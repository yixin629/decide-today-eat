import type { Metadata } from 'next'
import BackButton from '@/app/components/ui/BackButton'
import PtePlanner from './components/PtePlanner'

export const metadata: Metadata = {
  title: 'PTE 智能备考计划｜我们的小世界',
  description: '按移民或大学申请标准、目标分数和备考时间生成可编辑的 PTE 逐日计划。',
}

export default function PtePlanPage() {
  return (
    <main className="min-h-screen px-3 pb-24 pt-5 sm:px-6 md:pb-12 md:pt-8">
      <div className="mx-auto max-w-[96rem]">
        <BackButton />
        <div className="mt-4">
          <PtePlanner />
        </div>
      </div>
    </main>
  )
}
