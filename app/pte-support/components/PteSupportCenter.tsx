'use client'

import { ArrowLeft, Bot, Bug, CheckCircle2, Headset, LoaderCircle, Send, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { FormEvent, useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { pteCommercialEnabled, pteSupportAiEnabled } from '@/lib/pte-commercial/public-config'

type Message = { role: 'user' | 'assistant'; content: string }
type Ticket = { id: string; category: string; priority: string; title: string; description: string; page_url: string | null; status: string; staff_reply: string | null; created_at: string }

const CATEGORY_LABELS: Record<string, string> = { bug: '平台故障', content: '题目纠错', account: '账号问题', billing: '会员与支付', feature: '功能建议', other: '其他' }
const STATUS_LABELS: Record<string, string> = { open: '待受理', in_progress: '处理中', waiting_for_user: '等待补充', resolved: '已解决', closed: '已关闭' }

export default function PteSupportCenter() {
  const [token, setToken] = useState('')
  const [messages, setMessages] = useState<Message[]>([{ role: 'assistant', content: '你好，我是 PTE AI 助教。可以问我题型练习、备考方法、英文表达或平台使用问题。账号、退款和隐私问题请提交人工工单。' }])
  const [question, setQuestion] = useState('')
  const [chatBusy, setChatBusy] = useState(false)
  const [chatError, setChatError] = useState('')
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [ticketBusy, setTicketBusy] = useState(false)
  const [ticketMessage, setTicketMessage] = useState('')
  const [form, setForm] = useState({ category: 'bug', priority: 'normal', title: '', description: '', pageUrl: '' })

  const loadTickets = useCallback(async (accessToken: string) => {
    if (!pteCommercialEnabled || !accessToken) { setTickets([]); return }
    const response = await fetch('/api/pte-support/tickets', { headers: { Authorization: `Bearer ${accessToken}` }, cache: 'no-store' })
    if (response.ok) setTickets(((await response.json()) as { tickets: Ticket[] }).tickets)
  }, [])

  useEffect(() => {
    if (!pteCommercialEnabled) return
    let mounted = true
    void supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      const accessToken = data.session?.access_token ?? ''
      setToken(accessToken)
      void loadTickets(accessToken)
    })
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      const accessToken = session?.access_token ?? ''
      setToken(accessToken)
      void loadTickets(accessToken)
    })
    return () => { mounted = false; data.subscription.unsubscribe() }
  }, [loadTickets])

  async function ask(event: FormEvent) {
    event.preventDefault()
    const content = question.trim()
    if (!content || chatBusy) return
    const next = [...messages, { role: 'user' as const, content }]
    setMessages(next)
    setQuestion('')
    setChatError('')
    setChatBusy(true)
    const response = await fetch('/api/pte-support/chat', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ messages: next.slice(-16) }) })
    const result = await response.json() as { content?: string; error?: string }
    if (response.ok && result.content) setMessages((current) => [...current, { role: 'assistant', content: result.content! }])
    else setChatError(result.error ?? 'AI 助教暂时无法回答。')
    setChatBusy(false)
  }

  async function submitTicket(event: FormEvent) {
    event.preventDefault()
    if (!token || ticketBusy) return
    setTicketBusy(true)
    setTicketMessage('')
    const response = await fetch('/api/pte-support/tickets', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const result = await response.json() as { error?: string }
    if (response.ok) {
      setForm({ category: 'bug', priority: 'normal', title: '', description: '', pageUrl: '' })
      setTicketMessage('工单已提交，可以在下方查看处理进度。')
      await loadTickets(token)
    } else setTicketMessage(result.error ?? '提交失败，请稍后重试。')
    setTicketBusy(false)
  }

  return <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:py-10">
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div><p className="text-xs font-bold text-teal-700">PTE SUPPORT</p><h1 className="mt-1 text-2xl font-black sm:text-3xl">AI 助教与客服中心</h1><p className="mt-2 text-sm text-slate-600">学习问题即时问 AI，账号与平台问题提交人工工单。</p></div>
        <Link href="/pte-practice" className="inline-flex min-h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-bold"><ArrowLeft size={17} />返回练习平台</Link>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white" aria-labelledby="ai-title">
          <div className="border-b border-slate-200 px-5 py-4"><h2 id="ai-title" className="flex items-center gap-2 text-lg font-black"><Bot size={20} className="text-teal-700" />PTE AI 助教</h2><p className="mt-1 text-xs text-slate-500">AI 生成内容可能有误，练习估分不是 Pearson 官方成绩。</p></div>
          <div className="h-[430px] space-y-4 overflow-y-auto bg-slate-50 p-4" aria-live="polite">
            {messages.map((message, index) => <div key={`${message.role}-${index}`} className={`max-w-[88%] whitespace-pre-wrap rounded-lg px-4 py-3 text-sm leading-6 ${message.role === 'user' ? 'ml-auto bg-teal-700 text-white' : 'border border-slate-200 bg-white text-slate-700'}`}>{message.content}</div>)}
            {chatBusy && <div className="flex items-center gap-2 text-sm text-slate-500"><LoaderCircle className="animate-spin" size={16} />正在整理回答...</div>}
          </div>
          <form onSubmit={ask} className="border-t border-slate-200 p-4">
            {!pteSupportAiEnabled && <p className="mb-3 border-l-4 border-amber-400 bg-amber-50 px-3 py-2 text-xs text-amber-900">AI 助教当前未开启，请先配置环境变量和模型密钥。</p>}
            {pteCommercialEnabled && !token && <p className="mb-3 text-xs text-rose-700">商业模式下请先在 <Link className="font-bold underline" href="/pte-account">账号中心</Link> 登录。</p>}
            {chatError && <p role="alert" className="mb-3 text-xs text-rose-700">{chatError}</p>}
            <div className="flex gap-2"><textarea aria-label="向 PTE AI 助教提问" rows={2} maxLength={1800} value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="例如：RA 怎样改善流利度？" className="min-w-0 flex-1 resize-none rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none" /><button type="submit" title="发送问题" aria-label="发送问题" disabled={!pteSupportAiEnabled || (pteCommercialEnabled && !token) || chatBusy || !question.trim()} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-teal-700 text-white disabled:opacity-40"><Send size={18} /></button></div>
          </form>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5" aria-labelledby="ticket-title">
          <h2 id="ticket-title" className="flex items-center gap-2 text-lg font-black"><Headset size={20} className="text-teal-700" />提交人工工单</h2>
          {!pteCommercialEnabled || !token ? <div className="mt-5 rounded-lg bg-slate-100 p-5 text-sm leading-6 text-slate-600"><Bug size={22} className="mb-3 text-slate-700" /><p>{pteCommercialEnabled ? '请先登录正式 PTE 账号，登录后即可提交并追踪自己的工单。' : '正式工单系统随商业账号模式开放。当前私人模式仍可使用站内功能申请箱。'}</p><Link href={pteCommercialEnabled ? '/pte-account' : '/feature-requests'} className="mt-4 inline-flex font-bold text-teal-700 underline">{pteCommercialEnabled ? '前往账号中心' : '打开功能申请箱'}</Link></div> : <form onSubmit={submitTicket} className="mt-5 grid gap-4">
            <div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1 text-xs font-bold">问题类型<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className="min-h-10 rounded-md border border-slate-300 px-3 text-sm font-normal">{Object.entries(CATEGORY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="grid gap-1 text-xs font-bold">紧急程度<select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })} className="min-h-10 rounded-md border border-slate-300 px-3 text-sm font-normal"><option value="normal">一般</option><option value="high">影响使用</option><option value="urgent">无法继续练习/支付异常</option></select></label></div>
            <label className="grid gap-1 text-xs font-bold">标题<input required minLength={4} maxLength={120} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="min-h-10 rounded-md border border-slate-300 px-3 text-sm font-normal" placeholder="简要说明发生了什么" /></label>
            <label className="grid gap-1 text-xs font-bold">详细描述<textarea required minLength={10} maxLength={5000} rows={5} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="resize-y rounded-md border border-slate-300 px-3 py-2 text-sm font-normal" placeholder="操作步骤、预期结果、实际结果；请勿填写密码或银行卡信息。" /></label>
            <label className="grid gap-1 text-xs font-bold">相关页面（可选）<input maxLength={500} value={form.pageUrl} onChange={(event) => setForm({ ...form, pageUrl: event.target.value })} className="min-h-10 rounded-md border border-slate-300 px-3 text-sm font-normal" placeholder="/pte-practice 或完整网址" /></label>
            {ticketMessage && <p role="status" className="text-xs text-teal-800">{ticketMessage}</p>}
            <button disabled={ticketBusy} className="inline-flex min-h-11 w-fit items-center gap-2 rounded-md bg-slate-900 px-5 text-sm font-bold text-white disabled:opacity-50"><Send size={16} />{ticketBusy ? '提交中...' : '提交工单'}</button>
          </form>}
        </section>
      </div>

      {pteCommercialEnabled && token && <section className="border-t border-slate-200 pt-6"><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-black">我的工单</h2><span className="text-xs text-slate-500">仅你本人可见</span></div>{tickets.length === 0 ? <p className="rounded-lg border border-dashed border-slate-300 bg-white p-7 text-center text-sm text-slate-500">还没有提交过工单。</p> : <div className="grid gap-3 sm:grid-cols-2">{tickets.map((ticket) => <article key={ticket.id} className="rounded-lg border border-slate-200 bg-white p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold text-teal-700">#{ticket.id.slice(0, 8)} · {CATEGORY_LABELS[ticket.category] ?? ticket.category}</p><h3 className="mt-1 font-black">{ticket.title}</h3></div><span className="shrink-0 rounded bg-slate-100 px-2 py-1 text-xs font-bold">{STATUS_LABELS[ticket.status] ?? ticket.status}</span></div><p className="mt-3 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{ticket.description}</p>{ticket.staff_reply && <div className="mt-4 border-l-4 border-teal-500 bg-teal-50 px-3 py-2 text-sm text-teal-950"><p className="mb-1 flex items-center gap-1 font-bold"><CheckCircle2 size={15} />客服回复</p>{ticket.staff_reply}</div>}<p className="mt-4 text-xs text-slate-400">{new Date(ticket.created_at).toLocaleString('zh-CN')}</p></article>)}</div>}</section>}

      <footer className="flex items-center gap-2 text-xs text-slate-500"><Sparkles size={14} />AI 用于学习辅助；涉及账号、付款、隐私和投诉时由人工工单处理。</footer>
    </div>
  </main>
}
