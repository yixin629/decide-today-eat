import type { PracticeRow, SavedPtePlan } from '../types'

export interface CompleteReviewResult {
  plan: SavedPtePlan
  copiedToToday: boolean
  alreadyInToday: boolean
  error: string | null
}

export function completeStarredReview(
  plan: SavedPtePlan,
  location: { dayIndex: number; taskId: string; rowId: string },
  today: string,
  now = new Date().toISOString()
): CompleteReviewResult {
  const sourceTask = plan.days[location.dayIndex]?.tasks.find((task) => task.id === location.taskId)
  const sourceRow = sourceTask?.rows.find((row) => row.id === location.rowId)
  if (!sourceTask || !sourceRow) return { plan, copiedToToday: false, alreadyInToday: false, error: '找不到这条复习记录，请刷新后重试。' }

  const questionId = sourceRow.questionId.trim()
  const isRepeatSentence = sourceTask.shortLabel === 'RS'
  const todayIndex = plan.days.findIndex((day) => day.date === today)
  const todayTask = todayIndex >= 0 ? plan.days[todayIndex].tasks.find((task) => task.shortLabel === 'RS') : undefined
  if (isRepeatSentence && !questionId) return { plan, copiedToToday: false, alreadyInToday: false, error: '请先填写 RS 题号，再完成复习。' }
  if (isRepeatSentence && todayIndex < 0) return { plan, copiedToToday: false, alreadyInToday: false, error: '今天不在当前计划日期内，暂时不能自动登记今日练习。' }
  if (isRepeatSentence && !todayTask) return { plan, copiedToToday: false, alreadyInToday: false, error: '今日计划中没有 RS 题型，暂时不能自动登记。' }

  const alreadyInToday = Boolean(todayTask?.rows.some((row) => row.questionId.trim() === questionId))
  let copiedToToday = false
  const days = plan.days.map((day, dayIndex) => ({
    ...day,
    tasks: day.tasks.map((task) => {
      let rows = task.rows.map((row) => dayIndex === location.dayIndex && task.id === location.taskId && row.id === location.rowId
        ? { ...row, starred: false }
        : row)
      if (!isRepeatSentence || dayIndex !== todayIndex || task.shortLabel !== 'RS' || alreadyInToday) return { ...task, rows }
      const emptyIndex = rows.findIndex((row) => !row.questionId.trim())
      if (emptyIndex >= 0) {
        rows = rows.map((row, index) => index === emptyIndex ? { ...row, questionId } : row)
      } else {
        const extra: PracticeRow = { id: `${day.dayNumber}-${task.id}-review-${Date.parse(now)}`, category: 'extra', questionId, starred: false, score: '', attempts: '', note: '重点复习本自动登记' }
        rows = [...rows, extra]
      }
      copiedToToday = true
      return { ...task, rows }
    }),
  }))

  return { plan: { ...plan, days, updatedAt: now }, copiedToToday, alreadyInToday, error: null }
}
