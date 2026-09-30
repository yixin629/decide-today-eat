'use client'

import { useEffect, useState } from 'react'
import { loadAttempts } from '../../lib/attempt-repository'
import { computeSkillTrends, computeStreak, computeTargetGaps, computeWeakSpots } from '../../lib/analyticsEngine'
import type { SkillGapEntry } from '../../lib/analyticsEngine'
import { getLatestPlanTarget } from '@/lib/pte-target-scores'
import type { LatestPlanTarget } from '@/lib/pte-target-scores'
import { SKILLS } from '../../types'
import type { AttemptRecord, TaskType } from '../../types'
import SkillTrendChart from './SkillTrendChart'
import WeakSpotsPanel from './WeakSpotsPanel'
import StreakTiles from './StreakTiles'
import TargetGapPanel from './TargetGapPanel'

/**
 * 尝试读取该用户最近更新的一份 /pte-plan 备考计划的目标分数，仅用于只读展示的
 * "目标分数差距"，不做任何双向同步、不修改 /pte-plan 自身数据。读取逻辑本身
 * 放在 lib/pte-target-scores.ts（两个功能目录共享），这里不直接依赖 /pte-plan
 * 的内部实现文件。加载失败（未配置 Supabase、网络问题、用户未设置计划等）时
 * 静默返回 null，由 UI 展示"去设置目标"的引导，而不是报错。
 */
async function loadMostRecentPlanTarget(userId: string | null): Promise<LatestPlanTarget | null> {
  if (!userId) return null
  try {
    return await getLatestPlanTarget(userId)
  } catch {
    return null
  }
}

export default function AnalyticsDashboard({
  userId,
  refreshKey,
  onSelectTaskType,
}: {
  userId: string | null
  refreshKey: number
  onSelectTaskType: (taskType: TaskType) => void
}) {
  const [state, setState] = useState<{
    loading: boolean
    attempts: AttemptRecord[]
    error: string | null
    planTarget: LatestPlanTarget | null
  }>({ loading: true, attempts: [], error: null, planTarget: null })

  useEffect(() => {
    let cancelled = false
    setState((prev) => ({ ...prev, loading: true }))
    Promise.all([loadAttempts(userId), loadMostRecentPlanTarget(userId)]).then(([attemptResult, planTarget]) => {
      if (cancelled) return
      setState({ loading: false, attempts: attemptResult.attempts, error: attemptResult.error, planTarget })
    })
    return () => {
      cancelled = true
    }
  }, [userId, refreshKey])

  if (!userId) {
    return <p className="empty-state">未识别登录身份，暂时无法生成学习分析（分析基于按身份归属的云端练习记录）。</p>
  }

  if (state.loading) {
    return (
      <div className="loading-state">
        <span className="loading-spinner" aria-hidden />
        加载练习数据中…
      </div>
    )
  }

  if (state.attempts.length === 0) {
    return <p className="empty-state">还没有练习记录，去做几套练习吧，完成后这里会自动生成你的学习分析。</p>
  }

  const trends = computeSkillTrends(state.attempts, SKILLS)
  const weakSpots = computeWeakSpots(state.attempts)
  const streak = computeStreak(state.attempts)
  const gaps: SkillGapEntry[] | null = state.planTarget
    ? computeTargetGaps(state.attempts, state.planTarget.targetScores, SKILLS)
    : null

  return (
    <div className="space-y-6">
      {state.error && (
        <div className="note-warning">
          <span className="note-callout-icon" aria-hidden>⚠️</span>
          <span>{state.error}（当前分析基于本机可见的记录，可能不完整）</span>
        </div>
      )}

      <StreakTiles stats={streak} />

      <section>
        <h2 className="mb-3 text-base font-semibold text-gray-900">各技能达成度趋势（近 12 周）</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {trends.map((trend) => (
            <SkillTrendChart key={trend.skill} trend={trend} />
          ))}
        </div>
      </section>

      <WeakSpotsPanel entries={weakSpots} onPractice={onSelectTaskType} />

      <TargetGapPanel gaps={gaps} planName={state.planTarget?.name ?? null} />
    </div>
  )
}
