import type { Metadata } from 'next'
import StarredReviewPage from './components/StarredReviewPage'

export const metadata: Metadata = {
  title: 'PTE 重点复习本｜我们的小世界',
  description: '集中管理 PTE 备考计划中标星的题目，并按题号返回题库复习。',
}

export default function PteStarredReviewPage() {
  return <StarredReviewPage />
}
