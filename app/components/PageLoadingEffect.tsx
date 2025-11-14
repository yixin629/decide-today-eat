'use client'

import { useEffect, useState } from 'react'

export default function PageLoadingEffect() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 页面加载完成后隐藏加载动画
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  if (!loading) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-pink-400 via-rose-400 to-red-400">
      <div className="text-center">
        {/* 跳动的爱心 */}
        <div className="flex gap-4 mb-8">
          {['❤️', '💕', '💖', '💗', '💝'].map((heart, i) => (
            <div
              key={i}
              className="text-6xl animate-bounce"
              style={{
                animationDelay: `${i * 0.1}s`,
                animationDuration: '1s',
              }}
            >
              {heart}
            </div>
          ))}
        </div>

        {/* 加载文字 */}
        <div className="text-white text-2xl font-bold mb-4">加载中...</div>

        {/* 加载条 */}
        <div className="w-64 h-2 bg-white/30 rounded-full overflow-hidden">
          <div className="h-full bg-white rounded-full animate-loading-bar"></div>
        </div>
      </div>
    </div>
  )
}
