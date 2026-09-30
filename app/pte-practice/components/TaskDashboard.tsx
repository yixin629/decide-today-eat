'use client'

import { ArrowRight, BookOpen, Check, ChevronRight, Flame, Headphones, Mic, PenLine, Play, Target } from 'lucide-react'
import { useState } from 'react'
import { TASK_TYPE_META } from '../lib/taskTypes'
import { computeStreak } from '../lib/analyticsEngine'
import { attemptKey, itemKey, latestByItem, needsReview, sameDay, SKILL_NAMES, STUDY_SKILLS, TASK_CODES } from '../lib/study'
import type { StudyPreferences } from '../hooks/useStudyPreferences'
import { TASK_TYPES, type AttemptRecord, type PracticeItem, type PteSkill, type TaskType } from '../types'

const ICONS = { speaking: Mic, writing: PenLine, reading: BookOpen, listening: Headphones }

export default function TaskDashboard({ items, attempts, preferences, onSelectTaskType, onContinue, onReview, onListen, onGoalChange }: {
  items: PracticeItem[]
  attempts: AttemptRecord[]
  preferences: StudyPreferences
  onSelectTaskType: (taskType: TaskType) => void
  onContinue: (taskType: TaskType, itemId: string) => void
  onReview: () => void
  onListen: () => void
  onGoalChange: (goal: number) => void
}) {
  const [skill, setSkill] = useState<PteSkill>('speaking')
  const today = attempts.filter((a) => sameDay(a.createdAt))
  const streak = computeStreak(attempts)
  const latest = latestByItem(attempts)
  const reviewCount = [...latest.values()].filter(needsReview).length
  const completed = new Set(attempts.map(attemptKey))
  const goalPct = Math.min(100, Math.round(today.length / preferences.dailyGoal * 100))
  const recent = preferences.recent
  const continuing = recent ? items.find((i) => i.taskType === recent.taskType && i.id === recent.itemId) : undefined
  const nextItem = continuing ?? items.find((i) => i.taskType === 'speaking-read-aloud' && !completed.has(itemKey(i))) ?? items[0]
  const week = Array.from({ length: 7 }, (_, offset) => {
    const day = new Date()
    day.setDate(day.getDate() - 6 + offset)
    return { label: ['日', '一', '二', '三', '四', '五', '六'][day.getDay()], count: attempts.filter((a) => sameDay(a.createdAt, day)).length, today: offset === 6 }
  })
  const maxCount = Math.max(5, ...week.map((d) => d.count))

  return <div className="pte-dashboard">
    <div className="pte-section-heading">
      <div><p className="pte-eyebrow">MY STUDY SPACE</p><h2>今天，也向目标靠近一点</h2><p className="pte-muted">{new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })}</p></div>
      {nextItem && <button className="pte-button primary" onClick={() => onContinue(nextItem.taskType, nextItem.id)}><Play size={16} />{continuing ? '继续练习' : '开始今日练习'}</button>}
    </div>

    <section className="pte-today" aria-label="今日学习">
      <div className="pte-goal-block">
        <div className="pte-progress-ring" style={{ background: `conic-gradient(var(--pte-accent) ${goalPct}%, var(--pte-line) 0)` }} role="img" aria-label={`今日目标完成 ${goalPct}%`}><span><strong>{today.length}</strong><small>/ {preferences.dailyGoal} 题</small></span></div>
        <div><span className="pte-eyebrow">今日练习</span><h3>{goalPct >= 100 ? '今日目标已完成' : `再练 ${Math.max(0, preferences.dailyGoal - today.length)} 题，完成目标`}</h3><label className="pte-goal-select">每日目标 <select aria-label="每日练习目标" value={preferences.dailyGoal} onChange={(e) => onGoalChange(Number(e.target.value))}>{[5, 10, 15, 20, 30, 50].map((n) => <option key={n} value={n}>{n} 题</option>)}</select></label></div>
      </div>
      <div className="pte-today-metrics"><div><Flame size={18} /><strong>{streak.currentStreakDays}<small>天</small></strong><span>连续学习</span></div><div><Target size={18} /><strong>{Math.round(today.reduce((s, a) => s + a.durationSeconds, 0) / 60)}<small>分钟</small></strong><span>今日投入</span></div></div>
      <div className="pte-week"><span className="pte-eyebrow">近 7 天练习</span><div className="pte-week-bars">{week.map((day, index) => <div key={index} title={`${day.today ? '今天' : `周${day.label}`} ${day.count} 题`}><span>{day.count || ''}</span><div className="pte-bar-track"><i style={{ height: `${Math.max(4, day.count / maxCount * 100)}%` }} className={day.today ? 'is-today' : ''} /></div><small>{day.today ? '今' : day.label}</small></div>)}</div></div>
    </section>

    <div className="pte-dashboard-grid">
      <section className="pte-task-section">
        <div className="pte-section-heading compact"><div><h3>专项练习</h3><p className="pte-muted">{items.length} 道可用练习 · {TASK_TYPES.length} 种已支持题型</p></div></div>
        <div className="pte-skill-tabs" role="tablist" aria-label="技能分类">{STUDY_SKILLS.map((s) => { const Icon = ICONS[s]; return <button key={s} role="tab" aria-selected={skill === s} className={skill === s ? `active skill-${s}` : ''} onClick={() => setSkill(s)}><Icon size={17} />{SKILL_NAMES[s]}<span>{TASK_TYPES.filter((t) => TASK_TYPE_META[t].skill === s).length}</span></button> })}</div>
        <div role="tabpanel" aria-label={`${SKILL_NAMES[skill]}专项练习`} className="pte-task-list">{TASK_TYPES.filter((t) => TASK_TYPE_META[t].skill === skill).map((type) => {
          const meta = TASK_TYPE_META[type]
          const bank = items.filter((i) => i.taskType === type)
          const done = bank.filter((i) => completed.has(itemKey(i))).length
          return <button className="pte-task-row" key={type} onClick={() => onSelectTaskType(type)} disabled={!bank.length}>
            <span className={`pte-task-code skill-${skill}`}>{TASK_CODES[type]}</span><span className="pte-task-text"><strong>{meta.shortLabel}</strong><small>{meta.label.match(/（(.*)）/)?.[1] ?? meta.description}</small></span>
            <span className="pte-task-progress"><span>{done} / {bank.length} 已练</span><i><b style={{ width: `${bank.length ? done / bank.length * 100 : 0}%` }} /></i></span><ChevronRight size={17} />
          </button>
        })}</div>
      </section>
      <aside className="pte-study-side">
        <h3>接着练，更有方向</h3>
        <button className="pte-action-row" onClick={onReview}><span className="pte-action-icon amber"><BookOpen size={20} /></span><span><strong>错题复习</strong><small>{reviewCount ? `${reviewCount} 道客观题待巩固` : '暂时没有待复习错题'}</small></span><ArrowRight size={17} /></button>
        <button className="pte-action-row" onClick={onListen}><span className="pte-action-icon blue"><Headphones size={20} /></span><span><strong>精听跟读</strong><small>逐句听读 · 变速 · 循环播放</small></span><ArrowRight size={17} /></button>
        <div className="pte-checklist"><p className="pte-eyebrow">今日足迹</p>{STUDY_SKILLS.map((s) => { const count = today.filter((a) => TASK_TYPE_META[a.taskType].skill === s).length; return <div key={s}><span className={count ? 'pte-done' : 'pte-undone'}>{count ? <Check size={13} /> : null}</span><span>{SKILL_NAMES[s]}练习</span><strong>{count} 题</strong></div> })}</div>
        <p className="pte-small-note">内置内容为原创练习；练习反馈不等同于 Pearson 成绩。新增题型 SGD、RTS 尚未收录。</p>
      </aside>
    </div>
  </div>
}
