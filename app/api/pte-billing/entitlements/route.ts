import { NextResponse } from 'next/server'
import { commercialAdmin } from '@/lib/pte-commercial/server/admin'
import { authenticatedUser } from '@/lib/pte-commercial/server/auth'
import { commercialConfig } from '@/lib/pte-commercial/server/config'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  if (!commercialConfig().enabled) return NextResponse.json({ error: 'disabled' }, { status: 404 })
  const user = await authenticatedUser(request)
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const admin = commercialAdmin()
  if (!admin) return NextResponse.json({ error: 'not_configured' }, { status: 501 })
  const [{ data: membership }, { data: entitlements }] = await Promise.all([
    admin.from('pte_memberships').select('plan,status,current_period_end,cancel_at_period_end').eq('user_id', user.id).maybeSingle(),
    admin.from('pte_entitlements').select('question_bank,mock_exams_per_month,ai_scores_per_month,teacher_feedback').eq('user_id', user.id).maybeSingle(),
  ])
  return NextResponse.json({ membership, entitlements }, { headers: { 'Cache-Control': 'no-store' } })
}
