'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useToast } from '../components/ToastProvider'
import BackButton from '../components/BackButton'

interface Wish {
  id: string
  title: string
  description: string
  status: 'pending' | 'in-progress' | 'completed'
  addedBy: string
  createdAt: string
  completedAt?: string
}

export default function WishlistPage() {
  const toast = useToast()
  const [wishes, setWishes] = useState<Wish[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [newWish, setNewWish] = useState({
    title: '',
    description: '',
    addedBy: '',
  })
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all')

  // 加载数据
  useEffect(() => {
    loadWishes()
  }, [])

  const loadWishes = async () => {
    try {
      const { data, error } = await supabase
        .from('wishlist')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      if (data) {
        setWishes(
          data.map((item) => ({
            id: item.id,
            title: item.title,
            description: item.description,
            status: item.status,
            addedBy: item.added_by,
            createdAt: item.created_at,
            completedAt: item.completed_at,
          }))
        )
      }
    } catch (error) {
      console.error('加载心愿失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const { data, error } = await supabase
        .from('wishlist')
        .insert([
          {
            title: newWish.title,
            description: newWish.description,
            added_by: newWish.addedBy,
            status: 'pending',
          },
        ])
        .select()

      if (error) throw error

      if (data) {
        const newWishData = {
          id: data[0].id,
          title: data[0].title,
          description: data[0].description,
          status: data[0].status,
          addedBy: data[0].added_by,
          createdAt: data[0].created_at,
          completedAt: data[0].completed_at,
        }
        setWishes([newWishData, ...wishes])
        setNewWish({ title: '', description: '', addedBy: '' })
        setShowForm(false)
        toast.success('心愿添加成功！')
      }
    } catch (error) {
      console.error('添加心愿失败:', error)
      toast.error('添加失败，请检查网络连接')
    }
  }

  const updateStatus = async (id: string, status: Wish['status']) => {
    try {
      const updateData: any = { status }
      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString()
      }

      const { error } = await supabase.from('wishlist').update(updateData).eq('id', id)

      if (error) throw error

      setWishes(
        wishes.map((wish) =>
          wish.id === id
            ? {
                ...wish,
                status,
                completedAt: status === 'completed' ? new Date().toISOString() : undefined,
              }
            : wish
        )
      )
      toast.success('状态更新成功')
    } catch (error) {
      console.error('更新状态失败:', error)
      toast.error('更新失败，请重试')
    }
  }

  const deleteWish = async (id: string) => {
    if (!confirm('确定要删除这个心愿吗？')) return

    try {
      const { error } = await supabase.from('wishlist').delete().eq('id', id)

      if (error) throw error

      setWishes(wishes.filter((wish) => wish.id !== id))
      toast.success('删除成功')
    } catch (error) {
      console.error('删除失败:', error)
      toast.error('删除失败，请重试')
    }
  }

  const filteredWishes = wishes.filter((wish) => (filter === 'all' ? true : wish.status === filter))

  const getStatusEmoji = (status: Wish['status']) => {
    switch (status) {
      case 'pending':
        return '⏳'
      case 'in-progress':
        return '🔄'
      case 'completed':
        return '✅'
    }
  }

  const getStatusText = (status: Wish['status']) => {
    switch (status) {
      case 'pending':
        return '待实现'
      case 'in-progress':
        return '进行中'
      case 'completed':
        return '已完成'
    }
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <BackButton href="/" text="返回首页" />

        <div className="card">
          <h1 className="text-4xl font-bold text-primary mb-8 text-center">✨ 心愿清单 ✨</h1>

          {loading ? (
            <div className="text-center py-12">
              <div className="text-2xl">加载中... ⏳</div>
            </div>
          ) : (
            <>
              {/* Add Button */}
              <div className="mb-6 text-center">
                <button onClick={() => setShowForm(!showForm)} className="btn-primary">
                  {showForm ? '取消' : '+ 添加心愿'}
                </button>
              </div>

              {/* Add Form */}
              {showForm && (
                <form onSubmit={handleSubmit} className="bg-pink-50 p-6 rounded-xl mb-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">心愿标题</label>
                      <input
                        type="text"
                        value={newWish.title}
                        onChange={(e) => setNewWish({ ...newWish, title: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                        placeholder="例如: 一起去看极光"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">详细描述</label>
                      <textarea
                        value={newWish.description}
                        onChange={(e) => setNewWish({ ...newWish, description: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                        rows={3}
                        placeholder="写下这个心愿的详细内容..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">添加人</label>
                      <input
                        type="text"
                        value={newWish.addedBy}
                        onChange={(e) => setNewWish({ ...newWish, addedBy: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                        placeholder="你的名字"
                        required
                      />
                    </div>
                    <button type="submit" className="btn-primary w-full">
                      保存心愿
                    </button>
                  </div>
                </form>
              )}

              {/* Filter Buttons */}
              <div className="flex gap-4 mb-6 flex-wrap">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-6 py-2 rounded-full font-semibold transition-all ${
                    filter === 'all'
                      ? 'bg-primary text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  全部 ({wishes.length})
                </button>
                <button
                  onClick={() => setFilter('pending')}
                  className={`px-6 py-2 rounded-full font-semibold transition-all ${
                    filter === 'pending'
                      ? 'bg-primary text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  待实现 ({wishes.filter((w) => w.status === 'pending').length})
                </button>
                <button
                  onClick={() => setFilter('completed')}
                  className={`px-6 py-2 rounded-full font-semibold transition-all ${
                    filter === 'completed'
                      ? 'bg-primary text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  已完成 ({wishes.filter((w) => w.status === 'completed').length})
                </button>
              </div>

              {/* Progress Bar */}
              {wishes.length > 0 && (
                <div className="mb-8">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-semibold">完成进度</span>
                    <span className="text-sm font-semibold">
                      {wishes.filter((w) => w.status === 'completed').length} / {wishes.length}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-gradient-to-r from-primary to-accent h-4 rounded-full transition-all duration-500"
                      style={{
                        width: `${
                          (wishes.filter((w) => w.status === 'completed').length / wishes.length) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Wishes List */}
              <div className="space-y-4">
                {filteredWishes.map((wish) => (
                  <div
                    key={wish.id}
                    className={`p-6 rounded-xl shadow transition-all ${
                      wish.status === 'completed'
                        ? 'bg-green-50 border-2 border-green-300'
                        : 'bg-gradient-to-r from-pink-50 to-purple-50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-3xl">{getStatusEmoji(wish.status)}</span>
                          <h3 className="text-2xl font-bold text-primary">{wish.title}</h3>
                        </div>
                        {wish.description && (
                          <p className="text-gray-700 ml-12 mb-2">{wish.description}</p>
                        )}
                        <div className="ml-12 text-sm text-gray-500">
                          由 {wish.addedBy} 添加 •{' '}
                          {new Date(wish.createdAt).toLocaleDateString('zh-CN')}
                          {wish.completedAt && (
                            <> • 完成于 {new Date(wish.completedAt).toLocaleDateString('zh-CN')}</>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => deleteWish(wish.id)}
                        className="text-red-500 hover:text-red-700 text-2xl ml-4"
                      >
                        ×
                      </button>
                    </div>

                    {/* Status Buttons */}
                    <div className="flex gap-2 ml-12">
                      {wish.status !== 'pending' && (
                        <button
                          onClick={() => updateStatus(wish.id, 'pending')}
                          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-full text-sm font-semibold transition-all"
                        >
                          ⏳ 待实现
                        </button>
                      )}
                      {wish.status !== 'in-progress' && wish.status !== 'completed' && (
                        <button
                          onClick={() => updateStatus(wish.id, 'in-progress')}
                          className="px-4 py-2 bg-blue-200 hover:bg-blue-300 rounded-full text-sm font-semibold transition-all"
                        >
                          🔄 开始实现
                        </button>
                      )}
                      {wish.status !== 'completed' && (
                        <button
                          onClick={() => updateStatus(wish.id, 'completed')}
                          className="px-4 py-2 bg-green-200 hover:bg-green-300 rounded-full text-sm font-semibold transition-all"
                        >
                          ✅ 标记完成
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {filteredWishes.length === 0 && (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">✨</div>
                  <p className="text-gray-500 text-lg">
                    {filter === 'all'
                      ? '还没有心愿，添加第一个吧！'
                      : `没有${getStatusText(filter as Wish['status'])}的心愿`}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
