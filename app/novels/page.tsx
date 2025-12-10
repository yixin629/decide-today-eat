'use client'

import { useState, useEffect } from 'react'
import BackButton from '../components/BackButton'
import { useToast } from '../components/ToastProvider'
import { supabase } from '@/lib/supabase'
import LoadingSkeleton from '../components/LoadingSkeleton'

interface Novel {
  id: string
  title: string
  author: string
  cover_url?: string
  description?: string
  link?: string
  added_by: string
  likes: string[] // Array of user_ids
  created_at: string
}

export default function NovelsPage() {
  const { showToast } = useToast()
  const [novels, setNovels] = useState<Novel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<string | null>(null)

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false)
  const [newNovel, setNewNovel] = useState({
    title: '',
    author: '',
    description: '',
    link: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    // Check login
    const user = localStorage.getItem('currentUser') || localStorage.getItem('loggedInUser')
    setCurrentUser(user)
    if (user) {
      loadNovels()
    } else {
      setIsLoading(false)
    }
  }, [])

  const loadNovels = async () => {
    try {
      const { data, error } = await supabase
        .from('novels')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        if (error.code === '42P01') {
          showToast('小说数据库未初始化，请运行数据库脚本', 'error')
        } else {
          throw error
        }
      } else {
        setNovels(data || [])
      }
    } catch (error) {
      console.error('Failed to load novels:', error)
      showToast('加载小说列表失败', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAdd = async () => {
    if (!newNovel.title || !newNovel.author) {
      showToast('标题和作者不能为空', 'warning')
      return
    }
    if (!currentUser) return

    setIsSubmitting(true)
    try {
      const { data, error } = await supabase
        .from('novels')
        .insert({
          title: newNovel.title,
          author: newNovel.author,
          description: newNovel.description,
          link: newNovel.link,
          added_by: currentUser,
          likes: [],
        })
        .select()

      if (error) throw error

      setNovels([data[0], ...novels])
      showToast('添加成功！', 'success')
      setShowAddModal(false)
      setNewNovel({ title: '', author: '', description: '', link: '' })
    } catch (error: any) {
      showToast('添加失败: ' + error.message, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLike = async (novel: Novel) => {
    if (!currentUser) return

    const isLiked = novel.likes?.includes(currentUser)
    const newLikes = isLiked
      ? novel.likes.filter((id) => id !== currentUser)
      : [...(novel.likes || []), currentUser]

    // Optimistic update
    setNovels(novels.map((n) => (n.id === novel.id ? { ...n, likes: newLikes } : n)))

    try {
      const { error } = await supabase.from('novels').update({ likes: newLikes }).eq('id', novel.id)

      if (error) throw error
    } catch (error) {
      console.error('Like failed:', error)
      showToast('点赞失败', 'error')
      loadNovels() // Revert
    }
  }

  if (!currentUser) {
    if (isLoading)
      return (
        <div className="p-8 text-center">
          <LoadingSkeleton type="list" count={3} />
        </div>
      )
    return (
      <div className="min-h-screen p-8 max-w-2xl mx-auto">
        <BackButton href="/" text="返回首页" />
        <div className="card text-center py-12">
          <h1 className="text-3xl font-bold text-primary mb-4">📚 情侣书架</h1>
          <p className="text-gray-600 mb-6">请先登录后再使用书架功能</p>
          <a
            href="/login"
            className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full"
          >
            去登录
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <BackButton href="/" text="返回首页" />

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-primary">📚 情侣书架</h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full shadow-md hover:shadow-lg transition-all"
          >
            + 添加小说
          </button>
        </div>

        {/* List */}
        {isLoading ? (
          <LoadingSkeleton type="card" count={3} />
        ) : novels.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="text-6xl mb-4">📖</div>
            <p className="text-gray-500">书架还是空的，快去添加第一本喜欢的小说吧！</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {novels.map((novel) => (
              <div
                key={novel.id}
                className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all border border-gray-100 flex flex-col"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg text-gray-800 line-clamp-1">{novel.title}</h3>
                  <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-full">
                    {novel.added_by === 'zyx' ? '星星推荐' : '梨梨推荐'}
                  </span>
                </div>

                <p className="text-sm text-gray-500 mb-2">作者：{novel.author}</p>
                {novel.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2 flex-grow">
                    {novel.description}
                  </p>
                )}

                <div className="flex justify-between items-center mt-auto pt-4 border-t border-gray-50">
                  {novel.link ? (
                    <a
                      href={novel.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary text-sm hover:underline"
                    >
                      阅读链接 ↗
                    </a>
                  ) : (
                    <span className="text-xs text-gray-400">暂无链接</span>
                  )}

                  <button
                    onClick={() => handleLike(novel)}
                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-all ${
                      novel.likes?.includes(currentUser)
                        ? 'bg-pink-100 text-pink-500'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {novel.likes?.includes(currentUser) ? '❤️' : '🤍'} {novel.likes?.length || 0}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md animate-fade-in">
              <h2 className="text-xl font-bold mb-4">添加喜欢的小说</h2>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="小说标题 *"
                  value={newNovel.title}
                  onChange={(e) => setNewNovel({ ...newNovel, title: e.target.value })}
                  className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="作者 *"
                  value={newNovel.author}
                  onChange={(e) => setNewNovel({ ...newNovel, author: e.target.value })}
                  className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                />
                <textarea
                  placeholder="推荐理由/简介"
                  value={newNovel.description}
                  onChange={(e) => setNewNovel({ ...newNovel, description: e.target.value })}
                  className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none h-24 resize-none"
                />
                <input
                  type="text"
                  placeholder="阅读链接 (可选)"
                  value={newNovel.link}
                  onChange={(e) => setNewNovel({ ...newNovel, link: e.target.value })}
                  className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200"
                >
                  取消
                </button>
                <button
                  onClick={handleAdd}
                  disabled={isSubmitting}
                  className="flex-1 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50"
                >
                  {isSubmitting ? '提交中...' : '添加'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
