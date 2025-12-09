'use client'

import { useState, useEffect } from 'react'
import BackButton from '../components/BackButton'
import { useToast } from '../components/ToastProvider'
import { supabase } from '@/lib/supabase'

interface MoodRecord {
  id: string
  user_id: string
  mood: number
  note: string
  created_at: string
}

const MOODS = [
  { value: 5, emoji: '😍', label: '超级开心', color: 'bg-pink-500' },
  { value: 4, emoji: '😊', label: '开心', color: 'bg-green-500' },
  { value: 3, emoji: '😐', label: '一般', color: 'bg-yellow-500' },
  { value: 2, emoji: '😔', label: '有点难过', color: 'bg-blue-500' },
  { value: 1, emoji: '😢', label: '很难过', color: 'bg-purple-500' },
]

const MOOD_TIPS: Record<number, string[]> = {
  5: ['太棒了！记得和TA分享你的快乐哦！', '开心的日子值得记录下来！', '你的笑容是最美的风景！'],
  4: ['今天心情不错呢！', '保持好心情，继续加油！', '开心是最好的护肤品！'],
  3: ['平淡也是一种幸福！', '有时候普通的一天也很珍贵！', '每一天都是新的开始！'],
  2: ['抱抱你，会好起来的！', '难过的时候找TA聊聊吧！', '明天会更好的！'],
  1: ['心疼你，给你一个大大的拥抱！', '不开心的时候更需要TA的陪伴！', '哭出来会好受一些！'],
}

export default function MoodTrackerPage() {
  const toast = useToast()
  const [selectedMood, setSelectedMood] = useState<number | null>(null)
  const [note, setNote] = useState('')
  const [records, setRecords] = useState<MoodRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'record' | 'history' | 'stats'>('record')

  useEffect(() => {
    const user = localStorage.getItem('currentUser')
    setCurrentUser(user)
    if (user) {
      loadRecords(user)
    } else {
      setLoading(false)
    }
  }, [])

  const loadRecords = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('mood_records')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(30)

      if (error) throw error
      setRecords(data || [])
    } catch (error) {
      console.error('加载心情记录失败:', error)
      // 使用本地存储作为备选
      const localRecords = localStorage.getItem(`moodRecords_${userId}`)
      if (localRecords) {
        setRecords(JSON.parse(localRecords))
      }
    } finally {
      setLoading(false)
    }
  }

  const submitMood = async () => {
    if (!selectedMood || !currentUser) {
      toast.warning('请先选择心情')
      return
    }

    setSubmitting(true)
    const newRecord: MoodRecord = {
      id: Date.now().toString(),
      user_id: currentUser,
      mood: selectedMood,
      note: note.trim(),
      created_at: new Date().toISOString(),
    }

    try {
      const { error } = await supabase.from('mood_records').insert([newRecord])

      if (error) throw error

      setRecords([newRecord, ...records])
      toast.success('心情已记录！' + getRandomTip(selectedMood))
    } catch (error) {
      console.error('保存失败:', error)
      // 本地存储备选
      const updatedRecords = [newRecord, ...records]
      setRecords(updatedRecords)
      localStorage.setItem(`moodRecords_${currentUser}`, JSON.stringify(updatedRecords))
      toast.success('心情已记录！')
    } finally {
      setSubmitting(false)
      setSelectedMood(null)
      setNote('')
    }
  }

  const getRandomTip = (mood: number) => {
    const tips = MOOD_TIPS[mood]
    return tips[Math.floor(Math.random() * tips.length)]
  }

  const getMoodStats = () => {
    if (records.length === 0) return null

    const total = records.length
    const avgMood = records.reduce((sum, r) => sum + r.mood, 0) / total
    const moodCounts = MOODS.map((m) => ({
      ...m,
      count: records.filter((r) => r.mood === m.value).length,
    }))
    const mostFrequent = moodCounts.reduce((a, b) => (a.count > b.count ? a : b))

    return { total, avgMood, moodCounts, mostFrequent }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return '今天'
    if (days === 1) return '昨天'
    if (days < 7) return `${days}天前`
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  }

  const stats = getMoodStats()

  if (!currentUser) {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <BackButton href="/" text="返回首页" />
          <div className="card text-center">
            <h1 className="text-3xl font-bold text-primary mb-4">💭 心情追踪</h1>
            <p className="text-gray-600 mb-6">请先登录后再使用心情追踪功能</p>
            <a href="/login" className="btn-primary inline-block">
              去登录
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <BackButton href="/" text="返回首页" />

        <div className="card">
          <h1 className="text-3xl md:text-4xl font-bold text-primary text-center mb-2">
            💭 心情追踪
          </h1>
          <p className="text-gray-600 text-center mb-6">记录每一天的心情，看看心情变化趋势</p>

          {/* 切换标签 */}
          <div className="flex gap-2 mb-6 bg-gray-100 rounded-xl p-1">
            {[
              { key: 'record', label: '记录心情', icon: '✍️' },
              { key: 'history', label: '历史记录', icon: '📋' },
              { key: 'stats', label: '心情统计', icon: '📊' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setViewMode(tab.key as typeof viewMode)}
                className={`flex-1 py-2 px-4 rounded-lg transition-all ${
                  viewMode === tab.key
                    ? 'bg-white shadow-sm text-primary font-semibold'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {viewMode === 'record' && (
            <div className="space-y-6">
              {/* 心情选择 */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-center">今天心情如何？</h3>
                <div className="flex justify-center gap-4">
                  {MOODS.map((mood) => (
                    <button
                      key={mood.value}
                      onClick={() => setSelectedMood(mood.value)}
                      className={`flex flex-col items-center p-3 rounded-xl transition-all ${
                        selectedMood === mood.value
                          ? 'bg-pink-100 scale-110 ring-2 ring-primary'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <span className="text-4xl mb-1">{mood.emoji}</span>
                      <span className="text-xs text-gray-600">{mood.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 备注输入 */}
              <div>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="写点什么吧...（可选）"
                  className="w-full p-4 border border-gray-200 rounded-xl focus:border-primary focus:outline-none resize-none"
                  rows={3}
                />
              </div>

              {/* 提交按钮 */}
              <button
                onClick={submitMood}
                disabled={!selectedMood || submitting}
                className="w-full btn-primary py-3 disabled:opacity-50"
              >
                {submitting ? '保存中...' : '💾 记录心情'}
              </button>
            </div>
          )}

          {viewMode === 'history' && (
            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : records.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  还没有心情记录哦，快去记录第一条吧！
                </p>
              ) : (
                records.map((record) => {
                  const mood = MOODS.find((m) => m.value === record.mood)
                  return (
                    <div
                      key={record.id}
                      className="bg-gray-50 rounded-xl p-4 flex items-start gap-4"
                    >
                      <div className="text-3xl">{mood?.emoji}</div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-semibold">{mood?.label}</span>
                          <span className="text-sm text-gray-500">
                            {formatDate(record.created_at)}
                          </span>
                        </div>
                        {record.note && <p className="text-gray-600 text-sm">{record.note}</p>}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}

          {viewMode === 'stats' && stats && (
            <div className="space-y-6">
              {/* 概览 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-pink-50 rounded-xl p-4 text-center">
                  <p className="text-sm text-gray-600 mb-1">记录天数</p>
                  <p className="text-3xl font-bold text-primary">{stats.total}</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-4 text-center">
                  <p className="text-sm text-gray-600 mb-1">平均心情</p>
                  <p className="text-3xl font-bold text-purple-500">{stats.avgMood.toFixed(1)}</p>
                </div>
              </div>

              {/* 最常见心情 */}
              <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl p-6 text-center">
                <p className="text-sm text-gray-600 mb-2">最常见的心情</p>
                <span className="text-6xl">{stats.mostFrequent.emoji}</span>
                <p className="text-lg font-semibold mt-2">{stats.mostFrequent.label}</p>
                <p className="text-sm text-gray-500">出现 {stats.mostFrequent.count} 次</p>
              </div>

              {/* 心情分布 */}
              <div>
                <h3 className="font-semibold mb-3">心情分布</h3>
                <div className="space-y-2">
                  {stats.moodCounts.map((mood) => (
                    <div key={mood.value} className="flex items-center gap-3">
                      <span className="text-2xl w-10">{mood.emoji}</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
                        <div
                          className={`h-full ${mood.color} transition-all duration-500`}
                          style={{ width: `${(mood.count / stats.total) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 w-8">{mood.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {viewMode === 'stats' && !stats && (
            <p className="text-center text-gray-500 py-8">还没有足够的数据生成统计哦！</p>
          )}
        </div>
      </div>
    </div>
  )
}
