'use client'

import Link from 'next/link'
import { ArrowRight, CalendarCheck2, Check, Clock3, ListTodo, Play } from 'lucide-react'
import { useState } from 'react'
import type { TodayPlanSummary } from '../lib/today-plan'
import type { PracticeItem, TaskType } from '../types'

export default function TodayPlanPanel({ plan, items, loading, error, onStartTask, onStartItem }: {
  plan: TodayPlanSummary | null
  items: PracticeItem[]
  loading: boolean
  error: string | null
  onStartTask: (taskType: TaskType) => void
  onStartItem: (taskType: TaskType, itemId: string) => void
}) {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  if (loading) {
    return <section className="pte-plan-panel is-loading" aria-label="正在读取今日计划">
      <span className="pte-plan-skeleton wide" /><span className="pte-plan-skeleton" /><span className="pte-plan-skeleton" />
    </section>
  }

  if (!plan) {
    return <section className="pte-plan-panel pte-plan-empty" aria-label="今日备考计划">
      <span className="pte-plan-mark"><CalendarCheck2 size={21} /></span>
      <div><h3>把今天要练的内容排进计划</h3><p>{error ?? '生成备考计划后，这里会直接显示今日题型和完成进度。'}</p></div>
      <Link className="pte-button" href="/pte-plan">打开备考计划<ArrowRight size={15} /></Link>
    </section>
  }

  const planned = plan.tasks.reduce((sum, task) => sum + task.plannedCount, 0)
  const completed = plan.tasks.reduce((sum, task) => sum + task.completedCount, 0)
  const remainingTask = plan.tasks.find((task) => task.taskType && task.completedCount < task.plannedCount)
  const selectedTask = plan.tasks.find((task) => task.id === selectedTaskId) ?? null
  const percent = planned ? Math.min(100, Math.round(completed / planned * 100)) : 0

  return <section className="pte-plan-panel" aria-label="今日备考计划">
    <div className="pte-plan-head">
      <div className="pte-plan-title"><span className="pte-plan-mark"><ListTodo size={20} /></span><div><p className="pte-eyebrow">TODAY&apos;S PLAN · 第 {plan.dayNumber} 天</p><h3>{plan.focus || '今日备考计划'}</h3><p>{plan.planName}</p></div></div>
      <div className="pte-plan-summary"><span><Clock3 size={14} />{plan.plannedMinutes} 分钟</span><strong>{completed}<small> / {planned} 题</small></strong></div>
    </div>
    <div className="pte-plan-progress" aria-label={`今日计划完成 ${percent}%`}><i style={{ width: `${percent}%` }} /></div>
    <div className="pte-plan-tasks">
      {plan.tasks.map((task) => {
        const complete = task.plannedCount > 0 && task.completedCount >= task.plannedCount
        return <button key={task.id} aria-pressed={selectedTaskId === task.id} className={selectedTaskId === task.id ? 'is-selected' : ''} onClick={() => setSelectedTaskId(selectedTaskId === task.id ? null : task.id)}>
          {complete && <span className="pte-plan-task-done"><Check size={14} /></span>}
          <strong>{task.shortLabel}</strong>
          <small>{task.completedCount}/{task.plannedCount}</small>
        </button>
      })}
    </div>
    {selectedTask && <div className="pte-plan-detail">
      <div><strong>{selectedTask.shortLabel}</strong><span>已登记 {selectedTask.completedCount} 题 · 计划 {selectedTask.plannedCount} 题</span></div>
      {selectedTask.completedQuestionIds.length > 0
        ? <div className="pte-plan-question-list">{selectedTask.completedQuestionIds.map((id, index) => {
          const available = selectedTask.taskType && items.some((item) => item.taskType === selectedTask.taskType && item.id === id)
          return available && selectedTask.taskType
            ? <button key={`${id}-${index}`} onClick={() => onStartItem(selectedTask.taskType as TaskType, id)}>#{id}<ArrowRight size={13} /></button>
            : <span key={`${id}-${index}`} title="此题号未收录在当前练习题库">#{id} · 题库未收录</span>
        })}</div>
        : <p>还没有登记题号。</p>}
      {selectedTask.taskType && <button className="pte-button" onClick={() => onStartTask(selectedTask.taskType as TaskType)}><Play size={14} />练习 {selectedTask.shortLabel}</button>}
    </div>}
    <div className="pte-plan-actions">
      <Link href={`/pte-plan?plan=${encodeURIComponent(plan.planId)}`}>查看并记录题号<ArrowRight size={14} /></Link>
      {remainingTask && remainingTask.taskType && <button className="pte-button primary" onClick={() => onStartTask(remainingTask.taskType as TaskType)}><Play size={15} />继续今日计划</button>}
    </div>
  </section>
}
