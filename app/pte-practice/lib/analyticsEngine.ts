import { getTaskTypeMeta } from './taskTypes'
import type { AttemptRecord, PteSkill, TaskType } from '../types'

/**
 * 学习分析聚合层：纯函数，不含任何 UI 逻辑。
 *
 * 所有分数均归一化为 0-100 的"达成度百分比"（每条记录的 score/maxScore 取平均后
 * 乘以 100），从不假装等同于官方 10-90 分制。同时严格区分：
 * - 客观维度（isHeuristic === false）：基于精确对错判定，可信。
 * - 启发式维度（isHeuristic === true）：本项目估算或占位分，仅供参考，不代表真实评分。
 * 任何聚合都不得把两者混合成一条"看似精确"的曲线而不加区分。
 */

export const WEAK_SPOT_WINDOW_DAYS = 30
export const WEAK_SPOT_MIN_SAMPLES = 2
const TREND_WEEK_COUNT = 12

function toDateKey(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function startOfWeek(date: Date): Date {
  // 周一为一周起点，仅用于展示分桶，不涉及任何认证/授权语义。
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const day = d.getDay() // 0 = Sun
  const diff = (day === 0 ? -6 : 1) - day
  d.setDate(d.getDate() + diff)
  return d
}

function weekKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function avgPct(attempts: AttemptRecord[], predicate: (isHeuristic: boolean) => boolean): number | null {
  let sum = 0
  let count = 0
  for (const attempt of attempts) {
    for (const dim of attempt.dimensions) {
      if (!predicate(dim.isHeuristic)) continue
      if (dim.maxScore <= 0) continue
      sum += dim.score / dim.maxScore
      count += 1
    }
  }
  if (count === 0) return null
  return Math.round((sum / count) * 1000) / 10 // 0-100，保留一位小数
}

export interface SkillWeekPoint {
  weekStart: string // YYYY-MM-DD（周一）
  objectivePct: number | null
  heuristicPct: number | null
  objectiveSamples: number
  heuristicSamples: number
}

export interface SkillTrend {
  skill: PteSkill
  hasObjective: boolean
  hasHeuristic: boolean
  points: SkillWeekPoint[]
}

/** 按周聚合每个技能的客观/启发式维度平均达成度，最近 12 周，仅保留真实发生练习的周。 */
export function computeSkillTrends(attempts: AttemptRecord[], skills: readonly PteSkill[]): SkillTrend[] {
  const now = new Date()
  const weekStarts: Date[] = []
  for (let i = TREND_WEEK_COUNT - 1; i >= 0; i--) {
    const d = startOfWeek(now)
    d.setDate(d.getDate() - i * 7)
    weekStarts.push(d)
  }

  return skills.map((skill) => {
    const skillAttempts = attempts.filter((a) => getTaskTypeMeta(a.taskType).skill === skill)
    const hasObjective = skillAttempts.some((a) => a.dimensions.some((d) => !d.isHeuristic))
    const hasHeuristic = skillAttempts.some((a) => a.dimensions.some((d) => d.isHeuristic))

    const points: SkillWeekPoint[] = weekStarts
      .map((weekStart) => {
        const key = weekKey(weekStart)
        const nextWeek = new Date(weekStart)
        nextWeek.setDate(nextWeek.getDate() + 7)
        const inWeek = skillAttempts.filter((a) => {
          const d = new Date(a.createdAt)
          return d >= weekStart && d < nextWeek
        })
        if (inWeek.length === 0) {
          return { weekStart: key, objectivePct: null, heuristicPct: null, objectiveSamples: 0, heuristicSamples: 0 }
        }
        const objectiveSamples = inWeek.reduce((n, a) => n + a.dimensions.filter((d) => !d.isHeuristic).length, 0)
        const heuristicSamples = inWeek.reduce((n, a) => n + a.dimensions.filter((d) => d.isHeuristic).length, 0)
        return {
          weekStart: key,
          objectivePct: avgPct(inWeek, (h) => !h),
          heuristicPct: avgPct(inWeek, (h) => h),
          objectiveSamples,
          heuristicSamples,
        }
      })
      .filter((p) => p.objectivePct !== null || p.heuristicPct !== null)

    return { skill, hasObjective, hasHeuristic, points }
  })
}

export interface WeakSpotEntry {
  taskType: TaskType
  skill: PteSkill
  label: string
  avgPct: number
  sampleCount: number
  isHeuristicOnly: boolean
}

/** 按最近 WEAK_SPOT_WINDOW_DAYS 天内的表现，找出最需要加强的题型（样本量不足的题型不参与排名）。 */
export function computeWeakSpots(attempts: AttemptRecord[], limit = 5): WeakSpotEntry[] {
  const cutoff = Date.now() - WEAK_SPOT_WINDOW_DAYS * 24 * 60 * 60 * 1000
  const recent = attempts.filter((a) => new Date(a.createdAt).getTime() >= cutoff)

  const byTaskType = new Map<TaskType, AttemptRecord[]>()
  for (const attempt of recent) {
    const list = byTaskType.get(attempt.taskType) ?? []
    list.push(attempt)
    byTaskType.set(attempt.taskType, list)
  }

  const entries: WeakSpotEntry[] = []
  for (const [taskType, list] of byTaskType.entries()) {
    if (list.length < WEAK_SPOT_MIN_SAMPLES) continue
    const pct = avgPct(list, () => true)
    if (pct === null) continue
    const meta = getTaskTypeMeta(taskType)
    entries.push({
      taskType,
      skill: meta.skill,
      label: meta.shortLabel,
      avgPct: pct,
      sampleCount: list.length,
      isHeuristicOnly: meta.scoringDimensions.every((d) => d.isHeuristic),
    })
  }

  return entries.sort((a, b) => a.avgPct - b.avgPct).slice(0, limit)
}

export interface StreakStats {
  currentStreakDays: number
  practicedToday: boolean
  last7DaysCount: number
  totalAttempts: number
}

/** 连续练习天数：以自然日为单位；若今天尚未练习但昨天有练习，视为"连续未中断"（当天结束前仍可延续）。 */
export function computeStreak(attempts: AttemptRecord[], now: Date = new Date()): StreakStats {
  const dateKeys = new Set(attempts.map((a) => toDateKey(a.createdAt)))
  const todayKey = toDateKey(now.toISOString())
  const practicedToday = dateKeys.has(todayKey)

  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  if (!practicedToday) cursor.setDate(cursor.getDate() - 1)

  let streak = 0
  while (dateKeys.has(toDateKey(cursor.toISOString()))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }

  const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000
  const last7DaysCount = attempts.filter((a) => new Date(a.createdAt).getTime() >= sevenDaysAgo).length

  return { currentStreakDays: streak, practicedToday, last7DaysCount, totalAttempts: attempts.length }
}

export interface SkillGapEntry {
  skill: PteSkill
  currentPct: number | null
  targetPct: number
  gapPct: number | null
  sampleCount: number
}

/**
 * 将官方 10-90 分制的目标分数与练习估分做"达成度百分比"对齐，两者都归一化到 0-100%，
 * 绝不声称练习估分等于真实 PTE 10-90 分。currentPct 取最近 WEAK_SPOT_WINDOW_DAYS 天
 * 内该技能所有维度（客观+启发式混合）的平均达成度。
 */
export function computeTargetGaps(
  attempts: AttemptRecord[],
  targetScores: Record<PteSkill, number>,
  skills: readonly PteSkill[]
): SkillGapEntry[] {
  const cutoff = Date.now() - WEAK_SPOT_WINDOW_DAYS * 24 * 60 * 60 * 1000
  const recent = attempts.filter((a) => new Date(a.createdAt).getTime() >= cutoff)

  return skills.map((skill) => {
    const skillAttempts = recent.filter((a) => getTaskTypeMeta(a.taskType).skill === skill)
    const currentPct = avgPct(skillAttempts, () => true)
    const targetRaw = targetScores[skill]
    const targetPct = Math.round(Math.max(0, Math.min(100, ((targetRaw - 10) / (90 - 10)) * 100)) * 10) / 10
    const sampleCount = skillAttempts.reduce((n, a) => n + a.dimensions.length, 0)
    return {
      skill,
      currentPct,
      targetPct,
      gapPct: currentPct === null ? null : Math.round((targetPct - currentPct) * 10) / 10,
      sampleCount,
    }
  })
}
