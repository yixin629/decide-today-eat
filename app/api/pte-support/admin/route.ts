import { NextResponse } from 'next/server'
import { commercialAdmin } from '@/lib/pte-commercial/server/admin'
import { authenticatedUser } from '@/lib/pte-commercial/server/auth'
import { commercialConfig } from '@/lib/pte-commercial/server/config'

const STATUSES = ['open', 'in_progress', 'waiting_for_user', 'resolved', 'closed'] as const

async function staffContext(request: Request) {
  if (!commercialConfig().enabled) return { error: NextResponse.json({ error: 'disabled' }, { status: 404 }) }
  const user = await authenticatedUser(request)
  if (!user) return { error: NextResponse.json({ error: 'unauthorized' }, { status: 401 }) }
  const admin = commercialAdmin()
  if (!admin) return { error: NextResponse.json({ error: 'not_configured' }, { status: 501 }) }
  const { data: staff } = await admin.from('pte_support_staff').select('role,active').eq('user_id', user.id).maybeSingle()
  if (!staff?.active) return { error: NextResponse.json({ error: 'forbidden' }, { status: 403 }) }
  return { admin, user, staff }
}

export async function GET(request: Request) {
  const value = await staffContext(request)
  if ('error' in value) return value.error
  const url = new URL(request.url)
  const requested = url.searchParams.get('status')
  let query = value.admin.from('pte_support_tickets').select('id,user_id,category,priority,title,description,page_url,status,staff_reply,created_at,updated_at,resolved_at').order('created_at', { ascending: false }).limit(200)
  if (requested && STATUSES.includes(requested as typeof STATUSES[number])) query = query.eq('status', requested)
  const { data, error } = await query
  return error ? NextResponse.json({ error: 'load_failed' }, { status: 500 }) : NextResponse.json({ tickets: data ?? [] }, { headers: { 'Cache-Control': 'no-store' } })
}

export async function PATCH(request: Request) {
  const value = await staffContext(request)
  if ('error' in value) return value.error
  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }) }
  const input = body && typeof body === 'object' ? body as Record<string, unknown> : {}
  const id = typeof input.id === 'string' ? input.id : ''
  const status = typeof input.status === 'string' && STATUSES.includes(input.status as typeof STATUSES[number]) ? input.status : ''
  const staffReply = typeof input.staffReply === 'string' ? input.staffReply.trim() : ''
  if (!/^[0-9a-f-]{36}$/i.test(id) || !status || staffReply.length > 10000) return NextResponse.json({ error: 'invalid_input' }, { status: 400 })
  const now = new Date().toISOString()
  const { data, error } = await value.admin.from('pte_support_tickets').update({ status, staff_reply: staffReply || null, updated_at: now, resolved_at: status === 'resolved' || status === 'closed' ? now : null }).eq('id', id).select('id,status,updated_at').maybeSingle()
  if (error || !data) return NextResponse.json({ error: 'update_failed' }, { status: 500 })
  return NextResponse.json({ ticket: data })
}
