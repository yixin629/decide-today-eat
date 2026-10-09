'use client'

import Link from 'next/link'
import { BookOpenCheck, CalendarDays, CheckCircle2, Search, Star, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { SavedPtePlan } from '../types'

const PRACTICE_TASKS: Record<string, string> = {
  RA: 'speaking-read-aloud', RS: 'speaking-repeat-sentence', DI: 'speaking-describe-image',
  RL: 'speaking-retell-lecture', ASQ: 'speaking-answer-short-question',
  SGD: 'speaking-summarize-group-discussion', RTS: 'speaking-respond-to-situation',
  SWT: 'writing-summarize-text', WE: 'writing-essay', WFD: 'listening-write-from-dictation',
  SST: 'listening-summarize-spoken-text', RO: 'reading-reorder',
  HIW: 'listening-highlight-incorrect-words', FIBDD: 'reading-fill-blanks-dropdown',
  FIB: 'reading-fill-blanks-drag',
}

type ReviewStatus = 'all' | 'pending' | 'logged'
type ReviewSort = 'newest' | 'oldest'

export default function PlanReviewBook({ plan, today, saving, onComplete, onRemoveStar }: {
  plan: SavedPtePlan
  today: string
  saving: boolean
  onComplete: (dayIndex: number, taskId: string, rowId: string) => void
  onRemoveStar: (dayIndex: number, taskId: string, rowId: string) => void
}) {
  const [query, setQuery] = useState('')
  const [taskFilter, setTaskFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<ReviewStatus>('all')
  const [sort, setSort] = useState<ReviewSort>('newest')

  const entries = useMemo(() => plan.days.flatMap((day, dayIndex) => day.tasks.flatMap((task) =>
    task.rows.filter((row) => row.starred).map((row) => {
      const questionId = row.questionId.trim()
      const todayTask = plan.days.find((candidate) => candidate.date === today)?.tasks.find((candidate) => candidate.shortLabel === task.shortLabel)
      const loggedToday = Boolean(questionId && todayTask?.rows.some((candidate) => candidate.questionId.trim() === questionId))
      return { day, dayIndex, task, row, questionId, loggedToday }
    })
  )), [plan, today])

  const taskOptions = useMemo(() => Array.from(new Set(entries.map((entry) => entry.task.shortLabel))).sort(), [entries])
  const normalizedQuery = query.trim().toLocaleLowerCase()
  const filteredEntries = useMemo(() => entries.filter((entry) => {
    if (taskFilter !== 'all' && entry.task.shortLabel !== taskFilter) return false
    if (statusFilter === 'logged' && !entry.loggedToday) return false
    if (statusFilter === 'pending' && entry.loggedToday) return false
    if (!normalizedQuery) return true
    return [entry.questionId, entry.row.note, entry.task.label, entry.task.shortLabel]
      .some((value) => value.toLocaleLowerCase().includes(normalizedQuery))
  }).sort((left, right) => sort === 'newest'
    ? right.day.date.localeCompare(left.day.date)
    : left.day.date.localeCompare(right.day.date)), [entries, normalizedQuery, sort, statusFilter, taskFilter])

  const loggedCount = entries.filter((entry) => entry.loggedToday).length
  const hasFilters = Boolean(query || taskFilter !== 'all' || statusFilter !== 'all' || sort !== 'newest')

  function clearFilters() {
    setQuery('')
    setTaskFilter('all')
    setStatusFilter('all')
    setSort('newest')
  }

  return <section id="pte-review-book" className="scroll-mt-24 overflow-hidden rounded-lg border border-amber-200 bg-white shadow-lg" aria-labelledby="pte-review-book-title">
    <header className="flex flex-col gap-3 border-b border-amber-100 bg-amber-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div><p className="text-xs font-black text-amber-700">STARRED REVIEW</p><h2 id="pte-review-book-title" className="mt-1 flex items-center gap-2 text-xl font-black text-slate-900"><BookOpenCheck size={21} />重点复习本</h2><p className="mt-1 text-xs leading-5 text-slate-600">计划中标记 ★ 的题目都会集中在这里，可核对题号、回到原日期或进入题库重练。</p></div>
      <div className="flex flex-wrap gap-2 text-xs font-black"><span className="rounded-full bg-amber-200 px-3 py-1.5 text-amber-900">{entries.length} 道待复习</span><span className="rounded-full bg-emerald-100 px-3 py-1.5 text-emerald-800">今日已登记 {loggedCount}</span></div>
    </header>

    {entries.length ? <>
      <div className="grid gap-3 border-b border-slate-200 bg-slate-50 px-4 py-4 sm:grid-cols-2 lg:grid-cols-[minmax(220px,1fr)_150px_160px_140px_auto] sm:px-6">
        <label className="grid gap-1 text-xs font-bold text-slate-600"><span>搜索题号或备注</span><span className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} className="min-h-11 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900" placeholder="输入题号、题型或备注" /></span></label>
        <label className="grid gap-1 text-xs font-bold text-slate-600"><span>题型</span><select value={taskFilter} onChange={(event) => setTaskFilter(event.target.value)} className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900"><option value="all">全部题型</option>{taskOptions.map((task) => <option key={task} value={task}>{task}</option>)}</select></label>
        <label className="grid gap-1 text-xs font-bold text-slate-600"><span>今日状态</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as ReviewStatus)} className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900"><option value="all">全部状态</option><option value="pending">今日未登记</option><option value="logged">今日已登记</option></select></label>
        <label className="grid gap-1 text-xs font-bold text-slate-600"><span>日期排序</span><select value={sort} onChange={(event) => setSort(event.target.value as ReviewSort)} className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900"><option value="newest">最近优先</option><option value="oldest">最早优先</option></select></label>
        <button type="button" onClick={clearFilters} disabled={!hasFilters} className="inline-flex min-h-11 items-center justify-center gap-2 self-end rounded-lg border border-slate-300 px-3 text-xs font-bold text-slate-700 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"><X size={15} />清除</button>
      </div>
      <div className="border-b border-slate-100 px-4 py-2 text-xs font-semibold text-slate-500 sm:px-6">显示 {filteredEntries.length} / {entries.length} 道</div>
      {filteredEntries.length ? <div className="divide-y divide-slate-100">{filteredEntries.map(({ day, dayIndex, task, row, questionId, loggedToday }) => {
        const practiceTask = PRACTICE_TASKS[task.shortLabel]
        const href = practiceTask && questionId ? `/pte-practice?task=${encodeURIComponent(practiceTask)}&question=${encodeURIComponent(questionId)}` : null
        return <article key={`${day.date}-${task.id}-${row.id}`} className="grid gap-3 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-6">
          <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="rounded-md bg-slate-900 px-2 py-1 text-xs font-black text-white">{task.shortLabel}</span><strong className="break-all text-sm text-slate-900">题号：{questionId || '尚未填写'}</strong><span className="text-xs text-slate-500">Day {day.dayNumber} · {day.date}</span>{loggedToday && <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700"><CheckCircle2 size={14} />今日已登记</span>}</div><p className="mt-2 text-xs leading-5 text-slate-600">{row.note.trim() || task.label}{row.score ? ` · 最近记录 ${row.score}%` : ''}{row.attempts ? ` · ${row.attempts} 次` : ''}</p>{!questionId && <p className="mt-1 text-xs font-semibold text-amber-700">请先回到计划填写题号，才能在题库中定位。</p>}</div>
          <div className="flex flex-wrap gap-2"><Link href={`/pte-plan?plan=${encodeURIComponent(plan.id)}&day=${dayIndex}&task=${encodeURIComponent(task.id)}`} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:bg-slate-50"><CalendarDays size={15} />原计划</Link>{href && <Link href={href} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-teal-700 px-3 text-xs font-bold text-white hover:bg-teal-800"><Search size={15} />题库定位</Link>}<button type="button" onClick={() => onComplete(dayIndex, task.id, row.id)} disabled={saving || loggedToday || !questionId} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-emerald-700 px-3 text-xs font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300">{loggedToday ? <><CheckCircle2 size={15} />今日已登记</> : '登记今日完成'}</button><button type="button" onClick={() => onRemoveStar(dayIndex, task.id, row.id)} disabled={saving} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 text-xs font-bold text-amber-800 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50" aria-label={`取消星标题号 ${questionId || '未填写'}`}><Star size={15} fill="currentColor" />取消星标</button></div>
        </article>
      })}</div> : <div className="px-5 py-12 text-center"><p className="text-sm font-bold text-slate-700">没有符合条件的题目</p><button type="button" onClick={clearFilters} className="mt-3 text-xs font-bold text-teal-700 hover:text-teal-900">清除筛选</button></div>}
    </> : <div className="flex flex-col items-center gap-3 px-5 py-10 text-center text-slate-500"><Star size={28} /><p className="text-sm font-bold text-slate-700">还没有星标题目</p><p className="text-xs">在每日计划的题号旁点击 ☆，题目就会进入这里。</p></div>}
  </section>
}
