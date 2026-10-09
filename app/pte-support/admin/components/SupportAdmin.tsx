'use client'

import { ArrowLeft, LoaderCircle, Save } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Ticket = { id: string; user_id: string; category: string; priority: string; title: string; description: string; page_url: string | null; status: string; staff_reply: string | null; created_at: string }
const statuses = [['open', '待受理'], ['in_progress', '处理中'], ['waiting_for_user', '等待用户补充'], ['resolved', '已解决'], ['closed', '已关闭']]

export default function SupportAdmin() {
  const [token, setToken] = useState('')
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState('')

  const load = useCallback(async (accessToken: string, status = '') => {
    if (!accessToken) { setLoading(false); return }
    setLoading(true)
    const response = await fetch(`/api/pte-support/admin${status ? `?status=${status}` : ''}`, { headers: { Authorization: `Bearer ${accessToken}` }, cache: 'no-store' })
    if (response.ok) { setTickets(((await response.json()) as { tickets: Ticket[] }).tickets); setError('') }
    else setError(response.status === 403 ? '当前账号没有客服权限。' : '无法读取客服工单。')
    setLoading(false)
  }, [])

  useEffect(() => { void supabase.auth.getSession().then(({ data }) => { const accessToken = data.session?.access_token ?? ''; setToken(accessToken); void load(accessToken) }) }, [load])

  async function save(ticket: Ticket) {
    setSaving(ticket.id)
    const response = await fetch('/api/pte-support/admin', { method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ id: ticket.id, status: ticket.status, staffReply: ticket.staff_reply ?? '' }) })
    if (!response.ok) setError('保存失败，请重试。')
    else await load(token, filter)
    setSaving('')
  }

  return <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900"><div className="mx-auto max-w-6xl space-y-5"><header className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-bold text-teal-700">SUPPORT DESK</p><h1 className="text-2xl font-black">PTE 客服工作台</h1></div><Link href="/pte-support" className="inline-flex items-center gap-2 text-sm font-bold"><ArrowLeft size={17} />返回支持中心</Link></header><div className="flex flex-wrap gap-2"><button onClick={() => { setFilter(''); void load(token) }} className={`rounded-md px-3 py-2 text-xs font-bold ${!filter ? 'bg-slate-900 text-white' : 'bg-white'}`}>全部</button>{statuses.map(([value, label]) => <button key={value} onClick={() => { setFilter(value); void load(token, value) }} className={`rounded-md px-3 py-2 text-xs font-bold ${filter === value ? 'bg-slate-900 text-white' : 'bg-white'}`}>{label}</button>)}</div>{loading && <p className="flex items-center gap-2 text-sm"><LoaderCircle className="animate-spin" size={17} />正在读取工单...</p>}{error && <p role="alert" className="border-l-4 border-rose-500 bg-white p-4 text-sm text-rose-800">{error}</p>}<div className="grid gap-4">{tickets.map((ticket, index) => <article key={ticket.id} className="rounded-lg border border-slate-200 bg-white p-5"><div className="flex flex-wrap justify-between gap-3"><div><p className="text-xs font-bold text-teal-700">#{ticket.id.slice(0, 8)} · {ticket.category} · {ticket.priority}</p><h2 className="mt-1 font-black">{ticket.title}</h2><p className="mt-1 text-xs text-slate-400">用户 {ticket.user_id.slice(0, 8)} · {new Date(ticket.created_at).toLocaleString('zh-CN')}</p></div><select aria-label="工单状态" value={ticket.status} onChange={(event) => setTickets((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, status: event.target.value } : item))} className="h-10 rounded-md border border-slate-300 px-3 text-sm">{statuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div><p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-700">{ticket.description}</p>{ticket.page_url && <p className="mt-2 break-all text-xs text-slate-500">页面：{ticket.page_url}</p>}<label className="mt-4 grid gap-1 text-xs font-bold">客服回复<textarea rows={3} maxLength={10000} value={ticket.staff_reply ?? ''} onChange={(event) => setTickets((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, staff_reply: event.target.value } : item))} className="resize-y rounded-md border border-slate-300 p-3 text-sm font-normal" /></label><button disabled={saving === ticket.id} onClick={() => void save(ticket)} className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-md bg-teal-700 px-4 text-sm font-bold text-white disabled:opacity-50"><Save size={16} />{saving === ticket.id ? '保存中...' : '保存处理结果'}</button></article>)}</div></div></main>
}
