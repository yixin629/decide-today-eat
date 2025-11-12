'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface LoveQuote {
  id: number
  content: string
  author: string
  is_custom: boolean
  created_by: string | null
}

export default function LoveQuotesPage() {
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
      const { error } = await supabase
        .from('love_quotes')
        .insert([{
          ...newQuote,
          is_custom: true,
        }])

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
      alert('添加失败，请重试')
    }
  }

  const deleteQuote = async (id: number) => {
    if (!confirm('确定要删除这条情话吗？')) return

    try {
      const { error } = await supabase
        .from('love_quotes')
        .delete()
        .eq('id', id)

      if (error) throw error
      loadQuotes()
    } catch (error) {
      console.error('删除失败:', error)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('已复制到剪贴板！')
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-block mb-6 text-white hover:text-primary transition-colors">
          ← 返回首页
        </Link>

        {loading ? (
          <div className="card text-center">
            <div className="text-2xl">加载中...</div>
          </div>
        ) : (
          <>
            <div className="card text-center mb-6">
              <h1 className="text-4xl font-bold mb-8">💌 情话生成器 💌</h1>

              {/* 当前情话显示 */}
              {currentQuote && (
                <div className="mb-8 p-8 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-xl">
                  <div className="text-6xl mb-6">💝</div>
                  <div className="text-2xl font-serif italic mb-4 leading-relaxed">
                    &ldquo;{currentQuote.content}&rdquo;
                  </div>
                  <div className="text-sm text-gray-400">
                    —— {currentQuote.author}
                  </div>
                  {currentQuote.is_custom && currentQuote.created_by && (
                    <div className="text-xs text-gray-500 mt-2">
                      来自 {currentQuote.created_by} 的专属情话 ❤️
                    </div>
                  )}
                  
                  {/* 复制按钮 */}
                  <button
                    onClick={() => copyToClipboard(currentQuote.content)}
                    className="mt-4 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm"
                  >
                    📋 复制
                  </button>
                </div>
              )}

              {/* 按钮组 */}
              <div className="flex gap-4 justify-center mb-6">
                <button
                  onClick={getRandomQuote}
                  className="btn-primary text-xl px-12 py-4"
                >
                  🎲 换一句
                </button>
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="px-8 py-4 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                >
                  {showForm ? '取消' : '➕ 添加情话'}
                </button>
              </div>

              {/* 添加表单 */}
              {showForm && (
                <div className="mt-6 p-6 bg-white/5 rounded-lg border border-white/10 text-left">
                  <h3 className="text-xl font-bold mb-4">✨ 添加专属情话</h3>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">情话内容 *</label>
                      <textarea
                        value={newQuote.content}
                        onChange={(e) => setNewQuote({ ...newQuote, content: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 focus:border-primary focus:outline-none h-32"
                        placeholder="写下你想说的话..."
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold mb-2">署名</label>
                        <input
                          type="text"
                          value={newQuote.author}
                          onChange={(e) => setNewQuote({ ...newQuote, author: e.target.value })}
                          className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 focus:border-primary focus:outline-none"
                          placeholder="匿名"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold mb-2">创建者</label>
                        <select
                          value={newQuote.created_by}
                          onChange={(e) => setNewQuote({ ...newQuote, created_by: e.target.value })}
                          className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 focus:border-primary focus:outline-none"
                        >
                          <option value="zyx">zyx</option>
                          <option value="zly">zly</option>
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
              <h2 className="text-2xl font-bold mb-4">💖 我们的专属情话</h2>
              <div className="space-y-3">
                {quotes.filter(q => q.is_custom).length === 0 ? (
                  <p className="text-center text-gray-400 py-8">
                    还没有专属情话，快来添加吧！
                  </p>
                ) : (
                  quotes
                    .filter(q => q.is_custom)
                    .map((quote) => (
                      <div
                        key={quote.id}
                        className="p-4 bg-white/5 rounded-lg border border-white/10 hover:border-white/30 transition-all"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="text-lg italic mb-2">&ldquo;{quote.content}&rdquo;</p>
                            <div className="flex items-center gap-4 text-sm text-gray-400">
                              <span>—— {quote.author}</span>
                              <span>by {quote.created_by}</span>
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => copyToClipboard(quote.content)}
                              className="px-3 py-1 rounded bg-blue-500/20 hover:bg-blue-500/40 transition-colors text-sm"
                            >
                              📋
                            </button>
                            <button
                              onClick={() => deleteQuote(quote.id)}
                              className="px-3 py-1 rounded bg-red-500/20 hover:bg-red-500/40 transition-colors text-sm"
                            >
                              🗑️
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
