'use client'

import { useEffect } from 'react'
import { SKILL_META } from '../lib/standards'
import type { PracticeRow, SavedPtePlan, Skill } from '../types'

const REPORT_SKILLS: Skill[] = ['speaking', 'writing', 'reading', 'listening']

const MOOD_LABELS = {
  '': '未记录',
  great: '状态很好',
  good: '比较顺利',
  normal: '正常完成',
  tired: '有点疲惫',
  stuck: '需要调整',
} as const

function rowScore(row: PracticeRow) {
  if (!row.score.trim()) return 100
  const score = Number(row.score)
  return Number.isFinite(score) ? Math.min(100, Math.max(0, score)) : 100
}

function rowAttempts(row: PracticeRow) {
  if (!row.attempts.trim()) return 1
  const attempts = Number(row.attempts)
  return Number.isFinite(attempts) ? Math.max(1, attempts) : 1
}

function percent(numerator: number, denominator: number) {
  return denominator > 0 ? Math.round((numerator / denominator) * 100) : 0
}

function formatMinutes(minutes: number) {
  if (minutes < 60) return `${minutes} 分钟`
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  return remainder ? `${hours} 小时 ${remainder} 分` : `${hours} 小时`
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('zh-CN', { month: 'numeric', day: 'numeric' }).format(
    new Date(`${date}T00:00:00`)
  )
}

function buildReport(plan: SavedPtePlan) {
  const skillStats = Object.fromEntries(
    REPORT_SKILLS.map((skill) => [
      skill,
      { planned: 0, completed: 0, extra: 0, scoreTotal: 0, scoredRows: 0, attempts: 0 },
    ])
  ) as Record<
    Skill,
    {
      planned: number
      completed: number
      extra: number
      scoreTotal: number
      scoredRows: number
      attempts: number
    }
  >
  const taskStats = new Map<
    string,
    { id: string; label: string; skill: Skill; completed: number; scoreTotal: number; starred: number }
  >()

  let planned = 0
  let completed = 0
  let extra = 0
  let starred = 0
  let activeDays = 0
  let actualMinutes = 0

  const days = plan.days.map((day) => {
    let dayPlanned = 0
    let dayCompleted = 0
    let dayExtra = 0

    day.tasks
      .filter((task) => !day.hiddenTaskIds.includes(task.id))
      .forEach((task) => {
        const skill = skillStats[task.primarySkill]
        const taskStat = taskStats.get(task.id) ?? {
          id: task.id,
          label: task.shortLabel || task.label,
          skill: task.primarySkill,
          completed: 0,
          scoreTotal: 0,
          starred: 0,
        }

        task.rows.forEach((row) => {
          if (row.category === 'planned') {
            planned += 1
            dayPlanned += 1
            skill.planned += 1
          }
          if (row.starred) {
            starred += 1
            taskStat.starred += 1
          }
          if (!row.questionId.trim()) return

          const score = rowScore(row)
          if (row.category === 'planned') {
            completed += 1
            dayCompleted += 1
            skill.completed += 1
          } else {
            extra += 1
            dayExtra += 1
            skill.extra += 1
          }
          skill.scoreTotal += score
          skill.scoredRows += 1
          skill.attempts += rowAttempts(row)
          taskStat.completed += 1
          taskStat.scoreTotal += score
        })
        taskStats.set(task.id, taskStat)
      })

    const hasSummary = Boolean(
      day.summary.actualMinutes ||
        day.summary.mood ||
        day.summary.achievement.trim() ||
        day.summary.difficulty.trim() ||
        day.summary.nextFocus.trim()
    )
    if (dayCompleted + dayExtra > 0 || hasSummary) activeDays += 1
    actualMinutes += day.summary.actualMinutes ?? 0

    return {
      date: day.date,
      planned: dayPlanned,
      completed: dayCompleted,
      extra: dayExtra,
      actualMinutes: day.summary.actualMinutes ?? 0,
      mood: MOOD_LABELS[day.summary.mood],
    }
  })

  const focusTasks = [...taskStats.values()]
    .filter((task) => task.completed > 0 || task.starred > 0)
    .map((task) => ({
      ...task,
      averageScore: task.completed ? Math.round(task.scoreTotal / task.completed) : null,
    }))
    .sort((a, b) => b.starred - a.starred || (a.averageScore ?? 101) - (b.averageScore ?? 101))
    .slice(0, 6)

  return { planned, completed, extra, starred, activeDays, actualMinutes, days, skillStats, focusTasks }
}

interface PteReportProps {
  plan: SavedPtePlan
  open: boolean
  onClose: () => void
}

export default function PteReport({ plan, open, onClose }: PteReportProps) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose, open])

  if (!open) return null

  const report = buildReport(plan)
  const completionRate = percent(report.completed, report.planned)

  return (
    <div className="fixed inset-0 z-[85] flex items-end justify-center p-0 sm:items-center sm:p-5">
      <button
        type="button"
        aria-label="关闭总体报告"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="pte-report-title"
        className="relative max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-t-[2rem] bg-slate-50 shadow-2xl sm:rounded-[2rem]"
      >
        <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-white/10 bg-slate-950 px-5 py-5 text-white sm:px-7">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">PTE PROGRESS</p>
            <h2 id="pte-report-title" className="mt-1 text-2xl font-black">
              总体学习报告
            </h2>
            <p className="mt-1 text-sm text-slate-300">{plan.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-2xl transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            aria-label="关闭报告"
          >
            ×
          </button>
        </header>

        <div className="space-y-7 p-4 sm:p-7">
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="学习总览">
            {[
              { label: '计划完成率', value: `${completionRate}%`, note: `${report.completed}/${report.planned} 题` },
              { label: '有效学习天数', value: `${report.activeDays} 天`, note: `计划共 ${plan.days.length} 天` },
              { label: '实际学习时间', value: formatMinutes(report.actualMinutes), note: '来自每日总结' },
              { label: '已完成练习', value: `${report.completed + report.extra} 题`, note: `其中加练 ${report.extra} 题` },
            ].map((item) => (
              <article key={item.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <p className="text-xs font-bold text-slate-500">{item.label}</p>
                <p className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">{item.value}</p>
                <p className="mt-1 text-xs text-slate-500">{item.note}</p>
              </article>
            ))}
          </section>

          <section>
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">SKILL BREAKDOWN</p>
                <h3 className="mt-1 text-xl font-black text-slate-950">四科表现</h3>
              </div>
              <span className="text-xs text-slate-500">标星共 {report.starred} 题</span>
            </div>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {REPORT_SKILLS.map((skill) => {
                const stat = report.skillStats[skill]
                const meta = SKILL_META[skill]
                const average = stat.scoredRows ? Math.round(stat.scoreTotal / stat.scoredRows) : null
                const rate = percent(stat.completed, stat.planned)
                return (
                  <article key={skill} className="rounded-2xl border bg-white p-4 shadow-sm" style={{ borderColor: meta.color }}>
                    <div className="flex items-center justify-between">
                      <span className="font-black" style={{ color: meta.color }}>{meta.label}</span>
                      <span className="text-lg font-black text-slate-900">{average ?? '—'}</span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full" style={{ width: `${Math.min(100, rate)}%`, backgroundColor: meta.color }} />
                    </div>
                    <p className="mt-2 text-xs text-slate-600">完成 {stat.completed}/{stat.planned} · 加练 {stat.extra}</p>
                    <p className="mt-1 text-xs text-slate-500">累计练习 {stat.attempts} 次</p>
                  </article>
                )
              })}
            </div>
          </section>

          <section className="grid gap-5 lg:grid-cols-[0.9fr_1.4fr]">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">FOCUS NEXT</p>
              <h3 className="mt-1 text-xl font-black text-slate-950">重点关注题型</h3>
              <div className="mt-3 space-y-2">
                {report.focusTasks.length > 0 ? report.focusTasks.map((task) => (
                  <article key={task.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                    <div>
                      <p className="font-black text-slate-900">{task.label}</p>
                      <p className="text-xs text-slate-500">{SKILL_META[task.skill].label} · 完成 {task.completed} 题</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-slate-900">{task.averageScore ?? '—'} 分</p>
                      <p className="text-xs font-bold text-amber-600">★ {task.starred}</p>
                    </div>
                  </article>
                )) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-500">填写题号或标星后，这里会自动给出重点题型。</div>
                )}
              </div>
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">DAILY TRACK</p>
              <h3 className="mt-1 text-xl font-black text-slate-950">每日完成轨迹</h3>
              <div className="mt-3 max-h-[25rem] space-y-2 overflow-y-auto pr-1">
                {report.days.map((day) => {
                  const rate = percent(day.completed, day.planned)
                  return (
                    <article key={day.date} className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                      <div>
                        <p className="text-sm font-black text-slate-900">{formatDate(day.date)}</p>
                        <p className="text-[11px] text-slate-500">{day.mood}</p>
                      </div>
                      <div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full bg-cyan-500" style={{ width: `${Math.min(100, rate)}%` }} />
                        </div>
                        <p className="mt-1 text-[11px] text-slate-500">{day.completed}/{day.planned} 题 · 加练 {day.extra}</p>
                      </div>
                      <span className="text-xs font-bold text-slate-600">{day.actualMinutes ? `${day.actualMinutes} 分` : '—'}</span>
                    </article>
                  )
                })}
              </div>
            </div>
          </section>

          <p className="rounded-xl bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
            统计口径：填写题号即视为完成；未填写得分时按 100 分计，未填写练习次数时按 1 次计；当天隐藏的题型不纳入计划完成率。
          </p>
        </div>
      </section>
    </div>
  )
}
