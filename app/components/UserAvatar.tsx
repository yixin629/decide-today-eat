'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const users = [
  { name: 'zyx', emoji: '⭐', nickname: '星星' },
  { name: 'zly', emoji: '🍐', nickname: '梨梨' },
]

export default function UserAvatar() {
  const [currentUser, setCurrentUser] = useState<string>('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [unreadReminders, setUnreadReminders] = useState(0)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // 从localStorage获取当前登录用户
    const loggedInUser = localStorage.getItem('loggedInUser')
    if (loggedInUser) {
      setCurrentUser(loggedInUser)
      checkReminders(loggedInUser)
    }

    // 每分钟检查一次提醒
    const interval = setInterval(() => {
      const user = localStorage.getItem('loggedInUser')
      if (user) {
        setCurrentUser(user)
        checkReminders(user)
      }
    }, 60000)

    return () => clearInterval(interval)
  }, [pathname]) // 添加pathname依赖，路由变化时重新检查

  const checkReminders = async (userName: string) => {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const in3Days = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000)

      const { data } = await supabase
        .from('reminders')
        .select('*')
        .eq('remind_to', userName)
        .eq('is_sent', false)
        .gte('remind_date', today.toISOString().split('T')[0])
        .lte('remind_date', in3Days.toISOString().split('T')[0])

      if (data) {
        setUnreadReminders(data.length)
      }
    } catch (error) {
      console.error('检查提醒失败:', error)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('loggedInUser')
    router.push('/login')
  }

  const userInfo = users.find((u) => u.name === currentUser)

  if (!currentUser) return null

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="relative">
        {/* User Avatar Button */}
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 px-4 py-2 border-2 border-primary/20 hover:border-primary"
        >
          <span className="text-2xl">{userInfo?.emoji || '👤'}</span>
          <span className="font-semibold text-gray-800">{userInfo?.nickname}</span>
          {unreadReminders > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
              {unreadReminders}
            </span>
          )}
          <svg
            className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {showDropdown && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />

            {/* Menu */}
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border-2 border-gray-100 overflow-hidden z-50 animate-fade-in">
              {/* User Info */}
              <div className="px-4 py-3 bg-gradient-to-r from-pink-50 to-purple-50 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{userInfo?.emoji}</span>
                  <div>
                    <p className="font-bold text-gray-800">{userInfo?.nickname}</p>
                    <p className="text-sm text-gray-600">{userInfo?.name}</p>
                  </div>
                </div>
              </div>

              {/* Go to Profile */}
              <Link
                href="/profile"
                onClick={() => setShowDropdown(false)}
                className="block px-4 py-3 hover:bg-pink-50 transition-colors border-b border-gray-100"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">👤</span>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">个人资料</p>
                    <p className="text-xs text-gray-500">管理信息和提醒</p>
                  </div>
                  {unreadReminders > 0 && (
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      {unreadReminders}
                    </span>
                  )}
                </div>
              </Link>

              {/* Quick Actions */}
              <div className="p-2">
                <Link
                  href="/"
                  onClick={() => setShowDropdown(false)}
                  className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  🏠 返回首页
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  🚪 退出登录
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
