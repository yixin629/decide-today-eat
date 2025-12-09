'use client'

import { useState } from 'react'
import BackButton from '../components/BackButton'
import { useToast } from '../components/ToastProvider'

type Player = 'black' | 'white'
type Cell = Player | null

const BOARD_SIZE = 15

export default function GomokuPage() {
  const toast = useToast()
  const [board, setBoard] = useState<Cell[][]>(() =>
    Array(BOARD_SIZE)
      .fill(null)
      .map(() => Array(BOARD_SIZE).fill(null))
  )
  const [currentPlayer, setCurrentPlayer] = useState<Player>('black')
  const [winner, setWinner] = useState<Player | null>(null)
  const [lastMove, setLastMove] = useState<[number, number] | null>(null)
  const [history, setHistory] = useState<
    { board: Cell[][]; player: Player; move: [number, number] }[]
  >([])

  const checkWinner = (boardState: Cell[][], row: number, col: number, player: Player): boolean => {
    const directions = [
      [0, 1], // horizontal
      [1, 0], // vertical
      [1, 1], // diagonal \
      [1, -1], // diagonal /
    ]

    for (const [dx, dy] of directions) {
      let count = 1
      // Check positive direction
      for (let i = 1; i < 5; i++) {
        const newRow = row + dx * i
        const newCol = col + dy * i
        if (
          newRow >= 0 &&
          newRow < BOARD_SIZE &&
          newCol >= 0 &&
          newCol < BOARD_SIZE &&
          boardState[newRow][newCol] === player
        ) {
          count++
        } else {
          break
        }
      }
      // Check negative direction
      for (let i = 1; i < 5; i++) {
        const newRow = row - dx * i
        const newCol = col - dy * i
        if (
          newRow >= 0 &&
          newRow < BOARD_SIZE &&
          newCol >= 0 &&
          newCol < BOARD_SIZE &&
          boardState[newRow][newCol] === player
        ) {
          count++
        } else {
          break
        }
      }
      if (count >= 5) return true
    }
    return false
  }

  const handleCellClick = (row: number, col: number) => {
    if (board[row][col] || winner) return

    const newBoard = board.map((r) => [...r])
    newBoard[row][col] = currentPlayer

    // 保存历史记录
    setHistory([
      ...history,
      { board: board.map((r) => [...r]), player: currentPlayer, move: [row, col] },
    ])

    setBoard(newBoard)
    setLastMove([row, col])

    if (checkWinner(newBoard, row, col, currentPlayer)) {
      setWinner(currentPlayer)
      toast.success(`${currentPlayer === 'black' ? '⚫ 黑子' : '⚪ 白子'} 获胜！🎉`)
    } else {
      setCurrentPlayer(currentPlayer === 'black' ? 'white' : 'black')
    }
  }

  const undoMove = () => {
    if (history.length === 0 || winner) return

    const lastHistory = history[history.length - 1]
    setBoard(lastHistory.board)
    setCurrentPlayer(lastHistory.player)
    setHistory(history.slice(0, -1))

    // 找到倒数第二步的位置
    if (history.length > 1) {
      setLastMove(history[history.length - 2].move)
    } else {
      setLastMove(null)
    }

    toast.info('已撤销上一步')
  }

  const resetGame = () => {
    setBoard(
      Array(BOARD_SIZE)
        .fill(null)
        .map(() => Array(BOARD_SIZE).fill(null))
    )
    setCurrentPlayer('black')
    setWinner(null)
    setLastMove(null)
    setHistory([])
  }

  // 计算落子数
  const moveCount = history.length

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <BackButton href="/" text="返回首页" />

        <div className="card text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-primary mb-4">⚫⚪ 五子棋对战 ⚫⚪</h1>

          {/* Game Status */}
          <div className="mb-4">
            {winner ? (
              <div className="text-2xl md:text-3xl font-bold text-primary">
                {winner === 'black' ? '⚫ 黑子' : '⚪ 白子'} 获胜！🎉
              </div>
            ) : (
              <div className="text-xl md:text-2xl">
                当前回合: {currentPlayer === 'black' ? '⚫ 黑子' : '⚪ 白子'}
                <span className="text-sm text-gray-500 ml-2">（第 {moveCount + 1} 步）</span>
              </div>
            )}
          </div>

          {/* Game Board */}
          <div className="inline-block bg-yellow-700 p-2 md:p-4 rounded-lg shadow-2xl mb-4 overflow-x-auto">
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
                    disabled={!!winner}
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

          {/* Controls */}
          <div className="flex gap-3 justify-center flex-wrap mb-6">
            <button
              onClick={undoMove}
              disabled={history.length === 0 || !!winner}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ↩️ 悔棋
            </button>
            <button onClick={resetGame} className="btn-primary">
              🔄 重新开始
            </button>
          </div>

          {/* Move History */}
          {history.length > 0 && (
            <div className="mb-6 bg-gray-50 rounded-xl p-4">
              <h3 className="font-semibold mb-2">📜 落子记录</h3>
              <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                {history.map((h, i) => (
                  <span
                    key={i}
                    className={`text-xs px-2 py-1 rounded ${
                      h.player === 'black' ? 'bg-gray-800 text-white' : 'bg-white border'
                    }`}
                  >
                    {i + 1}. ({h.move[0]},{h.move[1]})
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="text-left bg-gray-50 p-4 rounded-lg">
            <h3 className="font-bold text-lg mb-2">游戏规则：</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
              <li>黑子先手，白子后手</li>
              <li>在棋盘上点击放置棋子</li>
              <li>横向、纵向或斜向连成5个即获胜</li>
              <li>红色边框标记上一步落子位置</li>
              <li>点击"悔棋"可撤销上一步</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
