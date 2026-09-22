'use client'

import { useEffect, useState } from 'react'
import { clearAttempts, loadAttempts } from '../lib/attempt-repository'
import { getItemsForTaskType } from '../lib/questionBank'
import { getTaskTypeMeta } from '../lib/taskTypes'
import type { AttemptRecord, TaskType } from '../types'
import HistoryPanel from './HistoryPanel'
import PracticeSession from './PracticeSession'
import TaskDashboard from './TaskDashboard'

type View = { name: 'dashboard' } | { name: 'pick-item'; taskType: TaskType } | { name: 'session'; taskType: TaskType; itemId: string } | { name: 'history' }

export default function PtePractice() {
  const [view, setView] = useState<View>({ name: 'dashboard' })
  const [attempts, setAttempts] = useState<AttemptRecord[]>([])

  useEffect(() => {
    setAttempts(loadAttempts())
  }, [])

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-sm text-blue-800">
        这是一套<strong>原创练习题</strong>，参考 PTE 公开题型格式自行编写，并非 Pearson 官方真题或&ldquo;机经&rdquo;，所有分数均为练习估分，仅供自我训练参考。
      </div>

      <div className="flex gap-2 border-b border-gray-200 pb-2">
        <button
          type="button"
          onClick={() => setView({ name: 'dashboard' })}
          className={`rounded-full px-4 py-1.5 text-sm font-medium ${view.name !== 'history' ? 'bg-primary text-white' : 'text-gray-500'}`}
        >
          题型练习
        </button>
        <button
          type="button"
          onClick={() => setView({ name: 'history' })}
          className={`rounded-full px-4 py-1.5 text-sm font-medium ${view.name === 'history' ? 'bg-primary text-white' : 'text-gray-500'}`}
        >
          练习记录
        </button>
      </div>

      {view.name === 'dashboard' && <TaskDashboard onSelectTaskType={(taskType) => setView({ name: 'pick-item', taskType })} />}

      {view.name === 'pick-item' && (
        <ItemPicker
          taskType={view.taskType}
          onBack={() => setView({ name: 'dashboard' })}
          onSelectItem={(itemId) => setView({ name: 'session', taskType: view.taskType, itemId })}
        />
      )}

      {view.name === 'session' && (
        <PracticeSession
          taskType={view.taskType}
          itemId={view.itemId}
          onExit={() => setView({ name: 'dashboard' })}
          onAttemptSaved={setAttempts}
        />
      )}

      {view.name === 'history' && (
        <HistoryPanel
          attempts={attempts}
          onClear={() => {
            clearAttempts()
            setAttempts([])
          }}
        />
      )}
    </div>
  )
}

function ItemPicker({
  taskType,
  onBack,
  onSelectItem,
}: {
  taskType: TaskType
  onBack: () => void
  onSelectItem: (itemId: string) => void
}) {
  const meta = getTaskTypeMeta(taskType)
  const items = getItemsForTaskType(taskType)

  return (
    <div className="space-y-4">
      <button type="button" onClick={onBack} className="text-sm text-gray-500 underline">
        ← 返回题型列表
      </button>
      <h2 className="text-lg font-semibold text-gray-900">{meta.label}</h2>
      <p className="text-sm text-gray-500">{meta.description}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectItem(item.id)}
            className="rounded-lg border border-gray-200 bg-white p-3 text-left text-sm shadow-sm hover:shadow-md"
          >
            练习 {index + 1}
          </button>
        ))}
      </div>
    </div>
  )
}
