'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavItem {
  name: string
  path: string
  icon: string
  category: 'feature' | 'game'
}

const navItems: NavItem[] = [
  // 功能页面
  { name: '个人资料', path: '/profile', icon: '👤', category: 'feature' },
  { name: '每日签到', path: '/check-in', icon: '💖', category: 'feature' },
  { name: '倒计时/正计时', path: '/countdown', icon: '⏰', category: 'feature' },
  { name: '共享日程', path: '/schedule', icon: '📅', category: 'feature' },
  { name: '时光胶囊', path: '/time-capsule', icon: '🎁', category: 'feature' },
  { name: '恋爱日记', path: '/diary', icon: '📖', category: 'feature' },
  { name: '美食决策器', path: '/food', icon: '🍜', category: 'feature' },
  { name: '纪念日', path: '/anniversaries', icon: '💝', category: 'feature' },
  { name: '愿望清单', path: '/wishlist', icon: '⭐', category: 'feature' },
  { name: '情侣问答', path: '/couple-quiz', icon: '❓', category: 'feature' },
  { name: '照片墙', path: '/photos', icon: '📷', category: 'feature' },
  { name: '留言板', path: '/notes', icon: '💌', category: 'feature' },
  { name: '情话生成器', path: '/love-quotes', icon: '💕', category: 'feature' },
  { name: '愿望桶', path: '/bucket-list', icon: '🪣', category: 'feature' },
  { name: '塔罗牌占卜', path: '/tarot', icon: '🔮', category: 'feature' },
  { name: '星座运势', path: '/horoscope', icon: '⭐', category: 'feature' },
  { name: '穿搭记录', path: '/outfit-records', icon: '👔', category: 'feature' },
  { name: '功能需求', path: '/feature-requests', icon: '💡', category: 'feature' },
  { name: '情侣书架', path: '/novels', icon: '📚', category: 'feature' },

  // 游戏页面
  { name: '五子棋', path: '/gomoku', icon: '⚫', category: 'game' },
  { name: '石头剪刀布', path: '/rock-paper-scissors', icon: '✊', category: 'game' },
  { name: '真心话大冒险', path: '/truth-or-dare', icon: '🎲', category: 'game' },
  { name: '涂鸦板', path: '/drawing', icon: '🎨', category: 'game' },
  { name: '记忆翻牌', path: '/memory-game', icon: '🃏', category: 'game' },
  { name: '配对游戏', path: '/matching-game', icon: '🧩', category: 'game' },
  { name: '装扮小人', path: '/dress-up', icon: '🎀', category: 'game' },
  { name: '制作情书', path: '/love-letter', icon: '💌', category: 'game' },
  { name: '颜色测试', path: '/color-test', icon: '🌈', category: 'game' },
]

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const pathname = usePathname()

  const filteredItems = navItems.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const features = filteredItems.filter((item) => item.category === 'feature')
  const games = filteredItems.filter((item) => item.category === 'game')

  // Hide navigation button on chat page to prevent overlap
  if (pathname === '/chat') return null

  return (
    <>
      {/* 汉堡菜单按钮 - 固定在左上角 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed top-4 left-4 z-50 p-3 bg-white rounded-lg shadow-lg hover:shadow-xl transition-all hover:scale-105 ${
          isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
        aria-label="打开导航菜单"
      >
        <div className="w-6 h-6 flex flex-col justify-center items-center">
          <span className="bg-primary block h-0.5 w-6 rounded-sm mb-1"></span>
          <span className="bg-primary block h-0.5 w-6 rounded-sm mb-1"></span>
          <span className="bg-primary block h-0.5 w-6 rounded-sm"></span>
        </div>
      </button>

      {/* 遮罩层 */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* 侧边导航栏 */}
      <div
        className={`fixed top-0 left-0 h-full w-[85vw] max-w-[280px] sm:max-w-[320px] md:w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out overflow-hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* 头部 */}
          <div className="p-4 sm:p-6 border-b border-gray-200 relative flex justify-between items-start">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-primary mb-1">功能导航</h2>
              <p className="text-xs sm:text-sm text-gray-600">快速找到你需要的功能</p>
            </div>
            {/* 关闭按钮 */}
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
            >
              <span className="text-2xl">✕</span>
            </button>
          </div>

          {/* 搜索框 */}
          <div className="p-3 sm:p-4 border-b border-gray-200">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索功能..."
                className="w-full px-3 sm:px-4 py-2 pl-9 sm:pl-10 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <span className="absolute left-2 sm:left-3 top-2.5 text-gray-400 text-sm sm:text-base">
                🔍
              </span>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 sm:right-3 top-2.5 text-gray-400 hover:text-gray-600 text-sm"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* 导航列表 */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4">
            {/* 首页链接 */}
            <Link
              href="/"
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg mb-2 transition-all ${
                pathname === '/'
                  ? 'bg-gradient-to-r from-pink-100 to-purple-100 text-primary font-semibold shadow-sm'
                  : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              <span className="text-xl sm:text-2xl">🏠</span>
              <span className="text-sm sm:text-base">首页</span>
            </Link>

            {/* 功能页面 */}
            {features.length > 0 && (
              <>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 sm:px-4 py-2 mt-4">
                  功能 ({features.length})
                </h3>
                {features.map((item) => (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg mb-1 transition-all ${
                      pathname === item.path
                        ? 'bg-gradient-to-r from-pink-100 to-purple-100 text-primary font-semibold shadow-sm'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <span className="text-lg sm:text-xl">{item.icon}</span>
                    <span className="text-xs sm:text-sm">{item.name}</span>
                  </Link>
                ))}
              </>
            )}

            {/* 游戏页面 */}
            {games.length > 0 && (
              <>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 sm:px-4 py-2 mt-4">
                  游戏 ({games.length})
                </h3>
                {games.map((item) => (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg mb-1 transition-all ${
                      pathname === item.path
                        ? 'bg-gradient-to-r from-pink-100 to-purple-100 text-primary font-semibold shadow-sm'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <span className="text-lg sm:text-xl">{item.icon}</span>
                    <span className="text-xs sm:text-sm">{item.name}</span>
                  </Link>
                ))}
              </>
            )}

            {/* 无搜索结果 */}
            {searchQuery && filteredItems.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <div className="text-3xl sm:text-4xl mb-2">🔍</div>
                <p className="text-sm">没有找到匹配的功能</p>
              </div>
            )}
          </div>

          {/* 底部信息 */}
          <div className="p-3 sm:p-4 border-t border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-500 text-center">共 {navItems.length} 个功能 💕</p>
          </div>
        </div>
      </div>
    </>
  )
}
