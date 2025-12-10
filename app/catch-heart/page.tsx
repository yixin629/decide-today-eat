'use client'

import { useState, useEffect, useCallback } from 'react'
import BackButton from '../components/BackButton'
import { useToast } from '../components/ToastProvider'

interface Position {
  x: number
  y: number
}

interface Heart {
  id: number
  x: number
  y: number
  collected: boolean
}

export default function CatchHeartPage() {
  const toast = useToast()
  const [gameStarted, setGameStarted] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(30)
  const [hearts, setHearts] = useState<Heart[]>([])
  const [position, setPosition] = useState<Position>({ x: 50, y: 80 })

  // 加载最高分
  useEffect(() => {
    const saved = localStorage.getItem('catchHeartHighScore')
    if (saved) {
      setHighScore(parseInt(saved))
    }
  }, [])

  const [isPaused, setIsPaused] = useState(false)

  // 游戏计时器
  useEffect(() => {
    if (!gameStarted || gameOver || isPaused) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setGameOver(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [gameStarted, gameOver, isPaused])

  // 生成爱心
  useEffect(() => {
    if (!gameStarted || gameOver || isPaused) return

    const spawnHeart = () => {
      const newHeart: Heart = {
        id: Date.now(),
        x: Math.random() * 80 + 10,
        y: -10,
        collected: false,
      }
      setHearts((prev) => [...prev, newHeart])
    }

    const spawnInterval = setInterval(spawnHeart, 800)
    return () => clearInterval(spawnInterval)
  }, [gameStarted, gameOver, isPaused])

  // 爱心下落
  useEffect(() => {
    if (!gameStarted || gameOver || isPaused) return

    const moveHearts = setInterval(() => {
      setHearts((prev) =>
        prev
          .map((heart) => ({
            ...heart,
            y: heart.y + 2,
          }))
          .filter((heart) => heart.y < 100 && !heart.collected)
      )
    }, 50)

    return () => clearInterval(moveHearts)
  }, [gameStarted, gameOver, isPaused])

  // 碰撞检测
  useEffect(() => {
    if (!gameStarted || gameOver || isPaused) return

    setHearts((prev) =>
      prev.map((heart) => {
        const distance = Math.sqrt(
          Math.pow(heart.x - position.x, 2) + Math.pow(heart.y - position.y, 2)
        )
        if (distance < 8 && !heart.collected) {
          setScore((s) => s + 1)
          return { ...heart, collected: true }
        }
        return heart
      })
    )
  }, [position, hearts, gameStarted, gameOver, isPaused])

  // 键盘控制
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!gameStarted || gameOver || isPaused) return

      const speed = 5
      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
          setPosition((prev) => ({ ...prev, x: Math.max(5, prev.x - speed) }))
          break
        case 'ArrowRight':
        case 'd':
          setPosition((prev) => ({ ...prev, x: Math.min(95, prev.x + speed) }))
          break
      }
    },
    [gameStarted, gameOver, isPaused]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // 触摸/鼠标控制
  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!gameStarted || gameOver || isPaused) return

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const x = ((clientX - rect.left) / rect.width) * 100
    setPosition((prev) => ({ ...prev, x: Math.max(5, Math.min(95, x)) }))
  }

  const startGame = () => {
    setGameStarted(true)
    setGameOver(false)
    setIsPaused(false)
    setScore(0)
    setTimeLeft(30)
    setHearts([])
    setPosition({ x: 50, y: 80 })
  }

  const pauseGame = () => {
    setIsPaused(true)
  }

  const resumeGame = () => {
    setIsPaused(false)
  }

  const exitGame = () => {
    setGameStarted(false)
    setIsPaused(false)
    setGameOver(false)
  }

  const endGame = useCallback(
    (finalScore: number) => {
      setGameOver(true)
      setIsPaused(false)
      if (finalScore > highScore) {
        setHighScore(finalScore)
        localStorage.setItem('catchHeartHighScore', finalScore.toString())
        toast.success('🎉 新纪录！')
      }
    },
    [highScore, toast]
  )

  useEffect(() => {
    if (gameOver && score > 0) {
      endGame(score)
    }
  }, [gameOver, score, endGame])

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-lg mx-auto">
        <BackButton href="/" text="返回首页" />

        <div className="card text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2">💕 接住爱心</h1>
          <p className="text-gray-600 mb-4">用键盘左右键或触摸屏幕移动，接住掉落的爱心！</p>

          {!gameStarted ? (
            <div className="space-y-6">
              <div className="text-6xl animate-bounce">💕</div>
              <div className="bg-pink-50 rounded-xl p-4">
                <p className="text-gray-600 mb-2">最高纪录</p>
                <p className="text-3xl font-bold text-primary">{highScore} 💕</p>
              </div>
              <button onClick={startGame} className="btn-primary text-xl px-12 py-4">
                🎮 开始游戏
              </button>
              <p className="text-sm text-gray-500">
                💡 提示：使用键盘 ← → 或 A D 键，或者触摸屏幕移动
              </p>
            </div>
          ) : (
            <>
              {/* 游戏信息 */}
              <div className="flex justify-between items-center mb-4">
                <div className="flex gap-4">
                  <div className="bg-pink-100 rounded-lg px-4 py-2">
                    <span className="text-sm text-gray-600 block">得分</span>
                    <span className="text-2xl font-bold text-primary">{score}</span>
                  </div>
                  <div className="bg-blue-100 rounded-lg px-4 py-2">
                    <span className="text-sm text-gray-600 block">时间</span>
                    <span
                      className={`text-2xl font-bold ${
                        timeLeft <= 10 ? 'text-red-500' : 'text-blue-500'
                      }`}
                    >
                      {timeLeft}s
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={isPaused ? resumeGame : pauseGame}
                    className="p-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded-lg transition-colors"
                  >
                    {isPaused ? '▶️' : '⏸️'}
                  </button>
                  <button
                    onClick={exitGame}
                    className="p-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                  >
                    🚪
                  </button>
                </div>
              </div>

              {/* 游戏区域 */}
              <div
                className="relative bg-gradient-to-b from-blue-100 to-pink-100 rounded-2xl overflow-hidden cursor-pointer select-none"
                style={{ height: '400px' }}
                onMouseMove={handleMove}
                onTouchMove={handleMove}
              >
                {/* 爱心 */}
                {hearts.map((heart) => (
                  <div
                    key={heart.id}
                    className={`absolute text-3xl transition-opacity ${
                      heart.collected ? 'opacity-0' : 'opacity-100'
                    }`}
                    style={{
                      left: `${heart.x}%`,
                      top: `${heart.y}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    💕
                  </div>
                ))}

                {/* 玩家 */}
                <div
                  className="absolute text-4xl transition-all duration-100"
                  style={{
                    left: `${position.x}%`,
                    top: `${position.y}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  🧺
                </div>

                {/* 游戏暂停遮罩 */}
                {isPaused && !gameOver && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-10">
                    <div className="bg-white rounded-2xl p-8 text-center shadow-xl animate-scale-in">
                      <h2 className="text-3xl font-bold mb-6 text-primary">已暂停</h2>
                      <div className="flex flex-col gap-3">
                        <button onClick={resumeGame} className="btn-primary w-full py-3 text-lg">
                          ▶️ 继续游戏
                        </button>
                        <button
                          onClick={exitGame}
                          className="px-6 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors"
                        >
                          🚪 退出游戏
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 游戏结束遮罩 */}
                {gameOver && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
                    <div className="bg-white rounded-2xl p-8 text-center">
                      <h2 className="text-2xl font-bold mb-2">游戏结束！</h2>
                      <p className="text-5xl font-bold text-primary mb-4">{score} 💕</p>
                      {score > highScore - 1 && score > 0 && (
                        <p className="text-green-500 mb-4">🎉 新纪录！</p>
                      )}
                      <div className="flex gap-3 justify-center">
                        <button
                          onClick={exitGame}
                          className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600"
                        >
                          退出
                        </button>
                        <button onClick={startGame} className="btn-primary">
                          🔄 再来一次
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
