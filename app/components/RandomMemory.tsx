'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Photo {
  id: string
  title: string
  description: string
  image_url: string
  uploaded_by: string
  created_at: string
}

interface Note {
  id: string
  from_name: string
  to_name: string
  message: string
  created_at: string
}

type Memory = { type: 'photo'; data: Photo } | { type: 'note'; data: Note } | null

export default function RandomMemory() {
  const [memory, setMemory] = useState<Memory>(null)
  const [loading, setLoading] = useState(false)
  const [show, setShow] = useState(false)

  const loadRandomMemory = async () => {
    setLoading(true)
    setShow(false)

    try {
      // 随机选择照片或留言
      const memoryType = Math.random() > 0.5 ? 'photo' : 'note'

      if (memoryType === 'photo') {
        const { data, error } = await supabase
          .from('photos')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error

        if (data && data.length > 0) {
          const randomIndex = Math.floor(Math.random() * data.length)
          setMemory({
            type: 'photo',
            data: data[randomIndex],
          })
        }
      } else {
        const { data, error } = await supabase
          .from('love_notes')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error

        if (data && data.length > 0) {
          const randomIndex = Math.floor(Math.random() * data.length)
          setMemory({
            type: 'note',
            data: data[randomIndex],
          })
        }
      }

      setShow(true)
    } catch (error) {
      console.error('加载回忆失败:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-primary mb-2">💫 随机回忆 💫</h2>
        <p className="text-gray-600">让我们看看有什么美好的回忆吧</p>
      </div>

      <button onClick={loadRandomMemory} disabled={loading} className="btn-primary w-full mb-6">
        {loading ? '加载中...' : '🎲 抽取一个回忆'}
      </button>

      {show && memory && (
        <div className="animate-fade-in">
          {memory.type === 'photo' ? (
            <div className="bg-pink-50 rounded-xl p-6 border border-pink-200">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">📸</span>
                <h3 className="text-xl font-bold text-gray-800">{memory.data.title}</h3>
              </div>

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={memory.data.image_url}
                alt={memory.data.title}
                className="w-full max-h-96 object-contain rounded-lg mb-4 bg-gray-50"
              />

              {memory.data.description && (
                <p className="text-gray-700 mb-3">{memory.data.description}</p>
              )}

              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>📷 {memory.data.uploaded_by}</span>
                <span>{new Date(memory.data.created_at).toLocaleDateString('zh-CN')}</span>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-200">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">💌</span>
                <h3 className="text-xl font-bold text-gray-800">甜蜜留言</h3>
              </div>

              <div className="bg-white rounded-lg p-4 mb-4">
                <p className="text-gray-800 text-lg leading-relaxed whitespace-pre-wrap">
                  {memory.data.message}
                </p>
              </div>

              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>
                  From: <span className="font-semibold text-primary">{memory.data.from_name}</span>
                  {' → '}
                  To: <span className="font-semibold text-secondary">{memory.data.to_name}</span>
                </span>
                <span>{new Date(memory.data.created_at).toLocaleDateString('zh-CN')}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
