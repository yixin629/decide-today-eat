type JsonRecord = Record<string, unknown>

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export type RegistrationStatus = 'added' | 'existing' | 'unavailable'

export function registerPracticeInPlan(
  days: unknown,
  date: string,
  taskId: string,
  questionId: string,
  rowId: string
): { days: unknown; status: RegistrationStatus } {
  if (!Array.isArray(days)) return { days, status: 'unavailable' }
  const dayIndex = days.findIndex((day) => isRecord(day) && day.date === date)
  const day = days[dayIndex]
  if (!isRecord(day) || !Array.isArray(day.tasks)) return { days, status: 'unavailable' }
  if (Array.isArray(day.hiddenTaskIds) && day.hiddenTaskIds.includes(taskId)) return { days, status: 'unavailable' }
  const taskIndex = day.tasks.findIndex((task) => isRecord(task) && task.id === taskId)
  const task = day.tasks[taskIndex]
  if (!isRecord(task) || !Array.isArray(task.rows)) return { days, status: 'unavailable' }
  if (task.rows.some((row) => isRecord(row) && typeof row.questionId === 'string' && row.questionId.trim() === questionId)) {
    return { days, status: 'existing' }
  }

  const emptyIndex = task.rows.findIndex((row) => isRecord(row) && typeof row.questionId === 'string' && !row.questionId.trim())
  const rows = emptyIndex >= 0
    ? task.rows.map((row, index) => index === emptyIndex && isRecord(row) ? { ...row, questionId } : row)
    : [...task.rows, { id: rowId, category: 'extra', questionId, starred: false, score: '', attempts: '', note: '练习平台自动登记' }]
  const tasks = day.tasks.map((candidate, index) => index === taskIndex ? { ...task, rows } : candidate)
  return {
    days: days.map((candidate, index) => index === dayIndex ? { ...day, tasks } : candidate),
    status: 'added',
  }
}
