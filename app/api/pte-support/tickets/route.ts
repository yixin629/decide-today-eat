import { NextResponse } from 'next/server'
import { commercialAdmin } from '@/lib/pte-commercial/server/admin'
import { authenticatedUser } from '@/lib/pte-commercial/server/auth'
import { commercialConfig } from '@/lib/pte-commercial/server/config'

const CATEGORIES = ['bug', 'content', 'account', 'billing', 'feature', 'other'] as const
const PRIORITIES = ['normal', 'high', 'urgent'] as const

async function context(request: Request) {
  if (!commercialConfig().enabled) return { error: NextResponse.json({ error: '正式工单仅在 PTE 商业模式开放。' }, { status: 404 }) }
  const user = await authenticatedUser(request)
  if (!user) return { error: NextResponse.json({ error: '请先登录 PTE 正式账号。' }, { status: 401 }) }
  const admin = commercialAdmin()
  if (!admin) return { error: NextResponse.json({ error: '工单服务尚未配置。' }, { status: 501 }) }
  return { user, admin }
}

export async function GET(request: Request) {
  const value = await context(request)
  if ('error' in value) return value.error
  const { data, error } = await value.admin.from('pte_support_tickets').select('id,category,priority,title,description,page_url,status,staff_reply,created_at,updated_at,resolved_at').eq('user_id', value.user.id).order('created_at', { ascending: false }).limit(100)
  if (error) return NextResponse.json({ error: '暂时无法读取工单。' }, { status: 500 })
  return NextResponse.json({ tickets: data ?? [] }, { headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(request: Request) {
  const value = await context(request)
  if ('error' in value) return value.error
  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ error: '请求格式无效。' }, { status: 400 }) }
  if (!body || typeof body !== 'object') return NextResponse.json({ error: '请填写工单内容。' }, { status: 400 })
  const input = body as Record<string, unknown>
  const title = typeof input.title === 'string' ? input.title.trim() : ''
  const description = typeof input.description === 'string' ? input.description.trim() : ''
  const category = typeof input.category === 'string' && CATEGORIES.includes(input.category as typeof CATEGORIES[number]) ? input.category : ''
  const priority = typeof input.priority === 'string' && PRIORITIES.includes(input.priority as typeof PRIORITIES[number]) ? input.priority : ''
  const pageUrl = typeof input.pageUrl === 'string' ? input.pageUrl.trim().slice(0, 500) : ''
  if (!category || !priority || title.length < 4 || title.length > 120 || description.length < 10 || description.length > 5000) return NextResponse.json({ error: '请检查分类、优先级、标题和问题描述。' }, { status: 400 })
  const { data, error } = await value.admin.from('pte_support_tickets').insert({ user_id: value.user.id, category, priority, title, description, page_url: pageUrl || null }).select('id,status,created_at').single()
  if (error) return NextResponse.json({ error: '工单提交失败，请稍后重试。' }, { status: 500 })
  return NextResponse.json({ ticket: data }, { status: 201 })
}
