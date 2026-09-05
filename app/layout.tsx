import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navigation from '@/app/components/layout/Navigation'
import UserAvatar from '@/app/components/layout/UserAvatar'
import AuthGuard from '@/app/components/providers/AuthGuard'
import { ToastProvider } from '@/app/components/feedback/ToastProvider'
import AIChatbot from '@/app/components/ai-chat/AIChatbot'
import UnifiedThemePanel from '@/app/components/layout/UnifiedThemePanel'
import HeartParticles from '@/app/components/layout/HeartParticles'
import RandomSurprise from '@/app/components/layout/RandomSurprise'
import NotificationCenter from '@/app/components/layout/NotificationCenter'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'zyx和zly的小世界 💕',
  description: '属于我们两个人的专属空间',
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: '#e85d88',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" data-scroll-behavior="smooth">
      <body className={`${inter.className} min-h-dvh`}>
        <ToastProvider>
          <AuthGuard>
            <a href="#main-content" className="skip-link">
              跳到主要内容
            </a>
            <RandomSurprise />
            <Navigation />
            <NotificationCenter />
            <UserAvatar />
            <div id="main-content" tabIndex={-1}>
              {children}
            </div>
            <AIChatbot />
            <UnifiedThemePanel />
            <HeartParticles />
          </AuthGuard>
        </ToastProvider>
      </body>
    </html>
  )
}
