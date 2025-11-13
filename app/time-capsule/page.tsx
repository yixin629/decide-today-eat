'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface TimeCapsule {
  id: string
  title: string
  content: string
  sender: string
  receiver?: string
  unlock_date: string
  is_opened: boolean
  opened_at?: string
  created_at: string
}

export default function TimeCapsulePage() {
  const [capsules, setCapsules] = useState<TimeCapsule[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [filter, setFilter] = useState<'all' | 'locked' | 'opened'>('all')
  const [newCapsule, setNewCapsule] = useState({
    title: '',
    content: '',
    sender: '',
    receiver: '',
    unlock_date: '',
  })

  const loadCapsules = useCallback(async () => {
    try {
      let query = supabase
        .from('time_capsules')
        .select('*')
        .order('unlock_date', { ascending: true })

      if (filter === 'locked') {
        query = query.eq('is_opened', false)
      } else if (filter === 'opened') {
        query = query.eq('is_opened', true)
      }

      const { data, error } = await query

      if (error) throw error
      setCapsules(data || [])
    } catch (error) {
      console.error('Error loading time capsules:', error)
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    loadCapsules()
  }, [loadCapsules])

  const handleAddCapsule = async () => {
    if (!newCapsule.title || !newCapsule.content || !newCapsule.sender || !newCapsule.unlock_date) {
      alert('请填写所有必填字段')
      return
    }

    const openDate = new Date(newCapsule.unlock_date)
    if (openDate <= new Date()) {
      alert('开启日期必须是未来的时间')
      return
    }

    try {
      const { error } = await supabase.from('time_capsules').insert([
        {
          ...newCapsule,
          is_opened: false,
        },
      ])

      if (error) throw error

      setNewCapsule({
        title: '',
        content: '',
        sender: '',
        receiver: '',
        unlock_date: '',
      })
      setShowAddForm(false)
      loadCapsules()
    } catch (error) {
      console.error('Error adding time capsule:', error)
      alert('添加失败')
    }
  }

  const handleOpenCapsule = async (capsule: TimeCapsule) => {
    const openDate = new Date(capsule.unlock_date)
    const now = new Date()

    if (openDate > now) {
      alert(`时光胶囊还未到开启时间！\n将在 ${openDate.toLocaleString('zh-CN')} 开启`)
      return
    }

    if (!confirm('确定要开启这个时光胶囊吗？')) return

    try {
      const { error } = await supabase
        .from('time_capsules')
        .update({
          is_opened: true,
          opened_at: new Date().toISOString(),
        })
        .eq('id', capsule.id)

      if (error) throw error
      loadCapsules()
    } catch (error) {
      console.error('Error opening time capsule:', error)
      alert('开启失败')
    }
  }

  const handleDeleteCapsule = async (id: string) => {
    if (!confirm('确定要删除这个时光胶囊吗？')) return

    try {
      const { error } = await supabase.from('time_capsules').delete().eq('id', id)

      if (error) throw error
      loadCapsules()
    } catch (error) {
      console.error('Error deleting time capsule:', error)
      alert('删除失败')
    }
  }

  const canOpen = (openDate: string) => {
    return new Date(openDate) <= new Date()
  }

  const getDaysUntilOpen = (openDate: string) => {
    const target = new Date(openDate)
    const now = new Date()
    const diff = target.getTime() - now.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

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
        <Link
          href="/"
          className="inline-block mb-6 text-gray-800 hover:text-primary transition-colors"
        >
          ← 返回首页
        </Link>

        <div className="card">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">🎁 时光胶囊</h1>
              <p className="text-gray-600">写给未来的信，封存此刻的心意</p>
            </div>
            <button onClick={() => setShowAddForm(!showAddForm)} className="btn-primary">
              {showAddForm ? '取消' : '+ 创建胶囊'}
            </button>
          </div>

          <div className="mb-6 flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={filter === 'all' ? 'btn-primary' : 'btn-secondary'}
            >
              全部
            </button>
            <button
              onClick={() => setFilter('locked')}
              className={filter === 'locked' ? 'btn-primary' : 'btn-secondary'}
            >
              🔒 未开启
            </button>
            <button
              onClick={() => setFilter('opened')}
              className={filter === 'opened' ? 'btn-primary' : 'btn-secondary'}
            >
              📖 已开启
            </button>
          </div>

          {showAddForm && (
            <div className="mb-8 p-6 bg-pink-50 rounded-xl border border-pink-200">
              <h3 className="text-xl font-bold text-gray-800 mb-4">创建新的时光胶囊</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-800 mb-2">标题 *</label>
                  <input
                    type="text"
                    value={newCapsule.title}
                    onChange={(e) => setNewCapsule({ ...newCapsule, title: e.target.value })}
                    className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-gray-800 placeholder-gray-400"
                    placeholder="给这个时光胶囊取个名字"
                  />
                </div>

                <div>
                  <label className="block text-gray-800 mb-2">写给未来的话 *</label>
                  <textarea
                    value={newCapsule.content}
                    onChange={(e) => setNewCapsule({ ...newCapsule, content: e.target.value })}
                    className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-gray-800 placeholder-gray-400"
                    placeholder="把想对未来说的话写在这里..."
                    rows={6}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-800 mb-2">创建者 *</label>
                    <input
                      type="text"
                      value={newCapsule.sender}
                      onChange={(e) => setNewCapsule({ ...newCapsule, sender: e.target.value })}
                      className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-gray-800 placeholder-gray-400"
                      placeholder="你的名字"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-800 mb-2">收件人</label>
                    <input
                      type="text"
                      value={newCapsule.receiver}
                      onChange={(e) => setNewCapsule({ ...newCapsule, receiver: e.target.value })}
                      className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-gray-800 placeholder-gray-400"
                      placeholder="写给谁（可选）"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-800 mb-2">开启日期 *</label>
                  <input
                    type="datetime-local"
                    value={newCapsule.unlock_date}
                    onChange={(e) => setNewCapsule({ ...newCapsule, unlock_date: e.target.value })}
                    className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-gray-800"
                    min={new Date().toISOString().slice(0, 16)}
                  />
                  <p className="text-sm text-gray-500 mt-1">在此日期之前，胶囊将保持封存状态</p>
                </div>

                <button onClick={handleAddCapsule} className="w-full btn-primary">
                  封存时光胶囊
                </button>
              </div>
            </div>
          )}

          {capsules.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🎁</div>
              <p className="text-xl text-gray-600">还没有创建任何时光胶囊</p>
              <p className="text-gray-500 mt-2">点击&ldquo;创建胶囊&rdquo;写下对未来的期许</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {capsules.map((capsule) => {
                const isLocked = !capsule.is_opened
                const canOpenNow = canOpen(capsule.unlock_date)
                const daysUntil = getDaysUntilOpen(capsule.unlock_date)

                return (
                  <div
                    key={capsule.id}
                    className={`p-6 rounded-xl border transition-all ${
                      isLocked && canOpenNow
                        ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-400/40 shadow-lg shadow-yellow-500/20 animate-pulse'
                        : isLocked
                        ? 'bg-pink-50 border-pink-200'
                        : 'bg-pink-100 backdrop-blur-md border-white/30'
                    } hover:bg-white/20`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-4xl">
                          {isLocked ? (canOpenNow ? '🔓' : '🔒') : '📖'}
                        </span>
                        <div>
                          <h3 className="text-xl font-bold text-gray-800">{capsule.title}</h3>
                          <p className="text-sm text-gray-600">
                            来自 {capsule.sender}
                            {capsule.receiver && ` 给 ${capsule.receiver}`}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteCapsule(capsule.id)}
                        className="text-red-400 hover:text-red-600 transition-colors"
                      >
                        🗑️
                      </button>
                    </div>

                    {isLocked ? (
                      <div className="text-center py-8">
                        <div className="text-6xl mb-4">🎁</div>
                        <p className="text-gray-800 font-semibold mb-2">
                          {canOpenNow ? '可以开启了！' : '尚未到开启时间'}
                        </p>
                        <p className="text-sm text-gray-600 mb-4">
                          开启日期：{new Date(capsule.unlock_date).toLocaleString('zh-CN')}
                        </p>
                        {!canOpenNow && (
                          <p className="text-lg text-yellow-300 font-bold mb-4">
                            还有 {daysUntil} 天
                          </p>
                        )}
                        {canOpenNow && (
                          <button
                            onClick={() => handleOpenCapsule(capsule)}
                            className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-800 font-bold rounded-lg hover:from-yellow-500 hover:to-orange-500 transition-all transform hover:scale-105"
                          >
                            开启胶囊
                          </button>
                        )}
                      </div>
                    ) : (
                      <div>
                        <div className="bg-white/10 rounded-lg p-4 mb-4">
                          <p className="text-gray-800 whitespace-pre-wrap">{capsule.content}</p>
                        </div>
                        <div className="text-sm text-gray-500">
                          <p>创建于：{new Date(capsule.created_at).toLocaleString('zh-CN')}</p>
                          <p>
                            开启于：
                            {capsule.opened_at &&
                              new Date(capsule.opened_at).toLocaleString('zh-CN')}
                          </p>
                        </div>
                      </div>
                    )}
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
