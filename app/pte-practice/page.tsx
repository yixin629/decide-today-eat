import type { Metadata } from 'next'
import PtePractice from './components/PtePractice'
import './practice.css'

export const metadata: Metadata = {
  title: 'PTE 练习平台｜我们的小世界',
  description: '按 PTE 题型练习读写听说，查看练习估分反馈，非官方评分。',
}

export default function PtePracticePage() {
  return (
    <main className="pte-page">
      <PtePractice />
    </main>
  )
}
