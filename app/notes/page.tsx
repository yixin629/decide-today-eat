'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface Note {
  id: string
  author: string
  content: string
  toPerson: string
  createdAt: string
  isRead: boolean
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [newNote, setNewNote] = useState({
    author: '',
    content: '',
    toPerson: '',
  })
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  // 加载数据
  useEffect(() => {
    loadNotes()
  }, [])

  const loadNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('love_notes')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      if (data) {
        setNotes(data.map(item => ({
          id: item.id,
          author: item.author,
          content: item.content,
          toPerson: item.to_person,
          createdAt: item.created_at,
          isRead: item.is_read,
        })))
      }
    } catch (error) {
      console.error('加载留言失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNote.content.trim()) return

    try {
      const { data, error } = await supabase
        .from('love_notes')
        .insert([{
          author: newNote.author,
          content: newNote.content,
          to_person: newNote.toPerson,
          is_read: false,
        }])
        .select()

      if (error) throw error

      if (data) {
        const newNoteData = {
          id: data[0].id,
          author: data[0].author,
          content: data[0].content,
          toPerson: data[0].to_person,
          createdAt: data[0].created_at,
          isRead: data[0].is_read,
        }
        setNotes([newNoteData, ...notes])
        setNewNote({ author: '', content: '', toPerson: '' })
      }
    } catch (error) {
      console.error('发送留言失败:', error)
      alert('发送失败，请检查网络连接')
    }
  }

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('love_notes')
        .update({ is_read: true })
        .eq('id', id)

      if (error) throw error

      setNotes(
        notes.map((note) => (note.id === id ? { ...note, isRead: true } : note))
      )
    } catch (error) {
      console.error('标记失败:', error)
    }
  }

  const deleteNote = async (id: string) => {
    if (!confirm('确定要删除这条留言吗？')) return

    try {
      const { error } = await supabase
        .from('love_notes')
        .delete()
        .eq('id', id)

      if (error) throw error

      setNotes(notes.filter((note) => note.id !== id))
    } catch (error) {
      console.error('删除失败:', error)
      alert('删除失败，请重试')
    }
  }

  const filteredNotes = notes.filter((note) =>
    filter === 'unread' ? !note.isRead : true
  )

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-block mb-6 text-white hover:text-primary transition-colors">
          ← 返回首页
        </Link>

        <div className="card">
          <h1 className="text-4xl font-bold text-primary mb-8 text-center">
            💌 甜蜜留言板 💌
          </h1>

          {loading ? (
            <div className="text-center py-12">
              <div className="text-2xl">加载中... ⏳</div>
            </div>
          ) : (
            <>
              {/* New Note Form */}
          <form onSubmit={handleSubmit} className="bg-pink-50 p-6 rounded-xl mb-8">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">你的名字</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newNote.author}
                      onChange={(e) =>
                        setNewNote({ ...newNote, author: e.target.value })
                      }
                      className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                      placeholder="例如: zly"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setNewNote({ ...newNote, author: 'zly' })}
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-secondary transition-colors text-sm"
                    >
                      zly
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewNote({ ...newNote, author: 'zyx' })}
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-secondary transition-colors text-sm"
                    >
                      zyx
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">给谁</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newNote.toPerson}
                      onChange={(e) =>
                        setNewNote({ ...newNote, toPerson: e.target.value })
                      }
                      className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                      placeholder="例如: zyx"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setNewNote({ ...newNote, toPerson: 'zyx' })}
                      className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-primary transition-colors text-sm"
                    >
                      zyx
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewNote({ ...newNote, toPerson: 'zly' })}
                      className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-primary transition-colors text-sm"
                    >
                      zly
                    </button>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">留言内容</label>
                <textarea
                  value={newNote.content}
                  onChange={(e) =>
                    setNewNote({ ...newNote, content: e.target.value })
                  }
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                  rows={4}
                  placeholder="写下想对 TA 说的话..."
                  required
                />
              </div>
              <button type="submit" className="btn-primary w-full">
                💌 发送留言
              </button>
            </div>
          </form>

          {/* Filter Buttons */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setFilter('all')}
              className={`px-6 py-2 rounded-full font-semibold transition-all ${
                filter === 'all'
                  ? 'bg-primary text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              全部 ({notes.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-6 py-2 rounded-full font-semibold transition-all ${
                filter === 'unread'
                  ? 'bg-primary text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              未读 ({notes.filter((n) => !n.isRead).length})
            </button>
          </div>

          {/* Notes List */}
          <div className="space-y-4">
            {filteredNotes.map((note) => (
              <div
                key={note.id}
                className={`p-6 rounded-xl shadow transition-all ${
                  note.isRead
                    ? 'bg-gray-50'
                    : 'bg-gradient-to-r from-pink-50 to-purple-50'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-primary text-lg">
                        {note.author}
                      </span>
                      <span className="text-gray-500">→</span>
                      <span className="font-bold text-secondary text-lg">
                        {note.toPerson}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(note.createdAt).toLocaleString('zh-CN')}
                    </span>
                  </div>
                  {!note.isRead && (
                    <span className="bg-red-500 text-white text-xs px-3 py-1 rounded-full">
                      NEW
                    </span>
                  )}
                </div>
                <p className="text-gray-800 text-lg mb-4 whitespace-pre-wrap">
                  {note.content}
                </p>
                <div className="flex gap-2">
                  {!note.isRead && (
                    <button
                      onClick={() => markAsRead(note.id)}
                      className="btn-primary text-sm py-2 px-4"
                    >
                      ✓ 标记已读
                    </button>
                  )}
                  <button
                    onClick={() => deleteNote(note.id)}
                    className="text-red-500 hover:text-red-700 text-sm px-4"
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredNotes.length === 0 && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">💌</div>
              <p className="text-gray-500 text-lg">
                {filter === 'unread' ? '没有未读留言' : '还没有留言，写下第一条吧！'}
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
