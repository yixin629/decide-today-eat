'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import BackButton from '../../components/BackButton'
import { useToast } from '../../components/ToastProvider'
import LoadingSkeleton from '../../components/LoadingSkeleton'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { GomokuGameState, BOARD_SIZE, checkWinner, getBotMove } from '../engine/GomokuLogic'

export default function GomokuGameRoom() {
  const { id } = useParams()
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const { showToast } = useToast()

  const [gameState, setGameState] = useState<GomokuGameState | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!currentUser || !id) return

    fetchGame()

    const channel = supabase
      .channel(`gomoku_game_${id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'gomoku_games', filter: `id=eq.${id}` },
        (payload) => {
          const gs = payload.new.game_state
          if (gs && gs.players && gs.board) {
            setGameState(gs as GomokuGameState)
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
        .from('gomoku_games')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      if (data && data.game_state && data.game_state.players && data.game_state.board) {
        setGameState(data.game_state as GomokuGameState)
      } else {
        setGameState(null)
      }
    } catch (err) {
      console.error(err)
      showToast('获取对局数据失败', 'error')
      router.push('/gomoku')
    } finally {
      setIsLoading(false)
    }
  }

  // --- Game Mechanics ---

  const handleCellClick = async (row: number, col: number) => {
    if (!gameState || !currentUser || gameState.status !== 'playing') return

    // 1. Am I a player in this game?
    const myPlayerInfo = gameState.players.find(p => p.id === currentUser)
    if (!myPlayerInfo) {
       showToast('你正在观战中', 'info')
       return
    }

    // 2. Is it my turn?
    if (gameState.currentPlayer !== myPlayerInfo.color) {
       showToast('还没到你的回合', 'warning')
       return
    }

    // 3. Is the cell empty? And game not over?
    if (gameState.board[row][col] || gameState.winner) return

    await playMove(row, col, myPlayerInfo.color)
  }

  const playMove = async (row: number, col: number, playerColor: 'black' | 'white') => {
    if (!gameState) return

    const newBoard = gameState.board.map((r) => [...r])
    newBoard[row][col] = playerColor

    const newHistory = [
      ...gameState.history,
      { board: newBoard.map((r) => [...r]), player: playerColor, move: [row, col] as [number, number] },
    ]

    const isWin = checkWinner(newBoard, row, col, playerColor)
    const nextPlayer = playerColor === 'black' ? 'white' : 'black'

    const nextState: GomokuGameState = {
       ...gameState,
       board: newBoard,
       lastMove: [row, col],
       history: newHistory,
       currentPlayer: isWin ? playerColor : nextPlayer, // If win, turn stays, status changes
       winner: isWin ? playerColor : null,
       status: isWin ? 'finished' : 'playing'
    }

    // Optimistic UI Update
    setGameState(nextState)

    try {
      await supabase
        .from('gomoku_games')
        .update({ game_state: nextState, status: nextState.status })
        .eq('id', id)

      if (isWin) {
         showToast(`${playerColor === 'black' ? '⚫ 黑子' : '⚪ 白子'} 获胜！🎉`, 'success')
      }
    } catch (err) {
      console.error(err)
      showToast('落子同步失败', 'error')
      // If failed, could refetch to revert
    }
  }

  // --- Bot Automation (Host Only) ---
  useEffect(() => {
     if (!gameState || gameState.status !== 'playing' || !currentUser) return
     if (gameState.hostId !== currentUser) return // Only host drives bots
     if (gameState.gameMode !== 'pve') return

     const currentPlayerConfig = gameState.players.find(p => p.color === gameState.currentPlayer)
     if (currentPlayerConfig && currentPlayerConfig.isBot) {
         // It's the bot's turn! Think and move.
         const timer = setTimeout(() => {
             const move = getBotMove(gameState.board, currentPlayerConfig.color)
             if (move) {
                 playMove(move[0], move[1], currentPlayerConfig.color)
             }
         }, 800) // Delay to feel natural

         return () => clearTimeout(timer)
     }
  }, [gameState?.currentPlayer, gameState?.status]) // eslint-disable-line react-hooks/exhaustive-deps


  if (isLoading || !currentUser) {
    return (
      <div className="min-h-screen p-4 flex flex-col items-center justify-center">
        <LoadingSkeleton type="card" count={1} />
      </div>
    )
  }

  if (!gameState) {
     return (
        <div className="min-h-screen flex flex-col items-center justify-center">
            <h1 className="text-2xl font-bold mb-4">房间不存在或已解散</h1>
            <BackButton href="/gomoku" text="返回大厅" />
        </div>
     )
  }

  const { board, winner, currentPlayer, history, lastMove, players, status } = gameState
  const moveCount = history.length
  
  const blackPlayer = players.find(p => p.color === 'black')
  const whitePlayer = players.find(p => p.color === 'white')

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <BackButton href="/gomoku" text="离开房间" />

        <div className="card text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2">⚫⚪ 五子棋对战 ⚫⚪</h1>
          
          {/* Player Info Panel */}
          <div className="flex justify-center items-center gap-8 mb-6 mt-4">
             {/* Black Player */}
             <div className={`flex flex-col items-center p-3 rounded-lg ${currentPlayer === 'black' && status === 'playing' ? 'bg-yellow-100 ring-2 ring-yellow-400' : 'bg-gray-50'}`}>
                <div className="text-3xl mb-1">{blackPlayer?.avatar || '👤'}</div>
                <div className="font-bold text-sm max-w-[100px] truncate">{blackPlayer?.name || '等待加入...'}</div>
                <div className="text-xs text-gray-500 mt-1">⚫ 黑子 (先手)</div>
             </div>

             <div className="text-2xl font-bold text-gray-400">VS</div>

             {/* White Player */}
             <div className={`flex flex-col items-center p-3 rounded-lg ${currentPlayer === 'white' && status === 'playing' ? 'bg-yellow-100 ring-2 ring-yellow-400' : 'bg-gray-50'}`}>
                <div className="text-3xl mb-1">{whitePlayer?.avatar || '👻'}</div>
                <div className="font-bold text-sm max-w-[100px] truncate">{whitePlayer?.name || '等待加入...'}</div>
                <div className="text-xs text-gray-500 mt-1">⚪ 白子 (后手)</div>
             </div>
          </div>

          {/* Game Status Announcement */}
          <div className="mb-4 h-12 flex items-center justify-center">
            {winner ? (
              <div className="text-2xl md:text-3xl font-bold text-green-600 animate-bounce">
                {winner === 'black' ? `${blackPlayer?.name} (黑子)` : `${whitePlayer?.name} (白子)`} 获胜！🎉
              </div>
            ) : status === 'waiting' ? (
              <div className="text-xl md:text-2xl text-orange-500 animate-pulse">
                 等待对手加入...
              </div>
            ) : (
              <div className="text-xl md:text-2xl">
                当前回合: {currentPlayer === 'black' ? '⚫ 黑子' : '⚪ 白子'}
                <span className="text-sm text-gray-500 ml-2">（第 {moveCount + 1} 步）</span>
              </div>
            )}
          </div>

          {/* Game Board */}
          <div className="inline-block bg-[#E3A869] p-2 md:p-6 rounded-lg shadow-2xl mb-4 relative ring-8 ring-[#8B5A2B]">
            
            {status === 'waiting' && (
                <div className="absolute inset-0 bg-black/30 z-20 flex items-center justify-center rounded-lg backdrop-blur-sm">
                   <div className="bg-white/90 px-6 py-3 rounded-xl shadow-lg font-bold text-lg text-black">
                      等待对手加入...
                   </div>
                </div>
            )}

            <div
              className="grid gap-0 relative"
              style={{ 
                 gridTemplateColumns: `repeat(${BOARD_SIZE}, minmax(0, 1fr))`,
                 width: 'max-content' 
              }}
            >
              {board.map((row, rowIndex) =>
                row.map((cell, colIndex) => {
                  const isTop = rowIndex === 0;
                  const isBottom = rowIndex === BOARD_SIZE - 1;
                  const isLeft = colIndex === 0;
                  const isRight = colIndex === BOARD_SIZE - 1;
                  const isCenter = rowIndex === 7 && colIndex === 7;
                  const isStar = (rowIndex === 3 || rowIndex === 11) && (colIndex === 3 || colIndex === 11);

                  return (
                    <button
                      key={`${rowIndex}-${colIndex}`}
                      onClick={() => handleCellClick(rowIndex, colIndex)}
                      className="w-7 h-7 md:w-10 md:h-10 relative flex items-center justify-center group"
                      disabled={!!winner || status !== 'playing'}
                    >
                      {/* Grid Lines */}
                      <div className={`absolute bg-gray-800 pointer-events-none z-0
                           ${isTop ? 'top-1/2 bottom-0' : isBottom ? 'top-0 bottom-1/2' : 'top-0 bottom-0'}
                           w-[1.5px] left-1/2 -ml-[0.75px]`} 
                      />
                      <div className={`absolute bg-gray-800 pointer-events-none z-0
                           ${isLeft ? 'left-1/2 right-0' : isRight ? 'left-0 right-1/2' : 'left-0 right-0'}
                           h-[1.5px] top-1/2 -mt-[0.75px]`} 
                      />

                      {/* Star Points (Tengen / Hoshi) */}
                      {(isCenter || isStar) && (
                         <div className="w-2 h-2 rounded-full leading-none bg-gray-800 absolute z-0 pointer-events-none shrink-0" />
                      )}

                      {/* Hover Indicator */}
                      <div className="absolute inset-0 z-10 opacity-0 group-hover:opacity-100 bg-white/30 rounded-full transition-opacity m-1 md:m-1.5" />

                      {/* Piece */}
                      {cell && (
                        <div
                          className={`absolute z-20 w-6 h-6 md:w-8 md:h-8 rounded-full shadow-md ${
                            cell === 'black' ? 'bg-gradient-to-br from-gray-700 to-black' : 'bg-gradient-to-br from-white to-gray-200 border border-gray-300'
                          }`}
                        />
                      )}

                      {/* Last Move Indicator */}
                      {lastMove && lastMove[0] === rowIndex && lastMove[1] === colIndex && (
                        <div className="absolute z-30 w-1.5 h-1.5 bg-red-500 rounded-full shadow-sm animate-pulse" />
                      )}
                    </button>
                  )
                })
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
