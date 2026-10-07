'use client'

import Link from 'next/link'
import { ArrowLeft, BookOpenCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import PlanReviewBook from '../../components/PlanReviewBook'
import { loadCloudPlans, saveCloudPlans } from '../../lib/plan-repository'
import { completeStarredReview } from '../../lib/review-book'
import type { SavedPtePlan } from '../../types'

export default function StarredReviewPage() {
  const { user, loading: authLoading } = useAuth()
  const [plans, setPlans] = useState<SavedPtePlan[]>([])
  const [activePlanId, setActivePlanId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return
    if (!user) { setError('请先登录后查看重点复习本。'); setLoading(false); return }
    let cancelled = false
    loadCloudPlans(user).then((loaded) => {
      if (cancelled) return
      setPlans(loaded)
      setActivePlanId(loaded[0]?.id ?? '')
      setLoading(false)
    }).catch(() => {
      if (!cancelled) { setError('重点复习本读取失败，请检查网络后重试。'); setLoading(false) }
    })
    return () => { cancelled = true }
  }, [authLoading, user])

  const activePlan = plans.find((plan) => plan.id === activePlanId) ?? null
  const total = plans.reduce((count, plan) => count + plan.days.reduce((dayCount, day) => dayCount + day.tasks.reduce((taskCount, task) => taskCount + task.rows.filter((row) => row.starred).length, 0), 0), 0)

  async function toggleStar(dayIndex: number, taskId: string, rowId: string) {
    if (!activePlan || !user || saving) return
    const today = new Date()
    const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    const result = completeStarredReview(activePlan, { dayIndex, taskId, rowId }, date)
    if (result.error) { setError(result.error); return }
    const updated = result.plan
    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      await saveCloudPlans(user, [updated])
      setPlans((current) => current.map((plan) => plan.id === updated.id ? updated : plan))
      setMessage(result.copiedToToday ? '已完成复习，并把 RS 题号自动登记到今日练习。' : result.alreadyInToday ? '已完成复习；今日 RS 已有相同题号，没有重复添加。' : '已完成复习并取消星标。')
    } catch {
      setError('更新星标失败，原记录没有改变，请稍后重试。')
    } finally {
      setSaving(false)
    }
  }

  return <main className="min-h-screen bg-slate-50 px-3 pb-24 pt-5 sm:px-6 md:py-8">
    <div className="mx-auto max-w-6xl space-y-5">
      <header className="flex flex-col gap-4 rounded-lg bg-slate-900 px-5 py-5 text-white sm:flex-row sm:items-center sm:justify-between">
        <div><p className="text-xs font-bold text-amber-300">PTE REVIEW WORKSPACE</p><h1 className="mt-1 flex items-center gap-2 text-2xl font-black"><BookOpenCheck size={24} />重点复习本</h1><p className="mt-2 text-sm text-slate-300">集中查看所有计划里的星标题目，不打断每日计划编辑。</p></div>
        <Link href="/pte-plan" className="inline-flex min-h-11 w-fit items-center gap-2 rounded-lg border border-white/20 px-4 text-sm font-bold hover:bg-white/10"><ArrowLeft size={17} />返回备考计划</Link>
      </header>
      <section className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:flex-row sm:items-end sm:justify-between">
        <label className="grid gap-1.5 text-sm font-bold text-slate-700"><span>选择备考方案</span><select className="min-h-11 min-w-64 rounded-lg border border-slate-300 bg-white px-3" value={activePlanId} onChange={(event) => setActivePlanId(event.target.value)} disabled={!plans.length}>{plans.length ? plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name || '未命名计划'}</option>) : <option value="">暂无计划</option>}</select></label>
        <p className="text-sm font-bold text-amber-700">全部方案共 {total} 道待复习{saving ? ' · 正在保存…' : ''}</p>
      </section>
      {error && <div role="alert" className="border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-sm text-amber-900">{error}</div>}
      {message && <div role="status" className="border-l-4 border-emerald-500 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{message}</div>}
      {loading ? <div className="py-16 text-center text-sm text-slate-500">正在读取重点复习本…</div> : activePlan ? <PlanReviewBook plan={activePlan} onToggleStar={toggleStar} /> : <div className="rounded-lg border border-dashed border-slate-300 bg-white py-16 text-center text-sm text-slate-500">还没有可用的备考计划。</div>}
    </div>
  </main>
}
