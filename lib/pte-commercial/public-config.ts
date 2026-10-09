export const pteCommercialEnabled = process.env.NEXT_PUBLIC_PTE_COMMERCIAL_MODE === 'true'
export const pteSupportAiEnabled = process.env.NEXT_PUBLIC_PTE_SUPPORT_AI_ENABLED === 'true'

export type PtePlanCode = 'free' | 'monthly' | 'yearly'

export const PTE_PLAN_LABELS: Record<PtePlanCode, string> = {
  free: '免费版',
  monthly: '月度会员',
  yearly: '年度会员',
}
