import type { Metadata } from 'next'
import PteSupportCenter from './components/PteSupportCenter'

export const metadata: Metadata = {
  title: 'PTE AI 助教与客服',
  description: 'PTE 学习问答、平台故障反馈与客服工单。',
}

export default function Page() {
  return <PteSupportCenter />
}
