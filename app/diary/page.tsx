'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useToast } from '../components/ToastProvider'
import BackButton from '../components/BackButton'
import LoadingSkeleton from '../components/LoadingSkeleton'

interface DiaryEntry {
  id: string
  date: string
  title: string
  content: string
  mood: string
  weather?: string
  stickers?: string[]
  author: string
  photos?: string[]
  created_at: string
  updated_at: string
}

export default function DiaryPage() {
  const toast = useToast()
  const [entries, setEntries] = useState<DiaryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingEntry, setEditingEntry] = useState<DiaryEntry | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [previewMode, setPreviewMode] = useState(false) // 新增：预览模式
  const [editPreviewMode, setEditPreviewMode] = useState(false) // 新增：编辑预览模式
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved')
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null)
  const [newEntry, setNewEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    title: '',
    content: '',
    mood: '😊',
    weather: '☀️',
    stickers: [] as string[],
    author: '',
  })

  const loadEntries = useCallback(async () => {
    try {
      let query = supabase.from('diary_entries').select('*').order('date', { ascending: false })

      if (selectedDate) {
        query = query.eq('date', selectedDate)
      }

      const { data, error } = await query

      if (error) throw error
      setEntries(data || [])
    } catch (error) {
      console.error('Error loading diary entries:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedDate])

  // 自动保存草稿到 localStorage
  const saveDraft = useCallback(() => {
    const draft = {
      date: newEntry.date,
      title: newEntry.title,
      content: newEntry.content,
      mood: newEntry.mood,
      author: newEntry.author,
      timestamp: Date.now(),
    }
    localStorage.setItem('diary-draft', JSON.stringify(draft))
    setSaveStatus('saved')
  }, [newEntry])

  // 从 localStorage 恢复草稿
  const loadDraft = useCallback(() => {
    const draft = localStorage.getItem('diary-draft')
    if (draft) {
      try {
        const parsedDraft = JSON.parse(draft)
        // 只在草稿不超过24小时时恢复
        if (Date.now() - parsedDraft.timestamp < 24 * 60 * 60 * 1000) {
          setNewEntry({
            date: parsedDraft.date || new Date().toISOString().split('T')[0],
            title: parsedDraft.title || '',
            content: parsedDraft.content || '',
            mood: parsedDraft.mood || '😊',
            weather: parsedDraft.weather || '☀️',
            stickers: parsedDraft.stickers || [],
            author: parsedDraft.author || '',
          })
        } else {
          // 清除过期的草稿
          localStorage.removeItem('diary-draft')
        }
      } catch (error) {
        console.error('Error loading draft:', error)
        localStorage.removeItem('diary-draft')
      }
    }
  }, [])

  // 清除草稿
  const clearDraft = useCallback(() => {
    localStorage.removeItem('diary-draft')
    setSaveStatus('saved')
  }, [])

  useEffect(() => {
    loadEntries()
    loadDraft()
  }, [loadEntries, loadDraft])

  // 自动保存逻辑
  useEffect(() => {
    if (showAddForm && (newEntry.title || newEntry.content || newEntry.author)) {
      setSaveStatus('unsaved')

      // 清除之前的定时器
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer)
      }

      // 设置新的定时器，30秒后自动保存
      const timer = setTimeout(() => {
        setSaveStatus('saving')
        saveDraft()
      }, 30000)

      setAutoSaveTimer(timer)
    }

    // 清理定时器
    return () => {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer)
      }
    }
  }, [newEntry, showAddForm, autoSaveTimer, saveDraft])

  const handleAddEntry = async () => {
    if (!newEntry.title || !newEntry.content || !newEntry.author) {
      toast.warning('请填写标题、内容和作者')
      return
    }

    try {
      const { error } = await supabase.from('diary_entries').insert([newEntry])

      if (error) throw error

      setNewEntry({
        date: new Date().toISOString().split('T')[0],
        title: '',
        content: '',
        mood: '😊',
        weather: '☀️',
        stickers: [],
        author: '',
      })
      setShowAddForm(false)
      clearDraft()
      toast.success('日记添加成功！')
      loadEntries()
    } catch (error) {
      console.error('Error adding diary entry:', error)
      toast.error('添加失败，请重试')
    }
  }

  const handleUpdateEntry = async () => {
    if (!editingEntry) return

    try {
      const { error } = await supabase
        .from('diary_entries')
        .update({
          title: editingEntry.title,
          content: editingEntry.content,
          mood: editingEntry.mood,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingEntry.id)

      if (error) throw error

      setEditingEntry(null)
      toast.success('更新成功！')
      loadEntries()
    } catch (error) {
      console.error('Error updating diary entry:', error)
      toast.error('更新失败，请重试')
    }
  }

  const handleDeleteEntry = async (id: string) => {
    if (!confirm('确定要删除这篇日记吗？')) return

    try {
      const { error } = await supabase.from('diary_entries').delete().eq('id', id)

      if (error) throw error
      toast.success('删除成功')
      loadEntries()
    } catch (error) {
      console.error('Error deleting diary entry:', error)
      toast.error('删除失败，请重试')
    }
  }

  const moodOptions = [
    { emoji: '😊', label: '开心' },
    { emoji: '😍', label: '甜蜜' },
    { emoji: '🥰', label: '幸福' },
    { emoji: '😘', label: '想念' },
    { emoji: '🤗', label: '温暖' },
    { emoji: '😌', label: '平静' },
    { emoji: '🥳', label: '兴奋' },
    { emoji: '😭', label: '难过' },
    { emoji: '😤', label: '生气' },
    { emoji: '🤔', label: '思考' },
    { emoji: '😴', label: '困倦' },
    { emoji: '🤒', label: '生病' },
    { emoji: '💪', label: '充满力量' },
    { emoji: '🎉', label: '庆祝' },
    { emoji: '💖', label: '恋爱中' },
  ]

  const weatherOptions = [
    { emoji: '☀️', label: '晴天' },
    { emoji: '⛅', label: '多云' },
    { emoji: '☁️', label: '阴天' },
    { emoji: '🌧️', label: '下雨' },
    { emoji: '⛈️', label: '雷雨' },
    { emoji: '🌨️', label: '下雪' },
    { emoji: '🌈', label: '彩虹' },
    { emoji: '🌙', label: '夜晚' },
    { emoji: '⭐', label: '星空' },
    { emoji: '🌤️', label: '晴转多云' },
  ]

  const stickerOptions = [
    '❤️',
    '💕',
    '💖',
    '💗',
    '💝',
    '💘',
    '💞',
    '💓',
    '🌹',
    '🌸',
    '🌺',
    '🌻',
    '🌼',
    '🌷',
    '🪻',
    '🏵️',
    '✨',
    '💫',
    '⭐',
    '🌟',
    '💥',
    '🎊',
    '🎉',
    '🎈',
    '🍰',
    '🍮',
    '🍪',
    '🍩',
    '🧁',
    '🍫',
    '🍬',
    '🍭',
    '🎵',
    '🎶',
    '🎸',
    '🎹',
    '🎤',
    '🎧',
    '🎬',
    '📷',
    '🌈',
    '☀️',
    '🌙',
    '☁️',
    '🌟',
    '💫',
    '✨',
    '⚡',
  ]

  const handleStickerToggle = (sticker: string) => {
    const currentStickers = newEntry.stickers || []
    if (currentStickers.includes(sticker)) {
      setNewEntry({
        ...newEntry,
        stickers: currentStickers.filter((s) => s !== sticker),
      })
    } else {
      setNewEntry({
        ...newEntry,
        stickers: [...currentStickers, sticker],
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-6xl mx-auto">
          <BackButton href="/" text="返回首页" />
          <h1 className="text-4xl font-bold text-gray-800 mb-2">📖 恋爱日记</h1>
          <p className="text-gray-600 mb-8">记录每天的甜蜜瞬间</p>
          <LoadingSkeleton type="diary" count={3} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <BackButton href="/" text="返回首页" />

        <div className="card">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">📖 恋爱日记</h1>
              <p className="text-gray-600">记录每天的甜蜜瞬间</p>
            </div>
            <button onClick={() => setShowAddForm(!showAddForm)} className="btn-primary">
              {showAddForm ? '取消' : '+ 写日记'}
            </button>
          </div>

          <div className="mb-6 flex gap-4 items-center">
            <label className="text-gray-800 font-semibold">筛选日期：</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-gray-800"
            />
            {selectedDate && (
              <button
                onClick={() => setSelectedDate('')}
                className="px-4 py-2 bg-white/20 text-gray-800 rounded-lg hover:bg-white/30 transition-colors"
              >
                清除筛选
              </button>
            )}
          </div>

          {showAddForm && (
            <div className="mb-8 p-6 bg-pink-50 rounded-xl border border-pink-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">写下今天的故事</h3>
                {showAddForm && (
                  <div className="flex items-center gap-2 text-sm">
                    {saveStatus === 'saving' && (
                      <span className="text-blue-600 flex items-center gap-1">
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        保存中...
                      </span>
                    )}
                    {saveStatus === 'saved' && (
                      <span className="text-green-600 flex items-center gap-1">
                        <span className="text-lg">💾</span>
                        已自动保存
                      </span>
                    )}
                    {saveStatus === 'unsaved' && (
                      <span className="text-orange-600 flex items-center gap-1">
                        <span className="text-lg">📝</span>
                        未保存
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-800 mb-2">日期 *</label>
                    <input
                      type="date"
                      value={newEntry.date}
                      onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                      className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-gray-800"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-800 mb-2">作者 *</label>
                    <input
                      type="text"
                      value={newEntry.author}
                      onChange={(e) => setNewEntry({ ...newEntry, author: e.target.value })}
                      className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-gray-800 placeholder-gray-400"
                      placeholder="你的名字"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-800 mb-2">标题 *</label>
                  <input
                    type="text"
                    value={newEntry.title}
                    onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
                    className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-gray-800 placeholder-gray-400"
                    placeholder="今天发生了什么特别的事？"
                  />
                </div>

                <div>
                  <label className="block text-gray-800 mb-2">今天的心情</label>
                  <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                    {moodOptions.map((mood) => (
                      <button
                        key={mood.emoji}
                        onClick={() => setNewEntry({ ...newEntry, mood: mood.emoji })}
                        className={`p-3 rounded-lg transition-all ${
                          newEntry.mood === mood.emoji
                            ? 'bg-white/30 scale-110'
                            : 'bg-white/10 hover:bg-white/20'
                        }`}
                        title={mood.label}
                      >
                        <span className="text-3xl">{mood.emoji}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-gray-800 mb-2">今天的天气</label>
                  <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                    {weatherOptions.map((weather) => (
                      <button
                        key={weather.emoji}
                        onClick={() => setNewEntry({ ...newEntry, weather: weather.emoji })}
                        className={`p-3 rounded-lg transition-all ${
                          newEntry.weather === weather.emoji
                            ? 'bg-white/30 scale-110'
                            : 'bg-white/10 hover:bg-white/20'
                        }`}
                        title={weather.label}
                      >
                        <span className="text-3xl">{weather.emoji}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-gray-800 mb-2">添加贴纸装饰 (最多选5个)</label>
                  <div className="grid grid-cols-8 md:grid-cols-12 gap-2 max-h-40 overflow-y-auto p-2 bg-white/10 rounded-lg">
                    {stickerOptions.map((sticker) => (
                      <button
                        key={sticker}
                        onClick={() => handleStickerToggle(sticker)}
                        disabled={
                          (newEntry.stickers?.length || 0) >= 5 &&
                          !newEntry.stickers?.includes(sticker)
                        }
                        className={`p-2 rounded-lg transition-all ${
                          newEntry.stickers?.includes(sticker)
                            ? 'bg-white/40 scale-110 ring-2 ring-pink-400'
                            : 'bg-white/10 hover:bg-white/20'
                        } disabled:opacity-30 disabled:cursor-not-allowed`}
                      >
                        <span className="text-2xl">{sticker}</span>
                      </button>
                    ))}
                  </div>
                  {newEntry.stickers && newEntry.stickers.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="text-sm text-gray-700">已选贴纸：</span>
                      {newEntry.stickers.map((sticker, i) => (
                        <span key={i} className="text-2xl">
                          {sticker}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-gray-800">日记内容 * (支持Markdown格式)</label>
                    <button
                      type="button"
                      onClick={() => setPreviewMode(!previewMode)}
                      className="px-3 py-1 bg-white/20 text-gray-800 rounded-lg hover:bg-white/30 transition-colors text-sm"
                    >
                      {previewMode ? '📝 编辑' : '👁️ 预览'}
                    </button>
                  </div>
                  {previewMode ? (
                    <div className="w-full min-h-[200px] px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-gray-800 prose prose-sm max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {newEntry.content || '*预览区域为空*'}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <textarea
                      value={newEntry.content}
                      onChange={(e) => setNewEntry({ ...newEntry, content: e.target.value })}
                      className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-gray-800 placeholder-gray-400"
                      placeholder="支持Markdown格式：**粗体** *斜体* - 列表 [链接](url)"
                      rows={8}
                    />
                  )}
                  <p className="text-xs text-gray-600 mt-1">
                    提示：支持 **粗体** *斜体* ### 标题 - 列表 等Markdown语法
                  </p>
                </div>

                <button onClick={handleAddEntry} className="w-full btn-primary">
                  保存日记
                </button>
              </div>
            </div>
          )}

          {entries.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">📖</div>
              <p className="text-xl text-gray-600">
                {selectedDate ? '这天还没有日记' : '还没有写过日记'}
              </p>
              <p className="text-gray-500 mt-2">点击&ldquo;写日记&rdquo;开始记录美好时光</p>
            </div>
          ) : (
            <div className="space-y-6">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="p-6 bg-pink-50 rounded-xl border border-pink-200 hover:bg-pink-100 transition-all"
                >
                  {editingEntry?.id === entry.id ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-gray-800 mb-2">标题</label>
                        <input
                          type="text"
                          value={editingEntry.title}
                          onChange={(e) =>
                            setEditingEntry({ ...editingEntry, title: e.target.value })
                          }
                          className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-gray-800"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-800 mb-2">心情</label>
                        <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                          {moodOptions.map((mood) => (
                            <button
                              key={mood.emoji}
                              onClick={() => setEditingEntry({ ...editingEntry, mood: mood.emoji })}
                              className={`p-2 rounded-lg transition-all ${
                                editingEntry.mood === mood.emoji
                                  ? 'bg-white/30 scale-110'
                                  : 'bg-white/10 hover:bg-white/20'
                              }`}
                            >
                              <span className="text-2xl">{mood.emoji}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="block text-gray-800">内容 (支持Markdown)</label>
                          <button
                            type="button"
                            onClick={() => setEditPreviewMode(!editPreviewMode)}
                            className="px-3 py-1 bg-white/20 text-gray-800 rounded-lg hover:bg-white/30 transition-colors text-sm"
                          >
                            {editPreviewMode ? '📝 编辑' : '👁️ 预览'}
                          </button>
                        </div>
                        {editPreviewMode ? (
                          <div className="w-full min-h-[150px] px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-gray-800 prose prose-sm max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {editingEntry.content || '*预览区域为空*'}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <textarea
                            value={editingEntry.content}
                            onChange={(e) =>
                              setEditingEntry({ ...editingEntry, content: e.target.value })
                            }
                            className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-gray-800"
                            rows={6}
                          />
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleUpdateEntry}
                          className="px-4 py-2 bg-green-500 text-gray-800 rounded-lg hover:bg-green-600 transition-colors"
                        >
                          保存
                        </button>
                        <button
                          onClick={() => setEditingEntry(null)}
                          className="px-4 py-2 bg-gray-500 text-gray-800 rounded-lg hover:bg-gray-600 transition-colors"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-5xl">{entry.mood}</span>
                            {entry.weather && <span className="text-3xl">{entry.weather}</span>}
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold text-gray-800 mb-1">{entry.title}</h3>
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                              <span>
                                📅{' '}
                                {new Date(entry.date).toLocaleDateString('zh-CN', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  weekday: 'long',
                                })}
                              </span>
                              <span>✍️ {entry.author}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingEntry(entry)}
                            className="text-blue-300 hover:text-blue-200 transition-colors"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteEntry(entry.id)}
                            className="text-red-400 hover:text-red-600 transition-colors"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>

                      <div className="bg-white/10 rounded-lg p-4 mb-3">
                        <div className="prose prose-sm max-w-none text-gray-800">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{entry.content}</ReactMarkdown>
                        </div>
                      </div>

                      {entry.stickers && entry.stickers.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3 p-3 bg-white/10 rounded-lg">
                          {entry.stickers.map((sticker, i) => (
                            <span
                              key={i}
                              className="text-3xl animate-pulse"
                              style={{ animationDelay: `${i * 0.1}s` }}
                            >
                              {sticker}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="text-xs text-gray-500">
                        {entry.updated_at !== entry.created_at && (
                          <span>
                            最后编辑：{new Date(entry.updated_at).toLocaleString('zh-CN')}
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
