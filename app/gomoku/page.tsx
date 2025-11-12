'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

type Player = 'black' | 'white'
type Cell = Player | null

const BOARD_SIZE = 15

export default function GomokuPage() {
  const [board, setBoard] = useState<Cell[][]>(() =>
    Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null))
  )
  const [currentPlayer, setCurrentPlayer] = useState<Player>('black')
  const [winner, setWinner] = useState<Player | null>(null)
  const [lastMove, setLastMove] = useState<[number, number] | null>(null)

  const checkWinner = (row: number, col: number, player: Player): boolean => {
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
          board[newRow][newCol] === player
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
          board[newRow][newCol] === player
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

    const newBoard = board.map(row => [...row])
    newBoard[row][col] = currentPlayer
    setBoard(newBoard)
    setLastMove([row, col])

    if (checkWinner(row, col, currentPlayer)) {
      setWinner(currentPlayer)
    } else {
      setCurrentPlayer(currentPlayer === 'black' ? 'white' : 'black')
    }
  }

  const resetGame = () => {
    setBoard(Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null)))
    setCurrentPlayer('black')
    setWinner(null)
    setLastMove(null)
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-block mb-6 text-white hover:text-primary transition-colors">
          ← 返回首页
        </Link>

        <div className="card text-center">
          <h1 className="text-4xl font-bold text-primary mb-6">
            ⚫⚪ 五子棋对战 ⚫⚪
          </h1>

          {/* Game Status */}
          <div className="mb-6">
            {winner ? (
              <div className="text-3xl font-bold text-primary">
                {winner === 'black' ? '⚫ 黑子' : '⚪ 白子'} 获胜！🎉
              </div>
            ) : (
              <div className="text-2xl">
                当前回合: {currentPlayer === 'black' ? '⚫ 黑子' : '⚪ 白子'}
              </div>
            )}
          </div>

          {/* Game Board */}
          <div className="inline-block bg-yellow-700 p-4 rounded-lg shadow-2xl mb-6">
            <div className="grid gap-0" style={{ gridTemplateColumns: `repeat(${BOARD_SIZE}, minmax(0, 1fr))` }}>
              {board.map((row, rowIndex) =>
                row.map((cell, colIndex) => (
                  <button
                    key={`${rowIndex}-${colIndex}`}
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                    className={`w-8 h-8 border border-gray-800 flex items-center justify-center hover:bg-yellow-600 transition-colors ${
                      lastMove &&
                      lastMove[0] === rowIndex &&
                      lastMove[1] === colIndex
                        ? 'ring-2 ring-red-500'
                        : ''
                    }`}
                    disabled={!!winner}
                  >
                    {cell && (
                      <div
                        className={`w-6 h-6 rounded-full ${
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
          <div className="flex gap-4 justify-center">
            <button onClick={resetGame} className="btn-primary">
              重新开始 🔄
            </button>
          </div>

          {/* Instructions */}
          <div className="mt-8 text-left bg-gray-50 p-4 rounded-lg">
            <h3 className="font-bold text-lg mb-2">游戏规则：</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              <li>黑子先手，白子后手</li>
              <li>在棋盘上点击放置棋子</li>
              <li>横向、纵向或斜向连成5个即获胜</li>
              <li>红色边框标记上一步落子位置</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
