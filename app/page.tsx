'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import RandomMemory from './components/RandomMemory'
import ThisDayMemories from './components/ThisDayMemories'

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
  const [unreadChat, setUnreadChat] = useState(0)
  const [unreadNotes, setUnreadNotes] = useState(0)

  useEffect(() => {
    loadStats()
    loadDailyQuote()
    loadNextAnniversary()
    loadUnreadCounts()

    // Refresh unread badges when user returns from another tab/page
    const onVisibility = () => {
      if (document.visibilityState === 'visible') loadUnreadCounts()
    }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('focus', loadUnreadCounts)

    // Realtime subscription for chat and notes
    const chatChannel = supabase
      .channel('home_unread_chat')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages' }, () => {
        loadUnreadCounts()
      })
      .subscribe()

    const notesChannel = supabase
      .channel('home_unread_notes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'love_notes' }, () => {
        loadUnreadCounts()
      })
      .subscribe()

    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('focus', loadUnreadCounts)
      supabase.removeChannel(chatChannel)
      supabase.removeChannel(notesChannel)
    }
  }, [])

  const loadStats = async () => {
    try {
      // 恋爱天数（从2025年9月12日开始）
      const startDate = new Date('2025-09-12')
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

  const loadUnreadCounts = async () => {
    try {
      const currentUser = localStorage.getItem('loggedInUser') || localStorage.getItem('currentUser')
      if (!currentUser) return

      // Unread chat messages (sent by the other person, not read yet)
      const { count: chatCount } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .neq('sender', currentUser)
        .eq('is_read', false)

      setUnreadChat(chatCount || 0)

      // Unread notes (written by the other person, check notes created in last 24h)
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const { count: notesCount } = await supabase
        .from('love_notes')
        .select('*', { count: 'exact', head: true })
        .neq('author', currentUser)
        .gte('created_at', yesterday.toISOString())

      setUnreadNotes(notesCount || 0)
    } catch (err) {
      // Silently ignore - tables might not exist yet
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

        {/* Next Anniversary Countdown - Enhanced */}
        {nextAnniversary && (
          <div className="relative bg-gradient-to-br from-rose-500 via-pink-500 to-purple-500 rounded-2xl p-6 shadow-xl mb-6 text-white overflow-hidden">
            {/* Floating hearts animation */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="absolute text-4xl animate-float"
                  style={{
                    left: `${i * 20}%`,
                    animationDelay: `${i * 0.5}s`,
                    opacity: 0.2,
                  }}
                >
                  💝
                </div>
              ))}
            </div>

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex-1 text-center md:text-left">
                <div className="text-sm opacity-90 mb-1 flex items-center justify-center md:justify-start gap-2">
                  <span className="animate-pulse">💝</span>
                  <span>即将到来</span>
                </div>
                <h3 className="text-2xl md:text-3xl font-bold mb-1 animate-bounce">
                  {nextAnniversary.name}
                </h3>
                <p className="text-sm opacity-90">{nextAnniversary.date}</p>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-center bg-white/20 rounded-xl p-4 backdrop-blur-sm">
                  <div className="text-5xl md:text-6xl font-bold animate-pulse">
                    {nextAnniversary.daysLeft}
                  </div>
                  <div className="text-sm mt-1">天后</div>
                </div>

                <button
                  onClick={() => {
                    // 生成海报逻辑（简化版，实际可以用canvas生成图片）
                    const posterText = `
${nextAnniversary.name}
距离这个特殊的日子还有 ${nextAnniversary.daysLeft} 天
${nextAnniversary.date}
💕 zyx和zly的小世界 💕
                    `.trim()

                    navigator.clipboard.writeText(posterText)
                    alert('纪念日海报文案已复制到剪贴板！')
                  }}
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg p-3 transition-all transform hover:scale-110"
                  title="生成海报"
                >
                  <span className="text-2xl">📋</span>
                </button>
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

        {/* "This Day in History" memories (photos/diary/anniversaries from same date past years) */}
        <ThisDayMemories />

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Couple Chat - TOP PRIORITY */}
          <Link href="/chat">
            <div className="card hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer bg-gradient-to-br from-pink-500/10 to-red-500/10 relative">
              {unreadChat > 0 && (
                <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg animate-bounce z-10">
                  {unreadChat > 99 ? '99+' : unreadChat}
                </div>
              )}
              <div className="text-5xl sm:text-6xl mb-3 sm:mb-4 text-center">💬</div>
              <h2 className="text-xl sm:text-2xl font-bold text-center mb-2 text-primary">
                情侣聊天室
              </h2>
              <p className="text-sm sm:text-base text-gray-600 text-center">实时聊天，随时传情</p>
            </div>
          </Link>

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

          {/* Shared Expense Tracker - NEW */}
          <Link href="/expenses">
            <div className="card hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200">
              <div className="text-5xl sm:text-6xl mb-3 sm:mb-4 text-center">💰</div>
              <h2 className="text-xl sm:text-2xl font-bold text-center mb-2 text-primary">
                共同账本
              </h2>
              <p className="text-sm sm:text-base text-gray-600 text-center">平分不分手，记录每一笔花销</p>
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

          {/* Mahjong */}
          <Link href="/mahjong">
            <div className="card hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
              <div className="text-5xl sm:text-6xl mb-3 sm:mb-4 text-center">🀄</div>
              <h2 className="text-xl sm:text-2xl font-bold text-center mb-2 text-primary">
                欢乐麻将
              </h2>
              <p className="text-sm sm:text-base text-gray-600 text-center">国粹对局赚取欢乐豆</p>
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
            <div className="card hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer relative">
              {unreadNotes > 0 && (
                <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg z-10">
                  {unreadNotes}
                </div>
              )}
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

          {/* Matching Game */}
          <Link href="/matching-game">
            <div className="card hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
              <div className="text-5xl sm:text-6xl mb-3 sm:mb-4 text-center">🧩</div>
              <h2 className="text-xl sm:text-2xl font-bold text-center mb-2 text-primary">
                情侣配对游戏
              </h2>
              <p className="text-sm sm:text-base text-gray-600 text-center">
                找到所有配对的情侣物品
              </p>
            </div>
          </Link>

          {/* Dress Up */}
          <Link href="/dress-up">
            <div className="card hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
              <div className="text-5xl sm:text-6xl mb-3 sm:mb-4 text-center">🎀</div>
              <h2 className="text-xl sm:text-2xl font-bold text-center mb-2 text-primary">
                装扮小人游戏
              </h2>
              <p className="text-sm sm:text-base text-gray-600 text-center">打扮你的虚拟形象</p>
            </div>
          </Link>

          {/* Love Letter */}
          <Link href="/love-letter">
            <div className="card hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
              <div className="text-5xl sm:text-6xl mb-3 sm:mb-4 text-center">💌</div>
              <h2 className="text-xl sm:text-2xl font-bold text-center mb-2 text-primary">
                制作情书游戏
              </h2>
              <p className="text-sm sm:text-base text-gray-600 text-center">创作专属浪漫情书</p>
            </div>
          </Link>

          {/* Color Test */}
          <Link href="/color-test">
            <div className="card hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
              <div className="text-5xl sm:text-6xl mb-3 sm:mb-4 text-center">🌈</div>
              <h2 className="text-xl sm:text-2xl font-bold text-center mb-2 text-primary">
                颜色性格测试
              </h2>
              <p className="text-sm sm:text-base text-gray-600 text-center">
                测测你的性格和恋爱风格
              </p>
            </div>
          </Link>

          {/* Tarot */}
          <Link href="/tarot">
            <div className="card hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
              <div className="text-5xl sm:text-6xl mb-3 sm:mb-4 text-center">🔮</div>
              <h2 className="text-xl sm:text-2xl font-bold text-center mb-2 text-primary">
                塔罗牌占卜
              </h2>
              <p className="text-sm sm:text-base text-gray-600 text-center">
                每日一卦，探索恋爱运势
              </p>
            </div>
          </Link>

          {/* Horoscope */}
          <Link href="/horoscope">
            <div className="card hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
              <div className="text-5xl sm:text-6xl mb-3 sm:mb-4 text-center">⭐</div>
              <h2 className="text-xl sm:text-2xl font-bold text-center mb-2 text-primary">
                星座运势
              </h2>
              <p className="text-sm sm:text-base text-gray-600 text-center">查看双人每日运势</p>
            </div>
          </Link>

          {/* Compatibility Test */}
          <Link href="/compatibility-test">
            <div className="card hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
              <div className="text-5xl sm:text-6xl mb-3 sm:mb-4 text-center">💕</div>
              <h2 className="text-xl sm:text-2xl font-bold text-center mb-2 text-primary">
                默契度测试
              </h2>
              <p className="text-sm sm:text-base text-gray-600 text-center">测测你们有多默契</p>
            </div>
          </Link>

          {/* Sweet Words */}
          <Link href="/sweet-words">
            <div className="card hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
              <div className="text-5xl sm:text-6xl mb-3 sm:mb-4 text-center">💝</div>
              <h2 className="text-xl sm:text-2xl font-bold text-center mb-2 text-primary">
                土味情话
              </h2>
              <p className="text-sm sm:text-base text-gray-600 text-center">甜到齁的情话大全</p>
            </div>
          </Link>

          {/* Catch Heart Game */}
          <Link href="/catch-heart">
            <div className="card hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
              <div className="text-5xl sm:text-6xl mb-3 sm:mb-4 text-center">💗</div>
              <h2 className="text-xl sm:text-2xl font-bold text-center mb-2 text-primary">
                接住爱心
              </h2>
              <p className="text-sm sm:text-base text-gray-600 text-center">接住从天而降的爱心</p>
            </div>
          </Link>

          {/* Thunder Fighter (Raiden-style) */}
          <Link href="/love-survivor">
            <div className="card hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer bg-gradient-to-br from-slate-800 to-indigo-900 text-white">
              <div className="text-5xl sm:text-6xl mb-3 sm:mb-4 text-center">✈️</div>
              <h2 className="text-xl sm:text-2xl font-bold text-center mb-2 text-yellow-300">
                雷霆战机
              </h2>
              <p className="text-sm sm:text-base text-gray-300 text-center">
                竖版飞行射击，经典雷神感
              </p>
            </div>
          </Link>

          {/* Grass Cutter (Survivor) */}
          <Link href="/grass-cutter">
            <div className="card hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer bg-gradient-to-br from-green-700 to-emerald-900 text-white">
              <div className="text-5xl sm:text-6xl mb-3 sm:mb-4 text-center">🧑‍🌾</div>
              <h2 className="text-xl sm:text-2xl font-bold text-center mb-2 text-green-300">
                割草大作战
              </h2>
              <p className="text-sm sm:text-base text-gray-300 text-center">
                自动攻击，存活 5 分钟获胜
              </p>
            </div>
          </Link>

          {/* Mood Tracker */}
          <Link href="/mood-tracker">
            <div className="card hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
              <div className="text-5xl sm:text-6xl mb-3 sm:mb-4 text-center">😊</div>
              <h2 className="text-xl sm:text-2xl font-bold text-center mb-2 text-primary">
                心情追踪
              </h2>
              <p className="text-sm sm:text-base text-gray-600 text-center">记录每天的心情变化</p>
            </div>
          </Link>

          {/* Emoji Battle */}
          <Link href="/emoji-battle">
            <div className="card hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
              <div className="text-5xl sm:text-6xl mb-3 sm:mb-4 text-center">🎴</div>
              <h2 className="text-xl sm:text-2xl font-bold text-center mb-2 text-primary">
                表情包大乱斗
              </h2>
              <p className="text-sm sm:text-base text-gray-600 text-center">
                选卡对战，谁的表情更厉害
              </p>
            </div>
          </Link>

          {/* Board Game */}
          <Link href="/board-game">
            <div className="card hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
              <div className="text-5xl sm:text-6xl mb-3 sm:mb-4 text-center">🎲</div>
              <h2 className="text-xl sm:text-2xl font-bold text-center mb-2 text-primary">
                情侣飞行棋
              </h2>
              <p className="text-sm sm:text-base text-gray-600 text-center">一起掷骰子玩飞行棋</p>
            </div>
          </Link>

          {/* Love Dice */}
          <Link href="/love-dice">
            <div className="card hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
              <div className="text-5xl sm:text-6xl mb-3 sm:mb-4 text-center">🎯</div>
              <h2 className="text-xl sm:text-2xl font-bold text-center mb-2 text-primary">
                爱情骰子
              </h2>
              <p className="text-sm sm:text-base text-gray-600 text-center">
                选择困难？让骰子来决定
              </p>
            </div>
          </Link>

          {/* Daily Challenge */}
          <Link href="/daily-challenge">
            <div className="card hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
              <div className="text-5xl sm:text-6xl mb-3 sm:mb-4 text-center">📋</div>
              <h2 className="text-xl sm:text-2xl font-bold text-center mb-2 text-primary">
                每日挑战
              </h2>
              <p className="text-sm sm:text-base text-gray-600 text-center">每天一个爱的小任务</p>
            </div>
          </Link>

          {/* Love Contract */}
          <Link href="/love-contract">
            <div className="card hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
              <div className="text-5xl sm:text-6xl mb-3 sm:mb-4 text-center">📜</div>
              <h2 className="text-xl sm:text-2xl font-bold text-center mb-2 text-primary">
                情侣契约书
              </h2>
              <p className="text-sm sm:text-base text-gray-600 text-center">
                创建属于你们的爱情约定
              </p>
            </div>
          </Link>

          {/* Music Player */}
          <Link href="/music-player">
            <div className="card hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
              <div className="text-5xl sm:text-6xl mb-3 sm:mb-4 text-center">🎵</div>
              <h2 className="text-xl sm:text-2xl font-bold text-center mb-2 text-primary">
                共享音乐播放器
              </h2>
              <p className="text-sm sm:text-base text-gray-600 text-center">
                一起听歌，分享浪漫时刻
              </p>
            </div>
          </Link>

          {/* Novels / Couple Bookshelf */}
          <Link href="/novels">
            <div className="card hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer bg-gradient-to-br from-indigo-50 to-blue-50">
              <div className="text-5xl sm:text-6xl mb-3 sm:mb-4 text-center">📚</div>
              <h2 className="text-xl sm:text-2xl font-bold text-center mb-2 text-primary">
                情侣书架
              </h2>
              <p className="text-sm sm:text-base text-gray-600 text-center">
                一起阅读，分享故事感动
              </p>
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

          {/* Settings */}
          <Link href="/settings">
            <div className="card hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer bg-gradient-to-br from-gray-100 to-gray-200">
              <div className="text-5xl sm:text-6xl mb-3 sm:mb-4 text-center">⚙️</div>
              <h2 className="text-xl sm:text-2xl font-bold text-center mb-2 text-primary">
                个人设置
              </h2>
              <p className="text-sm sm:text-base text-gray-600 text-center">
                自定义头像、昵称和签名
              </p>
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
