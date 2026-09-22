import { getTaskTypeMeta } from '../lib/taskTypes'
import type { AttemptRecord } from '../types'

export default function HistoryPanel({
  attempts,
  onClear,
  source = 'cloud',
}: {
  attempts: AttemptRecord[]
  onClear: () => void
  source?: 'cloud' | 'local'
}) {
  if (attempts.length === 0) {
    return <p className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-400">还没有练习记录，完成一次练习后会显示在这里。</p>
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          共 {attempts.length} 条记录（
          {source === 'cloud' ? '已同步到云端，可跨设备查看' : '当前保存在本机浏览器，不会同步到其他设备'}
          ）
        </p>
        {source === 'local' && (
          <button type="button" onClick={onClear} className="text-sm text-red-500 underline">
            清空本机记录
          </button>
        )}
      </div>
      <ul className="space-y-2">
        {attempts.map((attempt) => {
          const meta = getTaskTypeMeta(attempt.taskType)
          return (
            <li key={attempt.id} className="rounded-lg border border-gray-200 bg-white p-3 text-sm shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-800">{meta.shortLabel}</span>
                <span className="text-xs text-gray-400">{new Date(attempt.createdAt).toLocaleString('zh-CN')}</span>
              </div>
              <p className="mt-1 text-xs text-gray-500">{attempt.summary}</p>
              <p className="mt-0.5 text-xs text-gray-400">用时 {Math.round(attempt.durationSeconds)} 秒 · 练习估分，非官方评分</p>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
