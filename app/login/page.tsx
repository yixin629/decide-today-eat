'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [selectedUser, setSelectedUser] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // 检查是否已登录
    const loggedInUser = localStorage.getItem('loggedInUser')
    if (loggedInUser) {
      router.push('/')
    }
  }, [router])

  const handleLogin = () => {
    if (!selectedUser) {
      alert('请选择用户')
      return
    }

    if (!password) {
      alert('请输入密码')
      return
    }

    // 验证密码
    const correctPassword = selectedUser === 'zyx' ? 'lovezly' : 'lovezyx'
    if (password !== correctPassword) {
      alert('密码错误！')
      setPassword('')
      return
    }

    localStorage.setItem('loggedInUser', selectedUser)
    router.push('/')
  }

  const users = [
    {
      name: 'zyx',
      emoji: '⭐',
      nickname: '星星',
      color: 'from-yellow-100 to-orange-100',
      password: 'lovezly',
    },
    {
      name: 'zly',
      emoji: '🍐',
      nickname: '梨梨',
      color: 'from-green-100 to-emerald-100',
      password: 'lovezyx',
    },
  ]

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="card text-center">
          <h1 className="text-4xl font-bold text-primary mb-2">💕 欢迎回来 💕</h1>
          <p className="text-gray-600 mb-8">请选择你的身份登录</p>

          <div className="space-y-4 mb-8">
            {users.map((user) => (
              <button
                key={user.name}
                onClick={() => setSelectedUser(user.name)}
                className={`w-full p-6 rounded-2xl border-4 transition-all duration-300 ${
                  selectedUser === user.name
                    ? 'border-primary scale-105 shadow-xl'
                    : 'border-gray-200 hover:border-primary/50 hover:scale-102'
                } bg-gradient-to-br ${user.color}`}
              >
                <div className="flex items-center justify-center gap-4">
                  <span className="text-6xl">{user.emoji}</span>
                  <div className="text-left">
                    <h3 className="text-2xl font-bold text-gray-800">{user.nickname}</h3>
                    <p className="text-gray-600">{user.name}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Password Input */}
          {selectedUser && (
            <div className="mb-6 animate-fade-in">
              <label className="block text-left text-sm font-medium text-gray-700 mb-2">密码</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && password) {
                      handleLogin()
                    }
                  }}
                  placeholder="请输入密码"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-left">
                💡 提示：love+对方名字首字母缩写
              </p>
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={!selectedUser || !password}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {selectedUser
              ? `以 ${users.find((u) => u.name === selectedUser)?.nickname} 身份登录`
              : '请先选择用户'}
          </button>

          <p className="text-sm text-gray-500 mt-6">✨ 登录后可以管理个人信息、查看提醒等功能</p>
        </div>
      </div>
    </div>
  )
}
