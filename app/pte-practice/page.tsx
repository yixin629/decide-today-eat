import type { Metadata } from 'next'
import BackButton from '@/app/components/ui/BackButton'
import PtePractice from './components/PtePractice'

export const metadata: Metadata = {
  title: 'PTE 练习平台｜我们的小世界',
  description: '按 PTE 题型练习读写听说，查看练习估分反馈，非官方评分。',
}

export default function PtePracticePage() {
  return (
    <main className="min-h-screen px-3 pb-24 pt-5 sm:px-6 md:pb-12 md:pt-8">
      <div className="mx-auto max-w-5xl">
        <BackButton />
        <div className="mt-4">
          <h1 className="mb-1 text-2xl font-bold text-gray-900">PTE 练习平台</h1>
          <p className="mb-6 text-sm text-gray-500">选择题型开始练习，完成后查看练习估分反馈（参考分，非官方评分）。</p>
          <PtePractice />
        </div>
      </div>
    </main>
  )
}
