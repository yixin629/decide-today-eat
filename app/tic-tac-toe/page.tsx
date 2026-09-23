'use client'

import { useEffect, useState } from 'react'
import BackButton from '@/app/components/ui/BackButton'

type Cell = 'X' | 'O' | null
type Board = Cell[]

const WIN_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
]

const EMPTY_BOARD: Board = Array(9).fill(null)

interface Scores {
  X: number
  O: number
  draws: number
}

const SCORES_STORAGE_KEY = 'tic-tac-toe-scores-v1'

function calculateWinner(board: Board): { winner: 'X' | 'O' | null; line: number[] | null } {
  for (const line of WIN_LINES) {
    const [a, b, c] = line
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line }
    }
  }
  return { winner: null, line: null }
}

export default function TicTacToePage() {
  const [board, setBoard] = useState<Board>(EMPTY_BOARD)
  const [isXNext, setIsXNext] = useState(true)
  const [scores, setScores] = useState<Scores>({ X: 0, O: 0, draws: 0 })

  useEffect(() => {
    try {
      const saved = localStorage.getItem(SCORES_STORAGE_KEY)
      if (saved) setScores(JSON.parse(saved))
    } catch {
      // 本地存储不可用时忽略，比分从零开始
    }
  }, [])

  const { winner, line: winningLine } = calculateWinner(board)
  const isDraw = !winner && board.every((cell) => cell !== null)

  const saveScores = (next: Scores) => {
    setScores(next)
    try {
      localStorage.setItem(SCORES_STORAGE_KEY, JSON.stringify(next))
    } catch {
      // 本地存储不可用时不阻塞游戏
    }
  }

  const handleCellClick = (index: number) => {
    if (board[index] || winner || isDraw) return

    const nextBoard = [...board]
    nextBoard[index] = isXNext ? 'X' : 'O'
    setBoard(nextBoard)

    const result = calculateWinner(nextBoard)
    if (result.winner) {
      saveScores({ ...scores, [result.winner]: scores[result.winner] + 1 })
    } else if (nextBoard.every((cell) => cell !== null)) {
      saveScores({ ...scores, draws: scores.draws + 1 })
    }

    setIsXNext(!isXNext)
  }

  const resetBoard = () => {
    setBoard(EMPTY_BOARD)
    setIsXNext(true)
  }

  const resetScores = () => {
    saveScores({ X: 0, O: 0, draws: 0 })
  }

  const statusText = winner
    ? `🎉 ${winner === 'X' ? 'zyx（X）' : 'zly（O）'} 获胜！`
    : isDraw
      ? '🤝 平局！'
      : `轮到 ${isXNext ? 'zyx（X）' : 'zly（O）'}`

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <BackButton href="/" text="返回首页" />

        <div className="card text-center">
          <h1 className="text-4xl font-bold mb-2">⭕ 井字棋 ❌</h1>
          <p className="text-gray-400 mb-8">两个人轮流点击同一块屏幕来对战</p>

          <div className="grid grid-cols-3 gap-4 mb-6 max-w-xs mx-auto">
            <div className="p-4 rounded-lg bg-blue-500/20">
              <div className="text-sm text-gray-400">zyx（X）</div>
              <div className="text-2xl font-bold text-primary">{scores.X}</div>
            </div>
            <div className="p-4 rounded-lg bg-white/10">
              <div className="text-sm text-gray-400">平局</div>
              <div className="text-2xl font-bold">{scores.draws}</div>
            </div>
            <div className="p-4 rounded-lg bg-pink-500/20">
              <div className="text-sm text-gray-400">zly（O）</div>
              <div className="text-2xl font-bold text-primary">{scores.O}</div>
            </div>
          </div>

          <div className="text-2xl font-bold mb-6">{statusText}</div>

          <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto mb-8">
            {board.map((cell, index) => {
              const isWinningCell = winningLine?.includes(index)
              return (
                <button
                  key={index}
                  onClick={() => handleCellClick(index)}
                  disabled={!!cell || !!winner || isDraw}
                  aria-label={`第 ${index + 1} 格${cell ? `，已是 ${cell}` : '，空'}`}
                  className={`aspect-square rounded-lg text-5xl font-bold flex items-center justify-center transition-all border-2 ${
                    isWinningCell
                      ? 'bg-primary/30 border-primary'
                      : 'bg-white/5 border-white/20 hover:border-primary/60 hover:bg-primary/10'
                  } ${cell || winner || isDraw ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {cell === 'X' && <span className="text-blue-400">❌</span>}
                  {cell === 'O' && <span className="text-pink-400">⭕</span>}
                </button>
              )
            })}
          </div>

          <div className="flex gap-4 justify-center flex-wrap">
            <button onClick={resetBoard} className="btn-primary px-8 py-3">
              🔄 再来一局
            </button>
            <button
              onClick={resetScores}
              className="px-8 py-3 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              🗑️ 清空比分
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
