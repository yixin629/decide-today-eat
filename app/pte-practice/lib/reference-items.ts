import type { PracticeItem, TaskType } from '../types'

const SOURCE_CODE_BY_TASK: Partial<Record<TaskType, string>> = {
  'speaking-read-aloud': 'RA', 'speaking-repeat-sentence': 'RS', 'speaking-describe-image': 'DI',
  'speaking-retell-lecture': 'RL', 'speaking-answer-short-question': 'ASQ',
  'speaking-summarize-group-discussion': 'SGD', 'writing-summarize-text': 'SWT', 'writing-essay': 'WE',
  'reading-mcq-single': 'MCSR', 'reading-mcq-multiple': 'MCMR', 'reading-reorder': 'RO',
  'reading-fill-blanks-drag': 'FIBD&D', 'reading-fill-blanks-dropdown': 'FIB',
  'listening-fill-blanks-typed': 'FIBL', 'listening-highlight-summary': 'HCS',
  'listening-mcq-single': 'MCSL', 'listening-mcq-multiple': 'MCML',
  'listening-summarize-spoken-text': 'SST', 'listening-select-missing-word': 'SMW',
  'listening-highlight-incorrect-words': 'HIW', 'listening-write-from-dictation': 'WFD',
}

export function sourceCodeForTask(taskType: TaskType) {
  return SOURCE_CODE_BY_TASK[taskType] ?? null
}

export interface ReferenceQuestion {
  question_code: string
  source_number: number
  title: string
  question_text: string
  answer_text: string
  source_pages: Record<string, number>
  review_status: 'needs-review' | 'reviewed' | 'incomplete'
}

export function referencePracticeId(row: Pick<ReferenceQuestion, 'question_code' | 'source_number'>) {
  return `ref-${row.question_code}-${row.source_number}`
}

export function referenceToPracticeItem(row: ReferenceQuestion): PracticeItem | null {
  if (row.review_status === 'incomplete') return null

  const blocks = row.question_text.trim().split(/\r?\n\s*\r?\n/).map((block) => block.trim()).filter(Boolean)
  const firstLine = blocks[0]?.split(/\r?\n/)[0]?.trim() ?? ''
  const id = referencePracticeId(row)

  if (row.question_code === 'WFD' || row.question_code === 'RS') {
    // The PDF extraction sometimes appends a translated answer list after a blank line.
    if (!/^[\x20-\x7E]+$/.test(firstLine) || firstLine.length < 15 || firstLine.length > 220) return null
    if (row.question_code === 'WFD') return { id, taskType: 'listening-write-from-dictation', sentence: firstLine }
    return { id, taskType: 'speaking-repeat-sentence', text: firstLine }
  }

  if (row.question_code === 'RA') {
    const passage = blocks.length > 1 ? blocks.slice(1).join(' ') : blocks[0] ?? ''
    const text = passage.replace(/\s+/g, ' ').trim()
    if (text.length < 80 || text.length > 1800 || /[\u3400-\u9fff]/u.test(text)) return null
    return { id, taskType: 'speaking-read-aloud', text }
  }

  return null
}
