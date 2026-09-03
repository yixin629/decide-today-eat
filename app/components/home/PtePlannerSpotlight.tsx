'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { PTE_STORAGE_KEY, type SavedPtePlan } from '@/app/pte-plan/types'

export default function PtePlannerSpotlight() {
  const [plan, setPlan] = useState<SavedPtePlan | null>(null)

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(PTE_STORAGE_KEY)
      if (raw) setPlan(JSON.parse(raw) as SavedPtePlan)
    } catch {
      setPlan(null)
    }
  }, [])

  const progress = plan
    ? plan.days.reduce(
        (summary, day) => {
          day.tasks.forEach((task) => {
            summary.planned += task.plannedCount
            summary.done += task.rows.filter((row) => row.questionId.trim()).length
          })
          return summary
        },
        { planned: 0, done: 0 }
      )
    : null

  const rate = progress?.planned
    ? Math.min(100, Math.round((progress.done / progress.planned) * 100))
    : 0

  return (
    <section
      className="relative mb-8 overflow-hidden rounded-3xl border border-cyan-200 bg-gradient-to-br from-[#16324f] via-[#17465f] to-[#147d78] p-5 text-white shadow-xl sm:p-7"
      aria-labelledby="pte-planner-spotlight-title"
    >
      <span
        className="pointer-events-none absolute -right-8 -top-12 text-[9rem] opacity-[0.08]"
        aria-hidden="true"
      >
        90
      </span>
      <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-cyan-300/15 px-3 py-1 text-xs font-bold text-cyan-100">
              PTE 智能规划
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">
              澳洲 · 加拿大 · 英国 · 新西兰 · 大学申请
            </span>
          </div>
          <h2 id="pte-planner-spotlight-title" className="mt-3 text-2xl font-black sm:text-3xl">
            按你的目标分数，生成每天该练什么
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-cyan-50/85 sm:text-base">
            自由设置考试日期、当前分数、目标标准和每日时长；自动考虑题型权重与听说读写交叉供分。
          </p>
          {plan && progress && (
            <div className="mt-4 max-w-xl">
              <div className="mb-1.5 flex justify-between text-xs font-semibold text-cyan-50/80">
                <span>{plan.days.length} 天计划已保存</span>
                <span>
                  {progress.done}/{progress.planned} 题 · {rate}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-amber-300"
                  style={{ width: `${rate}%` }}
                />
              </div>
            </div>
          )}
        </div>
        <Link
          href="/pte-plan"
          className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-white px-6 py-3 font-black text-[#16324f] shadow-lg transition hover:-translate-y-0.5 hover:bg-cyan-50 hover:shadow-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-200"
        >
          {plan ? '继续今天的计划 →' : '开始生成计划 →'}
        </Link>
      </div>
    </section>
  )
}
