import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navigation from './components/Navigation'
import UserAvatar from './components/UserAvatar'
import AuthProvider from './components/AuthProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'zyx和zly的小世界 💕',
  description: '属于我们两个人的专属空间',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <AuthProvider>
          <Navigation />
          <UserAvatar />
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
