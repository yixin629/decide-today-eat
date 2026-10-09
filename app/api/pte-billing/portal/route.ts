import { NextResponse } from 'next/server'
import { commercialAdmin } from '@/lib/pte-commercial/server/admin'
import { authenticatedUser } from '@/lib/pte-commercial/server/auth'
import { commercialConfig } from '@/lib/pte-commercial/server/config'
import { stripePost, stringField } from '@/lib/pte-commercial/server/stripe'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const config = commercialConfig()
  if (!config.enabled) return NextResponse.json({ error: 'disabled' }, { status: 404 })
  const user = await authenticatedUser(request)
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const admin = commercialAdmin()
  if (!admin || !config.siteUrl) return NextResponse.json({ error: 'not_configured' }, { status: 501 })
  const { data, error } = await admin.from('pte_memberships').select('stripe_customer_id').eq('user_id', user.id).maybeSingle()
  if (error || !data?.stripe_customer_id) return NextResponse.json({ error: 'no_customer', message: '当前账号还没有可管理的付费订阅。' }, { status: 409 })
  try {
    const session = await stripePost('/billing_portal/sessions', { customer: data.stripe_customer_id, return_url: `${config.siteUrl}/pte-account` })
    const url = stringField(session.url)
    return url ? NextResponse.json({ url }) : NextResponse.json({ error: 'invalid_response' }, { status: 502 })
  } catch {
    return NextResponse.json({ error: 'portal_unavailable', message: '暂时无法打开订阅管理。' }, { status: 502 })
  }
}
