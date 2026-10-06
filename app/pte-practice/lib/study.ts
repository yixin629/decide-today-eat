import { QUESTION_SOURCE_LABELS, type AttemptRecord, type PracticeItem, type PteSkill, type TaskType } from '../types'

export const SKILL_NAMES: Record<PteSkill, string> = { speaking: '口语', writing: '写作', reading: '阅读', listening: '听力' }
export const STUDY_SKILLS: PteSkill[] = ['speaking', 'writing', 'reading', 'listening']
export const TASK_CODES: Record<TaskType, string> = {
  'speaking-read-aloud': 'RA', 'speaking-repeat-sentence': 'RS', 'speaking-describe-image': 'DI',
  'speaking-retell-lecture': 'RL', 'speaking-answer-short-question': 'ASQ',
  'writing-summarize-text': 'SWT', 'writing-essay': 'WE',
  'reading-mcq-single': 'MCS', 'reading-mcq-multiple': 'MCM', 'reading-reorder': 'RO',
  'reading-fill-blanks-drag': 'FIB', 'reading-fill-blanks-dropdown': 'FIB-D',
  'listening-fill-blanks-typed': 'FIB-L', 'listening-highlight-summary': 'HCS',
  'listening-mcq-single': 'MCS-L', 'listening-mcq-multiple': 'MCM-L',
  'listening-summarize-spoken-text': 'SST', 'listening-select-missing-word': 'SMW',
  'listening-highlight-incorrect-words': 'HIW', 'listening-write-from-dictation': 'WFD',
}

/**
 * 题目来源标签：登记了 provenance 的按登记类型显示；内置题库均为原创练习；
 * 早于来源登记功能上传的自定义题目不做推断，显示"来源未登记"。
 */
export function itemSourceLabel(item: PracticeItem, isCustom: boolean) {
  if (item.provenance) return QUESTION_SOURCE_LABELS[item.provenance.sourceType]
  return isCustom ? '来源未登记' : QUESTION_SOURCE_LABELS.original
}

export function itemKey(item: { taskType: TaskType; id: string }) {
  return `${item.taskType}:${item.id}`
}

export function attemptKey(attempt: AttemptRecord) {
  return itemKey({ taskType: attempt.taskType, id: attempt.itemId })
}

// Listening previews avoid revealing the sentence being tested before the attempt.
export function itemPreview(item: PracticeItem): string {
  if ('passage' in item) return item.passage
  if ('chart' in item) return item.chart.title
  if ('sourceText' in item && item.sourceText) return item.sourceText
  if ('prompt' in item) return item.prompt
  if ('textSegments' in item) return item.textSegments.join(' ____ ')
  if ('paragraphs' in item) return item.paragraphs[0] ?? '段落排序'
  if (item.taskType === 'speaking-read-aloud') return item.text
  return '听力与口语素材 · 进入练习后播放'
}

export function objectivePercent(attempt: AttemptRecord): number | null {
  const dimensions = attempt.dimensions.filter((d) => !d.isHeuristic && d.maxScore > 0)
  const max = dimensions.reduce((n, d) => n + d.maxScore, 0)
  return max ? Math.round(dimensions.reduce((n, d) => n + d.score, 0) / max * 100) : null
}

export function latestByItem(attempts: AttemptRecord[]) {
  const latest = new Map<string, AttemptRecord>()
  for (const attempt of attempts) {
    const key = attemptKey(attempt)
    const previous = latest.get(key)
    if (!previous || Date.parse(attempt.createdAt) > Date.parse(previous.createdAt)) latest.set(key, attempt)
  }
  return latest
}

export function needsReview(attempt: AttemptRecord | undefined) {
  if (!attempt) return false
  return attempt.dimensions.some((d) => !d.isHeuristic && d.id === 'content' && d.maxScore > 0 && d.score < d.maxScore)
}

export function sameDay(iso: string, date = new Date()) {
  return new Date(iso).toDateString() === date.toDateString()
}

export function formatDuration(seconds: number) {
  return seconds < 60 ? `${Math.round(seconds)} 秒` : `${Math.floor(seconds / 60)} 分 ${Math.round(seconds % 60)} 秒`
}
