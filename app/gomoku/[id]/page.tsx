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
          if (payload.new.game_state) {
            setGameState(payload.new.game_state as GomokuGameState)
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
      if (data && data.game_state) {
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
          <div className="inline-block bg-yellow-700 p-2 md:p-4 rounded-lg shadow-2xl mb-4 overflow-x-auto relative">
            
            {status === 'waiting' && (
                <div className="absolute inset-0 bg-black/20 z-10 flex items-center justify-center rounded-lg backdrop-blur-sm">
                   <div className="bg-white/90 px-6 py-3 rounded-xl shadow-lg font-bold text-lg">
                      等待中...
                   </div>
                </div>
            )}

            <div
              className="grid gap-0"
              style={{ gridTemplateColumns: `repeat(${BOARD_SIZE}, minmax(0, 1fr))` }}
            >
              {board.map((row, rowIndex) =>
                row.map((cell, colIndex) => (
                  <button
                    key={`${rowIndex}-${colIndex}`}
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                    className={`w-6 h-6 md:w-8 md:h-8 border border-gray-800 flex items-center justify-center hover:bg-yellow-600 transition-colors ${
                      lastMove && lastMove[0] === rowIndex && lastMove[1] === colIndex
                        ? 'ring-2 ring-red-500'
                        : ''
                    }`}
                    disabled={!!winner || status !== 'playing'}
                  >
                    {cell && (
                      <div
                        className={`w-5 h-5 md:w-6 md:h-6 rounded-full ${
                          cell === 'black' ? 'bg-black' : 'bg-white'
                        } shadow-lg`}
                      />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
