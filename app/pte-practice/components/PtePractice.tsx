'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { clearLocalAttempts, loadAttempts } from '../lib/attempt-repository'
import { loadItemsForTaskType } from '../lib/item-repository'
import { getTaskTypeMeta } from '../lib/taskTypes'
import type { AttemptRecord, PracticeItem, TaskType } from '../types'
import CommunityFeed from './CommunityFeed'
import HistoryPanel from './HistoryPanel'
import PracticeSession from './PracticeSession'
import TaskDashboard from './TaskDashboard'

type View = { name: 'dashboard' } | { name: 'pick-item'; taskType: TaskType } | { name: 'session'; taskType: TaskType; itemId: string }
type Tab = 'practice' | 'mine' | 'feed'

export default function PtePractice() {
  const { user } = useAuth()
  const [tab, setTab] = useState<Tab>('practice')
  const [view, setView] = useState<View>({ name: 'dashboard' })
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0)

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-sm text-blue-800">
        这是一套<strong>原创练习题</strong>，参考 PTE 公开题型格式自行编写，并非 Pearson 官方真题或&ldquo;机经&rdquo;，所有分数均为练习估分，仅供自我训练参考。
      </div>

      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
        <TabButton active={tab === 'practice'} onClick={() => setTab('practice')} label="题型练习" />
        <TabButton active={tab === 'mine'} onClick={() => setTab('mine')} label="我的练习" />
        <TabButton active={tab === 'feed'} onClick={() => setTab('feed')} label="练习集锦" />
      </div>

      {tab === 'practice' && (
        <>
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
              userId={user}
              onExit={() => setView({ name: 'dashboard' })}
              onAttemptSaved={() => setHistoryRefreshKey((key) => key + 1)}
            />
          )}
        </>
      )}

      {tab === 'mine' && <MyHistoryTab userId={user} refreshKey={historyRefreshKey} />}

      {tab === 'feed' && <CommunityFeed currentUserId={user} />}
    </div>
  )
}

function TabButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-1.5 text-sm font-medium ${active ? 'bg-primary text-white' : 'text-gray-500'}`}
    >
      {label}
    </button>
  )
}

function MyHistoryTab({ userId, refreshKey }: { userId: string | null; refreshKey: number }) {
  const [state, setState] = useState<{ attempts: AttemptRecord[]; loading: boolean; error: string | null; source: 'cloud' | 'local' }>({
    attempts: [],
    loading: true,
    error: null,
    source: 'local',
  })

  useEffect(() => {
    let cancelled = false
    setState((prev) => ({ ...prev, loading: true }))
    loadAttempts(userId).then((result) => {
      if (cancelled) return
      setState({ attempts: result.attempts, loading: false, error: result.error, source: result.source })
    })
    return () => {
      cancelled = true
    }
  }, [userId, refreshKey])

  if (!userId) {
    return (
      <p className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-400">
        未识别登录身份，暂时只能显示本机练习记录。
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {state.error && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
          {state.error}
        </p>
      )}
      {state.loading ? (
        <p className="text-sm text-gray-400">加载中…</p>
      ) : (
        <HistoryPanel
          attempts={state.attempts}
          source={state.source}
          onClear={() => {
            clearLocalAttempts()
            setState((prev) => ({ ...prev, attempts: prev.source === 'local' ? [] : prev.attempts }))
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
  const [state, setState] = useState<{ items: PracticeItem[]; loading: boolean; error: string | null }>({
    items: [],
    loading: true,
    error: null,
  })

  useEffect(() => {
    let cancelled = false
    setState({ items: [], loading: true, error: null })
    loadItemsForTaskType(taskType).then((result) => {
      if (cancelled) return
      setState({ items: result.items, loading: false, error: result.error })
    })
    return () => {
      cancelled = true
    }
  }, [taskType])

  return (
    <div className="space-y-4">
      <button type="button" onClick={onBack} className="text-sm text-gray-500 underline">
        ← 返回题型列表
      </button>
      <h2 className="text-lg font-semibold text-gray-900">{meta.label}</h2>
      <p className="text-sm text-gray-500">{meta.description}</p>
      {state.error && <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">{state.error}</p>}
      {state.loading ? (
        <p className="text-sm text-gray-400">加载题库中…</p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {state.items.map((item, index) => (
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
      )}
    </div>
  )
}
