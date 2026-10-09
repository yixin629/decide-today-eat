import type { Metadata } from 'next'
import SupportAdmin from './components/SupportAdmin'

export const metadata: Metadata = { title: 'PTE 客服工作台', description: '处理 PTE 用户工单。' }

export default function Page() { return <SupportAdmin /> }
