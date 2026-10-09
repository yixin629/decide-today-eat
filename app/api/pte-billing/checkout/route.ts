import { NextResponse } from 'next/server'
import { authenticatedUser } from '@/lib/pte-commercial/server/auth'
import { commercialConfig } from '@/lib/pte-commercial/server/config'
import { stripePost, stringField } from '@/lib/pte-commercial/server/stripe'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const config = commercialConfig()
  if (!config.enabled) return NextResponse.json({ error: 'disabled' }, { status: 404 })
  const user = await authenticatedUser(request)
  if (!user?.email) return NextResponse.json({ error: 'unauthorized', message: '请先登录正式 PTE 账号。' }, { status: 401 })

  let plan: 'monthly' | 'yearly' | null = null
  try {
    const body: unknown = await request.json()
    if (body && typeof body === 'object') {
      const value = stringField((body as Record<string, unknown>).plan)
      if (value === 'monthly' || value === 'yearly') plan = value
    }
  } catch {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 })
  }
  if (!plan) return NextResponse.json({ error: 'invalid_plan' }, { status: 400 })
  const priceId = plan === 'monthly' ? config.monthlyPriceId : config.yearlyPriceId
  if (!priceId || !config.siteUrl) return NextResponse.json({ error: 'not_configured', message: '支付沙箱尚未配置完成。' }, { status: 501 })

  try {
    const session = await stripePost('/checkout/sessions', {
      mode: 'subscription',
      customer_email: user.email,
      client_reference_id: user.id,
      'line_items[0][price]': priceId,
      'line_items[0][quantity]': '1',
      'metadata[user_id]': user.id,
      'metadata[plan]': plan,
      'subscription_data[metadata][user_id]': user.id,
      'subscription_data[metadata][plan]': plan,
      success_url: `${config.siteUrl}/pte-account?checkout=success`,
      cancel_url: `${config.siteUrl}/pte-account?checkout=cancelled`,
      allow_promotion_codes: 'true',
    })
    const url = stringField(session.url)
    return url ? NextResponse.json({ url }) : NextResponse.json({ error: 'invalid_response' }, { status: 502 })
  } catch {
    return NextResponse.json({ error: 'payment_unavailable', message: '暂时无法创建支付页面。' }, { status: 502 })
  }
}
