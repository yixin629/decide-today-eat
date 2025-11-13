'use client'

import { useState, useEffect } from 'react'

export const themes = {
  default: {
    name: '经典粉',
    primary: '#ec4899',
    secondary: '#f472b6',
    accent: '#db2777',
    background: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)',
    card: 'rgba(255, 255, 255, 0.9)',
    emoji: '💕',
  },
  lavender: {
    name: '薰衣草',
    primary: '#a78bfa',
    secondary: '#c4b5fd',
    accent: '#8b5cf6',
    background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
    card: 'rgba(255, 255, 255, 0.9)',
    emoji: '💜',
  },
  sakura: {
    name: '樱花粉',
    primary: '#fb7185',
    secondary: '#fda4af',
    accent: '#f43f5e',
    background: 'linear-gradient(135deg, #ffe4e6 0%, #fecdd3 100%)',
    card: 'rgba(255, 255, 255, 0.95)',
    emoji: '🌸',
  },
  ocean: {
    name: '海洋蓝',
    primary: '#3b82f6',
    secondary: '#60a5fa',
    accent: '#2563eb',
    background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
    card: 'rgba(255, 255, 255, 0.9)',
    emoji: '🌊',
  },
  sunset: {
    name: '日落橙',
    primary: '#f97316',
    secondary: '#fb923c',
    accent: '#ea580c',
    background: 'linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%)',
    card: 'rgba(255, 255, 255, 0.9)',
    emoji: '🌅',
  },
}

export type ThemeName = keyof typeof themes

export default function ThemeSwitcher() {
  const [currentTheme, setCurrentTheme] = useState<ThemeName>('default')
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // 从 localStorage 读取保存的主题
    const savedTheme = localStorage.getItem('theme') as ThemeName
    if (savedTheme && themes[savedTheme]) {
      setCurrentTheme(savedTheme)
      applyTheme(savedTheme)
    }
  }, [])

  const applyTheme = (themeName: ThemeName) => {
    const theme = themes[themeName]
    document.documentElement.style.setProperty('--color-primary', theme.primary)
    document.documentElement.style.setProperty('--color-secondary', theme.secondary)
    document.documentElement.style.setProperty('--color-accent', theme.accent)
    document.documentElement.style.setProperty('--bg-gradient', theme.background)
    document.documentElement.style.setProperty('--card-bg', theme.card)
  }

  const handleThemeChange = (themeName: ThemeName) => {
    setCurrentTheme(themeName)
    applyTheme(themeName)
    localStorage.setItem('theme', themeName)
    setIsOpen(false)
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* 主题面板 */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 bg-white rounded-2xl shadow-2xl p-4 w-64 animate-fade-in">
          <h3 className="text-lg font-bold text-gray-800 mb-3 text-center">选择主题 🎨</h3>
          <div className="space-y-2">
            {Object.entries(themes).map(([key, theme]) => (
              <button
                key={key}
                onClick={() => handleThemeChange(key as ThemeName)}
                className={`w-full p-3 rounded-xl flex items-center justify-between transition-all ${
                  currentTheme === key
                    ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white scale-105'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="text-2xl">{theme.emoji}</span>
                  <span className="font-semibold">{theme.name}</span>
                </span>
                {currentTheme === key && <span className="text-xl">✓</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 切换按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg hover:shadow-2xl transition-all hover:scale-110 flex items-center justify-center text-2xl"
        title="切换主题"
      >
        {themes[currentTheme].emoji}
      </button>
    </div>
  )
}
