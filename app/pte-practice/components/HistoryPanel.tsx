'use client'

import { useState } from 'react'
import { CloudUpload, RotateCcw, Search } from 'lucide-react'
import { getTaskTypeMeta } from '../lib/taskTypes'
import { isAssessed, scoreSummary } from '../lib/score-display'
import { TASK_TYPES, type AttemptRecord, type TaskType } from '../types'

export default function HistoryPanel({
  attempts,
  onClear,
  onPractice,
  source = 'cloud',
  onSync,
  syncing = false,
}: {
  attempts: AttemptRecord[]
  onClear?: () => void
  /** 点击某条历史记录时，回到对应题目重新练习一次（可选，不传则记录仅作展示）。 */
  onPractice?: (taskType: TaskType, itemId: string) => void
  source?: 'cloud' | 'local' | 'mixed'
  onSync?: () => void
  syncing?: boolean
}) {
  const [query, setQuery] = useState('')
  const [task, setTask] = useState('all')
  const [limit, setLimit] = useState(20)
  const filtered = attempts.filter((attempt) =>
    (task === 'all' || attempt.taskType === task) &&
    `${attempt.itemId} ${getTaskTypeMeta(attempt.taskType).shortLabel}`.toLowerCase().includes(query.trim().toLowerCase())
  ).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))

  if (attempts.length === 0) {
    return <p className="empty-state">还没有练习记录，完成一次练习后会显示在这里。</p>
  }

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold">练习记录</h2>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex min-w-0 flex-1 items-center gap-2 rounded-md border p-2">
          <Search size={16} aria-hidden="true" />
          <input className="min-w-0 w-full bg-transparent" aria-label="搜索练习记录" placeholder="搜索题号或题型" value={query} onChange={(event) => { setQuery(event.target.value); setLimit(20) }} />
        </label>
        <select className="max-w-full rounded-md border bg-transparent p-2" aria-label="筛选记录题型" value={task} onChange={(event) => { setTask(event.target.value); setLimit(20) }}>
          <option value="all">全部题型</option>
          {TASK_TYPES.filter((type) => attempts.some((attempt) => attempt.taskType === type)).map((type) => <option key={type} value={type}>{getTaskTypeMeta(type).shortLabel}</option>)}
        </select>
      </div>
      <p className="text-sm text-gray-500" role="status">符合条件 {filtered.length} 条</p>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-gray-500">
          共 {attempts.length} 条记录（
          {source === 'cloud' ? '云端记录，可跨设备查看' : source === 'mixed' ? '包含仅保存在本机的记录，本机部分尚未同步' : '本机记录，不会同步到其他设备'}
          ）
        </p>
        <div className="flex flex-wrap gap-2">
          {source !== 'cloud' && onSync && <button type="button" className="pte-button" disabled={syncing} onClick={onSync}><CloudUpload size={15} />{syncing ? '同步中…' : '同步本机记录'}</button>}
          {source === 'local' && onClear && <button type="button" onClick={onClear} className="text-sm text-red-500 underline transition-colors hover:text-red-700">清空本机记录</button>}
        </div>
      </div>
      <ul className="space-y-2">
        {filtered.slice(0, limit).map((attempt) => {
          const meta = getTaskTypeMeta(attempt.taskType)
          const content = (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium text-gray-800 break-all">{meta.shortLabel} · {attempt.itemId}</span>
                <span className="text-xs text-gray-400">{new Date(attempt.createdAt).toLocaleString('zh-CN')}</span>
              </div>
              <p className="mt-1 text-xs text-gray-500">{scoreSummary(attempt.dimensions)}</p>
              <p className="mt-0.5 text-xs text-gray-400">用时 {Math.round(attempt.durationSeconds)} 秒 · 练习估分，非官方评分</p>
            </>
          )
          return (
            <li key={attempt.id} className="card-compact text-sm transition-shadow duration-150 hover:shadow-md">
              {content}
              <details className="mt-3">
                <summary className="cursor-pointer font-medium">查看反馈详情</summary>
                <p className="mt-2 whitespace-pre-wrap break-words">{attempt.summary}</p>
                <dl className="mt-2 space-y-3">
                  {attempt.dimensions.map((dimension, index) => <div key={`${dimension.id}-${index}`}>
                    <dt className="font-medium">{dimension.label} · {isAssessed(dimension) ? `${dimension.score}/${dimension.maxScore}` : '未评估'}{isAssessed(dimension) && dimension.isHeuristic ? '（估算）' : ''}</dt>
                    <dd className="mt-1 whitespace-pre-wrap break-words text-gray-500">{dimension.note}</dd>
                  </div>)}
                </dl>
              </details>
              {onPractice && <button type="button" className="pte-button mt-3" onClick={() => onPractice(attempt.taskType, attempt.itemId)}><RotateCcw size={15} />再练一次</button>}
            </li>
          )
        })}
      </ul>
      {filtered.length === 0 && <div className="empty-state"><p>没有符合条件的记录。</p><button type="button" className="pte-button mt-3" onClick={() => { setQuery(''); setTask('all'); setLimit(20) }}><RotateCcw size={15} />重置筛选</button></div>}
      {filtered.length > limit && <button type="button" className="pte-button" onClick={() => setLimit((value) => value + 20)}>加载更多（剩余 {filtered.length - limit} 条）</button>}
    </div>
  )
}
