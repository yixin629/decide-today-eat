export const SKILLS = ['reading', 'listening', 'speaking', 'writing'] as const
export type PteSkill = (typeof SKILLS)[number]

export const TASK_TYPES = [
  'reading-mcq-single',
  'reading-reorder',
  'reading-fill-blanks-drag',
  'listening-fill-blanks-typed',
  'listening-highlight-summary',
  'speaking-read-aloud',
  'writing-summarize-text',
  'writing-essay',
] as const
export type TaskType = (typeof TASK_TYPES)[number]

export interface TaskTypeMeta {
  id: TaskType
  skill: PteSkill
  label: string
  shortLabel: string
  description: string
  timeLimitSeconds: number | null
  prepSeconds?: number
  scoringDimensions: ScoreDimensionMeta[]
  officialNote: string
}

export interface ScoreDimensionMeta {
  id: string
  label: string
  maxScore: number
  isHeuristic: boolean
}

export interface ScoreDimensionResult {
  id: string
  label: string
  score: number
  maxScore: number
  isHeuristic: boolean
  note: string
}

// ---- Reading: MCQ single answer ----
export interface McqSingleItem {
  id: string
  taskType: 'reading-mcq-single'
  passage: string
  question: string
  options: string[]
  correctIndex: number
}

// ---- Reading: Reorder paragraphs ----
export interface ReorderItem {
  id: string
  taskType: 'reading-reorder'
  paragraphs: string[]
  correctOrder: number[]
}

// ---- Reading: Fill in the blanks (drag word) ----
export interface FillBlanksDragItem {
  id: string
  taskType: 'reading-fill-blanks-drag'
  textSegments: string[]
  blankCount: number
  wordBank: string[]
  correctAnswers: string[]
}

// ---- Listening: Fill in the blanks (typed) ----
export interface ListeningFillBlanksItem {
  id: string
  taskType: 'listening-fill-blanks-typed'
  transcript: string
  textSegments: string[]
  correctAnswers: string[]
}

// ---- Listening: Highlight correct summary ----
export interface HighlightSummaryItem {
  id: string
  taskType: 'listening-highlight-summary'
  transcript: string
  question: string
  options: string[]
  correctIndex: number
}

// ---- Speaking: Read aloud ----
export interface ReadAloudItem {
  id: string
  taskType: 'speaking-read-aloud'
  text: string
}

// ---- Writing: Summarize written text / Essay ----
export interface WritingItem {
  id: string
  taskType: 'writing-summarize-text' | 'writing-essay'
  prompt: string
  sourceText?: string
  minWords: number
  maxWords: number
}

export type PracticeItem =
  | McqSingleItem
  | ReorderItem
  | FillBlanksDragItem
  | ListeningFillBlanksItem
  | HighlightSummaryItem
  | ReadAloudItem
  | WritingItem

export type AnswerPayload =
  | { taskType: 'reading-mcq-single'; selectedIndex: number | null }
  | { taskType: 'reading-reorder'; order: number[] }
  | { taskType: 'reading-fill-blanks-drag'; answers: string[] }
  | { taskType: 'listening-fill-blanks-typed'; answers: string[] }
  | { taskType: 'listening-highlight-summary'; selectedIndex: number | null }
  | {
      taskType: 'speaking-read-aloud'
      recordingSeconds: number
      recognizedTranscript: string | null
      /**
       * 录音文件，仅用于临时提交给自托管评分服务（见 pte-scoring-service/）
       * 做转写与发音评估，不落库、不持久化。评分服务未配置时忽略此字段。
       */
      audioBlob?: Blob | null
    }
  | { taskType: 'writing-summarize-text' | 'writing-essay'; text: string; secondsUsed: number }

export interface AttemptRecord {
  id: string
  taskType: TaskType
  itemId: string
  createdAt: string
  durationSeconds: number
  dimensions: ScoreDimensionResult[]
  summary: string
  isEstimate: true
  /** 记录归属的网站身份（'zyx' | 'zly'）。云端记录一定有值；本地回退记录可能缺失。 */
  userId?: string
}

export interface PracticeComment {
  id: string
  itemId: string
  taskType: TaskType
  userId: string
  body: string
  examLocation: string | null
  examDate: string | null
  createdAt: string
}
