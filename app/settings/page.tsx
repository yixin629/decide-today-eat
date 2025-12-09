'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import BackButton from '../components/BackButton'
import { useToast } from '../components/ToastProvider'

interface UserSettings {
  avatar: string
  nickname: string
  signature: string
  mood: string
  theme: string
  loveDeclaration: string
}

// 可选头像
const AVATAR_OPTIONS = [
  // 表情类
  '😊',
  '🥰',
  '😘',
  '😍',
  '🤗',
  '😎',
  '🥳',
  '😇',
  '🤩',
  '😋',
  // 动物类
  '🐱',
  '🐶',
  '🐰',
  '🐻',
  '🐼',
  '🦊',
  '🐨',
  '🐯',
  '🦁',
  '🐸',
  // 物品类
  '⭐',
  '🌟',
  '💖',
  '💕',
  '🍐',
  '🍑',
  '🍓',
  '🌸',
  '🌈',
  '🎀',
  // 更多
  '🦋',
  '🌙',
  '☀️',
  '🔥',
  '💎',
  '👑',
  '🎭',
  '🎪',
  '🎨',
  '🎵',
]

// 心情选项
const MOOD_OPTIONS = [
  { emoji: '😊', text: '开心' },
  { emoji: '🥰', text: '甜蜜' },
  { emoji: '😴', text: '困困' },
  { emoji: '🤔', text: '思考' },
  { emoji: '😤', text: '生气' },
  { emoji: '😢', text: '难过' },
  { emoji: '🤒', text: '不舒服' },
  { emoji: '💪', text: '充满能量' },
  { emoji: '🥱', text: '无聊' },
  { emoji: '😎', text: '超酷' },
]

// 主题颜色
const THEME_OPTIONS = [
  { name: '粉色甜心', value: 'pink', color: 'bg-pink-400' },
  { name: '薰衣草紫', value: 'purple', color: 'bg-purple-400' },
  { name: '天空蓝', value: 'blue', color: 'bg-blue-400' },
  { name: '薄荷绿', value: 'green', color: 'bg-green-400' },
  { name: '暖阳橙', value: 'orange', color: 'bg-orange-400' },
  { name: '樱花红', value: 'red', color: 'bg-red-400' },
]

// 预设签名
const SIGNATURE_PRESETS = [
  '今天也要开心鸭~',
  '爱你三千遍 💕',
  '你是我的小太阳 ☀️',
  '永远爱你的人',
  '最幸福的那个人',
  '被爱包围的每一天',
  '想你的第 N 天',
  '小可爱本爱',
]

export default function SettingsPage() {
  const router = useRouter()
  const toast = useToast()
  const [currentUser, setCurrentUser] = useState('')
  const [settings, setSettings] = useState<UserSettings>({
    avatar: '😊',
    nickname: '',
    signature: '',
    mood: '😊',
    theme: 'pink',
    loveDeclaration: '',
  })
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [showMoodPicker, setShowMoodPicker] = useState(false)
  const [partnerSettings, setPartnerSettings] = useState<UserSettings | null>(null)

  useEffect(() => {
    const user = localStorage.getItem('loggedInUser')
    if (!user) {
      router.push('/login')
      return
    }
    setCurrentUser(user)

    // 加载当前用户设置
    const savedSettings = localStorage.getItem(`userSettings_${user}`)
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings))
    } else {
      // 默认设置
      setSettings({
        avatar: user === 'zyx' ? '⭐' : '🍐',
        nickname: user === 'zyx' ? '星星' : '梨梨',
        signature: '今天也要开心鸭~',
        mood: '😊',
        theme: 'pink',
        loveDeclaration: '',
      })
    }

    // 加载对方设置
    const partner = user === 'zyx' ? 'zly' : 'zyx'
    const partnerSaved = localStorage.getItem(`userSettings_${partner}`)
    if (partnerSaved) {
      setPartnerSettings(JSON.parse(partnerSaved))
    }
  }, [router])

  const saveSettings = () => {
    localStorage.setItem(`userSettings_${currentUser}`, JSON.stringify(settings))
    toast.success('设置保存成功！💕')
  }

  const handleAvatarSelect = (avatar: string) => {
    setSettings({ ...settings, avatar })
    setShowAvatarPicker(false)
  }

  const handleMoodSelect = (mood: string) => {
    setSettings({ ...settings, mood })
    setShowMoodPicker(false)
  }

  const getPartnerName = () => {
    return currentUser === 'zyx' ? 'zly' : 'zyx'
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <BackButton href="/" text="返回首页" />

        <div className="card mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2 text-center">
            ⚙️ 个人设置
          </h1>
          <p className="text-gray-600 text-center mb-6">自定义你的专属空间</p>

          {/* 当前用户信息预览 */}
          <div className="bg-gradient-to-br from-pink-100 to-purple-100 rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-4">
              <div
                className="text-7xl cursor-pointer hover:scale-110 transition-transform"
                onClick={() => setShowAvatarPicker(true)}
              >
                {settings.avatar}
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
              </div>
            </div>
          </div>

          {/* 头像选择器 */}
          {showAvatarPicker && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
                <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">选择头像</h3>
                <div className="grid grid-cols-5 gap-3">
                  {AVATAR_OPTIONS.map((avatar) => (
                    <button
                      key={avatar}
                      onClick={() => handleAvatarSelect(avatar)}
                      className={`p-3 rounded-xl text-3xl transition-all hover:scale-110 ${
                        settings.avatar === avatar
                          ? 'bg-primary/20 ring-2 ring-primary'
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      {avatar}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setShowAvatarPicker(false)}
                  className="w-full mt-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  取消
                </button>
              </div>
            </div>
          )}

          {/* 心情选择器 */}
          {showMoodPicker && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl p-6 max-w-md w-full">
                <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">今天心情如何？</h3>
                <div className="grid grid-cols-2 gap-3">
                  {MOOD_OPTIONS.map((mood) => (
                    <button
                      key={mood.emoji}
                      onClick={() => handleMoodSelect(mood.emoji)}
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
                <button
                  onClick={() => setShowMoodPicker(false)}
                  className="w-full mt-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  取消
                </button>
              </div>
            </div>
          )}

          {/* 设置表单 */}
          <div className="space-y-6">
            {/* 昵称 */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">💝 昵称</label>
              <input
                type="text"
                value={settings.nickname}
                onChange={(e) => setSettings({ ...settings, nickname: e.target.value })}
                placeholder="给自己起个可爱的名字..."
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                maxLength={10}
              />
            </div>

            {/* 个性签名 */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">✨ 个性签名</label>
              <input
                type="text"
                value={settings.signature}
                onChange={(e) => setSettings({ ...settings, signature: e.target.value })}
                placeholder="写点什么..."
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                maxLength={30}
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {SIGNATURE_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setSettings({ ...settings, signature: preset })}
                    className="text-xs px-3 py-1 bg-pink-100 text-pink-600 rounded-full hover:bg-pink-200 transition-colors"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* 心情 */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">😊 今日心情</label>
              <button
                onClick={() => setShowMoodPicker(true)}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-left flex items-center gap-3 hover:bg-gray-50"
              >
                <span className="text-3xl">{settings.mood}</span>
                <span className="text-gray-600">
                  {MOOD_OPTIONS.find((m) => m.emoji === settings.mood)?.text || '点击选择心情'}
                </span>
              </button>
            </div>

            {/* 给对方的话 */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                💌 想对 {getPartnerName()} 说的话
              </label>
              <textarea
                value={settings.loveDeclaration}
                onChange={(e) => setSettings({ ...settings, loveDeclaration: e.target.value })}
                placeholder={`写点想对${getPartnerName()}说的悄悄话...`}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                rows={3}
                maxLength={100}
              />
            </div>

            {/* 保存按钮 */}
            <button onClick={saveSettings} className="w-full btn-primary text-lg py-4">
              💾 保存设置
            </button>
          </div>
        </div>

        {/* 对方的空间 */}
        {partnerSettings && (
          <div className="card">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
              💕 {getPartnerName()} 的空间
            </h2>
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6">
              <div className="flex items-center gap-4">
                <span className="text-6xl">{partnerSettings.avatar}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-gray-800">
                      {partnerSettings.nickname || getPartnerName()}
                    </h3>
                    <span className="text-xl">{partnerSettings.mood}</span>
                  </div>
                  <p className="text-gray-600 italic">{partnerSettings.signature}</p>
                </div>
              </div>
              {partnerSettings.loveDeclaration && (
                <div className="mt-4 p-4 bg-white/50 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">💌 Ta 对你说：</p>
                  <p className="text-gray-700">{partnerSettings.loveDeclaration}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 快捷功能 */}
        <div className="card mt-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">🎯 快捷功能</h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                localStorage.removeItem('loggedInUser')
                router.push('/login')
              }}
              className="p-4 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors text-left"
            >
              <span className="text-2xl mb-2 block">🔄</span>
              <span className="text-gray-700 font-medium">切换账号</span>
            </button>
            <button
              onClick={() => {
                localStorage.removeItem(`userSettings_${currentUser}`)
                toast.success('设置已重置')
                window.location.reload()
              }}
              className="p-4 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors text-left"
            >
              <span className="text-2xl mb-2 block">🗑️</span>
              <span className="text-gray-700 font-medium">重置设置</span>
            </button>
            <button
              onClick={() => {
                localStorage.removeItem('couplePlaylist')
                toast.success('播放列表已重置为默认')
              }}
              className="p-4 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors text-left"
            >
              <span className="text-2xl mb-2 block">🎵</span>
              <span className="text-gray-700 font-medium">重置歌单</span>
            </button>
            <button
              onClick={() => router.push('/profile')}
              className="p-4 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors text-left"
            >
              <span className="text-2xl mb-2 block">👤</span>
              <span className="text-gray-700 font-medium">个人资料</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
