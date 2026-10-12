import { supabase } from '@/lib/supabase'
import type { TaskType } from '../types'

const PLAN_TASK_TYPES: Record<string, TaskType> = {
  ra: 'speaking-read-aloud',
  rs: 'speaking-repeat-sentence',
  di: 'speaking-describe-image',
  rl: 'speaking-retell-lecture',
  asq: 'speaking-answer-short-question',
  sgd: 'speaking-summarize-group-discussion',
  rts: 'speaking-respond-to-situation',
  swt: 'writing-summarize-text',
  we: 'writing-essay',
  rfib: 'reading-fill-blanks-drag',
  fibdd: 'reading-fill-blanks-dropdown',
  ro: 'reading-reorder',
  sst: 'listening-summarize-spoken-text',
  hiw: 'listening-highlight-incorrect-words',
  wfd: 'listening-write-from-dictation',
}

export interface TodayPlanTask {
  id: string
  label: string
  shortLabel: string
  taskType: TaskType | null
  plannedCount: number
  completedCount: number
  completedQuestionIds: string[]
}

export interface TodayPlanSummary {
  planId: string
  planName: string
  dayNumber: number
  focus: string
  plannedMinutes: number
  tasks: TodayPlanTask[]
}

interface PlanRow {
  id: string
  name: string
  days: unknown
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function localDateValue(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function stringValue(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

function numberValue(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

export function parseTodayPlan(row: PlanRow, today = localDateValue()): TodayPlanSummary | null {
  if (!Array.isArray(row.days)) return null
  const day = row.days.find((candidate) => isRecord(candidate) && candidate.date === today)
  if (!isRecord(day) || !Array.isArray(day.tasks)) return null

  const hidden = new Set(Array.isArray(day.hiddenTaskIds) ? day.hiddenTaskIds.filter((id): id is string => typeof id === 'string') : [])
  const tasks = day.tasks.flatMap<TodayPlanTask>((candidate) => {
    if (!isRecord(candidate)) return []
    const id = stringValue(candidate.id)
    if (!id || hidden.has(id)) return []
    const rows = Array.isArray(candidate.rows) ? candidate.rows.filter(isRecord) : []
    const completedQuestionIds = rows
      .map((practiceRow) => stringValue(practiceRow.questionId).trim())
      .filter(Boolean)
    return [{
      id,
      label: stringValue(candidate.label, id.toUpperCase()),
      shortLabel: stringValue(candidate.shortLabel, id.toUpperCase()),
      taskType: PLAN_TASK_TYPES[id.toLowerCase()] ?? null,
      plannedCount: numberValue(candidate.plannedCount),
      completedCount: completedQuestionIds.length,
      completedQuestionIds,
    }]
  })

  return {
    planId: row.id,
    planName: row.name,
    dayNumber: numberValue(day.dayNumber),
    focus: stringValue(day.focus),
    plannedMinutes: numberValue(day.plannedMinutes),
    tasks,
  }
}

export async function loadTodayPlan(userId: string): Promise<{ plan: TodayPlanSummary | null; error: string | null }> {
  const { data, error } = await supabase
    .from('pte_plans')
    .select('id,name,days')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(20)

  if (error) return { plan: null, error: '今日计划暂时无法读取，可前往备考计划继续记录。' }
  const plan = (data ?? []).map((row) => parseTodayPlan(row as PlanRow)).find(Boolean) ?? null
  return { plan, error: null }
}
