'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import BackButton from '../components/BackButton'
import { useToast } from '../components/ToastProvider'
import { supabase } from '@/lib/supabase'

interface UserSettings {
  avatar: string // emoji or URL
  nickname: string
  signature: string
  mood: string
  theme: string
  loveDeclaration: string
}

const AVATAR_EMOJIS = [
  '😊','🥰','😘','😍','🤗','😎','🥳','😇','🤩','😋',
  '🐱','🐶','🐰','🐻','🐼','🦊','🐨','🐯','🦁','🐸',
  '⭐','🌟','💖','💕','🍐','🍑','🍓','🌸','🌈','🎀',
  '🦋','🌙','☀️','🔥','💎','👑','🎭','🎪','🎨','🎵',
]

const MOOD_OPTIONS = [
  { emoji: '😊', text: '开心' }, { emoji: '🥰', text: '甜蜜' },
  { emoji: '😴', text: '困困' }, { emoji: '🤔', text: '思考' },
  { emoji: '😤', text: '生气' }, { emoji: '😢', text: '难过' },
  { emoji: '🤒', text: '不舒服' }, { emoji: '💪', text: '充满能量' },
  { emoji: '🥱', text: '无聊' }, { emoji: '😎', text: '超酷' },
]

const SIGNATURE_PRESETS = [
  '今天也要开心鸭~', '爱你三千遍 💕', '你是我的小太阳 ☀️', '永远爱你的人',
  '最幸福的那个人', '被爱包围的每一天', '想你的第 N 天', '小可爱本爱',
]

export default function SettingsPage() {
  const router = useRouter()
  const toast = useToast()
  const [currentUser, setCurrentUser] = useState('')
  const [settings, setSettings] = useState<UserSettings>({
    avatar: '😊', nickname: '', signature: '', mood: '😊', theme: 'pink', loveDeclaration: '',
  })
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [showMoodPicker, setShowMoodPicker] = useState(false)
  const [partnerSettings, setPartnerSettings] = useState<UserSettings | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const user = localStorage.getItem('loggedInUser')
    if (!user) { router.push('/login'); return }
    setCurrentUser(user)

    const savedSettings = localStorage.getItem(`userSettings_${user}`)
    const baseSettings: UserSettings = savedSettings
      ? JSON.parse(savedSettings)
      : {
          avatar: user === 'zyx' ? '⭐' : '🍐',
          nickname: user === 'zyx' ? '星星' : '梨梨',
          signature: '今天也要开心鸭~',
          mood: '😊', theme: 'pink', loveDeclaration: '',
        }
    setSettings(baseSettings)

    // Fetch latest avatar from Supabase (overrides localStorage if newer)
    supabase.from('user_profiles')
      .select('avatar_url, avatar_emoji')
      .eq('name', user)
      .maybeSingle()
      .then(({ data }) => {
        if (data && (data.avatar_url || data.avatar_emoji)) {
          const remoteAvatar = data.avatar_url || data.avatar_emoji
          setSettings(prev => ({ ...prev, avatar: remoteAvatar }))
        }
      })

    const partner = user === 'zyx' ? 'zly' : 'zyx'
    const partnerSaved = localStorage.getItem(`userSettings_${partner}`)
    if (partnerSaved) setPartnerSettings(JSON.parse(partnerSaved))
  }, [router])

  const saveSettings = async () => {
    localStorage.setItem(`userSettings_${currentUser}`, JSON.stringify(settings))

    // Sync avatar to Supabase (UPDATE only - profile row must exist via Profile page)
    try {
      const isUrl = settings.avatar.startsWith('http')
      await supabase
        .from('user_profiles')
        .update({
          avatar_emoji: isUrl ? null : settings.avatar,
          avatar_url: isUrl ? settings.avatar : null,
        })
        .eq('name', currentUser)
    } catch (e) {
      // Profile row might not exist yet - that's fine, localStorage still works
      console.debug('Avatar Supabase sync skipped', e)
    }

    toast.success('设置保存成功! 💕')
  }

  const handleAvatarSelect = (avatar: string) => {
    setSettings({ ...settings, avatar })
    setShowAvatarPicker(false)
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return
    const file = event.target.files[0]
    if (file.size > 5 * 1024 * 1024) {
      toast.error('图片不能超过 5MB')
      return
    }
    const fileExt = file.name.split('.').pop()
    const filePath = `${currentUser}-${Date.now()}.${fileExt}`

    setUploading(true)
    try {
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file)
      if (uploadError) throw uploadError
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
      setSettings(prev => ({ ...prev, avatar: data.publicUrl }))
      setShowAvatarPicker(false)
      toast.success('头像上传成功!')
    } catch (err: any) {
      console.error(err)
      toast.error('上传失败，请确保 Supabase 已创建 avatars 存储桶')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const getPartnerName = () => currentUser === 'zyx' ? 'zly' : 'zyx'
  const isImageAvatar = settings.avatar.startsWith('http')

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <BackButton href="/" text="返回首页" />

        <div className="card mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2 text-center">
            ⚙️ 个人设置
          </h1>
          <p className="text-gray-600 text-center mb-6">自定义你的专属空间</p>

          {/* User Preview Card */}
          <div className="bg-gradient-to-br from-pink-100 to-purple-100 rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-4">
              <div
                className="w-20 h-20 rounded-full cursor-pointer hover:scale-110 transition-transform
                  flex items-center justify-center bg-white shadow-lg border-4 border-white overflow-hidden"
                onClick={() => setShowAvatarPicker(true)}
              >
                {isImageAvatar ? (
                  <img src={settings.avatar} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-5xl">{settings.avatar}</span>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-gray-800">
                    {settings.nickname || currentUser}
                  </h2>
                  <span className="text-2xl">{settings.mood}</span>
                </div>
                <p className="text-gray-600 italic">
                  {settings.signature || '点击下方设置签名...'}
                </p>
                <p className="text-xs text-gray-400 mt-1">点击头像更换</p>
              </div>
            </div>
          </div>

          {/* Avatar Picker Modal */}
          {showAvatarPicker && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl w-full max-w-md max-h-[85vh] overflow-hidden shadow-2xl">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                  <h3 className="text-lg font-bold text-gray-800">更换头像</h3>
                  <button onClick={() => setShowAvatarPicker(false)} className="text-gray-400 hover:text-gray-600 text-xl">
                    ✕
                  </button>
                </div>

                {/* Upload section */}
                <div className="p-4 border-b bg-gradient-to-r from-pink-50 to-purple-50">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-white shadow flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300">
                      {uploading ? (
                        <span className="animate-spin text-2xl">⏳</span>
                      ) : isImageAvatar ? (
                        <img src={settings.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-3xl">{settings.avatar}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium
                          hover:bg-pink-600 transition-colors disabled:opacity-50"
                      >
                        {uploading ? '上传中...' : '上传自定义图片'}
                      </button>
                      <p className="text-xs text-gray-400 mt-1">支持 JPG/PNG，最大 5MB</p>
                    </div>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>

                {/* Default emoji avatars */}
                <div className="p-4 overflow-y-auto" style={{ maxHeight: '50vh' }}>
                  <p className="text-xs text-gray-500 mb-3 font-medium">默认头像</p>
                  <div className="grid grid-cols-5 gap-2">
                    {AVATAR_EMOJIS.map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => handleAvatarSelect(emoji)}
                        className={`p-3 rounded-xl text-3xl transition-all hover:scale-110 ${
                          settings.avatar === emoji
                            ? 'bg-primary/20 ring-2 ring-primary shadow-md'
                            : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Mood Picker Modal */}
          {showMoodPicker && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl p-6 max-w-md w-full">
                <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">今天心情如何?</h3>
                <div className="grid grid-cols-2 gap-3">
                  {MOOD_OPTIONS.map(mood => (
                    <button
                      key={mood.emoji}
                      onClick={() => { setSettings({ ...settings, mood: mood.emoji }); setShowMoodPicker(false) }}
                      className={`p-4 rounded-xl flex items-center gap-3 transition-all ${
                        settings.mood === mood.emoji
                          ? 'bg-primary/20 ring-2 ring-primary'
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      <span className="text-3xl">{mood.emoji}</span>
                      <span className="text-gray-700">{mood.text}</span>
                    </button>
                  ))}
                </div>
                <button onClick={() => setShowMoodPicker(false)} className="w-full mt-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">
                  取消
                </button>
              </div>
            </div>
          )}

          {/* Settings Form */}
          <div className="space-y-6">
            <div>
              <label className="block text-gray-700 font-medium mb-2">💝 昵称</label>
              <input
                type="text" value={settings.nickname}
                onChange={e => setSettings({ ...settings, nickname: e.target.value })}
                placeholder="给自己起个可爱的名字..."
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                maxLength={10}
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">✨ 个性签名</label>
              <input
                type="text" value={settings.signature}
                onChange={e => setSettings({ ...settings, signature: e.target.value })}
                placeholder="写点什么..."
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                maxLength={30}
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {SIGNATURE_PRESETS.map(preset => (
                  <button key={preset}
                    onClick={() => setSettings({ ...settings, signature: preset })}
                    className="text-xs px-3 py-1 bg-pink-100 text-pink-600 rounded-full hover:bg-pink-200 transition-colors"
                  >{preset}</button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">😊 今日心情</label>
              <button onClick={() => setShowMoodPicker(true)}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-left flex items-center gap-3 hover:bg-gray-50"
              >
                <span className="text-3xl">{settings.mood}</span>
                <span className="text-gray-600">{MOOD_OPTIONS.find(m => m.emoji === settings.mood)?.text || '点击选择心情'}</span>
              </button>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">💌 想对 {getPartnerName()} 说的话</label>
              <textarea
                value={settings.loveDeclaration}
                onChange={e => setSettings({ ...settings, loveDeclaration: e.target.value })}
                placeholder={`写点想对${getPartnerName()}说的悄悄话...`}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                rows={3} maxLength={100}
              />
            </div>

            <button onClick={saveSettings} className="w-full btn-primary text-lg py-4">
              💾 保存设置
            </button>
          </div>
        </div>

        {/* Partner Space */}
        {partnerSettings && (
          <div className="card">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">💕 {getPartnerName()} 的空间</h2>
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-white shadow flex items-center justify-center overflow-hidden">
                  {partnerSettings.avatar.startsWith('http') ? (
                    <img src={partnerSettings.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl">{partnerSettings.avatar}</span>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-gray-800">{partnerSettings.nickname || getPartnerName()}</h3>
                    <span className="text-xl">{partnerSettings.mood}</span>
                  </div>
                  <p className="text-gray-600 italic">{partnerSettings.signature}</p>
                </div>
              </div>
              {partnerSettings.loveDeclaration && (
                <div className="mt-4 p-4 bg-white/50 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">💌 Ta 对你说:</p>
                  <p className="text-gray-700">{partnerSettings.loveDeclaration}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="card mt-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">🎯 快捷功能</h2>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => { localStorage.removeItem('loggedInUser'); router.push('/login') }}
              className="p-4 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors text-left"
            >
              <span className="text-2xl mb-2 block">🔄</span>
              <span className="text-gray-700 font-medium">切换账号</span>
            </button>
            <button onClick={() => { localStorage.removeItem(`userSettings_${currentUser}`); toast.success('设置已重置'); window.location.reload() }}
              className="p-4 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors text-left"
            >
              <span className="text-2xl mb-2 block">🗑️</span>
              <span className="text-gray-700 font-medium">重置设置</span>
            </button>
            <button onClick={() => router.push('/profile')}
              className="p-4 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors text-left"
            >
              <span className="text-2xl mb-2 block">👤</span>
              <span className="text-gray-700 font-medium">个人资料</span>
            </button>
            <button onClick={() => { setShowAvatarPicker(true) }}
              className="p-4 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors text-left"
            >
              <span className="text-2xl mb-2 block">📷</span>
              <span className="text-gray-700 font-medium">更换头像</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
