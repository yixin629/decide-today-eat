'use client'

import { useState, useEffect, useCallback } from 'react'
import BackButton from '../components/BackButton'
import { useToast } from '../components/ToastProvider'

interface Player {
  position: number
  color: string
  emoji: string
  name: string
}

interface Cell {
  type: 'normal' | 'forward' | 'backward' | 'love' | 'trap' | 'star'
  value: number
}

const BOARD_SIZE = 36
const CELLS: Cell[] = Array.from({ length: BOARD_SIZE }, (_, i) => {
  if (i === 0) return { type: 'normal', value: 0 }
  if (i % 7 === 0) return { type: 'love', value: 2 } // 爱心格：前进2格
  if (i % 9 === 0) return { type: 'trap', value: -3 } // 陷阱格：后退3格
  if (i % 5 === 0) return { type: 'forward', value: 3 } // 前进格：前进3格
  if (i % 8 === 0) return { type: 'backward', value: -2 } // 后退格：后退2格
  if (i === BOARD_SIZE - 1) return { type: 'star', value: 0 } // 终点
  return { type: 'normal', value: 0 }
})

const CELL_ICONS: Record<string, string> = {
  normal: '',
  forward: '🚀',
  backward: '🐢',
  love: '💕',
  trap: '💔',
  star: '⭐',
}

const CELL_COLORS: Record<string, string> = {
  normal: 'bg-gray-100',
  forward: 'bg-green-200',
  backward: 'bg-orange-200',
  love: 'bg-pink-200',
  trap: 'bg-red-200',
  star: 'bg-yellow-300',
}

const CELL_MESSAGES: Record<string, string> = {
  forward: '哇！踩到火箭，前进3格！🚀',
  backward: '哎呀，走得太慢了，后退2格！🐢',
  love: '爱心加持！前进2格！💕',
  trap: '不小心踩到陷阱了！后退3格！💔',
  star: '恭喜到达终点！⭐',
}

export default function BoardGamePage() {
  const toast = useToast()
  const [players, setPlayers] = useState<Player[]>([
    { position: 0, color: 'bg-pink-500', emoji: '👧', name: '玩家1' },
    { position: 0, color: 'bg-blue-500', emoji: '👦', name: '玩家2' },
  ])
  const [currentPlayer, setCurrentPlayer] = useState(0)
  const [diceValue, setDiceValue] = useState<number | null>(null)
  const [isRolling, setIsRolling] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<Player | null>(null)
  const [message, setMessage] = useState('点击骰子开始游戏！')

  // 掷骰子
  const rollDice = useCallback(() => {
    if (isRolling || gameOver) return

    setIsRolling(true)
    setMessage('骰子转转转...')

    // 骰子动画
    let count = 0
    const interval = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1)
      count++
      if (count >= 10) {
        clearInterval(interval)
        const finalValue = Math.floor(Math.random() * 6) + 1
        setDiceValue(finalValue)
        movePlayer(finalValue)
      }
    }, 100)
  }, [isRolling, gameOver, currentPlayer, players])

  // 移动玩家
  const movePlayer = (steps: number) => {
    const player = players[currentPlayer]
    let newPosition = Math.min(player.position + steps, BOARD_SIZE - 1)

    setMessage(`${player.name}掷出了 ${steps}！`)

    // 更新位置
    setTimeout(() => {
      const cell = CELLS[newPosition]

      // 处理特殊格子
      if (cell.type !== 'normal') {
        const cellMessage = CELL_MESSAGES[cell.type]
        if (cellMessage) {
          toast.info(cellMessage)
        }

        if (cell.type !== 'star') {
          newPosition = Math.max(0, Math.min(newPosition + cell.value, BOARD_SIZE - 1))
        }
      }

      // 检查是否到达终点
      if (newPosition >= BOARD_SIZE - 1) {
        setGameOver(true)
        setWinner(player)
        setMessage(`🎉 ${player.name}获胜！`)
      }

      setPlayers((prev) => {
        const updated = [...prev]
        updated[currentPlayer] = { ...player, position: newPosition }
        return updated
      })

      if (!gameOver && newPosition < BOARD_SIZE - 1) {
        setCurrentPlayer((prev) => (prev + 1) % 2)
        setMessage(`轮到${players[(currentPlayer + 1) % 2].name}了！`)
      }

      setIsRolling(false)
    }, 500)
  }

  // 重置游戏
  const resetGame = () => {
    setPlayers([
      { position: 0, color: 'bg-pink-500', emoji: '👧', name: '玩家1' },
      { position: 0, color: 'bg-blue-500', emoji: '👦', name: '玩家2' },
    ])
    setCurrentPlayer(0)
    setDiceValue(null)
    setIsRolling(false)
    setGameOver(false)
    setWinner(null)
    setMessage('点击骰子开始游戏！')
  }

  // 渲染游戏格子
  const renderBoard = () => {
    const rows = []
    let cellIndex = 0

    for (let row = 0; row < 6; row++) {
      const cells = []
      const isReversed = row % 2 === 1

      for (let col = 0; col < 6; col++) {
        const actualCol = isReversed ? 5 - col : col
        const index = row * 6 + actualCol

        if (index < BOARD_SIZE) {
          const cell = CELLS[index]
          const playersHere = players.filter((p) => p.position === index)

          cells.push(
            <div
              key={index}
              className={`relative w-12 h-12 md:w-14 md:h-14 rounded-lg ${CELL_COLORS[cell.type]} 
                flex items-center justify-center text-lg font-bold border-2 border-white shadow-sm`}
            >
              {index === 0 && <span className="text-xs">起点</span>}
              {CELL_ICONS[cell.type]}
              {playersHere.length > 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  {playersHere.map((p, i) => (
                    <span
                      key={i}
                      className={`text-xl ${i === 1 ? 'ml-1' : ''} animate-bounce`}
                      style={{ animationDelay: `${i * 0.1}s` }}
                    >
                      {p.emoji}
                    </span>
                  ))}
                </div>
              )}
              <span className="absolute bottom-0 right-1 text-xs text-gray-400">{index}</span>
            </div>
          )
        }
        cellIndex++
      }

      rows.push(
        <div key={row} className="flex justify-center gap-1">
          {cells}
        </div>
      )
    }

    return rows
  }

  // 骰子显示
  const renderDice = () => {
    const dots: Record<number, JSX.Element> = {
      1: (
        <div className="flex items-center justify-center h-full">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
        </div>
      ),
      2: (
        <div className="flex justify-between items-center h-full px-2">
          <div className="w-2 h-2 bg-gray-800 rounded-full"></div>
          <div className="w-2 h-2 bg-gray-800 rounded-full"></div>
        </div>
      ),
      3: (
        <div className="h-full flex flex-col justify-between py-1 px-2">
          <div className="w-2 h-2 bg-gray-800 rounded-full self-end"></div>
          <div className="w-2 h-2 bg-gray-800 rounded-full self-center"></div>
          <div className="w-2 h-2 bg-gray-800 rounded-full self-start"></div>
        </div>
      ),
      4: (
        <div className="grid grid-cols-2 gap-1 p-2 h-full">
          <div className="w-2 h-2 bg-gray-800 rounded-full"></div>
          <div className="w-2 h-2 bg-gray-800 rounded-full"></div>
          <div className="w-2 h-2 bg-gray-800 rounded-full"></div>
          <div className="w-2 h-2 bg-gray-800 rounded-full"></div>
        </div>
      ),
      5: (
        <div className="grid grid-cols-2 gap-1 p-2 h-full relative">
          <div className="w-2 h-2 bg-gray-800 rounded-full"></div>
          <div className="w-2 h-2 bg-gray-800 rounded-full"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-gray-800 rounded-full"></div>
          </div>
          <div className="w-2 h-2 bg-gray-800 rounded-full"></div>
          <div className="w-2 h-2 bg-gray-800 rounded-full"></div>
        </div>
      ),
      6: (
        <div className="grid grid-cols-2 gap-1 p-1 h-full">
          <div className="w-2 h-2 bg-gray-800 rounded-full"></div>
          <div className="w-2 h-2 bg-gray-800 rounded-full"></div>
          <div className="w-2 h-2 bg-gray-800 rounded-full"></div>
          <div className="w-2 h-2 bg-gray-800 rounded-full"></div>
          <div className="w-2 h-2 bg-gray-800 rounded-full"></div>
          <div className="w-2 h-2 bg-gray-800 rounded-full"></div>
        </div>
      ),
    }

    return (
      <div
        onClick={rollDice}
        className={`w-16 h-16 bg-white rounded-xl shadow-lg border-2 border-gray-200 cursor-pointer 
          transition-transform ${isRolling ? 'animate-spin' : 'hover:scale-110'} 
          ${gameOver ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {diceValue ? (
          dots[diceValue]
        ) : (
          <div className="flex items-center justify-center h-full text-2xl">🎲</div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-xl mx-auto">
        <BackButton href="/" text="返回首页" />

        <div className="card">
          <h1 className="text-3xl md:text-4xl font-bold text-primary text-center mb-2">
            🎲 情侣飞行棋
          </h1>
          <p className="text-gray-600 text-center mb-4">和 ta 一起玩飞行棋吧！</p>

          {/* 玩家信息 */}
          <div className="flex justify-center gap-6 mb-4">
            {players.map((player, index) => (
              <div
                key={index}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl ${
                  currentPlayer === index && !gameOver
                    ? 'bg-yellow-100 ring-2 ring-yellow-400'
                    : 'bg-gray-100'
                }`}
              >
                <span className="text-2xl">{player.emoji}</span>
                <div>
                  <div className="font-semibold text-sm">{player.name}</div>
                  <div className="text-xs text-gray-500">位置: {player.position}</div>
                </div>
              </div>
            ))}
          </div>

          {/* 消息提示 */}
          <div className="text-center mb-4">
            <span className="bg-gradient-to-r from-pink-100 to-purple-100 px-4 py-2 rounded-full text-sm font-medium">
              {message}
            </span>
          </div>

          {/* 游戏棋盘 */}
          <div className="bg-gradient-to-br from-pink-50 to-purple-50 p-4 rounded-2xl mb-6 space-y-1">
            {renderBoard()}
          </div>

          {/* 图例 */}
          <div className="flex flex-wrap justify-center gap-2 mb-6 text-xs">
            <span className="flex items-center gap-1 bg-green-100 px-2 py-1 rounded">
              🚀 前进3格
            </span>
            <span className="flex items-center gap-1 bg-pink-100 px-2 py-1 rounded">
              💕 前进2格
            </span>
            <span className="flex items-center gap-1 bg-orange-100 px-2 py-1 rounded">
              🐢 后退2格
            </span>
            <span className="flex items-center gap-1 bg-red-100 px-2 py-1 rounded">💔 后退3格</span>
          </div>

          {/* 骰子和控制 */}
          <div className="flex flex-col items-center gap-4">
            {!gameOver ? (
              <>
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-2">点击骰子掷骰</p>
                  {renderDice()}
                </div>
              </>
            ) : (
              <div className="text-center">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-2xl font-bold mb-2">{winner?.name} 获胜！</h2>
                <p className="text-gray-500 mb-4">太厉害了！</p>
                <button onClick={resetGame} className="btn-primary">
                  🔄 再来一局
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
