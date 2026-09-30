import { loadItemsForTaskType } from '../lib/item-repository'
import { DEFAULT_ITEMS_PER_TASK_TYPE, MOCK_EXAM_SECTIONS, type MockExamSection } from '../lib/mockExam'
import { getTaskTypeMeta } from '../lib/taskTypes'
import type { TaskType } from '../types'

export interface MockExamStep {
  taskType: TaskType
  itemId: string
  sectionId: MockExamSection['id']
  sectionLabel: string
  sectionShortLabel: string
  indexInSection: number
  totalInSection: number
  globalIndex: number
  totalGlobal: number
  /** 该题在时间预算中的估算秒数（时间限制 + 准备时间，取自 taskTypes.ts 元数据）。 */
  estimatedSeconds: number
}

export interface MockExamRun {
  steps: MockExamStep[]
  totalEstimatedSeconds: number
  itemsPerTaskType: number
  loadWarnings: string[]
}

function estimateSecondsForTaskType(taskType: TaskType): number {
  const meta = getTaskTypeMeta(taskType)
  // 客观题/写作等 timeLimitSeconds 已覆盖全部作答时间；口语类需加上准备时间。
  return (meta.timeLimitSeconds ?? 0) + (meta.prepSeconds ?? 0)
}

/**
 * 构建一次具体的模拟考试题目序列：按官方公开的 Part 1 → Part 2 → Part 3、
 * 题型顺序，为每种题型从现有题库中抽取固定数量的题目（不足则循环复用现有
 * 题目，不等待题库扩充，也不重复造题）。
 */
export async function buildMockExamRun(itemsPerTaskType: number = DEFAULT_ITEMS_PER_TASK_TYPE): Promise<MockExamRun> {
  const steps: MockExamStep[] = []
  const loadWarnings: string[] = []
  let totalEstimatedSeconds = 0

  for (const section of MOCK_EXAM_SECTIONS) {
    for (const taskType of section.taskTypes) {
      const result = await loadItemsForTaskType(taskType)
      if (result.error) {
        loadWarnings.push(`${getTaskTypeMeta(taskType).shortLabel}: ${result.error}`)
      }
      const pool = result.items
      if (pool.length === 0) {
        loadWarnings.push(`${getTaskTypeMeta(taskType).shortLabel}: 题库为空，模考中已跳过该题型。`)
        continue
      }
      const perTypeSeconds = estimateSecondsForTaskType(taskType)
      for (let i = 0; i < itemsPerTaskType; i += 1) {
        // 题库题目数量少于抽取数量时循环复用已有题目，而不是等待题库扩充。
        const item = pool[i % pool.length]
        steps.push({
          taskType,
          itemId: item.id,
          sectionId: section.id,
          sectionLabel: section.label,
          sectionShortLabel: section.shortLabel,
          indexInSection: 0,
          totalInSection: 0,
          globalIndex: 0,
          totalGlobal: 0,
          estimatedSeconds: perTypeSeconds,
        })
        totalEstimatedSeconds += perTypeSeconds
      }
    }
  }

  // 回填每个 Section / 全局的序号与总数。
  const totalGlobal = steps.length
  const sectionCounts = new Map<string, number>()
  for (const step of steps) {
    sectionCounts.set(step.sectionId, (sectionCounts.get(step.sectionId) ?? 0) + 1)
  }
  const sectionRunningIndex = new Map<string, number>()
  steps.forEach((step, index) => {
    const nextIndex = (sectionRunningIndex.get(step.sectionId) ?? 0) + 1
    sectionRunningIndex.set(step.sectionId, nextIndex)
    step.indexInSection = nextIndex
    step.totalInSection = sectionCounts.get(step.sectionId) ?? nextIndex
    step.globalIndex = index + 1
    step.totalGlobal = totalGlobal
  })

  return { steps, totalEstimatedSeconds, itemsPerTaskType, loadWarnings }
}

export function formatEstimatedDuration(totalSeconds: number): string {
  const minutes = Math.round(totalSeconds / 60)
  if (minutes < 60) return `约 ${minutes} 分钟`
  const hours = Math.floor(minutes / 60)
  const remainMinutes = minutes % 60
  return remainMinutes > 0 ? `约 ${hours} 小时 ${remainMinutes} 分钟` : `约 ${hours} 小时`
}
