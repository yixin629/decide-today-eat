'use client'

import { useState, useEffect } from 'react'

type ThemeMode = 'light' | 'dark' | 'eye-care'
type FontSize = 'small' | 'medium' | 'large'

export default function ThemeSettings() {
  const [themeMode, setThemeMode] = useState<ThemeMode>('light')
  const [fontSize, setFontSize] = useState<FontSize>('medium')
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // 加载保存的设置
    const savedTheme = localStorage.getItem('themeMode') as ThemeMode
    const savedFontSize = localStorage.getItem('fontSize') as FontSize

    if (savedTheme) {
      setThemeMode(savedTheme)
      applyTheme(savedTheme)
    }
    if (savedFontSize) {
      setFontSize(savedFontSize)
      applyFontSize(savedFontSize)
    }
  }, [])

  const applyTheme = (mode: ThemeMode) => {
    const root = document.documentElement

    // 移除所有主题类
    root.classList.remove('dark-mode', 'eye-care-mode')

    if (mode === 'dark') {
      root.classList.add('dark-mode')
    } else if (mode === 'eye-care') {
      root.classList.add('eye-care-mode')
    }
  }

  const applyFontSize = (size: FontSize) => {
    const root = document.documentElement

    switch (size) {
      case 'small':
        root.style.fontSize = '14px'
        break
      case 'medium':
        root.style.fontSize = '16px'
        break
      case 'large':
        root.style.fontSize = '18px'
        break
    }
  }

  const handleThemeChange = (mode: ThemeMode) => {
    setThemeMode(mode)
    applyTheme(mode)
    localStorage.setItem('themeMode', mode)

    // 触觉反馈
    if (navigator.vibrate) {
      navigator.vibrate(30)
    }
  }

  const handleFontSizeChange = (size: FontSize) => {
    setFontSize(size)
    applyFontSize(size)
    localStorage.setItem('fontSize', size)

    // 触觉反馈
    if (navigator.vibrate) {
      navigator.vibrate(30)
    }
  }

  return (
    <>
      {/* 设置按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        // move settings button left to avoid overlapping other fixed action buttons (chatbot/theme)
        className="fixed bottom-6 right-40 bg-white text-gray-700 p-4 rounded-full shadow-lg hover:shadow-xl transition-all z-40 hover:scale-110"
        aria-label="主题设置"
      >
        <span className="text-2xl">⚙️</span>
      </button>

      {/* 设置面板 */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-30 z-40"
            onClick={() => setIsOpen(false)}
          />
          {/* panel position updated to match the new button position */}
          <div className="fixed bottom-24 right-40 bg-white rounded-2xl shadow-2xl z-50 p-6 w-80 animate-slide-up">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>⚙️</span>
              <span>显示设置</span>
            </h3>

            {/* 主题模式 */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">主题模式</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleThemeChange('light')}
                  className={`p-3 rounded-xl transition-all ${
                    themeMode === 'light'
                      ? 'bg-primary text-white shadow-lg'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  <div className="text-2xl mb-1">☀️</div>
                  <div className="text-xs">日间</div>
                </button>
                <button
                  onClick={() => handleThemeChange('dark')}
                  className={`p-3 rounded-xl transition-all ${
                    themeMode === 'dark'
                      ? 'bg-primary text-white shadow-lg'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  <div className="text-2xl mb-1">🌙</div>
                  <div className="text-xs">夜间</div>
                </button>
                <button
                  onClick={() => handleThemeChange('eye-care')}
                  className={`p-3 rounded-xl transition-all ${
                    themeMode === 'eye-care'
                      ? 'bg-primary text-white shadow-lg'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  <div className="text-2xl mb-1">👁️</div>
                  <div className="text-xs">护眼</div>
                </button>
              </div>
            </div>

            {/* 字体大小 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">字体大小</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleFontSizeChange('small')}
                  className={`p-3 rounded-xl transition-all ${
                    fontSize === 'small'
                      ? 'bg-primary text-white shadow-lg'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  <div className="text-xl mb-1">A</div>
                  <div className="text-xs">小</div>
                </button>
                <button
                  onClick={() => handleFontSizeChange('medium')}
                  className={`p-3 rounded-xl transition-all ${
                    fontSize === 'medium'
                      ? 'bg-primary text-white shadow-lg'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  <div className="text-2xl mb-1">A</div>
                  <div className="text-xs">中</div>
                </button>
                <button
                  onClick={() => handleFontSizeChange('large')}
                  className={`p-3 rounded-xl transition-all ${
                    fontSize === 'large'
                      ? 'bg-primary text-white shadow-lg'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  <div className="text-3xl mb-1">A</div>
                  <div className="text-xs">大</div>
                </button>
              </div>
            </div>

            {/* 关闭按钮 */}
            <button onClick={() => setIsOpen(false)} className="mt-6 w-full btn-secondary">
              关闭
            </button>
          </div>
        </>
      )}

      {/* 添加动画样式 */}
      <style jsx>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  )
}
