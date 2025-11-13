'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { useToast } from '../components/ToastProvider'
import BackButton from '../components/BackButton'
import LoadingSkeleton from '../components/LoadingSkeleton'

interface BucketItem {
  id: number
  title: string
  description: string | null
  is_completed: boolean
  completed_at: string | null
  completed_by: string | null
  priority: number
  category: string | null
  created_at: string
}

export default function BucketListPage() {
  const toast = useToast()
  const [items, setItems] = useState<BucketItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterCompleted, setFilterCompleted] = useState('all')

  const [newItem, setNewItem] = useState({
    title: '',
    description: '',
    category: '体验',
    priority: 0,
  })

  const categories = ['全部', '旅行', '美食', '体验', '学习', '运动', '其他']

  useEffect(() => {
    loadItems()
  }, [])

  const loadItems = async () => {
    try {
      const { data, error } = await supabase
        .from('love_bucket_list')
        .select('*')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true })

      if (error) throw error
      setItems(data || [])
    } catch (error) {
      console.error('加载失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const { error } = await supabase.from('love_bucket_list').insert([newItem])

      if (error) throw error

      setShowForm(false)
      setNewItem({
        title: '',
        description: '',
        category: '体验',
        priority: 0,
      })
      toast.success('愿望添加成功！')
      loadItems()
    } catch (error) {
      console.error('添加失败:', error)
      toast.error('添加失败，请重试')
    }
  }

  const toggleComplete = async (id: number, is_completed: boolean, completed_by: string) => {
    try {
      const { error } = await supabase
        .from('love_bucket_list')
        .update({
          is_completed: !is_completed,
          completed_at: !is_completed ? new Date().toISOString() : null,
          completed_by: !is_completed ? completed_by : null,
        })
        .eq('id', id)

      if (error) throw error
      loadItems()
    } catch (error) {
      console.error('更新失败:', error)
    }
  }

  const deleteItem = async (id: number) => {
    if (!confirm('确定要删除这项任务吗？')) return

    try {
      const { error } = await supabase.from('love_bucket_list').delete().eq('id', id)

      if (error) throw error
      loadItems()
    } catch (error) {
      console.error('删除失败:', error)
    }
  }

  const filteredItems = items.filter((item) => {
    if (filterCategory !== 'all' && item.category !== filterCategory) return false
    if (filterCompleted === 'completed' && !item.is_completed) return false
    if (filterCompleted === 'pending' && item.is_completed) return false
    return true
  })

  const completedCount = items.filter((item) => item.is_completed).length
  const progress = items.length > 0 ? (completedCount / items.length) * 100 : 0

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <BackButton href="/" text="返回首页" />

        {loading ? (
          <div className="min-h-screen flex items-center justify-center">
            <LoadingSkeleton type="list" count={4} />
          </div>
        ) : (
          <>
            <div className="card mb-6">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">💑 我们想做的100件事</h1>
                <button onClick={() => setShowForm(!showForm)} className="btn-primary">
                  {showForm ? '取消' : '➕ 添加任务'}
                </button>
              </div>

              {/* 进度条 */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg font-semibold">
                    已完成: {completedCount} / {items.length}
                  </span>
                  <span className="text-lg font-semibold text-primary">{progress.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-primary to-accent h-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* 添加表单 */}
              {showForm && (
                <div className="mb-6 p-6 bg-white/5 rounded-lg border border-white/10">
                  <h3 className="text-xl font-bold mb-4">✨ 添加新任务</h3>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">任务标题 *</label>
                      <input
                        type="text"
                        value={newItem.title}
                        onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 focus:border-primary focus:outline-none"
                        placeholder="例如：一起去看极光"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2">详细描述</label>
                      <textarea
                        value={newItem.description}
                        onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 focus:border-primary focus:outline-none h-24"
                        placeholder="可以添加更多细节..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold mb-2">分类</label>
                        <select
                          value={newItem.category}
                          onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                          className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 focus:border-primary focus:outline-none"
                        >
                          <option value="旅行">✈️ 旅行</option>
                          <option value="美食">🍜 美食</option>
                          <option value="体验">🎭 体验</option>
                          <option value="学习">📚 学习</option>
                          <option value="运动">⚽ 运动</option>
                          <option value="其他">📦 其他</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold mb-2">优先级</label>
                        <select
                          value={newItem.priority}
                          onChange={(e) =>
                            setNewItem({ ...newItem, priority: parseInt(e.target.value) })
                          }
                          className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 focus:border-primary focus:outline-none"
                        >
                          <option value="0">普通</option>
                          <option value="1">⭐ 重要</option>
                          <option value="2">⭐⭐ 非常重要</option>
                          <option value="3">⭐⭐⭐ 超级重要</option>
                        </select>
                      </div>
                    </div>

                    <button type="submit" className="btn-primary w-full">
                      ✅ 添加
                    </button>
                  </form>
                </div>
              )}

              {/* 筛选器 */}
              <div className="flex gap-2 mb-6 flex-wrap">
                <button
                  onClick={() => setFilterCategory('all')}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    filterCategory === 'all'
                      ? 'bg-primary text-white'
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  全部
                </button>
                {categories.slice(1).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`px-3 py-1 rounded-lg transition-colors ${
                      filterCategory === cat
                        ? 'bg-primary text-white'
                        : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
                <div className="border-l border-white/20 mx-2" />
                <button
                  onClick={() => setFilterCompleted('pending')}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    filterCompleted === 'pending'
                      ? 'bg-yellow-500 text-white'
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  待完成
                </button>
                <button
                  onClick={() => setFilterCompleted('completed')}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    filterCompleted === 'completed'
                      ? 'bg-green-500 text-white'
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  已完成
                </button>
              </div>

              {/* 任务列表 */}
              <div className="space-y-3">
                {filteredItems.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <div className="text-6xl mb-4">📝</div>
                    <p>还没有任务，开始添加你们想做的事情吧！</p>
                  </div>
                ) : (
                  filteredItems.map((item, index) => (
                    <div
                      key={item.id}
                      className={`p-4 rounded-lg border transition-all ${
                        item.is_completed
                          ? 'bg-green-500/10 border-green-500/30'
                          : 'bg-white/5 border-white/10 hover:border-white/30'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 mt-1">
                          <button
                            onClick={() => {
                              const completedBy = prompt('谁完成的？输入 zyx 或 zly:')
                              if (completedBy === 'zyx' || completedBy === 'zly') {
                                toggleComplete(item.id, item.is_completed, completedBy)
                              }
                            }}
                            className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                              item.is_completed
                                ? 'bg-green-500 border-green-500'
                                : 'border-white/30 hover:border-primary'
                            }`}
                          >
                            {item.is_completed && '✓'}
                          </button>
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3
                              className={`text-lg font-semibold ${
                                item.is_completed ? 'line-through text-gray-500' : ''
                              }`}
                            >
                              {item.title}
                            </h3>
                            {item.priority > 0 && (
                              <span className="text-yellow-500">{'⭐'.repeat(item.priority)}</span>
                            )}
                            {item.category && (
                              <span className="text-xs px-2 py-1 rounded bg-white/10">
                                {item.category}
                              </span>
                            )}
                          </div>

                          {item.description && (
                            <p
                              className={`text-sm mb-2 ${
                                item.is_completed ? 'text-gray-500' : 'text-gray-300'
                              }`}
                            >
                              {item.description}
                            </p>
                          )}

                          {item.is_completed && item.completed_at && (
                            <p className="text-sm text-green-500">
                              ✅{' '}
                              {format(new Date(item.completed_at), 'yyyy-MM-dd', { locale: zhCN })}
                              {item.completed_by && ` by ${item.completed_by}`}
                            </p>
                          )}
                        </div>

                        <button
                          onClick={() => deleteItem(item.id)}
                          className="flex-shrink-0 px-3 py-1 rounded bg-red-500/20 hover:bg-red-500/40 transition-colors text-sm"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
