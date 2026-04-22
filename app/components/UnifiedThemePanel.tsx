'use client'

import { useState, useEffect } from 'react'

// ── Color themes (primary palette) ──
export const colorThemes = {
  default:  { name: '经典粉',    primary: '#ec4899', secondary: '#f472b6', accent: '#db2777', emoji: '💕', swatch: 'from-pink-400 to-rose-400' },
  lavender: { name: '薰衣草紫',  primary: '#a78bfa', secondary: '#c4b5fd', accent: '#8b5cf6', emoji: '💜', swatch: 'from-violet-400 to-purple-400' },
  sakura:   { name: '樱花粉',    primary: '#fb7185', secondary: '#fda4af', accent: '#f43f5e', emoji: '🌸', swatch: 'from-rose-400 to-pink-500' },
  ocean:    { name: '海洋蓝',    primary: '#3b82f6', secondary: '#60a5fa', accent: '#2563eb', emoji: '🌊', swatch: 'from-sky-400 to-blue-500' },
  sunset:   { name: '日落橙',    primary: '#f97316', secondary: '#fb923c', accent: '#ea580c', emoji: '🌅', swatch: 'from-orange-400 to-amber-500' },
  forest:   { name: '森林绿',    primary: '#10b981', secondary: '#34d399', accent: '#059669', emoji: '🌲', swatch: 'from-emerald-400 to-green-600' },
  midnight: { name: '午夜蓝',    primary: '#6366f1', secondary: '#818cf8', accent: '#4f46e5', emoji: '🌙', swatch: 'from-indigo-500 to-blue-700' },
  cherry:   { name: '樱桃红',    primary: '#ef4444', secondary: '#f87171', accent: '#dc2626', emoji: '🍒', swatch: 'from-red-400 to-red-600' },
}

// ── Display mode (light/dark/eye-care) ──
type DisplayMode = 'light' | 'dark' | 'eye-care'
type FontSize = 'small' | 'medium' | 'large'
export type ColorThemeName = keyof typeof colorThemes

const BG_GRADIENTS: Record<ColorThemeName, string> = {
  default:  'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)',
  lavender: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
  sakura:   'linear-gradient(135deg, #ffe4e6 0%, #fecdd3 100%)',
  ocean:    'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
  sunset:   'linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%)',
  forest:   'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
  midnight: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
  cherry:   'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
}

export default function UnifiedThemePanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [colorTheme, setColorTheme] = useState<ColorThemeName>('default')
  const [mode, setMode] = useState<DisplayMode>('light')
  const [fontSize, setFontSize] = useState<FontSize>('medium')

  useEffect(() => {
    // Load saved settings
    const savedTheme = localStorage.getItem('colorTheme') as ColorThemeName
    const savedMode = localStorage.getItem('themeMode') as DisplayMode
    const savedFontSize = localStorage.getItem('fontSize') as FontSize

    if (savedTheme && colorThemes[savedTheme]) {
      setColorTheme(savedTheme)
      applyColorTheme(savedTheme, savedMode || 'light')
    }
    if (savedMode) {
      setMode(savedMode)
      applyMode(savedMode, savedTheme || 'default')
    }
    if (savedFontSize) {
      setFontSize(savedFontSize)
      applyFontSize(savedFontSize)
    }
  }, [])

  const applyColorTheme = (name: ColorThemeName, currentMode: DisplayMode) => {
    const theme = colorThemes[name]
    const root = document.documentElement
    root.style.setProperty('--color-primary', theme.primary)
    root.style.setProperty('--color-secondary', theme.secondary)
    root.style.setProperty('--color-accent', theme.accent)
    // Only update bg gradient if not in dark mode
    if (currentMode !== 'dark') {
      root.style.setProperty('--bg-gradient', BG_GRADIENTS[name])
    }
    // Also update --primary so bg-primary class picks it up
    root.style.setProperty('--primary', theme.primary)
    root.style.setProperty('--secondary', theme.secondary)
  }

  const applyMode = (m: DisplayMode, currentTheme: ColorThemeName) => {
    const root = document.documentElement
    root.classList.remove('dark-mode', 'eye-care-mode')
    if (m === 'dark') root.classList.add('dark-mode')
    else if (m === 'eye-care') root.classList.add('eye-care-mode')
    else {
      // Restore theme bg gradient when switching back to light
      root.style.setProperty('--bg-gradient', BG_GRADIENTS[currentTheme])
    }
  }

  const applyFontSize = (size: FontSize) => {
    const root = document.documentElement
    root.style.fontSize = size === 'small' ? '14px' : size === 'large' ? '18px' : '16px'
  }

  const selectTheme = (name: ColorThemeName) => {
    setColorTheme(name)
    applyColorTheme(name, mode)
    localStorage.setItem('colorTheme', name)
    if (navigator.vibrate) navigator.vibrate(20)
  }

  const selectMode = (m: DisplayMode) => {
    setMode(m)
    applyMode(m, colorTheme)
    localStorage.setItem('themeMode', m)
    if (navigator.vibrate) navigator.vibrate(20)
  }

  const selectFontSize = (s: FontSize) => {
    setFontSize(s)
    applyFontSize(s)
    localStorage.setItem('fontSize', s)
    if (navigator.vibrate) navigator.vibrate(20)
  }

  const current = colorThemes[colorTheme]

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-24 w-14 h-14 rounded-full shadow-lg hover:shadow-2xl transition-all hover:scale-110 flex items-center justify-center text-2xl z-50"
        style={{
          background: `linear-gradient(135deg, ${current.primary}, ${current.secondary})`,
          color: 'white',
        }}
        aria-label="主题设置"
        title="主题设置"
      >
        🎨
      </button>

      {/* Panel */}
      {isOpen && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setIsOpen(false)} />
          <div className="fixed bottom-24 right-6 bg-white rounded-2xl shadow-2xl z-50 w-[340px] max-w-[calc(100vw-3rem)] overflow-hidden animate-fade-in dark:bg-gray-800">
            {/* Header */}
            <div
              className="p-4 text-white"
              style={{ background: `linear-gradient(135deg, ${current.primary}, ${current.accent})` }}
            >
              <h3 className="text-lg font-bold flex items-center gap-2">
                <span>🎨</span>
                <span>主题与显示</span>
              </h3>
              <p className="text-xs text-white/80 mt-0.5">个性化你的专属空间</p>
            </div>

            <div className="p-4 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* Color theme */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-700 dark-mode-text-gray-200">配色方案</label>
                  <span className="text-xs text-gray-500">{current.name}</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {(Object.entries(colorThemes) as [ColorThemeName, typeof current][]).map(([key, t]) => (
                    <button
                      key={key}
                      onClick={() => selectTheme(key)}
                      className={`relative aspect-square rounded-xl flex flex-col items-center justify-center transition-all ${
                        colorTheme === key ? 'ring-2 ring-offset-2 scale-105' : 'hover:scale-105'
                      }`}
                      style={{
                        background: `linear-gradient(135deg, ${t.primary}, ${t.secondary})`,
                        ['--tw-ring-color' as string]: t.primary,
                      }}
                      title={t.name}
                    >
                      <span className="text-2xl drop-shadow">{t.emoji}</span>
                      {colorTheme === key && (
                        <span className="absolute top-1 right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center text-xs">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Display mode */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">显示模式</label>
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => selectMode('light')}
                    className={`p-3 rounded-xl transition-all ${mode === 'light' ? 'bg-gradient-to-br from-yellow-300 to-orange-400 text-white shadow-md' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                  >
                    <div className="text-2xl mb-1">☀️</div>
                    <div className="text-xs font-medium">日间</div>
                  </button>
                  <button onClick={() => selectMode('dark')}
                    className={`p-3 rounded-xl transition-all ${mode === 'dark' ? 'bg-gradient-to-br from-indigo-600 to-purple-700 text-white shadow-md' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                  >
                    <div className="text-2xl mb-1">🌙</div>
                    <div className="text-xs font-medium">夜间</div>
                  </button>
                  <button onClick={() => selectMode('eye-care')}
                    className={`p-3 rounded-xl transition-all ${mode === 'eye-care' ? 'bg-gradient-to-br from-amber-200 to-yellow-400 text-amber-900 shadow-md' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                  >
                    <div className="text-2xl mb-1">👁️</div>
                    <div className="text-xs font-medium">护眼</div>
                  </button>
                </div>
              </div>

              {/* Font size */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">字体大小</label>
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => selectFontSize('small')}
                    className={`p-3 rounded-xl transition-all ${fontSize === 'small' ? 'text-white shadow-md' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                    style={fontSize === 'small' ? { background: `linear-gradient(135deg, ${current.primary}, ${current.secondary})` } : {}}
                  >
                    <div className="text-sm font-bold mb-1">A</div>
                    <div className="text-xs">小</div>
                  </button>
                  <button onClick={() => selectFontSize('medium')}
                    className={`p-3 rounded-xl transition-all ${fontSize === 'medium' ? 'text-white shadow-md' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                    style={fontSize === 'medium' ? { background: `linear-gradient(135deg, ${current.primary}, ${current.secondary})` } : {}}
                  >
                    <div className="text-base font-bold mb-1">A</div>
                    <div className="text-xs">中</div>
                  </button>
                  <button onClick={() => selectFontSize('large')}
                    className={`p-3 rounded-xl transition-all ${fontSize === 'large' ? 'text-white shadow-md' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                    style={fontSize === 'large' ? { background: `linear-gradient(135deg, ${current.primary}, ${current.secondary})` } : {}}
                  >
                    <div className="text-lg font-bold mb-1">A</div>
                    <div className="text-xs">大</div>
                  </button>
                </div>
              </div>

              {/* Preview */}
              <div className="rounded-xl p-3 border-2" style={{ borderColor: current.primary, background: BG_GRADIENTS[colorTheme] }}>
                <div className="text-xs text-gray-500 mb-1">实时预览</div>
                <div className="flex items-center gap-2">
                  <span
                    className="text-white text-xs px-2 py-1 rounded-full font-medium"
                    style={{ background: current.primary }}
                  >
                    主要按钮
                  </span>
                  <span
                    className="text-xs px-2 py-1 rounded-full font-medium bg-white border"
                    style={{ color: current.primary, borderColor: current.primary }}
                  >
                    次要按钮
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
