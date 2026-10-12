'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, Check, FileUp, LogIn, LogOut, Pencil, Search, Trash2, X } from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

type Question = {
  id: string
  owner_id: string
  question_code: string
  source_number: number
  title: string
  question_text: string
  answer_text: string
  source_pages: Record<string, number>
  review_status: 'needs-review' | 'reviewed' | 'incomplete'
}

type ImportQuestion = Omit<Question, 'id' | 'owner_id'>
const PAGE_SIZE = 30

function isImportQuestion(value: unknown): value is ImportQuestion {
  if (!value || typeof value !== 'object') return false
  const row = value as Record<string, unknown>
  return typeof row.question_code === 'string' && /^[A-Z&]{2,8}$/.test(row.question_code)
    && Number.isInteger(row.source_number) && Number(row.source_number) > 0
    && typeof row.title === 'string' && row.title.length <= 200
    && typeof row.question_text === 'string' && row.question_text.length <= 15000
    && typeof row.answer_text === 'string' && row.answer_text.length <= 15000 && !!row.source_pages
    && typeof row.source_pages === 'object' && !Array.isArray(row.source_pages)
    && Object.entries(row.source_pages).every(([name, page]) => name.length <= 100 && Number.isInteger(page) && Number(page) > 0)
    && ['needs-review', 'reviewed', 'incomplete'].includes(String(row.review_status))
}

export default function PrivateQuestionBank() {
  const [user, setUser] = useState<User | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'reset'>('login')
  const [recovering, setRecovering] = useState(false)
  const [query, setQuery] = useState('')
  const [rows, setRows] = useState<Question[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState<Question | null>(null)
  const [draft, setDraft] = useState<Question | null>(null)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const searchRequestRef = useRef(0)

  useEffect(() => {
    let active = true
    void supabase.auth.getUser().then(({ data }) => {
      if (active) { setUser(data.user); setAuthReady(true) }
    })
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (active) {
        setUser(session?.user ?? null)
        setAuthReady(true)
        if (event === 'PASSWORD_RECOVERY') setRecovering(true)
      }
    })
    return () => { active = false; data.subscription.unsubscribe() }
  }, [])

  const load = useCallback(async () => {
    if (!user) return
    const requestId = ++searchRequestRef.current
    setLoading(true)
    const term = query.trim().replace(/[^\p{L}\p{N} #& -]/gu, '').slice(0, 80)
    let request = supabase.from('pte_private_questions').select('*', { count: 'exact' })
      .eq('owner_id', user.id).order('question_code').order('source_number')
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
    if (term) {
      const number = Number(term.replace(/^#/, ''))
      if (Number.isInteger(number) && number > 0) request = request.eq('source_number', number)
      else if (/^[A-Z&]{2,8}\s*#?\s*\d+$/i.test(term)) {
        const match = term.toUpperCase().match(/^([A-Z&]+)\s*#?\s*(\d+)$/)
        if (match) request = request.eq('question_code', match[1]).eq('source_number', Number(match[2]))
      } else {
        request = request.or(`title.ilike.%${term}%,question_text.ilike.%${term}%,answer_text.ilike.%${term}%`)
      }
    }
    const { data, error, count } = await request
    if (requestId !== searchRequestRef.current) return
    setLoading(false)
    if (error) { setMessage(error.message); return }
    setRows((data ?? []) as Question[])
    setTotal(count ?? 0)
  }, [user, query, page])

  useEffect(() => {
    const timeout = window.setTimeout(() => { void load() }, 250)
    return () => { window.clearTimeout(timeout); searchRequestRef.current += 1 }
  }, [load, refreshKey])

  async function submitAuth() {
    if (busy) return
    setBusy(true); setMessage('')
    const normalizedEmail = email.trim().toLowerCase()
    let errorMessage: string | null = null
    if (authMode === 'register') {
      const { error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: { emailRedirectTo: `${window.location.origin}/pte-private-bank` },
      })
      errorMessage = error?.message ?? null
    } else if (authMode === 'reset') {
      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: `${window.location.origin}/pte-private-bank`,
      })
      errorMessage = error?.message ?? null
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password })
      errorMessage = error?.message ?? null
    }
    setBusy(false)
    setMessage(errorMessage ?? (authMode === 'register' ? '注册请求已提交。请按邮箱验证邮件完成确认，然后返回登录。' : authMode === 'reset' ? '密码重置邮件已发送，请检查邮箱。' : '已登录私人题库。'))
    setPassword('')
  }

  async function updatePassword() {
    if (busy || password.length < 8) return
    setBusy(true); setMessage('')
    const { error } = await supabase.auth.updateUser({ password })
    setBusy(false)
    setPassword('')
    if (error) setMessage(error.message)
    else { setRecovering(false); setMessage('密码已更新。') }
  }

  async function save() {
    if (!draft || busy) return
    const code = draft.question_code.trim().toUpperCase()
    if (!/^[A-Z&]{2,8}$/.test(code) || !Number.isInteger(draft.source_number) || draft.source_number < 1) {
      setMessage('请填写有效的题型代码和正整数题号。')
      return
    }
    setBusy(true); setMessage('')
    const { error } = await supabase.from('pte_private_questions').update({
      question_code: code, source_number: draft.source_number,
      title: draft.title.trim(), question_text: draft.question_text.trim(),
      answer_text: draft.answer_text.trim(), review_status: draft.review_status,
      updated_at: new Date().toISOString(),
    }).eq('id', draft.id).eq('owner_id', draft.owner_id)
    setBusy(false)
    if (error) { setMessage(error.message); return }
    setSelected({ ...draft, question_code: code }); setDraft(null); setRefreshKey((value) => value + 1)
    setMessage('已保存。')
  }

  async function remove() {
    if (!selected || busy || !window.confirm(`删除 ${selected.question_code} #${selected.source_number}？此操作无法撤销。`)) return
    setBusy(true); setMessage('')
    const { error } = await supabase.from('pte_private_questions').delete().eq('id', selected.id).eq('owner_id', selected.owner_id)
    setBusy(false)
    if (error) { setMessage(error.message); return }
    setSelected(null); setDraft(null); setRefreshKey((value) => value + 1)
    setMessage('已删除。')
  }

  async function importFile(file: File) {
    if (!user || busy) return
    setBusy(true); setMessage('正在校验导入文件...')
    try {
      const parsed: unknown = JSON.parse(await file.text())
      if (file.size > 20_000_000 || !Array.isArray(parsed) || !parsed.length || parsed.length > 3000 || !parsed.every(isImportQuestion)) {
        throw new Error('JSON 须是 1-3000 条有效题目；每条须有题型、题号、题干、答案、来源页码和校对状态。')
      }
      const unique = new Set(parsed.map((row) => `${row.question_code}:${row.source_number}`))
      if (unique.size !== parsed.length) throw new Error('导入文件包含重复题号，请先去重。')
      let imported = 0
      for (let index = 0; index < parsed.length; index += 50) {
        const batch = parsed.slice(index, index + 50).map((row) => ({ ...row, owner_id: user.id }))
        const { error } = await supabase.from('pte_private_questions').upsert(batch, { onConflict: 'owner_id,question_code,source_number', ignoreDuplicates: true })
        if (error) throw new Error(`已写入 ${imported} 条后失败：${error.message}`)
        imported += batch.length
        setMessage(`已导入 ${imported} / ${parsed.length} 条...`)
      }
      setMessage(`已处理 ${imported} 条，已有题号不会被覆盖。请逐题校对自动提取的题干与答案。`)
      setRefreshKey((value) => value + 1)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '导入失败。')
    } finally { setBusy(false) }
  }

  return <main className="min-h-screen bg-[#f4f6f5] text-[#1d2c2a]">
    <header className="border-b border-[#dce4df] bg-white"><div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4"><div><p className="text-xs font-bold text-teal-700">PTE · PERSONAL</p><h1 className="text-xl font-bold">私人资料题库</h1></div><Link href="/pte-practice" className="inline-flex items-center gap-2 text-sm font-semibold text-teal-800"><ArrowLeft size={16} />练习平台</Link></div></header>
    <div className="mx-auto max-w-6xl px-4 py-6">
      {!authReady ? <p role="status">正在检查登录状态...</p> : recovering ? <section className="max-w-sm space-y-4 rounded border border-[#dce4df] bg-white p-5"><h2 className="font-bold">设置新密码</h2><label className="block text-sm">新密码<input className="mt-1 w-full rounded border p-2" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} /></label><button className="rounded bg-teal-700 px-4 py-2 font-semibold text-white disabled:opacity-50" disabled={busy || password.length < 8} onClick={() => void updatePassword()}>更新密码</button><p className="text-xs text-[#53615f]">至少 8 位。</p></section> : !user ? <section className="max-w-sm space-y-4 rounded border border-[#dce4df] bg-white p-5"><h2 className="font-bold">{authMode === 'register' ? '创建私人题库账号' : authMode === 'reset' ? '重置题库账号密码' : '登录私人题库'}</h2><p className="text-sm text-[#53615f]">这里使用的是网站的私人题库账号，不是 Supabase 管理后台账号。没有预设密码；首次使用请用自己的邮箱创建账号。</p><label className="block text-sm">邮箱<input className="mt-1 w-full rounded border p-2" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>{authMode !== 'reset' && <label className="block text-sm">密码<input className="mt-1 w-full rounded border p-2" type="password" autoComplete={authMode === 'register' ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} /></label>}<button className="inline-flex items-center gap-2 rounded bg-teal-700 px-4 py-2 font-semibold text-white disabled:opacity-50" disabled={busy || !email.trim() || (authMode !== 'reset' && (!password || (authMode === 'register' && password.length < 8)))} onClick={() => void submitAuth()}><LogIn size={17} />{authMode === 'register' ? '注册' : authMode === 'reset' ? '发送重置邮件' : '登录'}</button>{authMode === 'register' && <p className="text-xs text-[#53615f]">密码至少 8 位；如果项目要求邮箱验证，请先点击验证邮件中的链接。</p>}<div className="flex flex-wrap gap-3 text-sm text-teal-800">{authMode !== 'login' && <button type="button" onClick={() => { setAuthMode('login'); setMessage('') }}>返回登录</button>}{authMode !== 'register' && <button type="button" onClick={() => { setAuthMode('register'); setMessage('') }}>创建账号</button>}{authMode !== 'reset' && <button type="button" onClick={() => { setAuthMode('reset'); setMessage('') }}>忘记密码</button>}</div></section> : <>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-[#53615f]">仅 {user.email ?? '当前账号'} 可见 · {total} 题</p><div className="flex gap-3"><label className="inline-flex cursor-pointer items-center gap-2 rounded border border-teal-700 px-3 py-2 text-sm font-semibold text-teal-800"><FileUp size={16} />导入 JSON<input className="sr-only" type="file" accept="application/json,.json" disabled={busy} onChange={(event) => { const file = event.target.files?.[0]; if (file) void importFile(file); event.target.value = '' }} /></label><button className="inline-flex items-center gap-2 text-sm" onClick={() => void supabase.auth.signOut()}><LogOut size={16} />退出</button></div></div>
        <label className="mb-5 flex items-center gap-2 rounded border border-[#cbd8d2] bg-white px-3"><Search size={18} className="text-[#64736c]" /><input className="w-full py-3 outline-none" value={query} onChange={(event) => { setQuery(event.target.value); setPage(0) }} placeholder="搜索题号（如 RS 103）、题干或答案关键词" /></label>
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(300px,1fr)]"><section className="min-w-0"><h2 className="mb-3 text-sm font-bold">{loading ? '正在搜索...' : `搜索结果 ${total} 条`}</h2><div className="divide-y border border-[#dce4df] bg-white">{rows.map((row) => <button key={row.id} className={`block w-full px-4 py-3 text-left hover:bg-[#eef6f2] ${selected?.id === row.id ? 'bg-[#e5f3ed]' : ''}`} onClick={() => { setSelected(row); setDraft(null) }}><span className="font-bold text-teal-800">{row.question_code} #{row.source_number}</span><span className="ml-2 text-sm">{row.title}</span><p className="mt-1 line-clamp-2 text-sm text-[#53615f]">{row.question_text || '待补题干'}</p></button>)}{!loading && !rows.length && <p className="p-5 text-sm text-[#53615f]">没有找到题目。</p>}</div><div className="mt-3 flex items-center justify-between text-sm"><button disabled={page === 0} onClick={() => setPage((value) => value - 1)}>上一页</button><span>第 {page + 1} 页</span><button disabled={(page + 1) * PAGE_SIZE >= total} onClick={() => setPage((value) => value + 1)}>下一页</button></div></section>
          <section className="min-w-0 border border-[#dce4df] bg-white p-5">{selected ? <><div className="mb-4 flex items-start justify-between gap-3"><div><h2 className="text-lg font-bold">{selected.question_code} #{selected.source_number}</h2><p className="text-sm text-[#53615f]">{selected.title}</p></div><div className="flex gap-2"><button title="编辑" aria-label="编辑题目" onClick={() => setDraft({ ...selected })}><Pencil size={18} /></button><button title="删除" aria-label="删除题目" disabled={busy} onClick={() => void remove()}><Trash2 size={18} /></button></div></div>{draft ? <div className="space-y-3"><div className="grid grid-cols-2 gap-3"><label className="block text-sm">题型代码<input className="mt-1 w-full rounded border p-2" value={draft.question_code} onChange={(event) => setDraft({ ...draft, question_code: event.target.value })} /></label><label className="block text-sm">题号<input className="mt-1 w-full rounded border p-2" type="number" min="1" value={draft.source_number} onChange={(event) => setDraft({ ...draft, source_number: Number(event.target.value) })} /></label></div><label className="block text-sm">标题<input className="mt-1 w-full rounded border p-2" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></label><label className="block text-sm">题干<textarea className="mt-1 min-h-40 w-full rounded border p-2" value={draft.question_text} onChange={(event) => setDraft({ ...draft, question_text: event.target.value })} /></label><label className="block text-sm">答案<textarea className="mt-1 min-h-32 w-full rounded border p-2" value={draft.answer_text} onChange={(event) => setDraft({ ...draft, answer_text: event.target.value })} /></label><label className="block text-sm">校对状态<select className="mt-1 w-full rounded border p-2" value={draft.review_status} onChange={(event) => setDraft({ ...draft, review_status: event.target.value as Question['review_status'] })}><option value="needs-review">待校对</option><option value="reviewed">已校对</option><option value="incomplete">资料不完整</option></select></label><div className="flex gap-3"><button className="inline-flex items-center gap-2 rounded bg-teal-700 px-3 py-2 text-white" disabled={busy} onClick={() => void save()}><Check size={16} />保存</button><button className="inline-flex items-center gap-2" onClick={() => setDraft(null)}><X size={16} />取消</button></div></div> : <><p className="mb-3 text-xs font-semibold text-[#64736c]">{selected.review_status === 'reviewed' ? '已校对' : selected.review_status === 'incomplete' ? '资料不完整' : '待校对'}</p><h3 className="text-sm font-bold">题干</h3><p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6">{selected.question_text || '待补题干'}</p><h3 className="mt-5 text-sm font-bold">答案</h3><p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6">{selected.answer_text || '待补答案'}</p><h3 className="mt-5 text-sm font-bold">来源页码</h3><p className="mt-1 text-sm text-[#53615f]">{Object.entries(selected.source_pages).map(([name, number]) => `${name}：第 ${number} 页`).join(' · ') || '未记录'}</p></>}</> : <p className="text-sm text-[#53615f]">选择左侧题目查看内容。</p>}</section></div>
      </>}
      {message && <p className="mt-4 rounded border border-[#bfd6c9] bg-[#e9f5ee] p-3 text-sm" role="status">{message}</p>}
    </div>
  </main>
}
