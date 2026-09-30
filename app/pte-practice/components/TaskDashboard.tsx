'use client'

import { useEffect, useState } from 'react'
import { TASK_TYPE_META } from '../lib/taskTypes'
import { getItemsForTaskType } from '../lib/questionBank'
import { loadItemsForTaskType } from '../lib/item-repository'
import { SKILLS, TASK_TYPES } from '../types'
import type { TaskType } from '../types'

const SKILL_LABELS: Record<(typeof SKILLS)[number], string> = {
  reading: '阅读 Reading',
  listening: '听力 Listening',
  speaking: '口语 Speaking',
  writing: '写作 Writing',
}

function initialCounts(): Record<TaskType, number> {
  const counts = {} as Record<TaskType, number>
  TASK_TYPES.forEach((taskType) => {
    counts[taskType] = getItemsForTaskType(taskType).length
  })
  return counts
}

export default function TaskDashboard({ onSelectTaskType }: { onSelectTaskType: (taskType: TaskType) => void }) {
  // 先用本地题库的数量做初始展示（瞬时可用，不用等网络），随后异步向 Supabase
  // 查询每个题型的真实题量并覆盖——这样云端题库新增题目后，这里的计数会
  // 跟着变化，不会一直停留在本地静态文件的数字上。
  const [counts, setCounts] = useState<Record<TaskType, number>>(initialCounts)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const entries = await Promise.all(
        TASK_TYPES.map(async (taskType) => {
          const { items } = await loadItemsForTaskType(taskType)
          return [taskType, items.length] as const
        })
      )
      if (cancelled) return
      setCounts((prev) => {
        const next = { ...prev }
        entries.forEach(([taskType, count]) => {
          next[taskType] = count
        })
        return next
      })
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="space-y-8">
      {SKILLS.map((skill) => {
        const tasksInSkill = TASK_TYPES.filter((taskType) => TASK_TYPE_META[taskType].skill === skill)
        return (
          <section key={skill}>
            <h2 className="mb-3 text-base font-semibold text-gray-900">{SKILL_LABELS[skill]}</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {tasksInSkill.map((taskType) => {
                const meta = TASK_TYPE_META[taskType]
                const itemCount = counts[taskType]
                return (
                  <button
                    key={taskType}
                    type="button"
                    onClick={() => onSelectTaskType(taskType)}
                    disabled={itemCount === 0}
                    className="flex flex-col items-start gap-1 rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition-shadow hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="font-medium text-gray-900">{meta.shortLabel}</span>
                    <span className="text-xs text-gray-500">{meta.description}</span>
                    <span className="mt-1 text-xs text-gray-400">
                      {itemCount > 0 ? `${itemCount} 道练习题` : '题库准备中'}
                      {meta.timeLimitSeconds !== null && ` · 限时 ${Math.round(meta.timeLimitSeconds / 60)} 分钟`}
                    </span>
                  </button>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}
