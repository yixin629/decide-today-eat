'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import BackButton from '../../components/BackButton'
import { useToast } from '../../components/ToastProvider'
import LoadingSkeleton from '../../components/LoadingSkeleton'
import { GameState, Player, Tile, getBotAction, getBotDiscard, applyDiscard, applyBotTurn, applyAction, ValidAction, ActionType } from '../engine/MahjongLogic'
import PlayerHand from '../components/PlayerHand'
import TileComponent from '../components/Tile'
import GameEndModal from '../components/GameEndModal'

export default function MahjongGameRoom() {
  const { id } = useParams()
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const { showToast } = useToast()

  const [gameState, setGameState] = useState<GameState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTileIndex, setSelectedTileIndex] = useState<number | null>(null)

  useEffect(() => {
    if (!currentUser || !id) return

    fetchGame()

    const channel = supabase
      .channel(`mahjong_game_${id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'mahjong_games', filter: `id=eq.${id}` },
        (payload) => {
          const gs = payload.new.game_state
          if (gs && gs.players && gs.deck) {
            setGameState(gs as GameState)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUser, id]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchGame = async () => {
    try {
      const { data, error } = await supabase
        .from('mahjong_games')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      if (data && data.game_state && data.game_state.players && data.game_state.deck) {
        setGameState(data.game_state as GameState)
      } else {
        // Handle waiting state UI if game_state isn't fully ready
        setGameState(null)
      }
    } catch (err) {
      console.error(err)
      showToast('获取对局数据失败', 'error')
      router.push('/mahjong')
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate positions: Bottom is self. Left is (selfIndex + 3) % 4, Top is (selfIndex + 2) % 4, Right is (selfIndex + 1) % 4
  const getRenderPositions = () => {
    if (!gameState) return { bottom: null, right: null, top: null, left: null }

    const selfIndex = gameState.players.findIndex(p => p.id === currentUser)
    if (selfIndex === -1) {
       // Spectator view, just render 0 as bottom
       return {
         bottom: gameState.players[0],
         right: gameState.players[1],
         top: gameState.players[2],
         left: gameState.players[3],
       }
    }

    return {
      bottom: gameState.players[selfIndex],
      right: gameState.players[(selfIndex + 1) % 4],
      top: gameState.players[(selfIndex + 2) % 4],
      left: gameState.players[(selfIndex + 3) % 4],
    }
  }

  // Bot Turn Automation (Host only)
  useEffect(() => {
    if (!gameState || !currentUser) return
    if (gameState.host_id !== currentUser) return // Only host drives bots

    // 1. Handle Bot Pending Actions (Interruptions)
    if (gameState.pendingActions && Object.keys(gameState.pendingActions).length > 0) {
       
       // CRITICAL FIX: If ANY human player has pending actions, bots must wait!
       const hasHumanPending = Object.keys(gameState.pendingActions).some(pId => {
          const p = gameState.players.find(x => x.id === pId);
          return p && !p.isBot;
       });

       if (hasHumanPending) {
         // Wait for the human to make a decision (Pong/Hu/Pass). 
         // The human's action will trigger a database update, which will rerun this effect.
         return; 
       }

       let botActionTaken = false;
       for (const [pId, actions] of Object.entries(gameState.pendingActions)) {
          const player = gameState.players.find(p => p.id === pId);
          if (player && player.isBot) {
             botActionTaken = true;
             const timer = setTimeout(async () => {
                try {
                  // Realistically the bot should decide. Given our simplistic `getBotAction`:
                  // If it has 'hu', it does 'hu'. Else 'kong' > 'pong' > 'pass'.
                  let chosenAction: ValidAction | undefined;
                  chosenAction = actions.find(a => a.type === 'hu');
                  if (!chosenAction) chosenAction = actions.find(a => a.type === 'kong');
                  if (!chosenAction) chosenAction = actions.find(a => a.type === 'pong');
                  
                  const typeToTake = chosenAction ? chosenAction.type : 'pass';
                  const nextState = applyAction(gameState, player.id, typeToTake);
                  await supabase.from('mahjong_games').update({ game_state: nextState }).eq('id', id);
                } catch (err) {
                  console.error('Bot pending action error:', err);
                }
             }, 1000 + Math.random() * 1000); // Random delay 1-2s to feel human
             return () => clearTimeout(timer);
          }
       }
       if (botActionTaken) return; // Wait for bot to resolve before normal turns
    }

    // 2. Normal Bot Turn
    if (gameState.status !== 'playing') return;

    const currentPlayerIndex = gameState.currentTurn
    const currentPlayer = gameState.players[currentPlayerIndex]

    if (currentPlayer && currentPlayer.isBot) {
      if (gameState.pendingActions && Object.keys(gameState.pendingActions).length > 0) return; // Waiting for someone else

      // It's a bot's normal draw/discard turn!
      const timer = setTimeout(async () => {
        try {
           const nextState = applyBotTurn(gameState, currentPlayer.id)
           await supabase
             .from('mahjong_games')
             .update({ game_state: nextState })
             .eq('id', id)
        } catch (err) {
           console.error('Bot turn error:', err)
        }
      }, 1500) // 1.5 second delay for bot think time

      return () => clearTimeout(timer)
    }
  }, [gameState, currentUser]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelfDiscard = async () => {
     if (selectedTileIndex === null || !gameState || !currentUser) return
     const selfIndex = gameState.players.findIndex(p => p.id === currentUser)
     if (gameState.currentTurn !== selfIndex) {
         showToast('还没到你的回合', 'warning')
         return
     }

     const nextState = applyDiscard(gameState, currentUser, selectedTileIndex)
     setSelectedTileIndex(null)

     try {
       await supabase
         .from('mahjong_games')
         .update({ game_state: nextState })
         .eq('id', id)
     } catch (err) {
       console.error(err)
       showToast('出牌失败', 'error')
     }
  }

  const handleAction = async (actionType: ActionType) => {
     if (!gameState || !currentUser) return;
     const nextState = applyAction(gameState, currentUser, actionType);
     try {
       await supabase
         .from('mahjong_games')
         .update({ game_state: nextState })
         .eq('id', id)
     } catch (err) {
       console.error(err)
       showToast('操作失败', 'error')
     }
  }

  if (isLoading || !currentUser) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <LoadingSkeleton type="card" count={1} />
      </div>
    )
  }

  if (!gameState) {
     return (
        <div className="min-h-screen flex flex-col items-center justify-center">
            <h1 className="text-2xl font-bold mb-4">等待玩家加入...</h1>
            <BackButton href="/mahjong" text="退出房间" />
        </div>
     )
  }

  const { bottom, right, top, left } = getRenderPositions()
  
  // Is it my normal turn?
  const isMyTurn = bottom ? gameState.currentTurn === gameState.players.findIndex(p => p.id === bottom.id) : false
  const hasPendingActions = gameState.pendingActions && Object.keys(gameState.pendingActions).length > 0;
  
  // Do I have an interruption choice to make?
  const myPendingActions = gameState.pendingActions ? gameState.pendingActions[currentUser] : null;

  const actionLabels: Record<string, string> = {
     hu: '胡',
     kong: '杠',
     pong: '碰',
     chow: '吃',
  }

  return (
    <div className="min-h-screen bg-green-900 overflow-hidden flex flex-col">
      {/* Top Header */}
      <div className="absolute top-4 left-4 z-10 flex gap-4">
        <BackButton href="/mahjong" text="离开房间" className="bg-white/20 text-white hover:bg-white/30" />
        <div className="bg-black/40 text-white px-4 py-2 rounded-lg flex flex-col">
          <span className="text-xs opacity-70">
             {gameState.mode === 'sichuan' ? '四川血战' : '经典模式'} | 底分: {gameState.baseMultiplier * 100}豆
          </span>
          <span className="font-bold">剩余牌数: {gameState.deck.length}</span>
        </div>
      </div>

      {/* Game Board Container */}
      <div className="flex-1 relative w-full max-w-7xl mx-auto mt-16 pb-16">
         
         {/* Top Player */}
         {top && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2">
               <PlayerHand 
                 player={top} 
                 position="top" 
                 isCurrentTurn={gameState.currentTurn === gameState.players.findIndex(p => p.id === top.id)} 
               />
            </div>
         )}

         {/* Left Player */}
         {left && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 transform -translate-x-1/4 scale-75 md:scale-100">
               <PlayerHand 
                 player={left} 
                 position="left" 
                 isCurrentTurn={gameState.currentTurn === gameState.players.findIndex(p => p.id === left.id)} 
               />
            </div>
         )}

         {/* Right Player */}
         {right && (
            <div className="absolute right-0 top-1/2 -translate-y-1/2 transform translate-x-1/4 scale-75 md:scale-100">
               <PlayerHand 
                 player={right} 
                 position="right" 
                 isCurrentTurn={gameState.currentTurn === gameState.players.findIndex(p => p.id === right.id)} 
               />
            </div>
         )}

         {/* Center Action Area (Prompts & Table) */}
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-8">
            
            {/* Last Discarded Tile Visualization */}
            {gameState.lastAction && gameState.lastAction.tile && (
               <div className="flex flex-col items-center bg-black/40 p-6 rounded-2xl shadow-2xl backdrop-blur-sm border border-white/10 animate-fade-in">
                  <span className="text-white/80 text-sm mb-3">
                     {gameState.players.find(p => p.id === gameState.lastAction!.playerId)?.name} 打出:
                  </span>
                  <TileComponent tile={gameState.lastAction.tile} size="lg" className="scale-125 shadow-2xl" />
               </div>
            )}

            {/* My Turn Action Buttons */}
            {isMyTurn && !hasPendingActions && (
              <div className="flex gap-4">
                 <button onClick={handleSelfDiscard} disabled={selectedTileIndex === null} className="btn-primary px-10 py-4 text-2xl font-bold rounded-full disabled:bg-gray-500 disabled:opacity-50 shadow-xl hover:scale-105 transition-transform active:scale-95">
                    出 牌
                 </button>
              </div>
            )}

            {/* My Interruption Action Buttons */}
            {myPendingActions && myPendingActions.length > 0 && (
               <div className="flex gap-4 p-4 bg-black/60 rounded-2xl backdrop-blur-md shadow-2xl animate-bounce">
                  {myPendingActions.map((action, idx) => (
                    <button 
                       key={idx} 
                       onClick={() => handleAction(action.type)} 
                       className={`
                         px-8 py-4 text-3xl font-bold rounded-full shadow-xl hover:scale-110 transition-transform active:scale-90
                         ${action.type === 'hu' ? 'bg-red-500 text-white animate-pulse' : 
                           action.type === 'kong' ? 'bg-yellow-500 text-black' : 
                           'bg-blue-500 text-white'}
                       `}
                    >
                       {actionLabels[action.type] || action.type}
                    </button>
                  ))}
                  <button 
                     onClick={() => handleAction('pass')} 
                     className="px-8 py-4 text-3xl font-bold bg-gray-600 text-white rounded-full shadow-xl hover:scale-110 transition-transform active:scale-90"
                  >
                     过
                  </button>
               </div>
            )}
         </div>

         {/* Bottom Player (Self) */}
         {bottom && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full px-4">
               <PlayerHand 
                 player={bottom} 
                 position="bottom" 
                 isCurrentTurn={isMyTurn}
                 selectedTileIndex={selectedTileIndex}
                 onTileClick={(tile, idx) => {
                    if (isMyTurn) setSelectedTileIndex(idx)
                 }}
               />
            </div>
         )}
         
         <GameEndModal 
            gameState={gameState} 
            currentUser={currentUser}
            onReturnToLobby={() => router.push('/mahjong')} 
         />

      </div>
    </div>
  )
}
