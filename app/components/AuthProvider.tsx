'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const loggedInUser = localStorage.getItem('loggedInUser')

    // 如果在登录页面，不需要检查
    if (pathname === '/login') {
      setIsChecking(false)
      return
    }

    // 如果未登录，跳转到登录页
    if (!loggedInUser) {
      router.push('/login')
    } else {
      setIsChecking(false)
    }
  }, [pathname, router])

  // 显示加载中
  if (isChecking && pathname !== '/login') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">💕</div>
          <p className="text-xl text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
