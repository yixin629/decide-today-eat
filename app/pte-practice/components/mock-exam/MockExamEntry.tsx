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
      <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-sm text-blue-800">
        模拟考试按 <strong>PTE Academic 2026 版</strong> 公开的考试结构连续进行：Part 1 口语与写作 → Part 2
        阅读 → Part 3 听力，中途<strong>不安排可选休息</strong>（与 2026 版真实考试一致）。
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        为了让模考能在合理时间内练完，<strong>每种题型仅精简抽取 {DEFAULT_ITEMS_PER_TASK_TYPE} 道题</strong>，
        并非官方真实题量（真实考试同一题型可能出现更多题目，且总时长会更长）。所有分数仍为练习估分，不代表
        Pearson 官方评分。
      </div>

      <div className="space-y-3">
        {MOCK_EXAM_SECTIONS.map((section, index) => (
          <div key={section.id} className="rounded-xl border border-gray-200 bg-white p-4">
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

      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
        预计总用时约 <strong>{totalMinutes} 分钟</strong>（精简版；官方完整版约 2 小时 15 分钟）。开始后请勿刷新或关闭
        页面——当前版本不支持中途退出后恢复进度，刷新会丢失本次模考记录。
      </div>

      {error && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">{error}</p>}

      <button
        type="button"
        onClick={onStart}
        disabled={starting}
        className="w-full rounded-lg bg-primary py-2.5 font-medium text-white disabled:opacity-60 sm:w-auto sm:px-8"
      >
        {starting ? '正在准备题目…' : '开始模拟考试'}
      </button>
    </div>
  )
}
