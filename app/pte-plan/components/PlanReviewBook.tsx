'use client'

import Link from 'next/link'
import { BookOpenCheck, CalendarDays, Search, Star } from 'lucide-react'
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

export default function PlanReviewBook({ plan, onComplete, onRemoveStar }: {
  plan: SavedPtePlan
  onComplete: (dayIndex: number, taskId: string, rowId: string) => void
  onRemoveStar: (dayIndex: number, taskId: string, rowId: string) => void
}) {
  const entries = plan.days.flatMap((day, dayIndex) => day.tasks.flatMap((task) =>
    task.rows.filter((row) => row.starred).map((row) => ({ day, dayIndex, task, row }))
  ))

  return <section id="pte-review-book" className="scroll-mt-24 overflow-hidden rounded-lg border border-amber-200 bg-white shadow-lg" aria-labelledby="pte-review-book-title">
    <header className="flex flex-col gap-3 border-b border-amber-100 bg-amber-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div><p className="text-xs font-black text-amber-700">STARRED REVIEW</p><h2 id="pte-review-book-title" className="mt-1 flex items-center gap-2 text-xl font-black text-slate-900"><BookOpenCheck size={21} />重点复习本</h2><p className="mt-1 text-xs leading-5 text-slate-600">计划中标记 ★ 的题目都会集中在这里，可核对题号、回到原日期或进入题库重练。</p></div>
      <span className="w-fit rounded-full bg-amber-200 px-3 py-1.5 text-xs font-black text-amber-900">{entries.length} 道待复习</span>
    </header>
    {entries.length ? <div className="divide-y divide-slate-100">{entries.map(({ day, dayIndex, task, row }) => {
      const questionId = row.questionId.trim()
      const practiceTask = PRACTICE_TASKS[task.shortLabel]
      const href = practiceTask && questionId ? `/pte-practice?task=${encodeURIComponent(practiceTask)}&question=${encodeURIComponent(questionId)}` : null
      return <article key={`${day.date}-${task.id}-${row.id}`} className="grid gap-3 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-6">
        <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="rounded-md bg-slate-900 px-2 py-1 text-xs font-black text-white">{task.shortLabel}</span><strong className="break-all text-sm text-slate-900">题号：{questionId || '尚未填写'}</strong><span className="text-xs text-slate-500">Day {day.dayNumber} · {day.date}</span></div><p className="mt-2 text-xs leading-5 text-slate-600">{row.note.trim() || task.label}{row.score ? ` · 最近记录 ${row.score}%` : ''}{row.attempts ? ` · ${row.attempts} 次` : ''}</p>{!questionId && <p className="mt-1 text-xs font-semibold text-amber-700">请先回到计划填写题号，才能在题库中定位。</p>}</div>
        <div className="flex flex-wrap gap-2"><Link href={`/pte-plan?plan=${encodeURIComponent(plan.id)}&day=${dayIndex}&task=${encodeURIComponent(task.id)}`} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:bg-slate-50"><CalendarDays size={15} />原计划</Link>{href && <Link href={href} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-teal-700 px-3 text-xs font-bold text-white hover:bg-teal-800"><Search size={15} />题库定位</Link>}<button type="button" onClick={() => onComplete(dayIndex, task.id, row.id)} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-emerald-700 px-3 text-xs font-bold text-white hover:bg-emerald-800">登记今日完成</button><button type="button" onClick={() => onRemoveStar(dayIndex, task.id, row.id)} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 text-xs font-bold text-amber-800 hover:bg-amber-100" aria-label={`取消星标题号 ${questionId || '未填写'}`}><Star size={15} fill="currentColor" />取消星标</button></div>
      </article>
    })}</div> : <div className="flex flex-col items-center gap-3 px-5 py-10 text-center text-slate-500"><Star size={28} /><p className="text-sm font-bold text-slate-700">还没有星标题目</p><p className="text-xs">在每日计划的题号旁点击 ☆，题目就会进入这里。</p></div>}
  </section>
}
