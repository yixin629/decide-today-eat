import Link from 'next/link'
import { ArrowRight, CalendarCheck2, Check, Clock3, ListTodo, Play } from 'lucide-react'
import type { TodayPlanSummary } from '../lib/today-plan'
import type { TaskType } from '../types'

export default function TodayPlanPanel({ plan, loading, error, onStartTask }: {
  plan: TodayPlanSummary | null
  loading: boolean
  error: string | null
  onStartTask: (taskType: TaskType) => void
}) {
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
        return <button key={task.id} disabled={!task.taskType} title={task.taskType ? `开始 ${task.shortLabel} 练习` : '该计划题型暂未接入练习题库'} onClick={() => task.taskType && onStartTask(task.taskType)}>
          <span className={complete ? 'is-complete' : ''}>{complete ? <Check size={14} /> : task.shortLabel}</span>
          <strong>{task.shortLabel}</strong>
          <small>{task.completedCount}/{task.plannedCount}</small>
        </button>
      })}
    </div>
    <div className="pte-plan-actions">
      <Link href={`/pte-plan?plan=${encodeURIComponent(plan.planId)}`}>查看并记录题号<ArrowRight size={14} /></Link>
      {remainingTask && remainingTask.taskType && <button className="pte-button primary" onClick={() => onStartTask(remainingTask.taskType as TaskType)}><Play size={15} />继续今日计划</button>}
    </div>
  </section>
}
