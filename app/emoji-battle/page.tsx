'use client'

import { useState, useEffect } from 'react'
import BackButton from '../components/BackButton'
import { useToast } from '../components/ToastProvider'

interface EmojiCard {
  id: number
  emoji: string
  name: string
  attack: number
  defense: number
  special: string
}

const EMOJI_CARDS: EmojiCard[] = [
  { id: 1, emoji: '🦁', name: '狮子王', attack: 90, defense: 70, special: '百兽之王' },
  { id: 2, emoji: '🐉', name: '神龙', attack: 95, defense: 80, special: '龙息攻击' },
  { id: 3, emoji: '🦊', name: '小狐狸', attack: 60, defense: 50, special: '魅惑之术' },
  { id: 4, emoji: '🐼', name: '功夫熊猫', attack: 75, defense: 85, special: '铁头功' },
  { id: 5, emoji: '🦄', name: '独角兽', attack: 70, defense: 90, special: '治愈之光' },
  { id: 6, emoji: '🐯', name: '老虎', attack: 85, defense: 65, special: '虎啸山林' },
  { id: 7, emoji: '🐰', name: '兔兔', attack: 40, defense: 95, special: '闪避大师' },
  { id: 8, emoji: '🐻', name: '大熊', attack: 80, defense: 80, special: '熊抱攻击' },
  { id: 9, emoji: '🦅', name: '雄鹰', attack: 88, defense: 55, special: '俯冲打击' },
  { id: 10, emoji: '🐺', name: '孤狼', attack: 82, defense: 60, special: '月夜嚎叫' },
  { id: 11, emoji: '🦋', name: '蝴蝶仙', attack: 30, defense: 40, special: '梦幻粉尘' },
  { id: 12, emoji: '🐸', name: '青蛙王子', attack: 55, defense: 70, special: '毒液喷射' },
  { id: 13, emoji: '🦈', name: '鲨鱼', attack: 92, defense: 50, special: '撕咬攻击' },
  { id: 14, emoji: '🐙', name: '章鱼博士', attack: 65, defense: 75, special: '墨汁喷射' },
  { id: 15, emoji: '🦀', name: '钳子蟹', attack: 70, defense: 88, special: '铁钳防御' },
  { id: 16, emoji: '💕', name: '爱心使者', attack: 50, defense: 100, special: '爱的守护' },
  { id: 17, emoji: '⭐', name: '星星', attack: 75, defense: 75, special: '闪耀光芒' },
  { id: 18, emoji: '🌙', name: '月亮女神', attack: 68, defense: 82, special: '月光祝福' },
]

export default function EmojiBattlePage() {
  const toast = useToast()
  const [gameState, setGameState] = useState<'select' | 'battle' | 'result'>('select')
  const [player1Cards, setPlayer1Cards] = useState<EmojiCard[]>([])
  const [player2Cards, setPlayer2Cards] = useState<EmojiCard[]>([])
  const [player1Selected, setPlayer1Selected] = useState<EmojiCard | null>(null)
  const [player2Selected, setPlayer2Selected] = useState<EmojiCard | null>(null)
  const [currentTurn, setCurrentTurn] = useState<1 | 2>(1)
  const [player1Score, setPlayer1Score] = useState(0)
  const [player2Score, setPlayer2Score] = useState(0)
  const [round, setRound] = useState(1)
  const [battleLog, setBattleLog] = useState<string[]>([])
  const [showBattle, setShowBattle] = useState(false)
  const [winner, setWinner] = useState<string | null>(null)

  // 初始化游戏，随机分配卡牌
  const initGame = () => {
    const shuffled = [...EMOJI_CARDS].sort(() => Math.random() - 0.5)
    setPlayer1Cards(shuffled.slice(0, 5))
    setPlayer2Cards(shuffled.slice(5, 10))
    setPlayer1Selected(null)
    setPlayer2Selected(null)
    setCurrentTurn(1)
    setPlayer1Score(0)
    setPlayer2Score(0)
    setRound(1)
    setBattleLog([])
    setShowBattle(false)
    setWinner(null)
    setGameState('select')
  }

  useEffect(() => {
    initGame()
  }, [])

  // 选择卡牌
  const selectCard = (card: EmojiCard) => {
    if (currentTurn === 1 && !player1Selected) {
      setPlayer1Selected(card)
      setCurrentTurn(2)
      toast.info('玩家2请选择卡牌！')
    } else if (currentTurn === 2 && !player2Selected && player1Selected) {
      setPlayer2Selected(card)
      // 开始战斗
      setTimeout(() => startBattle(player1Selected, card), 500)
    }
  }

  // 战斗逻辑
  const startBattle = (card1: EmojiCard, card2: EmojiCard) => {
    setShowBattle(true)
    const logs: string[] = []

    logs.push(`⚔️ 第${round}回合开始！`)
    logs.push(`${card1.emoji} ${card1.name} VS ${card2.emoji} ${card2.name}`)

    // 计算战斗结果
    const score1 = card1.attack + Math.random() * 30 - 15
    const score2 = card2.attack + Math.random() * 30 - 15

    logs.push(`${card1.emoji} 发动技能「${card1.special}」！攻击力: ${score1.toFixed(0)}`)
    logs.push(`${card2.emoji} 发动技能「${card2.special}」！攻击力: ${score2.toFixed(0)}`)

    let roundWinner = ''
    if (score1 > score2) {
      setPlayer1Score((prev) => prev + 1)
      roundWinner = `${card1.emoji} ${card1.name} 获胜！`
      logs.push(`🎉 玩家1的 ${card1.emoji} 获胜！`)
    } else if (score2 > score1) {
      setPlayer2Score((prev) => prev + 1)
      roundWinner = `${card2.emoji} ${card2.name} 获胜！`
      logs.push(`🎉 玩家2的 ${card2.emoji} 获胜！`)
    } else {
      logs.push('⚖️ 平局！双方势均力敌！')
    }

    setBattleLog(logs)

    // 移除已使用的卡牌
    setPlayer1Cards((prev) => prev.filter((c) => c.id !== card1.id))
    setPlayer2Cards((prev) => prev.filter((c) => c.id !== card2.id))

    // 检查游戏是否结束
    setTimeout(() => {
      if (round >= 5) {
        // 游戏结束
        if (player1Score + (score1 > score2 ? 1 : 0) > player2Score + (score2 > score1 ? 1 : 0)) {
          setWinner('玩家1')
        } else if (
          player2Score + (score2 > score1 ? 1 : 0) >
          player1Score + (score1 > score2 ? 1 : 0)
        ) {
          setWinner('玩家2')
        } else {
          setWinner('平局')
        }
        setGameState('result')
      } else {
        // 下一回合
        setRound((prev) => prev + 1)
        setPlayer1Selected(null)
        setPlayer2Selected(null)
        setCurrentTurn(1)
        setShowBattle(false)
      }
    }, 2500)
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <BackButton href="/" text="返回首页" />

        <div className="card">
          <h1 className="text-3xl md:text-4xl font-bold text-primary text-center mb-2">
            🎴 表情包大乱斗
          </h1>
          <p className="text-gray-600 text-center mb-6">选择你的表情包卡牌，与对方对战！</p>

          {/* 分数板 */}
          <div className="flex justify-center gap-8 mb-6">
            <div
              className={`text-center p-4 rounded-xl ${
                currentTurn === 1 && gameState === 'select'
                  ? 'bg-pink-100 ring-2 ring-pink-500'
                  : 'bg-gray-100'
              }`}
            >
              <div className="text-2xl font-bold text-pink-500">玩家1</div>
              <div className="text-4xl font-bold">{player1Score}</div>
            </div>
            <div className="flex items-center">
              <span className="text-2xl font-bold text-gray-400">VS</span>
            </div>
            <div
              className={`text-center p-4 rounded-xl ${
                currentTurn === 2 && gameState === 'select'
                  ? 'bg-blue-100 ring-2 ring-blue-500'
                  : 'bg-gray-100'
              }`}
            >
              <div className="text-2xl font-bold text-blue-500">玩家2</div>
              <div className="text-4xl font-bold">{player2Score}</div>
            </div>
          </div>

          {/* 回合提示 */}
          <div className="text-center mb-6">
            <span className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm font-semibold">
              第 {round} / 5 回合
            </span>
          </div>

          {gameState === 'select' && !showBattle && (
            <>
              {/* 玩家1的卡牌 */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-pink-500 mb-3 text-center">
                  {currentTurn === 1 ? '👆 玩家1 请选择卡牌' : '玩家1 已选择'}
                </h3>
                <div className="flex justify-center gap-3 flex-wrap">
                  {player1Cards.map((card) => (
                    <button
                      key={card.id}
                      onClick={() => currentTurn === 1 && selectCard(card)}
                      disabled={currentTurn !== 1 || player1Selected !== null}
                      className={`relative p-3 rounded-xl transition-all ${
                        player1Selected?.id === card.id
                          ? 'bg-pink-200 ring-2 ring-pink-500 scale-110'
                          : currentTurn === 1
                          ? 'bg-pink-50 hover:bg-pink-100 hover:scale-105 cursor-pointer'
                          : 'bg-gray-100 opacity-50'
                      }`}
                    >
                      <div className="text-4xl mb-1">{card.emoji}</div>
                      <div className="text-xs font-semibold">{card.name}</div>
                      <div className="text-xs text-gray-500">
                        ⚔️{card.attack} 🛡️{card.defense}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 战斗区域 */}
              <div className="flex justify-center items-center gap-8 py-8 bg-gradient-to-r from-pink-50 via-purple-50 to-blue-50 rounded-2xl mb-8">
                <div className="text-center">
                  {player1Selected ? (
                    <div className="animate-bounce">
                      <div className="text-6xl mb-2">{player1Selected.emoji}</div>
                      <div className="font-semibold">{player1Selected.name}</div>
                    </div>
                  ) : (
                    <div className="w-20 h-20 bg-pink-200 rounded-xl flex items-center justify-center text-4xl opacity-50">
                      ❓
                    </div>
                  )}
                </div>
                <div className="text-4xl font-bold text-gray-300">⚡</div>
                <div className="text-center">
                  {player2Selected ? (
                    <div className="animate-bounce">
                      <div className="text-6xl mb-2">{player2Selected.emoji}</div>
                      <div className="font-semibold">{player2Selected.name}</div>
                    </div>
                  ) : (
                    <div className="w-20 h-20 bg-blue-200 rounded-xl flex items-center justify-center text-4xl opacity-50">
                      ❓
                    </div>
                  )}
                </div>
              </div>

              {/* 玩家2的卡牌 */}
              <div>
                <h3 className="text-lg font-semibold text-blue-500 mb-3 text-center">
                  {currentTurn === 2 ? '👆 玩家2 请选择卡牌' : '玩家2 等待中...'}
                </h3>
                <div className="flex justify-center gap-3 flex-wrap">
                  {player2Cards.map((card) => (
                    <button
                      key={card.id}
                      onClick={() => currentTurn === 2 && selectCard(card)}
                      disabled={currentTurn !== 2}
                      className={`relative p-3 rounded-xl transition-all ${
                        player2Selected?.id === card.id
                          ? 'bg-blue-200 ring-2 ring-blue-500 scale-110'
                          : currentTurn === 2
                          ? 'bg-blue-50 hover:bg-blue-100 hover:scale-105 cursor-pointer'
                          : 'bg-gray-100 opacity-50'
                      }`}
                    >
                      <div className="text-4xl mb-1">{card.emoji}</div>
                      <div className="text-xs font-semibold">{card.name}</div>
                      <div className="text-xs text-gray-500">
                        ⚔️{card.attack} 🛡️{card.defense}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* 战斗动画 */}
          {showBattle && (
            <div className="text-center py-8">
              <div className="flex justify-center items-center gap-8 mb-6">
                <div className="animate-pulse">
                  <div className="text-8xl">{player1Selected?.emoji}</div>
                </div>
                <div className="text-4xl animate-spin">💥</div>
                <div className="animate-pulse">
                  <div className="text-8xl">{player2Selected?.emoji}</div>
                </div>
              </div>
              <div className="bg-gray-900 text-green-400 rounded-xl p-4 font-mono text-left max-w-md mx-auto">
                {battleLog.map((log, index) => (
                  <div key={index} className="mb-1 animate-pulse">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 游戏结果 */}
          {gameState === 'result' && (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">{winner === '平局' ? '🤝' : '🏆'}</div>
              <h2 className="text-3xl font-bold mb-4">
                {winner === '平局' ? '势均力敌！' : `${winner} 获胜！`}
              </h2>
              <p className="text-xl text-gray-600 mb-6">
                最终比分: {player1Score} : {player2Score}
              </p>
              <button onClick={initGame} className="btn-primary text-lg px-8 py-3">
                🔄 再来一局
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
