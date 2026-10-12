import type { Metadata } from 'next'
import PrivateQuestionBank from './components/PrivateQuestionBank'

export const metadata: Metadata = { title: 'PTE 私人资料题库' }

export default function Page() {
  return <PrivateQuestionBank />
}
