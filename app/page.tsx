'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import RandomMemory from './components/RandomMemory'

interface Stats {
  photos: number
  wishes: number
  checkIns: number
  daysTogeth: number
}

interface NextAnniversary {
  name: string
  date: string
  daysLeft: number
}

export default function Home() {
  const [stats, setStats] = useState<Stats>({
    photos: 0,
    wishes: 0,
    checkIns: 0,
    daysTogeth: 0,
  })
  const [dailyQuote, setDailyQuote] = useState('')
  const [nextAnniversary, setNextAnniversary] = useState<NextAnniversary | null>(null)

  useEffect(() => {
    loadStats()
    loadDailyQuote()
    loadNextAnniversary()
  }, [])

  const loadStats = async () => {
    try {
      // 恋爱天数（假设从2024年1月1日开始）
      const startDate = new Date('2024-01-01')
      const today = new Date()
      const days = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

      // 获取照片数量
      const { count: photosCount } = await supabase
        .from('photos')
        .select('*', { count: 'exact', head: true })

      // 获取心愿数量
      const { count: wishesCount } = await supabase
        .from('wishlist')
        .select('*', { count: 'exact', head: true })

      // 获取签到数量
      const { count: checkInsCount } = await supabase
        .from('check_ins')
        .select('*', { count: 'exact', head: true })

      setStats({
        photos: photosCount || 0,
        wishes: wishesCount || 0,
        checkIns: checkInsCount || 0,
        daysTogeth: days,
      })
    } catch (error) {
      console.error('加载统计数据失败:', error)
    }
  }

  const loadDailyQuote = async () => {
    try {
      // 从 love_quotes 表随机获取一条情话
      const { data, error } = await supabase.from('love_quotes').select('quote').limit(50)

      if (error) throw error

      if (data && data.length > 0) {
        // 客户端随机选择一条
        const randomQuote = data[Math.floor(Math.random() * data.length)]
        setDailyQuote(randomQuote.quote)
      }
    } catch (error) {
      console.error('加载每日情话失败:', error)
      setDailyQuote('爱你，是我做过最好的决定 💕')
    }
  }

  const loadNextAnniversary = async () => {
    try {
      const { data, error } = await supabase
        .from('anniversaries')
        .select('*')
        .order('date', { ascending: true })

      if (error) throw error

      if (data && data.length > 0) {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        // 找到下一个即将到来的纪念日
        for (const anniversary of data) {
          const anniversaryDate = new Date(anniversary.date)
          const currentYearDate = new Date(
            today.getFullYear(),
            anniversaryDate.getMonth(),
            anniversaryDate.getDate()
          )

          // 如果今年的日期已经过了，看明年的
          if (currentYearDate < today) {
            currentYearDate.setFullYear(today.getFullYear() + 1)
          }

          const daysLeft = Math.ceil(
            (currentYearDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          )

          if (daysLeft >= 0) {
            setNextAnniversary({
              name: anniversary.name,
              date: currentYearDate.toLocaleDateString('zh-CN'),
              daysLeft: daysLeft,
            })
            break
          }
        }
      }
    } catch (error) {
      console.error('加载纪念日失败:', error)
    }
  }
  return (
    <main className="min-h-screen p-4 sm:p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="text-center mb-6 md:mb-8 mt-4 md:mt-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 md:mb-4 drop-shadow-lg">
            💕 zyx和zly的小世界 💕
          </h1>
          <p className="text-lg sm:text-xl text-white drop-shadow">属于我们两个人的专属空间</p>
        </header>

        {/* Love Stats Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-pink-500 to-red-500 rounded-2xl p-4 text-white shadow-xl">
            <div className="text-3xl font-bold">{stats.daysTogeth}</div>
            <div className="text-sm opacity-90">在一起的天数</div>
            <div className="text-2xl mt-1">❤️</div>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-indigo-500 rounded-2xl p-4 text-white shadow-xl">
            <div className="text-3xl font-bold">{stats.photos}</div>
            <div className="text-sm opacity-90">共同回忆</div>
            <div className="text-2xl mt-1">📸</div>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-4 text-white shadow-xl">
            <div className="text-3xl font-bold">{stats.checkIns}</div>
            <div className="text-sm opacity-90">签到天数</div>
            <div className="text-2xl mt-1">📅</div>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-yellow-500 rounded-2xl p-4 text-white shadow-xl">
            <div className="text-3xl font-bold">{stats.wishes}</div>
            <div className="text-sm opacity-90">心愿清单</div>
            <div className="text-2xl mt-1">✨</div>
          </div>
        </div>

        {/* Next Anniversary Countdown */}
        {nextAnniversary && (
          <div className="bg-gradient-to-br from-rose-500 via-pink-500 to-purple-500 rounded-2xl p-6 shadow-xl mb-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-sm opacity-90 mb-1">即将到来 💝</div>
                <h3 className="text-2xl font-bold mb-1">{nextAnniversary.name}</h3>
                <p className="text-sm opacity-90">{nextAnniversary.date}</p>
              </div>
              <div className="text-center">
                <div className="text-5xl font-bold">{nextAnniversary.daysLeft}</div>
                <div className="text-sm mt-1">天后</div>
              </div>
            </div>
          </div>
        )}

        {/* Daily Love Quote */}
        {dailyQuote && (
          <div className="bg-gradient-to-r from-pink-400 via-rose-400 to-red-400 rounded-2xl p-6 shadow-xl mb-8 text-white text-center">
            <div className="text-4xl mb-3">💝</div>
            <p className="text-lg md:text-xl font-medium italic">&ldquo;{dailyQuote}&rdquo;</p>
            <p className="text-sm mt-2 opacity-80">今日情话</p>
          </div>
        )}

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Photo Album */}
          <Link href="/photos">
            <div className="card hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
              <div className="text-5xl sm:text-6xl mb-3 sm:mb-4 text-center">📸</div>
              <h2 className="text-xl sm:text-2xl font-bold text-center mb-2 text-primary">
                我们的相册
              </h2>
              <p className="text-sm sm:text-base text-gray-600 text-center">记录每一个美好瞬间</p>
            </div>
          </Link>

          {/* Check In */}
          <Link href="/check-in">
            <div className="card hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
              <div className="text-5xl sm:text-6xl mb-3 sm:mb-4 text-center">💖</div>
              <h2 className="text-xl sm:text-2xl font-bold text-center mb-2 text-primary">
                每日签到
              </h2>
              <p className="text-sm sm:text-base text-gray-600 text-center">记录每一天的小确幸</p>
            </div>
          </Link>

          {/* Gomoku */}
          <Link href="/gomoku">
            <div className="card hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
              <div className="text-5xl sm:text-6xl mb-3 sm:mb-4 text-center">⚫⚪</div>
              <h2 className="text-xl sm:text-2xl font-bold text-center mb-2 text-primary">
                五子棋对战
              </h2>
              <p className="text-sm sm:text-base text-gray-600 text-center">来一场甜蜜的对决吧</p>
            </div>
          </Link>

          {/* Anniversaries */}
          <Link href="/anniversaries">
            <div className="card hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
              <div className="text-5xl sm:text-6xl mb-3 sm:mb-4 text-center">💝</div>
              <h2 className="text-xl sm:text-2xl font-bold text-center mb-2 text-primary">
                重要纪念日
              </h2>
              <p className="text-sm sm:text-base text-gray-600 text-center">
                永远铭记我们的每个特殊日子
              </p>
            </div>
          </Link>

          {/* Food Decider */}
          <Link href="/food">
            <div className="card hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
              <div className="text-5xl sm:text-6xl mb-3 sm:mb-4 text-center">🍱</div>
              <h2 className="text-xl sm:text-2xl font-bold text-center mb-2 text-primary">
                今晚吃什么
              </h2>
              <p className="text-sm sm:text-base text-gray-600 text-center">让我来帮你们做决定</p>
            </div>
          </Link>

          {/* Love Notes */}
          <Link href="/notes">
            <div className="card hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
              <div className="text-5xl sm:text-6xl mb-3 sm:mb-4 text-center">💌</div>
              <h2 className="text-xl sm:text-2xl font-bold text-center mb-2 text-primary">
                甜蜜留言板
              </h2>
              <p className="text-sm sm:text-base text-gray-600 text-center">留下想对对方说的话</p>
            </div>
          </Link>

          {/* Wishlist */}
          <Link href="/wishlist">
            <div className="card hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
              <div className="text-5xl sm:text-6xl mb-3 sm:mb-4 text-center">✨</div>
              <h2 className="text-xl sm:text-2xl font-bold text-center mb-2 text-primary">
                心愿清单
              </h2>
              <p className="text-sm sm:text-base text-gray-600 text-center">一起完成的愿望</p>
            </div>
          </Link>

          {/* Truth or Dare */}
          <Link href="/truth-or-dare">
            <div className="card hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
              <div className="text-5xl sm:text-6xl mb-3 sm:mb-4 text-center">💖</div>
              <h2 className="text-xl sm:text-2xl font-bold text-center mb-2 text-primary">
                真心话大冒险
              </h2>
              <p className="text-sm sm:text-base text-gray-600 text-center">增进了解的趣味游戏</p>
            </div>
          </Link>

          {/* Bucket List */}
          <Link href="/bucket-list">
            <div className="card hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
              <div className="text-5xl sm:text-6xl mb-3 sm:mb-4 text-center">💑</div>
              <h2 className="text-xl sm:text-2xl font-bold text-center mb-2 text-primary">
                100件想做的事
              </h2>
              <p className="text-sm sm:text-base text-gray-600 text-center">我们的爱情任务清单</p>
            </div>
          </Link>

          {/* Love Quotes */}
          <Link href="/love-quotes">
            <div className="card hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
              <div className="text-5xl sm:text-6xl mb-3 sm:mb-4 text-center">💝</div>
              <h2 className="text-xl sm:text-2xl font-bold text-center mb-2 text-primary">
                情话生成器
              </h2>
              <p className="text-sm sm:text-base text-gray-600 text-center">每天一句甜蜜情话</p>
            </div>
          </Link>

          {/* Couple Quiz */}
          <Link href="/couple-quiz">
            <div className="card hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
              <div className="text-5xl sm:text-6xl mb-3 sm:mb-4 text-center">🤔</div>
              <h2 className="text-xl sm:text-2xl font-bold text-center mb-2 text-primary">
                情侣问答
              </h2>
              <p className="text-sm sm:text-base text-gray-600 text-center">测测你们的默契度</p>
            </div>
          </Link>

          {/* Rock Paper Scissors */}
          <Link href="/rock-paper-scissors">
            <div className="card hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
              <div className="text-5xl sm:text-6xl mb-3 sm:mb-4 text-center">✊</div>
              <h2 className="text-xl sm:text-2xl font-bold text-center mb-2 text-primary">
                石头剪刀布
              </h2>
              <p className="text-sm sm:text-base text-gray-600 text-center">看谁的运气更好</p>
            </div>
          </Link>

          {/* Memory Game */}
          <Link href="/memory-game">
            <div className="card hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
              <div className="text-5xl sm:text-6xl mb-3 sm:mb-4 text-center">🃏</div>
              <h2 className="text-xl sm:text-2xl font-bold text-center mb-2 text-primary">
                记忆翻牌
              </h2>
              <p className="text-sm sm:text-base text-gray-600 text-center">考验记忆力的游戏</p>
            </div>
          </Link>

          {/* Drawing */}
          <Link href="/drawing">
            <div className="card hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
              <div className="text-5xl sm:text-6xl mb-3 sm:mb-4 text-center">🎨</div>
              <h2 className="text-xl sm:text-2xl font-bold text-center mb-2 text-primary">
                猜猜我画的
              </h2>
              <p className="text-sm sm:text-base text-gray-600 text-center">发挥你的艺术天赋</p>
            </div>
          </Link>

          {/* Countdown */}
          <Link href="/countdown">
            <div className="card hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
              <div className="text-5xl sm:text-6xl mb-3 sm:mb-4 text-center">⏰</div>
              <h2 className="text-xl sm:text-2xl font-bold text-center mb-2 text-primary">
                时光计时器
              </h2>
              <p className="text-sm sm:text-base text-gray-600 text-center">
                记录我们的每一个重要时刻
              </p>
            </div>
          </Link>

          {/* Schedule */}
          <Link href="/schedule">
            <div className="card hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
              <div className="text-5xl sm:text-6xl mb-3 sm:mb-4 text-center">📅</div>
              <h2 className="text-xl sm:text-2xl font-bold text-center mb-2 text-primary">
                共享日程
              </h2>
              <p className="text-sm sm:text-base text-gray-600 text-center">规划两人的约会计划</p>
            </div>
          </Link>

          {/* Time Capsule */}
          <Link href="/time-capsule">
            <div className="card hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
              <div className="text-5xl sm:text-6xl mb-3 sm:mb-4 text-center">🎁</div>
              <h2 className="text-xl sm:text-2xl font-bold text-center mb-2 text-primary">
                时光胶囊
              </h2>
              <p className="text-sm sm:text-base text-gray-600 text-center">写给未来的信</p>
            </div>
          </Link>

          {/* Diary */}
          <Link href="/diary">
            <div className="card hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
              <div className="text-5xl sm:text-6xl mb-3 sm:mb-4 text-center">📖</div>
              <h2 className="text-xl sm:text-2xl font-bold text-center mb-2 text-primary">
                恋爱日记
              </h2>
              <p className="text-sm sm:text-base text-gray-600 text-center">记录每天的甜蜜瞬间</p>
            </div>
          </Link>

          {/* Feature Requests */}
          <Link href="/feature-requests">
            <div className="card hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-2 border-purple-500/30">
              <div className="text-5xl sm:text-6xl mb-3 sm:mb-4 text-center">💡</div>
              <h2 className="text-xl sm:text-2xl font-bold text-center mb-2 text-primary">
                功能申请箱
              </h2>
              <p className="text-sm sm:text-base text-gray-600 text-center">提出你的想法和建议</p>
            </div>
          </Link>
        </div>

        {/* Random Memory Section */}
        <div className="mt-12">
          <RandomMemory />
        </div>

        {/* Footer */}
        <footer className="text-center mt-16 text-white drop-shadow">
          <p className="text-lg">❤️ 愿我们的爱情永远甜蜜 ❤️</p>
        </footer>
      </div>
    </main>
  )
}
