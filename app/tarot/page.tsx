'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import BackButton from '../components/BackButton'
import { useToast } from '../components/ToastProvider'

interface TarotCard {
  name: string
  emoji: string
  meaning: string
  advice: string
  loveFortune: string
}

const TAROT_CARDS: TarotCard[] = [
  {
    name: '愚者',
    emoji: '🃏',
    meaning: '新的开始，勇敢冒险',
    advice: '保持开放的心态，勇于尝试新事物',
    loveFortune: '可能会遇到意想不到的缘分，保持真诚',
  },
  {
    name: '魔术师',
    emoji: '✨',
    meaning: '创造力，行动力',
    advice: '把想法付诸实践，主动出击',
    loveFortune: '你的魅力正在发光，主动表达爱意',
  },
  {
    name: '女祭司',
    emoji: '🌙',
    meaning: '直觉，内在智慧',
    advice: '倾听内心的声音，相信直觉',
    loveFortune: '感情需要耐心和理解，深入了解对方',
  },
  {
    name: '皇后',
    emoji: '👑',
    meaning: '丰盛，母性',
    advice: '关注生活的美好，给予爱与关怀',
    loveFortune: '感情温馨美满，适合表达柔情蜜意',
  },
  {
    name: '皇帝',
    emoji: '♔',
    meaning: '权威，稳定',
    advice: '建立秩序，承担责任',
    loveFortune: '关系需要稳定的承诺，展现你的可靠',
  },
  {
    name: '教皇',
    emoji: '⛪',
    meaning: '传统，指导',
    advice: '寻求智慧的建议，遵循内心价值',
    loveFortune: '传统的约会方式会带来好运',
  },
  {
    name: '恋人',
    emoji: '💑',
    meaning: '选择，结合',
    advice: '做出重要决定，珍惜眼前人',
    loveFortune: '感情运势极佳，适合表白或深化关系',
  },
  {
    name: '战车',
    emoji: '🏇',
    meaning: '胜利，意志力',
    advice: '坚持目标，克服障碍',
    loveFortune: '为爱勇往直前，主动争取幸福',
  },
  {
    name: '力量',
    emoji: '🦁',
    meaning: '勇气，耐心',
    advice: '以温柔的力量面对挑战',
    loveFortune: '用真诚和耐心打动对方的心',
  },
  {
    name: '隐士',
    emoji: '🕯️',
    meaning: '内省，智慧',
    advice: '独处思考，寻找内在答案',
    loveFortune: '给彼此一些空间，深入了解自己',
  },
  {
    name: '命运之轮',
    emoji: '🎡',
    meaning: '转变，机遇',
    advice: '接受变化，把握机会',
    loveFortune: '感情出现转机，保持积极态度',
  },
  {
    name: '正义',
    emoji: '⚖️',
    meaning: '公平，真相',
    advice: '做出正确的选择，实事求是',
    loveFortune: '诚实沟通，公平对待彼此',
  },
  {
    name: '倒吊人',
    emoji: '🙃',
    meaning: '换个角度，放手',
    advice: '改变视角，耐心等待',
    loveFortune: '换个角度看待感情，可能有新发现',
  },
  {
    name: '死神',
    emoji: '🦴',
    meaning: '结束，重生',
    advice: '放下过去，迎接新开始',
    loveFortune: '旧感情结束，新恋情即将到来',
  },
  {
    name: '节制',
    emoji: '🍶',
    meaning: '平衡，和谐',
    advice: '保持中庸之道，融合不同元素',
    loveFortune: '感情需要平衡和妥协，相互理解',
  },
  {
    name: '恶魔',
    emoji: '😈',
    meaning: '诱惑，束缚',
    advice: '识别并打破限制，追求自由',
    loveFortune: '警惕不健康的依赖，保持独立',
  },
  {
    name: '塔',
    emoji: '🗼',
    meaning: '突变，破坏',
    advice: '接受突如其来的变化',
    loveFortune: '可能有意外发生，保持冷静应对',
  },
  {
    name: '星星',
    emoji: '⭐',
    meaning: '希望，灵感',
    advice: '保持希望，相信未来',
    loveFortune: '充满希望的恋情，梦想成真',
  },
  {
    name: '月亮',
    emoji: '🌙',
    meaning: '潜意识，幻想',
    advice: '面对内心的恐惧和不安',
    loveFortune: '感情朦胧不清，需要更多沟通',
  },
  {
    name: '太阳',
    emoji: '☀️',
    meaning: '成功，喜悦',
    advice: '享受当下，分享快乐',
    loveFortune: '感情明朗美好，幸福洋溢',
  },
  {
    name: '审判',
    emoji: '📯',
    meaning: '觉醒，救赎',
    advice: '反思过去，做出改变',
    loveFortune: '重新审视感情，可能有复合机会',
  },
  {
    name: '世界',
    emoji: '🌍',
    meaning: '完成，成就',
    advice: '庆祝成功，准备新旅程',
    loveFortune: '感情圆满，达到理想状态',
  },
]

export default function TarotPage() {
  const toast = useToast()
  const [isDrawing, setIsDrawing] = useState(false)
  const [drawnCard, setDrawnCard] = useState<TarotCard | null>(null)
  const [todayReading, setTodayReading] = useState<any>(null)
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkTodayReading()
    loadHistory()
  }, [])

  // 检查今天是否已抽牌
  const checkTodayReading = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const { data, error } = await supabase
        .from('tarot_readings')
        .select('*')
        .eq('reading_date', today)
        .order('created_at', { ascending: false })
        .limit(1)

      if (error) throw error

      if (data && data.length > 0) {
        setTodayReading(data[0])
        const card = TAROT_CARDS.find((c) => c.name === data[0].card_name)
        if (card) setDrawnCard(card)
      }
    } catch (error) {
      console.error('检查今日占卜失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 加载历史记录
  const loadHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('tarot_readings')
        .select('*')
        .order('reading_date', { ascending: false })
        .limit(10)

      if (error) throw error
      if (data) setHistory(data)
    } catch (error) {
      console.error('加载历史记录失败:', error)
    }
  }

  // 抽牌
  const drawCard = async () => {
    if (todayReading) {
      toast.error('今天已经抽过牌了哦，明天再来吧！')
      return
    }

    setIsDrawing(true)

    // 触觉反馈
    if (navigator.vibrate) {
      navigator.vibrate([50, 50, 50, 50, 50])
    }

    // 随机选择一张牌（带动画效果）
    let count = 0
    const interval = setInterval(() => {
      const randomCard = TAROT_CARDS[Math.floor(Math.random() * TAROT_CARDS.length)]
      setDrawnCard(randomCard)
      count++

      if (count > 20) {
        clearInterval(interval)
        setIsDrawing(false)
        saveReading(randomCard)
      }
    }, 100)
  }

  // 保存占卜结果
  const saveReading = async (card: TarotCard) => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const { data, error } = await supabase
        .from('tarot_readings')
        .insert([
          {
            user_id: 'couple',
            card_name: card.name,
            card_meaning: card.meaning,
            card_advice: card.advice,
            love_fortune: card.loveFortune,
            reading_date: today,
          },
        ])
        .select()

      if (error) throw error

      if (data && data.length > 0) {
        setTodayReading(data[0])
        loadHistory()
        toast.success('占卜完成！💫')

        // 触觉反馈
        if (navigator.vibrate) {
          navigator.vibrate([100, 50, 200])
        }
      }
    } catch (error) {
      console.error('保存占卜结果失败:', error)
      toast.error('保存失败，请重试')
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })
  }

  if (loading) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-2xl">🔮 加载中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <BackButton href="/" text="返回首页" />

        <div className="card text-center">
          <h1 className="text-4xl font-bold text-primary mb-2">🔮 塔罗牌占卜</h1>
          <p className="text-gray-600 mb-8">每日一卦，探索你的恋爱运势</p>

          {!drawnCard ? (
            <div className="space-y-8">
              {/* 牌阵 */}
              <div className="grid grid-cols-4 md:grid-cols-6 gap-3 max-w-3xl mx-auto mb-8">
                {TAROT_CARDS.slice(0, 12).map((card, index) => (
                  <div
                    key={index}
                    className="aspect-[2/3] bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg shadow-lg flex items-center justify-center text-white text-3xl hover:scale-105 transition-transform cursor-pointer"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    🎴
                  </div>
                ))}
              </div>

              <button
                onClick={drawCard}
                disabled={isDrawing || !!todayReading}
                className="btn-primary text-xl px-12 py-4 disabled:opacity-50"
              >
                {isDrawing ? '占卜中... 🌟' : '抽取今日塔罗牌 ✨'}
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {/* 抽到的牌 */}
              <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 rounded-3xl p-8 shadow-inner">
                <div
                  className={`bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-8 shadow-2xl max-w-md mx-auto transform ${
                    isDrawing ? 'animate-pulse' : 'scale-100'
                  }`}
                >
                  <div className="text-8xl mb-4">{drawnCard.emoji}</div>
                  <h2 className="text-3xl font-bold text-white mb-2">{drawnCard.name}</h2>
                  <p className="text-purple-100 text-lg">{drawnCard.meaning}</p>
                </div>
              </div>

              {!isDrawing && (
                <div className="grid md:grid-cols-2 gap-6 text-left">
                  {/* 建议 */}
                  <div className="bg-blue-50 rounded-2xl p-6">
                    <h3 className="font-bold text-lg text-blue-800 mb-3 flex items-center gap-2">
                      💡 今日建议
                    </h3>
                    <p className="text-gray-700 leading-relaxed">{drawnCard.advice}</p>
                  </div>

                  {/* 恋爱运势 */}
                  <div className="bg-pink-50 rounded-2xl p-6">
                    <h3 className="font-bold text-lg text-pink-800 mb-3 flex items-center gap-2">
                      💖 恋爱运势
                    </h3>
                    <p className="text-gray-700 leading-relaxed">{drawnCard.loveFortune}</p>
                  </div>
                </div>
              )}

              {todayReading && <p className="text-gray-500 text-sm">明天再来抽取新的塔罗牌吧 🌙</p>}
            </div>
          )}

          {/* 历史记录 */}
          {history.length > 0 && (
            <div className="mt-12 pt-8 border-t text-left">
              <h3 className="font-bold text-xl mb-6 text-gray-800 text-center">📜 历史占卜记录</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {history.map((record) => {
                  const card = TAROT_CARDS.find((c) => c.name === record.card_name)
                  return (
                    <div
                      key={record.id}
                      className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex items-center gap-4 mb-3">
                        <span className="text-4xl">{card?.emoji}</span>
                        <div>
                          <h4 className="font-bold text-lg text-gray-800">{record.card_name}</h4>
                          <p className="text-sm text-gray-600">{formatDate(record.reading_date)}</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">{record.love_fortune}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* 说明 */}
          <div className="mt-8 pt-6 border-t text-left">
            <h3 className="font-bold text-lg mb-3 text-gray-700">🌟 使用说明：</h3>
            <ul className="space-y-2 text-gray-600">
              <li>• 每天只能抽取一次塔罗牌</li>
              <li>• 抽牌前先在心中默念问题</li>
              <li>• 塔罗牌会给出当日的恋爱运势和建议</li>
              <li>• 可以查看过往的占卜记录</li>
              <li>• 保持开放的心态，参考建议而非完全依赖</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
