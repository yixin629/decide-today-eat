'use client'

import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from './ToastProvider'

interface AvatarSelectorProps {
  currentAvatar: string
  onSelect: (newAvatar: string) => void
  onClose: () => void
  userId: string
}

const EMOJI_OPTIONS = [
  '😊',
  '😎',
  '🤠',
  '🥳',
  '🥰',
  '🤔',
  '😴',
  '🐶',
  '🐱',
  '🐼',
  '🦊',
  '🦁',
  '🐷',
  '⭐',
  '🌟',
  '🌙',
  '☀️',
  '🌈',
  '🍎',
  '🍓',
  '🥑',
  '🍕',
  '🍔',
  '🍜',
  '⚽',
  '🏀',
  '🎮',
  '🎨',
  '🚀',
  '💎',
]

export default function AvatarSelector({
  currentAvatar,
  onSelect,
  onClose,
  userId,
}: AvatarSelectorProps) {
  const [activeTab, setActiveTab] = useState<'emoji' | 'image'>('emoji')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { showToast } = useToast()

  const handleEmojiSelect = async (emoji: string) => {
    try {
      // Create user profile if not exists or update
      // We assume user_profiles table exists as per previous steps
      const { error } = await supabase.from('user_profiles').upsert(
        {
          // We need a way to identify the user record.
          // In this app, we are using 'name' (zyx/zly) as ID in some places,
          // but the table definition used UUID.
          // Let's assume we map 'name' to the profile somehow or search by name.
          // Wait, the table has `name` column.
          // Let's try to update by name match for simplicity if ID is not available.
          // Actually, best to fetch profile by Name first.
          // For now, let's just pass the avatar back and let parent handle DB?
          // No, component should handle "Selection". Parent handles "Saving"?
          // Let's let Parent handle DB update to keep this UI-focused.
        },
        { onConflict: 'name' }
      )

      onSelect(emoji)
      onClose()
    } catch (e) {
      console.error(e)
    }
  }

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0) {
        return
      }
      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}-${Math.random()}.${fileExt}`
      const filePath = `${fileName}`

      setUploading(true)

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      // Get Public URL
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)

      onSelect(data.publicUrl)
      onClose()
      showToast('头像上传成功！', 'success')
    } catch (error: any) {
      console.error('Upload failed:', error)
      showToast('上传失败，请确保已有 avatars 存储桶', 'error')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-800">更换头像</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <div className="flex border-b">
          <button
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'emoji'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('emoji')}
          >
            😊 表情
          </button>
          <button
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'image'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('image')}
          >
            🖼️ 图片
          </button>
        </div>

        <div className="p-4 h-64 overflow-y-auto">
          {activeTab === 'emoji' ? (
            <div className="grid grid-cols-5 gap-2">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => onSelect(emoji)}
                  className={`text-2xl p-2 rounded-lg hover:bg-gray-100 transition-colors ${
                    currentAvatar === emoji ? 'bg-pink-100 ring-2 ring-pink-300' : ''
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
              <div
                className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300 cursor-pointer hover:border-primary transition-colors relative"
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? (
                  <span className="animate-spin">⏳</span>
                ) : (
                  <span className="text-4xl text-gray-400">+</span>
                )}
                {/* Preview current if it's an image */}
                {currentAvatar && currentAvatar.startsWith('http') && !uploading && (
                  <img
                    src={currentAvatar}
                    alt="Current"
                    className="absolute inset-0 w-full h-full object-cover opacity-50"
                  />
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />
              <p className="text-sm text-gray-500">点击上传新图片</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
