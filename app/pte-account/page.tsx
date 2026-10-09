import type { Metadata } from 'next'
import PteAccount from './components/PteAccount'

export const metadata: Metadata = {
  title: 'PTE 账号与会员',
  description: 'PTE 商业平台的正式账号、权益与订阅管理入口。',
}

export default function Page() {
  return <PteAccount />
}
