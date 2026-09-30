import type { TaskType } from '../types'

/**
 * 模拟考试（Mock Exam）题型顺序定义。
 *
 * 顺序依据 Pearson 官方公开的 PTE Academic 2026 版考试结构说明：
 * 全程连续进行，不再安排可选的 10 分钟休息；
 * Part 1 口语与写作 → Part 2 阅读 → Part 3 听力，且各 Part 内部题型顺序固定。
 *
 * 重要声明：真实考试每种题型出现的题量因场次而异（例如 Read Aloud 往往有
 * 多道）。为了让模考在合理时间内可练习完成，本模块对每种题型固定抽取少量
 * 题目（见 DEFAULT_ITEMS_PER_TASK_TYPE），并非官方真实题量，UI 中必须明确
 * 提示"精简题量，非官方真实题量"。
 */

export interface MockExamSection {
  id: 'speaking-writing' | 'reading' | 'listening'
  label: string
  shortLabel: string
  taskTypes: TaskType[]
}

export const MOCK_EXAM_SECTIONS: MockExamSection[] = [
  {
    id: 'speaking-writing',
    label: 'Part 1 · 口语与写作 Speaking & Writing',
    shortLabel: 'Part 1',
    taskTypes: [
      'speaking-read-aloud',
      'speaking-repeat-sentence',
      'speaking-describe-image',
      'speaking-retell-lecture',
      'speaking-answer-short-question',
      'writing-summarize-text',
      'writing-essay',
    ],
  },
  {
    id: 'reading',
    label: 'Part 2 · 阅读 Reading',
    shortLabel: 'Part 2',
    taskTypes: [
      'reading-fill-blanks-dropdown',
      'reading-mcq-multiple',
      'reading-reorder',
      'reading-fill-blanks-drag',
      'reading-mcq-single',
    ],
  },
  {
    id: 'listening',
    label: 'Part 3 · 听力 Listening',
    shortLabel: 'Part 3',
    taskTypes: [
      'listening-summarize-spoken-text',
      'listening-mcq-multiple',
      'listening-fill-blanks-typed',
      'listening-highlight-summary',
      'listening-mcq-single',
      'listening-select-missing-word',
      'listening-highlight-incorrect-words',
      'listening-write-from-dictation',
    ],
  },
]

/** 每种题型默认抽取的题目数量，精简自真实考试题量，仅供模拟练习使用。 */
export const DEFAULT_ITEMS_PER_TASK_TYPE = 2
