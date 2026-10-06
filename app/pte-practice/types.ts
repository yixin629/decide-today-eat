export const SKILLS = ['reading', 'listening', 'speaking', 'writing'] as const
export type PteSkill = (typeof SKILLS)[number]

export const TASK_TYPES = [
  'reading-mcq-single',
  'reading-mcq-multiple',
  'reading-reorder',
  'reading-fill-blanks-drag',
  'reading-fill-blanks-dropdown',
  'listening-fill-blanks-typed',
  'listening-highlight-summary',
  'listening-mcq-single',
  'listening-mcq-multiple',
  'listening-summarize-spoken-text',
  'listening-select-missing-word',
  'listening-highlight-incorrect-words',
  'listening-write-from-dictation',
  'speaking-read-aloud',
  'speaking-repeat-sentence',
  'speaking-describe-image',
  'speaking-retell-lecture',
  'speaking-answer-short-question',
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

export const QUESTION_SOURCE_TYPES = ['original', 'licensed', 'public-domain', 'user-provided'] as const
export type QuestionSourceType = (typeof QUESTION_SOURCE_TYPES)[number]
export const QUESTION_SOURCE_LABELS: Record<QuestionSourceType, string> = {
  original: '原创',
  licensed: '已授权',
  'public-domain': '公共领域',
  'user-provided': '用户自有',
}

export interface QuestionProvenance {
  sourceType: QuestionSourceType
  sourceTitle: string
  sourceUrl?: string
  rightsBasis: string
  commercialUseAllowed: true
  attestedAt: string
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

// ---- Reading: MCQ multiple answers ----
export interface McqMultipleItem {
  id: string
  taskType: 'reading-mcq-multiple'
  passage: string
  question: string
  options: string[]
  correctIndexes: number[]
}

// ---- Reading: Fill in the blanks (dropdown per blank) ----
export interface FillBlanksDropdownItem {
  id: string
  taskType: 'reading-fill-blanks-dropdown'
  textSegments: string[]
  blankOptions: string[][]
  correctAnswers: string[]
}

// ---- Listening: MCQ single / multiple answers ----
export interface ListeningMcqSingleItem {
  id: string
  taskType: 'listening-mcq-single'
  transcript: string
  question: string
  options: string[]
  correctIndex: number
}

export interface ListeningMcqMultipleItem {
  id: string
  taskType: 'listening-mcq-multiple'
  transcript: string
  question: string
  options: string[]
  correctIndexes: number[]
}

// ---- Listening: Summarize spoken text ----
export interface ListeningSummarizeItem {
  id: string
  taskType: 'listening-summarize-spoken-text'
  transcript: string
  minWords: number
  maxWords: number
}

// ---- Listening: Select missing word ----
export interface SelectMissingWordItem {
  id: string
  taskType: 'listening-select-missing-word'
  /** 完整录音文字稿（含结尾被省略的词/短语），仅用于语音合成播放，不直接展示给用户。 */
  fullTranscript: string
  /** 展示给用户的文字稿，结尾处的空缺用 "____" 占位。 */
  displayedTranscript: string
  options: string[]
  correctIndex: number
}

// ---- Listening: Highlight incorrect words ----
export interface HighlightIncorrectWordsItem {
  id: string
  taskType: 'listening-highlight-incorrect-words'
  /** 实际朗读的文字稿（用于语音合成播放）。 */
  audioTranscript: string
  /** 屏幕上展示的文字稿单词数组，其中部分单词与实际朗读内容不同。 */
  displayedWords: string[]
  /** displayedWords 中与实际朗读不符的单词下标。 */
  incorrectWordIndexes: number[]
}

// ---- Listening: Write from dictation ----
export interface WriteFromDictationItem {
  id: string
  taskType: 'listening-write-from-dictation'
  sentence: string
}

// ---- Speaking: Repeat sentence ----
export interface RepeatSentenceItem {
  id: string
  taskType: 'speaking-repeat-sentence'
  text: string
}

// ---- Speaking: Describe image ----
export interface DescribeImageChart {
  type: 'bar' | 'line'
  title: string
  categories: string[]
  values: number[]
  unit?: string
}

export interface DescribeImageItem {
  id: string
  taskType: 'speaking-describe-image'
  chart: DescribeImageChart
  /** 供内容维度做关键词覆盖率估算的参考描述文本，不展示给用户。 */
  referenceDescription: string
  prepSeconds: number
}

// ---- Speaking: Retell lecture ----
export interface RetellLectureItem {
  id: string
  taskType: 'speaking-retell-lecture'
  transcript: string
  prepSeconds: number
}

// ---- Speaking: Answer short question ----
export interface AnswerShortQuestionItem {
  id: string
  taskType: 'speaking-answer-short-question'
  question: string
  /** 任一均判定为正确（不区分大小写、忽略标点）。 */
  acceptableAnswers: string[]
}

type PracticeItemContent =
  | McqSingleItem
  | ReorderItem
  | FillBlanksDragItem
  | ListeningFillBlanksItem
  | HighlightSummaryItem
  | ReadAloudItem
  | WritingItem
  | McqMultipleItem
  | FillBlanksDropdownItem
  | ListeningMcqSingleItem
  | ListeningMcqMultipleItem
  | ListeningSummarizeItem
  | SelectMissingWordItem
  | HighlightIncorrectWordsItem
  | WriteFromDictationItem
  | RepeatSentenceItem
  | DescribeImageItem
  | RetellLectureItem
  | AnswerShortQuestionItem

export type PracticeItem = PracticeItemContent & { provenance?: QuestionProvenance }

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
  | { taskType: 'reading-mcq-multiple'; selectedIndexes: number[] }
  | { taskType: 'reading-fill-blanks-dropdown'; answers: string[] }
  | { taskType: 'listening-mcq-single'; selectedIndex: number | null }
  | { taskType: 'listening-mcq-multiple'; selectedIndexes: number[] }
  | { taskType: 'listening-summarize-spoken-text'; text: string; secondsUsed: number }
  | { taskType: 'listening-select-missing-word'; selectedIndex: number | null }
  | { taskType: 'listening-highlight-incorrect-words'; selectedWordIndexes: number[] }
  | { taskType: 'listening-write-from-dictation'; text: string }
  | {
      taskType: 'speaking-repeat-sentence' | 'speaking-retell-lecture' | 'speaking-describe-image'
      recordingSeconds: number
      recognizedTranscript: string | null
      audioBlob?: Blob | null
    }
  | { taskType: 'speaking-answer-short-question'; recordingSeconds: number; recognizedTranscript: string | null; audioBlob?: Blob | null }

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
