import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navigation from './components/Navigation'
import UserAvatar from './components/UserAvatar'
import AuthProvider from './components/AuthProvider'
import { ToastProvider } from './components/ToastProvider'
import AIChatbot from './components/AIChatbot'
import UnifiedThemePanel from './components/UnifiedThemePanel'
import HeartParticles from './components/HeartParticles'
import PageLoadingEffect from './components/PageLoadingEffect'
import RandomSurprise from './components/RandomSurprise'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'zyx和zly的小世界 💕',
  description: '属于我们两个人的专属空间',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <ToastProvider>
          <AuthProvider>
            <PageLoadingEffect />
            <RandomSurprise />
            <Navigation />
            <UserAvatar />
            {children}
            <AIChatbot />
            <UnifiedThemePanel />
            <HeartParticles />
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  )
}
