import { TASK_TYPE_META } from '../lib/taskTypes'
import { getItemsForTaskType } from '../lib/questionBank'
import { SKILLS, TASK_TYPES } from '../types'
import type { TaskType } from '../types'

const SKILL_LABELS: Record<(typeof SKILLS)[number], string> = {
  reading: '阅读 Reading',
  listening: '听力 Listening',
  speaking: '口语 Speaking',
  writing: '写作 Writing',
}

export default function TaskDashboard({ onSelectTaskType }: { onSelectTaskType: (taskType: TaskType) => void }) {
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
                const itemCount = getItemsForTaskType(taskType).length
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
