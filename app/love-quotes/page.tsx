'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import BackButton from '../components/BackButton'
import { useToast } from '../components/ToastProvider'

interface LoveQuote {
  id: number
  content: string
  author: string
  is_custom: boolean
  created_by: string | null
}

export default function LoveQuotesPage() {
  const toast = useToast()
  const [quotes, setQuotes] = useState<LoveQuote[]>([])
  const [currentQuote, setCurrentQuote] = useState<LoveQuote | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const [newQuote, setNewQuote] = useState({
    content: '',
    author: '匿名',
    created_by: 'zyx',
  })

  useEffect(() => {
    loadQuotes()
  }, [])

  const loadQuotes = async () => {
    try {
      const { data, error } = await supabase
        .from('love_quotes')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setQuotes(data || [])

      // 自动显示一条随机情话
      if (data && data.length > 0) {
        const randomIndex = Math.floor(Math.random() * data.length)
        setCurrentQuote(data[randomIndex])
      }
    } catch (error) {
      console.error('加载失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRandomQuote = () => {
    if (quotes.length === 0) return

    const randomIndex = Math.floor(Math.random() * quotes.length)
    setCurrentQuote(quotes[randomIndex])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const { error } = await supabase.from('love_quotes').insert([
        {
          ...newQuote,
          is_custom: true,
        },
      ])

      if (error) throw error

      setShowForm(false)
      setNewQuote({
        content: '',
        author: '匿名',
        created_by: 'zyx',
      })
      loadQuotes()
    } catch (error) {
      console.error('添加失败:', error)
      toast.error('添加失败，请重试')
    }
  }

  const deleteQuote = async (id: number) => {
    if (!confirm('确定要删除这条情话吗？')) return

    try {
      const { error } = await supabase.from('love_quotes').delete().eq('id', id)

      if (error) throw error
      loadQuotes()
    } catch (error) {
      console.error('删除失败:', error)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('已复制到剪贴板！')
  }

  return (
    <div className="min-h-screen p-4 md:p-8 relative overflow-hidden">
      {/* 背景装饰 - 星星和梨 */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-20">
        <div className="absolute top-10 left-10 text-4xl animate-pulse">⭐</div>
        <div className="absolute top-20 right-20 text-3xl animate-bounce">🍐</div>
        <div className="absolute top-40 left-1/4 text-2xl animate-pulse delay-100">⭐</div>
        <div className="absolute top-60 right-1/3 text-3xl animate-bounce delay-200">🍐</div>
        <div className="absolute bottom-40 left-20 text-3xl animate-pulse delay-300">⭐</div>
        <div className="absolute bottom-20 right-10 text-4xl animate-bounce delay-500">🍐</div>
        <div className="absolute top-1/3 right-10 text-2xl animate-pulse">⭐</div>
        <div className="absolute bottom-1/3 left-10 text-2xl animate-bounce">🍐</div>
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <BackButton href="/" text="返回首页" />

        {loading ? (
          <div className="card text-center">
            <div className="text-2xl">加载中...</div>
          </div>
        ) : (
          <>
            <div className="card text-center mb-6">
              <div className="flex items-center justify-center gap-3 mb-6">
                <span className="text-3xl md:text-4xl animate-pulse">⭐</span>
                <h1 className="text-3xl md:text-4xl font-bold text-primary">情话生成器</h1>
                <span className="text-3xl md:text-4xl animate-bounce">🍐</span>
              </div>

              <p className="text-sm md:text-base text-gray-600 mb-8">
                星星🌟代表zyx，梨🍐代表zly，我们的专属甜蜜空间
              </p>

              {/* 当前情话显示 */}
              {currentQuote && (
                <div className="mb-8 p-6 md:p-8 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl border-2 border-pink-200 relative">
                  {/* 装饰性星星和梨 */}
                  <div className="absolute top-2 left-2 text-xl md:text-2xl opacity-30">⭐</div>
                  <div className="absolute top-2 right-2 text-xl md:text-2xl opacity-30">🍐</div>
                  <div className="absolute bottom-2 left-2 text-xl md:text-2xl opacity-30">🍐</div>
                  <div className="absolute bottom-2 right-2 text-xl md:text-2xl opacity-30">⭐</div>

                  <div className="text-4xl md:text-6xl mb-4 md:mb-6">💝</div>
                  <div className="text-lg md:text-2xl font-serif italic mb-4 leading-relaxed text-gray-800 px-4">
                    &ldquo;{currentQuote.content}&rdquo;
                  </div>
                  <div className="text-xs md:text-sm text-gray-600">—— {currentQuote.author}</div>
                  {currentQuote.is_custom && currentQuote.created_by && (
                    <div className="text-xs text-gray-500 mt-2">
                      来自 {currentQuote.created_by === 'zyx' ? '⭐星星' : '🍐梨'} 的专属情话 ❤️
                    </div>
                  )}

                  {/* 复制按钮 */}
                  <button
                    onClick={() => copyToClipboard(currentQuote.content)}
                    className="mt-4 px-4 py-2 rounded-lg bg-white hover:bg-gray-50 border border-gray-300 transition-colors text-sm"
                  >
                    📋 复制
                  </button>
                </div>
              )}

              {/* 按钮组 */}
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center mb-6">
                <button
                  onClick={getRandomQuote}
                  className="btn-primary text-lg md:text-xl px-8 md:px-12 py-3 md:py-4 flex items-center justify-center gap-2"
                >
                  <span>🎲</span>
                  <span>换一句</span>
                  <span className="hidden sm:inline">⭐🍐</span>
                </button>
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="px-6 md:px-8 py-3 md:py-4 rounded-lg border-2 border-gray-300 hover:border-primary bg-white hover:bg-pink-50 transition-colors text-gray-700 font-semibold"
                >
                  {showForm ? '取消' : '➕ 添加情话'}
                </button>
              </div>

              {/* 添加表单 */}
              {showForm && (
                <div className="mt-6 p-4 md:p-6 bg-pink-50 rounded-lg border-2 border-pink-200 text-left">
                  <h3 className="text-lg md:text-xl font-bold mb-4 text-primary flex items-center gap-2">
                    <span>✨</span>
                    <span>添加专属情话</span>
                    <span>⭐🍐</span>
                  </h3>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700">
                        情话内容 *
                      </label>
                      <textarea
                        value={newQuote.content}
                        onChange={(e) => setNewQuote({ ...newQuote, content: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border-2 border-gray-300 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary h-32 text-sm md:text-base"
                        placeholder="写下你想说的话..."
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">
                          署名
                        </label>
                        <input
                          type="text"
                          value={newQuote.author}
                          onChange={(e) => setNewQuote({ ...newQuote, author: e.target.value })}
                          className="w-full px-4 py-2 rounded-lg border-2 border-gray-300 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary text-sm md:text-base"
                          placeholder="匿名"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">
                          创建者
                        </label>
                        <select
                          value={newQuote.created_by}
                          onChange={(e) => setNewQuote({ ...newQuote, created_by: e.target.value })}
                          className="w-full px-4 py-2 rounded-lg border-2 border-gray-300 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary text-sm md:text-base"
                        >
                          <option value="zyx">⭐ zyx (星星)</option>
                          <option value="zly">🍐 zly (梨)</option>
                        </select>
                      </div>
                    </div>

                    <button type="submit" className="btn-primary w-full">
                      💌 添加
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* 自定义情话列表 */}
            <div className="card">
              <h2 className="text-xl md:text-2xl font-bold mb-4 text-primary flex items-center gap-2">
                <span>💖</span>
                <span>我们的专属情话</span>
                <span>⭐🍐</span>
              </h2>
              <div className="space-y-3">
                {quotes.filter((q) => q.is_custom).length === 0 ? (
                  <p className="text-center text-gray-500 py-8">还没有专属情话，快来添加吧！⭐🍐</p>
                ) : (
                  quotes
                    .filter((q) => q.is_custom)
                    .map((quote) => (
                      <div
                        key={quote.id}
                        className="p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border border-pink-200 hover:border-primary transition-all hover:shadow-md"
                      >
                        <div className="flex flex-col md:flex-row justify-between items-start gap-3">
                          <div className="flex-1 w-full">
                            <p className="text-base md:text-lg italic mb-2 text-gray-800">
                              &ldquo;{quote.content}&rdquo;
                            </p>
                            <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm text-gray-600">
                              <span>—— {quote.author}</span>
                              <span className="flex items-center gap-1">
                                <span>来自</span>
                                <span>{quote.created_by === 'zyx' ? '⭐星星' : '🍐梨'}</span>
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2 w-full md:w-auto">
                            <button
                              onClick={() => copyToClipboard(quote.content)}
                              className="flex-1 md:flex-none px-3 py-1 rounded bg-blue-100 hover:bg-blue-200 transition-colors text-sm text-blue-700"
                            >
                              📋 复制
                            </button>
                            <button
                              onClick={() => deleteQuote(quote.id)}
                              className="flex-1 md:flex-none px-3 py-1 rounded bg-red-100 hover:bg-red-200 transition-colors text-sm text-red-600"
                            >
                              🗑️ 删除
                            </button>
                          </div>
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
