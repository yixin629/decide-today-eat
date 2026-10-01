import { getTaskTypeMeta } from '../lib/taskTypes'
import { scoreSummary } from '../lib/score-display'
import type { AttemptRecord, TaskType } from '../types'

export default function HistoryPanel({
  attempts,
  onClear,
  onPractice,
  source = 'cloud',
}: {
  attempts: AttemptRecord[]
  onClear?: () => void
  /** 点击某条历史记录时，回到对应题目重新练习一次（可选，不传则记录仅作展示）。 */
  onPractice?: (taskType: TaskType, itemId: string) => void
  source?: 'cloud' | 'local'
}) {
  if (attempts.length === 0) {
    return <p className="empty-state">还没有练习记录，完成一次练习后会显示在这里。</p>
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-gray-500">
          共 {attempts.length} 条记录（
          {source === 'cloud' ? '已同步到云端，可跨设备查看' : '当前保存在本机浏览器，不会同步到其他设备'}
          ）
        </p>
        {source === 'local' && onClear && (
          <button type="button" onClick={onClear} className="text-sm text-red-500 underline transition-colors hover:text-red-700">
            清空本机记录
          </button>
        )}
      </div>
      <ul className="space-y-2">
        {attempts.map((attempt) => {
          const meta = getTaskTypeMeta(attempt.taskType)
          const content = (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium text-gray-800">{meta.shortLabel}</span>
                <span className="text-xs text-gray-400">{new Date(attempt.createdAt).toLocaleString('zh-CN')}</span>
              </div>
              <p className="mt-1 text-xs text-gray-500">{scoreSummary(attempt.dimensions)}</p>
              <p className="mt-0.5 text-xs text-gray-400">用时 {Math.round(attempt.durationSeconds)} 秒 · 练习估分，非官方评分</p>
            </>
          )
          return (
            <li key={attempt.id} className="card-compact text-sm transition-shadow duration-150 hover:shadow-md">
              {onPractice ? (
                <button type="button" className="w-full text-left" onClick={() => onPractice(attempt.taskType, attempt.itemId)}>
                  {content}
                </button>
              ) : (
                content
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
