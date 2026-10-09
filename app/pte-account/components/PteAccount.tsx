'use client'

import { CreditCard, LogIn, LogOut, Mail, ShieldCheck } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { PTE_PLAN_LABELS, pteCommercialEnabled, type PtePlanCode } from '@/lib/pte-commercial/public-config'

type Mode = 'login' | 'register' | 'reset' | 'update'
interface AccountState {
  membership: { plan: PtePlanCode; status: string; current_period_end: string | null; cancel_at_period_end: boolean } | null
  entitlements: { question_bank: string; mock_exams_per_month: number; ai_scores_per_month: number; teacher_feedback: boolean } | null
}

export default function PteAccount() {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [sessionToken, setSessionToken] = useState('')
  const [account, setAccount] = useState<AccountState | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ error: boolean; text: string } | null>(null)

  const loadAccount = useCallback(async (token: string) => {
    if (!token) { setAccount(null); return }
    const response = await fetch('/api/pte-billing/entitlements', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
    if (response.ok) setAccount(await response.json() as AccountState)
  }, [])

  useEffect(() => {
    if (!pteCommercialEnabled) return
    let mounted = true
    void supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      const token = data.session?.access_token ?? ''
      setSessionToken(token)
      void loadAccount(token)
    })
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return
      if (event === 'PASSWORD_RECOVERY') setMode('update')
      const token = session?.access_token ?? ''
      setSessionToken(token)
      void loadAccount(token)
    })
    return () => { mounted = false; data.subscription.unsubscribe() }
  }, [loadAccount])

  async function submit() {
    if (busy || (mode !== 'update' && !email.trim())) return
    if (mode !== 'reset' && password.length < 8) { setMessage({ error: true, text: '密码至少需要 8 个字符。' }); return }
    setBusy(true)
    setMessage(null)
    const normalizedEmail = email.trim().toLowerCase()
    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password })
      setMessage(error ? { error: true, text: error.message } : { error: false, text: '登录成功。' })
    } else if (mode === 'register') {
      const { error } = await supabase.auth.signUp({ email: normalizedEmail, password, options: { emailRedirectTo: `${window.location.origin}/pte-account` } })
      setMessage(error ? { error: true, text: error.message } : { error: false, text: '注册申请已提交，请查收验证邮件。' })
    } else if (mode === 'reset') {
      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, { redirectTo: `${window.location.origin}/pte-account` })
      setMessage(error ? { error: true, text: error.message } : { error: false, text: '重置邮件已发送。' })
    } else {
      const { error } = await supabase.auth.updateUser({ password })
      setMessage(error ? { error: true, text: error.message } : { error: false, text: '新密码已保存。' })
      if (!error) setMode('login')
    }
    setBusy(false)
  }

  async function billing(path: 'checkout' | 'portal', plan?: 'monthly' | 'yearly') {
    if (!sessionToken || busy) return
    setBusy(true)
    setMessage(null)
    const response = await fetch(`/api/pte-billing/${path}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${sessionToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(plan ? { plan } : {}),
    })
    const result = await response.json() as { url?: string; message?: string }
    if (response.ok && result.url) window.location.assign(result.url)
    else setMessage({ error: true, text: result.message ?? '暂时无法打开支付服务。' })
    setBusy(false)
  }

  if (!pteCommercialEnabled) return <main className="min-h-screen bg-slate-50 px-4 py-16"><section className="mx-auto max-w-xl rounded-lg border border-slate-200 bg-white p-8 text-center"><ShieldCheck className="mx-auto text-teal-700" size={34} /><h1 className="mt-4 text-2xl font-black text-slate-900">PTE 商业账号尚未开启</h1><p className="mt-3 text-sm leading-6 text-slate-600">当前仍使用私人站模式，正式账号和付费不会影响现有数据。</p></section></main>

  return <main className="min-h-screen bg-slate-50 px-4 py-10"><div className="mx-auto max-w-5xl space-y-6">
    <header className="rounded-lg bg-slate-900 px-6 py-7 text-white"><p className="text-xs font-bold text-amber-300">PTE ACCOUNT</p><h1 className="mt-2 text-3xl font-black">账号与会员</h1><p className="mt-2 text-sm text-slate-300">正式邮箱账号、会员权益和订阅管理。</p></header>
    {message && <div role={message.error ? 'alert' : 'status'} className={`border-l-4 px-4 py-3 text-sm ${message.error ? 'border-rose-500 bg-rose-50 text-rose-900' : 'border-emerald-500 bg-emerald-50 text-emerald-900'}`}>{message.text}</div>}
    {!sessionToken || mode === 'update' ? <section className="rounded-lg border border-slate-200 bg-white p-6">{mode !== 'update' && <div className="mb-5 flex gap-2" aria-label="账号操作">{(['login', 'register', 'reset'] as Mode[]).map((value) => <button key={value} type="button" aria-pressed={mode === value} onClick={() => setMode(value)} className={`min-h-10 rounded-lg px-4 text-sm font-bold ${mode === value ? 'bg-slate-900 text-white' : 'border border-slate-200 text-slate-700'}`}>{value === 'login' ? '登录' : value === 'register' ? '注册' : '重置密码'}</button>)}</div>}<div className="grid gap-4">{mode !== 'update' && <label className="grid gap-1.5 text-sm font-bold text-slate-700"><span>邮箱</span><input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="min-h-11 rounded-lg border border-slate-300 px-3 font-normal" /></label>}{mode !== 'reset' && <label className="grid gap-1.5 text-sm font-bold text-slate-700"><span>{mode === 'update' ? '新密码' : '密码'}</span><input type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={(event) => setPassword(event.target.value)} className="min-h-11 rounded-lg border border-slate-300 px-3 font-normal" /></label>}<button type="button" disabled={busy} onClick={() => void submit()} className="inline-flex min-h-11 w-fit items-center gap-2 rounded-lg bg-teal-700 px-5 text-sm font-bold text-white disabled:opacity-50">{mode === 'reset' ? <Mail size={17} /> : <LogIn size={17} />}{busy ? '处理中…' : mode === 'login' ? '登录' : mode === 'register' ? '创建账号' : mode === 'update' ? '保存新密码' : '发送重置邮件'}</button></div></section>
      : <><section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><div className="rounded-lg border border-slate-200 bg-white p-5"><p className="text-xs font-bold text-slate-500">当前方案</p><p className="mt-2 text-xl font-black text-slate-900">{PTE_PLAN_LABELS[account?.membership?.plan ?? 'free']}</p></div><div className="rounded-lg border border-slate-200 bg-white p-5"><p className="text-xs font-bold text-slate-500">每月模考</p><p className="mt-2 text-xl font-black text-slate-900">{account?.entitlements?.mock_exams_per_month ?? 1} 次</p></div><div className="rounded-lg border border-slate-200 bg-white p-5"><p className="text-xs font-bold text-slate-500">AI 评分额度</p><p className="mt-2 text-xl font-black text-slate-900">{account?.entitlements?.ai_scores_per_month ?? 5} 次</p></div><div className="rounded-lg border border-slate-200 bg-white p-5"><p className="text-xs font-bold text-slate-500">题库权限</p><p className="mt-2 text-xl font-black text-slate-900">{account?.entitlements?.question_bank === 'full' ? '完整题库' : '入门题库'}</p></div></section><section className="flex flex-wrap gap-3 rounded-lg border border-slate-200 bg-white p-6"><button type="button" disabled={busy} onClick={() => void billing('checkout', 'monthly')} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-teal-700 px-4 text-sm font-bold text-white"><CreditCard size={17} />开通月度会员</button><button type="button" disabled={busy} onClick={() => void billing('checkout', 'yearly')} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-amber-500 px-4 text-sm font-bold text-slate-950"><CreditCard size={17} />开通年度会员</button><button type="button" disabled={busy} onClick={() => void billing('portal')} className="min-h-11 rounded-lg border border-slate-300 px-4 text-sm font-bold text-slate-700">管理订阅</button><button type="button" onClick={() => void supabase.auth.signOut()} className="ml-auto inline-flex min-h-11 items-center gap-2 px-3 text-sm font-bold text-slate-600"><LogOut size={17} />退出</button></section></>}
  </div></main>
}
