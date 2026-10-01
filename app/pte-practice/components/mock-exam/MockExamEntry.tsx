'use client'

import { useState } from 'react'
import { DEFAULT_ITEMS_PER_TASK_TYPE, MOCK_EXAM_SECTIONS } from '../../lib/mockExam'
import { getTaskTypeMeta } from '../../lib/taskTypes'

export default function MockExamEntry({
  onStart,
  starting,
  error,
}: {
  onStart: () => void
  starting: boolean
  error: string | null
}) {
  const [estimatedMinutesPerPart] = useState(() =>
    MOCK_EXAM_SECTIONS.map((section) => {
      const seconds = section.taskTypes.reduce((sum, taskType) => {
        const meta = getTaskTypeMeta(taskType)
        return sum + (meta.timeLimitSeconds ?? 0) + (meta.prepSeconds ?? 0)
      }, 0)
      return Math.round((seconds * DEFAULT_ITEMS_PER_TASK_TYPE) / 60)
    })
  )

  const totalMinutes = estimatedMinutesPerPart.reduce((a, b) => a + b, 0)

  return (
    <div className="space-y-5">
      <div className="note-info">
        <span className="note-callout-icon" aria-hidden>ℹ️</span>
        <span>
          <strong>精简模拟练习</strong>：口语与写作 → 阅读 → 听力。当前覆盖 20 种题型，
          尚未包含 Summarize Group Discussion 和 Respond to a Situation，不是完整官方模考。
        </span>
      </div>

      <div className="note-warning">
        <span className="note-callout-icon" aria-hidden>⚠️</span>
        <span>
          为了让模考能在合理时间内练完，<strong>每种题型仅精简抽取 {DEFAULT_ITEMS_PER_TASK_TYPE} 道题</strong>，
          并非官方真实题量（真实考试同一题型可能出现更多题目，且总时长会更长）。所有分数仍为练习估分，不代表
          Pearson 官方评分。
        </span>
      </div>

      <div className="space-y-3">
        {MOCK_EXAM_SECTIONS.map((section, index) => (
          <div key={section.id} className="card-compact">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">{section.label}</h3>
              <span className="text-sm text-gray-500">约 {estimatedMinutesPerPart[index]} 分钟</span>
            </div>
            <ol className="mt-2 flex flex-wrap gap-2 text-xs text-gray-600">
              {section.taskTypes.map((taskType) => (
                <li key={taskType} className="rounded-full bg-gray-100 px-2.5 py-1">
                  {getTaskTypeMeta(taskType).shortLabel}
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>

      <div className="card-compact text-sm text-gray-700">
        预计总用时约 <strong>{totalMinutes} 分钟</strong>。当前版本不支持恢复模考进度；
        已提交的作答保留在练习记录，未提交的作答在离开后丢失。
      </div>

      {error && (
        <div className="note-error">
          <span className="note-callout-icon" aria-hidden>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <button type="button" onClick={onStart} disabled={starting} className="btn-primary w-full sm:w-auto">
        {starting ? '正在准备题目…' : '开始模拟考试'}
      </button>
    </div>
  )
}
