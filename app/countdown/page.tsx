'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useToast } from '../components/ToastProvider'
import BackButton from '../components/BackButton'

interface Countdown {
  id: string
  title: string
  target_date: string
  type: 'countdown' | 'countup'
  emoji: string
  created_at: string
}

export default function CountdownPage() {
  const toast = useToast()
  const [countdowns, setCountdowns] = useState<Countdown[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newCountdown, setNewCountdown] = useState({
    title: '',
    target_date: '',
    type: 'countdown' as 'countdown' | 'countup',
    emoji: '⏰',
  })
  const [currentTime, setCurrentTime] = useState(new Date())

  const loadCountdowns = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('countdowns')
        .select('*')
        .order('target_date', { ascending: true })

      if (error) throw error
      setCountdowns(data || [])
    } catch (error) {
      console.error('Error loading countdowns:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCountdowns()
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [loadCountdowns])

  const calculateTimeDifference = (targetDate: string, type: string) => {
    const target = new Date(targetDate)
    const now = currentTime
    const diff =
      type === 'countdown' ? target.getTime() - now.getTime() : now.getTime() - target.getTime()

    if (diff < 0 && type === 'countdown') {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true }
    }

    const days = Math.floor(Math.abs(diff) / (1000 * 60 * 60 * 24))
    const hours = Math.floor((Math.abs(diff) % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((Math.abs(diff) % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((Math.abs(diff) % (1000 * 60)) / 1000)

    return { days, hours, minutes, seconds, isPast: false }
  }

  const handleAddCountdown = async () => {
    if (!newCountdown.title || !newCountdown.target_date) {
      toast.warning('请填写标题和日期')
      return
    }

    try {
      const { error } = await supabase.from('countdowns').insert([newCountdown])

      if (error) throw error

      setNewCountdown({
        title: '',
        target_date: '',
        type: 'countdown',
        emoji: '⏰',
      })
      setShowAddForm(false)
      toast.success('倒计时添加成功！')
      loadCountdowns()
    } catch (error) {
      console.error('Error adding countdown:', error)
      toast.error('添加失败，请重试')
    }
  }

  const handleDeleteCountdown = async (id: string) => {
    if (!confirm('确定要删除这个倒计时吗？')) return

    try {
      const { error } = await supabase.from('countdowns').delete().eq('id', id)

      if (error) throw error
      toast.success('删除成功')
      loadCountdowns()
    } catch (error) {
      console.error('Error deleting countdown:', error)
      toast.error('删除失败，请重试')
    }
  }

  const emojiOptions = ['⏰', '💝', '🎂', '🎉', '✈️', '💍', '🌟', '❤️', '🎁', '🌹']

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">加载中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <BackButton href="/" text="返回首页" />

        <div className="card">
          <h1 className="text-4xl font-bold text-primary mb-2 text-center">⏰ 时光计时器</h1>
          <p className="text-gray-600 text-center mb-6">记录每一个重要时刻</p>

          <div className="flex justify-center mb-8">
            <button onClick={() => setShowAddForm(!showAddForm)} className="btn-primary">
              {showAddForm ? '取消' : '+ 添加计时'}
            </button>
          </div>

          {showAddForm && (
            <div className="mb-8 p-6 bg-pink-50 rounded-xl border border-pink-200">
              <h3 className="text-xl font-bold text-gray-800 mb-4">添加新计时</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 mb-2 font-semibold">标题</label>
                  <input
                    type="text"
                    value={newCountdown.title}
                    onChange={(e) => setNewCountdown({ ...newCountdown, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="例如：下次见面、在一起纪念日"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2 font-semibold">日期时间</label>
                  <input
                    type="datetime-local"
                    value={newCountdown.target_date}
                    onChange={(e) =>
                      setNewCountdown({ ...newCountdown, target_date: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2 font-semibold">类型</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-gray-700 cursor-pointer">
                      <input
                        type="radio"
                        value="countdown"
                        checked={newCountdown.type === 'countdown'}
                        onChange={(e) =>
                          setNewCountdown({ ...newCountdown, type: e.target.value as 'countdown' })
                        }
                        className="w-4 h-4 text-primary"
                      />
                      倒计时（未来事件）
                    </label>
                    <label className="flex items-center gap-2 text-gray-700 cursor-pointer">
                      <input
                        type="radio"
                        value="countup"
                        checked={newCountdown.type === 'countup'}
                        onChange={(e) =>
                          setNewCountdown({ ...newCountdown, type: e.target.value as 'countup' })
                        }
                        className="w-4 h-4 text-primary"
                      />
                      正计时（已过天数）
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 mb-2 font-semibold">选择图标</label>
                  <div className="flex gap-2 flex-wrap">
                    {emojiOptions.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => setNewCountdown({ ...newCountdown, emoji })}
                        className={`text-3xl p-2 rounded-lg transition-all ${
                          newCountdown.emoji === emoji
                            ? 'bg-pink-200 scale-110'
                            : 'bg-gray-100 hover:bg-pink-100'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <button onClick={handleAddCountdown} className="btn-primary w-full">
                  添加计时
                </button>
              </div>
            </div>
          )}

          {countdowns.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">⏰</div>
              <p className="text-xl text-gray-600">还没有添加任何计时器</p>
              <p className="text-gray-500 mt-2">点击&ldquo;添加计时&rdquo;开始记录重要时刻</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {countdowns.map((countdown) => {
                const time = calculateTimeDifference(countdown.target_date, countdown.type)
                return (
                  <div
                    key={countdown.id}
                    className="p-6 bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl border border-pink-200 hover:shadow-lg transition-all"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-4xl">{countdown.emoji}</span>
                        <div>
                          <h3 className="text-xl font-bold text-gray-800">{countdown.title}</h3>
                          <p className="text-sm text-gray-600">
                            {new Date(countdown.target_date).toLocaleString('zh-CN', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteCountdown(countdown.id)}
                        className="text-red-400 hover:text-red-600 transition-colors"
                      >
                        🗑️
                      </button>
                    </div>

                    {time.isPast ? (
                      <div className="text-center py-4 text-gray-500">时间已过</div>
                    ) : (
                      <div className="grid grid-cols-4 gap-4 mt-4">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-primary">{time.days}</div>
                          <div className="text-sm text-gray-600">天</div>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-primary">{time.hours}</div>
                          <div className="text-sm text-gray-600">时</div>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-primary">{time.minutes}</div>
                          <div className="text-sm text-gray-600">分</div>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-primary">{time.seconds}</div>
                          <div className="text-sm text-gray-600">秒</div>
                        </div>
                      </div>
                    )}

                    <div className="mt-4 text-center">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          countdown.type === 'countdown'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {countdown.type === 'countdown' ? '倒计时' : '正计时'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
