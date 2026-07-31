import type { Metadata, Viewport } from 'next'
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
import { Analytics } from '@vercel/analytics/next'

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
    <html lang="zh-CN">
      <body className={`${inter.className} min-h-dvh`}>
        <ToastProvider>
          <AuthProvider>
            <a href="#main-content" className="skip-link">
              跳到主要内容
            </a>
            <PageLoadingEffect />
            <RandomSurprise />
            <Navigation />
            <UserAvatar />
            <div id="main-content" tabIndex={-1}>
              {children}
            </div>
            <AIChatbot />
            <UnifiedThemePanel />
            <HeartParticles />
          </AuthProvider>
        </ToastProvider>
        <Analytics />
      </body>
    </html>
  )
}
