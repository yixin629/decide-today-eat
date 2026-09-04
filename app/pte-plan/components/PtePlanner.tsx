'use client'

import { addDays, format, parseISO } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { useEffect, useRef, useState } from 'react'
import { useToast } from '@/app/components/feedback/ToastProvider'
import { readSessionUser } from '@/lib/auth-session'
import { ensureAllTaskCoverage, generateStudyPlan } from '../engine/generate-plan'
import { deleteCloudPlan, loadCloudPlans, saveCloudPlans } from '../lib/plan-repository'
import { getPreset, SCORE_PRESETS, SKILL_META } from '../lib/standards'
import { templatesForTask } from '../lib/templates'
import {
  SKILLS,
  type DailyStudyMood,
  type DailySummary,
  type PlannerConfig,
  type PracticeRow,
  type SavedPtePlan,
  type Skill,
} from '../types'
import TemplateLibrary from './TemplateLibrary'

const DISPLAY_SKILLS: Skill[] = ['speaking', 'writing', 'reading', 'listening']
const DAILY_MOODS: { value: Exclude<DailyStudyMood, ''>; label: string; emoji: string }[] = [
  { value: 'great', label: '状态很好', emoji: '🔥' },
  { value: 'good', label: '比较顺利', emoji: '😊' },
  { value: 'normal', label: '正常完成', emoji: '🙂' },
  { value: 'tired', label: '有点疲惫', emoji: '😮‍💨' },
  { value: 'stuck', label: '需要调整', emoji: '🧩' },
]

function dateValue(date: Date) {
  return format(date, 'yyyy-MM-dd')
}

function defaultConfig(): PlannerConfig {
  const preset = getPreset('au-superior-2025')
  return {
    presetId: preset.id,
    testType: preset.testType,
    startDate: dateValue(addDays(new Date(), 1)),
    testDate: dateValue(addDays(new Date(), 29)),
    dailyMinutes: 120,
    currentScores: { listening: 50, reading: 50, writing: 50, speaking: 50 },
    targetScores: { ...preset.recommendedScores },
  }
}

function scoreText(scores: Record<Skill, number>) {
  return SKILLS.map((skill) => `${SKILL_META[skill].shortLabel}${scores[skill]}`).join('｜')
}

function createPlanId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16)
    const value = character === 'x' ? random : (random & 0x3) | 0x8
    return value.toString(16)
  })
}

function defaultPlanName(config: PlannerConfig) {
  return `${getPreset(config.presetId).label} · ${config.testDate}`
}

function nextActiveDay(plan: SavedPtePlan) {
  const today = dateValue(new Date())
  const nextIndex = plan.days.findIndex((day) => day.date >= today)
  return nextIndex >= 0 ? nextIndex : Math.max(0, plan.days.length - 1)
}

export default function PtePlanner() {
  const toast = useToast()
  const syncErrorShownRef = useRef(false)
  const autoSaveTimerRef = useRef<number | null>(null)
  const [config, setConfig] = useState<PlannerConfig>(defaultConfig)
  const [plans, setPlans] = useState<SavedPtePlan[]>([])
  const [syncedVersions, setSyncedVersions] = useState<Record<string, string>>({})
  const [activePlanId, setActivePlanId] = useState<string | null>(null)
  const [activeDay, setActiveDay] = useState(0)
  const [hydrated, setHydrated] = useState(false)
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  const [cloudReady, setCloudReady] = useState(false)
  const [syncStatus, setSyncStatus] = useState<
    'loading' | 'saving' | 'saved' | 'offline' | 'error'
  >('loading')
  const [taskPickerOpen, setTaskPickerOpen] = useState(false)
  const [manualSaving, setManualSaving] = useState(false)
  const [templateTask, setTemplateTask] = useState<string | null>(null)
  const [templateLibraryOpen, setTemplateLibraryOpen] = useState(false)

  useEffect(() => {
    let cancelled = false

    const loadPlans = async () => {
      const user = readSessionUser()
      if (cancelled) return
      setCurrentUser(user)

      if (!user) {
        setSyncStatus('offline')
        setHydrated(true)
        return
      }

      try {
        const cloudPlans = await loadCloudPlans(user)
        if (cancelled) return

        setSyncedVersions(Object.fromEntries(cloudPlans.map((plan) => [plan.id, plan.updatedAt])))
        const resolvedPlans = cloudPlans
          .map(ensureAllTaskCoverage)
          .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        const active = resolvedPlans[0] ?? null
        setPlans(resolvedPlans)
        setActivePlanId(active?.id ?? null)
        if (active) {
          setConfig(active.config)
          setActiveDay(nextActiveDay(active))
        }
        setCloudReady(true)
        setSyncStatus('saved')
      } catch (error) {
        console.error('加载 PTE 云端计划失败:', error)
        setSyncStatus('error')
        toast.error('无法读取 PTE 计划数据库，请检查网络后刷新')
      }
      setHydrated(true)
    }

    void loadPlans()
    return () => {
      cancelled = true
    }
  }, [toast])

  useEffect(() => {
    if (!hydrated || !cloudReady || !currentUser) return
    const changedPlans = plans.filter((plan) => syncedVersions[plan.id] !== plan.updatedAt)
    if (changedPlans.length === 0) return

    const timer = window.setTimeout(async () => {
      autoSaveTimerRef.current = null
      setSyncStatus('saving')
      try {
        await saveCloudPlans(currentUser, changedPlans)
        setSyncedVersions((current) => ({
          ...current,
          ...Object.fromEntries(changedPlans.map((plan) => [plan.id, plan.updatedAt])),
        }))
        syncErrorShownRef.current = false
        setSyncStatus('saved')
      } catch (error) {
        console.error('保存 PTE 云端计划失败:', error)
        setSyncStatus('error')
        if (!syncErrorShownRef.current) {
          syncErrorShownRef.current = true
          toast.error('云端保存失败，请保留页面并重试修改')
        }
      }
    }, 800)
    autoSaveTimerRef.current = timer

    return () => {
      window.clearTimeout(timer)
      if (autoSaveTimerRef.current === timer) autoSaveTimerRef.current = null
    }
  }, [cloudReady, currentUser, hydrated, plans, syncedVersions, toast])

  const savedPlan = plans.find((plan) => plan.id === activePlanId) ?? null
  const hasUnsavedChanges = Boolean(
    savedPlan && syncedVersions[savedPlan.id] !== savedPlan.updatedAt
  )
  const preset = getPreset(config.presetId)
  const currentDay = savedPlan?.days[activeDay]
  const totals = (() => {
    if (!savedPlan) return { planned: 0, done: 0, starred: 0 }
    return savedPlan.days.reduce(
      (summary, day) => {
        day.tasks.forEach((task) => {
          if (day.hiddenTaskIds.includes(task.id)) return
          task.rows.forEach((row) => {
            if (row.category === 'planned') summary.planned += 1
            if (row.questionId.trim()) summary.done += 1
            if (row.starred) summary.starred += 1
          })
        })
        return summary
      },
      { planned: 0, done: 0, starred: 0 }
    )
  })()

  const selectPreset = (presetId: string) => {
    const next = getPreset(presetId)
    setConfig((previous) => ({
      ...previous,
      presetId: next.id,
      testType: next.testType,
      targetScores: { ...next.recommendedScores },
    }))
  }

  const updateScore = (field: 'currentScores' | 'targetScores', skill: Skill, value: string) => {
    const score = Math.min(90, Math.max(10, Number(value) || 10))
    setConfig((previous) => ({
      ...previous,
      [field]: { ...previous[field], [skill]: score },
    }))
  }

  const createPlan = () => {
    if (!currentUser || !cloudReady) {
      toast.error('数据库尚未连接，暂时不能创建计划')
      return
    }
    const start = parseISO(config.startDate)
    const test = parseISO(config.testDate)
    if (Number.isNaN(start.getTime()) || Number.isNaN(test.getTime()) || test <= start) {
      toast.error('考试日期必须晚于开始日期')
      return
    }

    const days = generateStudyPlan(config)
    const now = new Date().toISOString()
    const nextPlan: SavedPtePlan = {
      version: 1,
      id: createPlanId(),
      name: defaultPlanName(config),
      createdAt: now,
      updatedAt: now,
      config,
      days,
    }
    setPlans((current) => [nextPlan, ...current])
    setActivePlanId(nextPlan.id)
    setActiveDay(0)
    toast.success('新计划已生成并自动保存')
  }

  const selectPlan = (planId: string) => {
    const selected = plans.find((plan) => plan.id === planId)
    if (!selected) return
    setActivePlanId(selected.id)
    setConfig(selected.config)
    setActiveDay(nextActiveDay(selected))
  }

  const startNewPlan = () => {
    setActivePlanId(null)
    setConfig(defaultConfig())
    setActiveDay(0)
  }

  const renamePlan = (name: string) => {
    if (!activePlanId) return
    setPlans((current) =>
      current.map((plan) =>
        plan.id === activePlanId ? { ...plan, name, updatedAt: new Date().toISOString() } : plan
      )
    )
  }

  const duplicatePlan = () => {
    if (!savedPlan) return
    const now = new Date().toISOString()
    const copy: SavedPtePlan = {
      ...savedPlan,
      id: createPlanId(),
      name: `${savedPlan.name || '未命名计划'}（副本）`,
      createdAt: now,
      updatedAt: now,
      config: {
        ...savedPlan.config,
        currentScores: { ...savedPlan.config.currentScores },
        targetScores: { ...savedPlan.config.targetScores },
      },
      days: savedPlan.days.map((day) => ({
        ...day,
        hiddenTaskIds: [...day.hiddenTaskIds],
        summary: { ...day.summary },
        tasks: day.tasks.map((task) => ({
          ...task,
          rows: task.rows.map((row) => ({ ...row })),
        })),
      })),
    }
    setPlans((current) => [copy, ...current])
    setActivePlanId(copy.id)
    setConfig(copy.config)
    toast.success('已复制为新的独立计划')
  }

  const deletePlan = async () => {
    if (!savedPlan || !window.confirm(`确定删除“${savedPlan.name || '未命名计划'}”吗？`)) return
    if (!currentUser || !cloudReady) {
      toast.error('数据库尚未连接，暂时不能删除计划')
      return
    }
    try {
      await deleteCloudPlan(currentUser, savedPlan.id)
    } catch (error) {
      console.error('删除 PTE 云端计划失败:', error)
      toast.error('云端删除失败，请稍后重试')
      return
    }

    const remaining = plans.filter((plan) => plan.id !== savedPlan.id)
    const next = remaining[0]
    setSyncedVersions((current) => {
      const next = { ...current }
      delete next[savedPlan.id]
      return next
    })
    setPlans(remaining)
    setActivePlanId(next?.id ?? null)
    setConfig(next?.config ?? defaultConfig())
    setActiveDay(next ? nextActiveDay(next) : 0)
    toast.success('计划已删除')
  }

  const updateRow = (taskId: string, rowId: string, patch: Partial<PracticeRow>) => {
    if (!activePlanId) return
    setPlans((current) =>
      current.map((plan) =>
        plan.id !== activePlanId
          ? plan
          : {
              ...plan,
              updatedAt: new Date().toISOString(),
              days: plan.days.map((day, dayIndex) =>
                dayIndex !== activeDay
                  ? day
                  : {
                      ...day,
                      tasks: day.tasks.map((task) =>
                        task.id !== taskId
                          ? task
                          : {
                              ...task,
                              rows: task.rows.map((row) =>
                                row.id === rowId ? { ...row, ...patch } : row
                              ),
                            }
                      ),
                    }
              ),
            }
      )
    )
  }

  const addExtraRow = (taskId: string) => {
    if (!activePlanId) return
    setPlans((current) =>
      current.map((plan) =>
        plan.id !== activePlanId
          ? plan
          : {
              ...plan,
              updatedAt: new Date().toISOString(),
              days: plan.days.map((day, dayIndex) =>
                dayIndex !== activeDay
                  ? day
                  : {
                      ...day,
                      tasks: day.tasks.map((task) =>
                        task.id !== taskId
                          ? task
                          : {
                              ...task,
                              rows: [
                                ...task.rows,
                                {
                                  id: `${day.dayNumber}-${task.id}-extra-${Date.now()}`,
                                  category: 'extra',
                                  questionId: '',
                                  starred: false,
                                  score: '',
                                  attempts: '',
                                  note: '',
                                },
                              ],
                            }
                      ),
                    }
              ),
            }
      )
    )
  }

  const setTaskHidden = (taskId: string, hidden: boolean) => {
    if (!activePlanId) return
    setPlans((current) =>
      current.map((plan) =>
        plan.id !== activePlanId
          ? plan
          : {
              ...plan,
              updatedAt: new Date().toISOString(),
              days: plan.days.map((day, dayIndex) => {
                if (dayIndex !== activeDay) return day
                const hiddenTaskIds = hidden
                  ? [...new Set([...day.hiddenTaskIds, taskId])]
                  : day.hiddenTaskIds.filter((id) => id !== taskId)
                return { ...day, hiddenTaskIds }
              }),
            }
      )
    )
  }

  const showAllTasks = () => {
    if (!activePlanId) return
    setPlans((current) =>
      current.map((plan) =>
        plan.id !== activePlanId
          ? plan
          : {
              ...plan,
              updatedAt: new Date().toISOString(),
              days: plan.days.map((day, dayIndex) =>
                dayIndex === activeDay ? { ...day, hiddenTaskIds: [] } : day
              ),
            }
      )
    )
  }

  const updateDailySummary = (patch: Partial<DailySummary>) => {
    if (!activePlanId) return
    setPlans((current) =>
      current.map((plan) =>
        plan.id !== activePlanId
          ? plan
          : {
              ...plan,
              updatedAt: new Date().toISOString(),
              days: plan.days.map((day, dayIndex) =>
                dayIndex === activeDay ? { ...day, summary: { ...day.summary, ...patch } } : day
              ),
            }
      )
    )
  }

  const saveNow = async () => {
    if (!savedPlan || !currentUser || !cloudReady) {
      toast.error('数据库尚未连接，当前计划无法保存')
      return
    }

    if (autoSaveTimerRef.current !== null) {
      window.clearTimeout(autoSaveTimerRef.current)
      autoSaveTimerRef.current = null
    }
    setManualSaving(true)
    setSyncStatus('saving')
    try {
      await saveCloudPlans(currentUser, [savedPlan])
      setSyncedVersions((current) => ({
        ...current,
        [savedPlan.id]: savedPlan.updatedAt,
      }))
      syncErrorShownRef.current = false
      setSyncStatus('saved')
      toast.success('当前计划已保存到数据库')
    } catch (error) {
      console.error('手动保存 PTE 计划失败:', error)
      setSyncStatus('error')
      toast.error('保存失败，请检查网络后重试')
    } finally {
      setManualSaving(false)
    }
  }

  const dayStats = currentDay
    ? currentDay.tasks.reduce(
        (summary, task) => {
          if (currentDay.hiddenTaskIds.includes(task.id)) return summary
          task.rows.forEach((row) => {
            if (row.category === 'planned') summary.planned += 1
            if (row.questionId.trim()) summary.done += 1
            if (row.category === 'extra' && row.questionId.trim()) summary.extra += 1
            if (row.starred) summary.starred += 1
          })
          return summary
        },
        { planned: 0, done: 0, extra: 0, starred: 0 }
      )
    : null

  return (
    <div className="space-y-6 pb-28 md:pb-20">
      {hydrated && (
        <section className="rounded-3xl border border-indigo-200 bg-gradient-to-r from-indigo-50 via-white to-cyan-50 p-5 shadow-lg sm:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600">
                MY PTE PLANS
              </p>
              <h2 className="mt-1 text-xl font-black text-slate-900">我的备考方案</h2>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                <span>每个方案的逐题记录都会自动保存，可以随时切换回来继续填写。</span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                    syncStatus === 'saved' && !hasUnsavedChanges
                      ? 'bg-emerald-100 text-emerald-700'
                      : syncStatus === 'saving'
                        ? 'bg-cyan-100 text-cyan-700'
                        : syncStatus === 'loading'
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-amber-100 text-amber-700'
                  }`}
                  role="status"
                >
                  {syncStatus === 'saved' && !hasUnsavedChanges
                    ? '云端已保存'
                    : hasUnsavedChanges && syncStatus !== 'saving'
                      ? '等待自动保存'
                      : syncStatus === 'saving'
                        ? '正在同步…'
                        : syncStatus === 'loading'
                          ? '正在读取云端…'
                          : syncStatus === 'offline'
                            ? '未登录数据库'
                            : '云端同步异常'}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={startNewPlan}
                className="min-h-11 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-black text-white transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
              >
                ＋新建方案
              </button>
              {savedPlan && (
                <>
                  <button
                    type="button"
                    onClick={duplicatePlan}
                    className="min-h-11 rounded-xl border border-indigo-200 bg-white px-4 py-2 text-sm font-bold text-indigo-700 transition hover:border-indigo-400 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
                  >
                    复制方案
                  </button>
                  <button
                    type="button"
                    onClick={deletePlan}
                    className="min-h-11 rounded-xl border border-rose-200 bg-white px-4 py-2 text-sm font-bold text-rose-600 transition hover:border-rose-400 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
                  >
                    删除
                  </button>
                </>
              )}
            </div>
          </div>

          {plans.length > 0 ? (
            <div className="mt-5 grid gap-3 lg:grid-cols-2">
              <label>
                <span className="label-primary">切换计划</span>
                <select
                  className="input-primary min-h-12 w-full bg-white"
                  value={activePlanId ?? ''}
                  onChange={(event) => selectPlan(event.target.value)}
                >
                  {!activePlanId && <option value="">正在创建新方案</option>}
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name || '未命名计划'}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="label-primary">当前计划名称</span>
                <input
                  type="text"
                  maxLength={50}
                  value={savedPlan?.name ?? ''}
                  disabled={!savedPlan}
                  onChange={(event) => renamePlan(event.target.value)}
                  placeholder={savedPlan ? '输入计划名称' : '生成计划后可以改名'}
                  className="input-primary min-h-12 w-full bg-white disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </label>
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-indigo-300 bg-white/70 px-4 py-5 text-sm text-slate-600">
              还没有保存的计划。设置日期、目标分数和每天学习时间后，生成第一个方案即可。
            </div>
          )}
        </section>
      )}

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white/90 shadow-xl backdrop-blur-sm">
        <div className="bg-[#16324f] px-5 py-6 text-white sm:px-7">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-100">
                PTE SMART STUDY PLANNER
              </p>
              <h1 className="mt-2 text-2xl font-black sm:text-3xl">智能备考计划生成器</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-200">
                按申请标准、分数差距、剩余天数和每日时间自动分配题型。多个计划、逐题记录和每日总结全部保存到数据库。
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setTemplateTask(null)
                  setTemplateLibraryOpen(true)
                }}
                className="rounded-xl bg-white px-4 py-2 text-sm font-black text-[#16324f] transition hover:bg-cyan-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
              >
                📚 口语/写作模板库
              </button>
              <span className="w-fit rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-cyan-50">
                标准核对：2026-09-03
              </span>
            </div>
          </div>
        </div>

        <div className="grid gap-5 p-5 sm:p-7 xl:grid-cols-[1.3fr_0.7fr]">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className="label-primary">申请标准</span>
              <select
                className="input-primary min-h-12 w-full"
                value={config.presetId}
                onChange={(event) => selectPreset(event.target.value)}
              >
                {[
                  ['australia', '澳洲移民'],
                  ['canada', '加拿大移民'],
                  ['uk', '英国签证'],
                  ['new-zealand', '新西兰移民'],
                  ['university', '大学申请'],
                ].map(([group, label]) => (
                  <optgroup key={group} label={label}>
                    {SCORE_PRESETS.filter((item) => item.group === group).map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>

            <label>
              <span className="label-primary">开始日期</span>
              <input
                type="date"
                className="input-primary min-h-12 w-full"
                value={config.startDate}
                onChange={(event) =>
                  setConfig((previous) => ({ ...previous, startDate: event.target.value }))
                }
              />
            </label>
            <label>
              <span className="label-primary">考试日期</span>
              <input
                type="date"
                className="input-primary min-h-12 w-full"
                value={config.testDate}
                min={config.startDate}
                onChange={(event) =>
                  setConfig((previous) => ({ ...previous, testDate: event.target.value }))
                }
              />
            </label>
            <label className="sm:col-span-2">
              <span className="label-primary">每天可学习时间：{config.dailyMinutes} 分钟</span>
              <input
                type="range"
                min="30"
                max="300"
                step="15"
                value={config.dailyMinutes}
                onChange={(event) =>
                  setConfig((previous) => ({
                    ...previous,
                    dailyMinutes: Number(event.target.value),
                  }))
                }
                className="h-3 w-full cursor-pointer accent-pink-600"
              />
              <div className="mt-1 flex justify-between text-xs text-gray-500">
                <span>30 分钟</span>
                <span>5 小时</span>
              </div>
            </label>
          </div>

          <aside className="rounded-2xl border border-cyan-100 bg-cyan-50/70 p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-cyan-700">
                  {preset.country}
                </p>
                <h2 className="mt-1 text-lg font-black text-gray-900">{preset.label}</h2>
              </div>
              <span className="badge-blue shrink-0">{preset.testLabel}</span>
            </div>
            <p className="mt-3 text-sm font-bold text-[#16324f]">{preset.requirement}</p>
            <p className="mt-2 text-xs leading-5 text-gray-600">{preset.note}</p>
            <div className="mt-4 rounded-xl bg-white/80 p-3 text-xs text-gray-600">
              <p>官方/参考线：{scoreText(preset.officialScores)}</p>
              <p className="mt-1 font-semibold text-emerald-700">
                默认训练线：{scoreText(preset.recommendedScores)}
              </p>
            </div>
            <a
              href={preset.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex text-xs font-semibold text-cyan-700 underline decoration-cyan-300 underline-offset-4 hover:text-cyan-900"
            >
              查看标准来源：{preset.sourceLabel}
            </a>
          </aside>
        </div>

        <div className="border-t border-slate-200 bg-slate-50/80 p-5 sm:p-7">
          <div className="grid gap-5 lg:grid-cols-2">
            {(['currentScores', 'targetScores'] as const).map((field) => (
              <fieldset key={field}>
                <legend className="mb-3 text-sm font-black text-gray-900">
                  {field === 'currentScores' ? '当前分数' : '训练目标（可修改）'}
                </legend>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {SKILLS.map((skill) => (
                    <label
                      key={skill}
                      className="rounded-2xl border bg-white p-3 shadow-sm"
                      style={{ borderColor: SKILL_META[skill].color }}
                    >
                      <span className="block text-xs font-bold text-gray-600">
                        {SKILL_META[skill].label}
                      </span>
                      <input
                        type="number"
                        min="10"
                        max="90"
                        value={config[field][skill]}
                        onChange={(event) => updateScore(field, skill, event.target.value)}
                        className="mt-1 w-full border-0 bg-transparent p-0 text-2xl font-black text-gray-900 outline-none"
                        aria-label={`${field === 'currentScores' ? '当前' : '目标'}${SKILL_META[skill].label}分数`}
                      />
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
          <button
            type="button"
            onClick={createPlan}
            className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-pink-600 to-purple-600 px-6 py-3 font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-300 sm:w-auto"
          >
            {savedPlan ? '按当前设置另存为新计划' : '生成并保存逐日计划'}
          </button>
        </div>
      </section>

      {savedPlan && currentDay && dayStats && (
        <>
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="计划总览">
            {[
              { label: '备考天数', value: `${savedPlan.days.length} 天`, color: '#16324f' },
              { label: '计划题目', value: totals.planned, color: '#276fae' },
              { label: '已录入题目', value: totals.done, color: '#147d78' },
              { label: '待重点回练', value: totals.starred, color: '#c45b1a' },
            ].map((item) => (
              <article key={item.label} className="card !rounded-2xl !p-4">
                <p className="text-xs font-bold text-gray-500">{item.label}</p>
                <strong className="mt-1 block text-2xl font-black" style={{ color: item.color }}>
                  {item.value}
                </strong>
              </article>
            ))}
          </section>

          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white/90 shadow-xl">
            <div className="border-b border-slate-200 bg-[#16324f] px-4 py-4 text-white sm:px-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-semibold text-cyan-100">
                    Day {currentDay.dayNumber} · {currentDay.phase} · {currentDay.focus}
                  </p>
                  <h2 className="mt-1 text-xl font-black">
                    {format(parseISO(currentDay.date), 'M月d日 EEEE', { locale: zhCN })}
                  </h2>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  {[
                    ['计划', dayStats.planned],
                    ['已填', dayStats.done],
                    ['加练', dayStats.extra],
                    ['★', dayStats.starred],
                  ].map(([label, value]) => (
                    <div key={label} className="min-w-16 rounded-xl bg-white/10 px-2 py-2">
                      <span className="block text-white/70">{label}</span>
                      <strong className="mt-0.5 block text-base">{value}</strong>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-emerald-300 transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round((dayStats.done / Math.max(1, dayStats.planned)) * 100)
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div className="border-b border-slate-200 bg-slate-50 px-3 py-3 sm:px-5">
              <div className="flex snap-x gap-2 overflow-x-auto pb-1">
                {savedPlan.days.map((day, index) => {
                  const visibleTasks = day.tasks.filter(
                    (task) => !day.hiddenTaskIds.includes(task.id)
                  )
                  const completed = visibleTasks.reduce(
                    (sum, task) => sum + task.rows.filter((row) => row.questionId.trim()).length,
                    0
                  )
                  const planned = visibleTasks.reduce((sum, task) => sum + task.plannedCount, 0)
                  return (
                    <button
                      key={day.date}
                      type="button"
                      onClick={() => {
                        setActiveDay(index)
                        setTaskPickerOpen(false)
                      }}
                      className={`min-w-[5.2rem] snap-start rounded-xl border px-3 py-2 text-left transition ${
                        index === activeDay
                          ? 'border-pink-500 bg-pink-600 text-white shadow-md'
                          : 'border-slate-200 bg-white text-gray-700 hover:border-pink-300'
                      }`}
                    >
                      <span className="block text-[10px] font-bold opacity-70">
                        DAY {day.dayNumber}
                      </span>
                      <span className="block text-sm font-black">{day.date.slice(5)}</span>
                      <span className="mt-0.5 block text-[10px] opacity-75">
                        {completed}/{planned}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="border-b border-slate-200 bg-white px-3 py-3 sm:px-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-slate-800">今日题型</p>
                  <p className="text-xs text-slate-500">
                    显示 {currentDay.tasks.length - currentDay.hiddenTaskIds.length}/
                    {currentDay.tasks.length} 种
                    {currentDay.hiddenTaskIds.length > 0 &&
                      ` · 已隐藏 ${currentDay.hiddenTaskIds.length} 种`}
                  </p>
                </div>
                <div className="flex gap-2">
                  {currentDay.hiddenTaskIds.length > 0 && (
                    <button
                      type="button"
                      onClick={showAllTasks}
                      className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                    >
                      全部恢复
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setTaskPickerOpen((open) => !open)}
                    className="min-h-11 rounded-xl bg-[#16324f] px-4 py-2 text-sm font-black text-white transition hover:bg-[#204b72] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                    aria-expanded={taskPickerOpen}
                  >
                    {taskPickerOpen ? '收起选择' : '选择今日题型'}
                  </button>
                </div>
              </div>

              {taskPickerOpen && (
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
                  <p className="mb-3 text-xs font-bold text-amber-900">
                    勾选今天不练的题型，勾选后对应表格会隐藏
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {DISPLAY_SKILLS.flatMap((skill) =>
                      currentDay.tasks
                        .filter((task) => task.primarySkill === skill)
                        .map((task) => {
                          const hidden = currentDay.hiddenTaskIds.includes(task.id)
                          return (
                            <label
                              key={task.id}
                              className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 text-sm transition ${
                                hidden
                                  ? 'border-amber-400 bg-amber-100 text-amber-950'
                                  : 'border-slate-200 bg-white text-slate-700 hover:border-cyan-300'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={hidden}
                                onChange={(event) => setTaskHidden(task.id, event.target.checked)}
                                className="h-5 w-5 rounded border-slate-300 accent-amber-600"
                              />
                              <span className="font-black">{task.shortLabel}</span>
                              <span className="truncate text-xs opacity-70">{task.label}</span>
                            </label>
                          )
                        })
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-5 p-3 sm:p-5">
              {DISPLAY_SKILLS.map((skill) => {
                const skillTasks = currentDay.tasks.filter(
                  (task) =>
                    task.primarySkill === skill && !currentDay.hiddenTaskIds.includes(task.id)
                )
                if (skillTasks.length === 0) return null
                const meta = SKILL_META[skill]
                return (
                  <section
                    key={skill}
                    className="overflow-hidden rounded-2xl border"
                    style={{ borderColor: meta.color }}
                  >
                    <div
                      className="flex items-center justify-between gap-3 px-4 py-3 text-white"
                      style={{ backgroundColor: meta.color }}
                    >
                      <h3 className="font-black">{meta.label}目标训练</h3>
                      <span className="text-xs font-semibold text-white/80">
                        目标 {savedPlan.config.targetScores[skill]}
                      </span>
                    </div>
                    <div
                      className="space-y-4 p-3 sm:p-4"
                      style={{ backgroundColor: meta.softColor }}
                    >
                      {skillTasks.map((task) => (
                        <article
                          key={task.id}
                          className="overflow-hidden rounded-2xl bg-white shadow-sm"
                        >
                          <div className="flex flex-col gap-2 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span
                                  className="rounded-lg px-2 py-1 text-xs font-black text-white"
                                  style={{ backgroundColor: meta.color }}
                                >
                                  {task.shortLabel}
                                </span>
                                <h4 className="font-black text-gray-900">{task.label}</h4>
                              </div>
                              <p className="mt-1 text-xs text-gray-500">{task.standard}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {templatesForTask(task.shortLabel).length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setTemplateTask(task.shortLabel)
                                    setTemplateLibraryOpen(true)
                                  }}
                                  className="rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-black text-cyan-800 transition hover:border-cyan-400 hover:bg-cyan-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                                >
                                  查看模板
                                </button>
                              )}
                              <span className="text-xs font-bold text-gray-500">
                                计划 {task.plannedCount} 题
                              </span>
                            </div>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full min-w-[860px] border-collapse text-sm">
                              <thead className="bg-slate-100 text-xs text-gray-600">
                                <tr>
                                  <th className="w-20 px-3 py-2 text-left">类别</th>
                                  <th className="w-16 px-3 py-2 text-center">序号</th>
                                  <th className="min-w-44 px-3 py-2 text-left">题号（必填）</th>
                                  <th className="w-20 px-3 py-2 text-center">标星</th>
                                  <th className="w-28 px-3 py-2 text-left">得分率</th>
                                  <th className="w-24 px-3 py-2 text-left">次数</th>
                                  <th className="min-w-56 px-3 py-2 text-left">备注</th>
                                </tr>
                              </thead>
                              <tbody>
                                {task.rows.map((row, rowIndex) => (
                                  <tr
                                    key={row.id}
                                    className={`border-t border-slate-200 ${
                                      row.category === 'extra' ? 'bg-amber-50' : 'bg-white'
                                    }`}
                                  >
                                    <td className="px-3 py-2 text-xs font-bold text-gray-500">
                                      {row.category === 'planned' ? '计划' : '加练'}
                                    </td>
                                    <td className="px-3 py-2 text-center text-xs text-gray-500">
                                      {rowIndex + 1}
                                    </td>
                                    <td className="px-3 py-2">
                                      <input
                                        type="text"
                                        inputMode="numeric"
                                        value={row.questionId}
                                        onChange={(event) =>
                                          updateRow(task.id, row.id, {
                                            questionId: event.target.value,
                                          })
                                        }
                                        placeholder="直接填题号"
                                        className="min-h-11 w-full rounded-xl border border-amber-300 bg-amber-50 px-3 font-bold text-gray-900 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
                                      />
                                    </td>
                                    <td className="px-3 py-2 text-center">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          updateRow(task.id, row.id, { starred: !row.starred })
                                        }
                                        className={`h-11 w-11 rounded-xl text-xl transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                                          row.starred
                                            ? 'bg-amber-300 text-amber-900 shadow-inner'
                                            : 'bg-amber-50 text-amber-500 hover:bg-amber-100'
                                        }`}
                                        aria-label={row.starred ? '取消重点标星' : '标记为重点回练'}
                                        aria-pressed={row.starred}
                                      >
                                        {row.starred ? '★' : '☆'}
                                      </button>
                                    </td>
                                    <td className="px-3 py-2">
                                      <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={row.score}
                                        onChange={(event) =>
                                          updateRow(task.id, row.id, { score: event.target.value })
                                        }
                                        placeholder="默认100"
                                        className="input-primary min-h-11 w-full"
                                      />
                                    </td>
                                    <td className="px-3 py-2">
                                      <input
                                        type="number"
                                        min="1"
                                        max="50"
                                        value={row.attempts}
                                        onChange={(event) =>
                                          updateRow(task.id, row.id, {
                                            attempts: event.target.value,
                                          })
                                        }
                                        placeholder="1"
                                        className="input-primary min-h-11 w-full"
                                      />
                                    </td>
                                    <td className="px-3 py-2">
                                      <input
                                        type="text"
                                        value={row.note}
                                        onChange={(event) =>
                                          updateRow(task.id, row.id, { note: event.target.value })
                                        }
                                        placeholder="选填：问题或复盘重点"
                                        className="input-primary min-h-11 w-full"
                                      />
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => addExtraRow(task.id)}
                              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-gray-700 transition hover:border-pink-400 hover:text-pink-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300"
                            >
                              ＋再加一行 {task.shortLabel}
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                )
              })}
            </div>

            <section className="border-t border-slate-200 bg-gradient-to-br from-indigo-50 via-white to-cyan-50 p-4 sm:p-6">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-600">
                    DAILY REVIEW
                  </p>
                  <h3 className="mt-1 text-xl font-black text-slate-900">今日学习总结</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    所有内容选填，修改后自动保存到数据库
                  </p>
                </div>
                <div className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-slate-600 shadow-sm">
                  已填 {dayStats.done}/{dayStats.planned} 题
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-[0.35fr_0.65fr]">
                <label>
                  <span className="label-primary">实际学习时长</span>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="1440"
                      value={currentDay.summary.actualMinutes ?? ''}
                      onChange={(event) =>
                        updateDailySummary({
                          actualMinutes: event.target.value
                            ? Math.min(1440, Math.max(0, Number(event.target.value)))
                            : null,
                        })
                      }
                      placeholder="例如 120"
                      className="input-primary min-h-12 w-full bg-white pr-14"
                    />
                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                      分钟
                    </span>
                  </div>
                </label>

                <fieldset>
                  <legend className="label-primary">今日状态</legend>
                  <div className="flex flex-wrap gap-2">
                    {DAILY_MOODS.map((mood) => {
                      const selected = currentDay.summary.mood === mood.value
                      return (
                        <button
                          key={mood.value}
                          type="button"
                          onClick={() => updateDailySummary({ mood: selected ? '' : mood.value })}
                          className={`min-h-12 rounded-xl border px-3 py-2 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 ${
                            selected
                              ? 'border-indigo-500 bg-indigo-600 text-white shadow-md'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300'
                          }`}
                          aria-pressed={selected}
                        >
                          <span aria-hidden="true">{mood.emoji}</span> {mood.label}
                        </button>
                      )
                    })}
                  </div>
                </fieldset>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-3">
                <label>
                  <span className="label-primary">今天最大的收获</span>
                  <textarea
                    rows={4}
                    maxLength={500}
                    value={currentDay.summary.achievement}
                    onChange={(event) => updateDailySummary({ achievement: event.target.value })}
                    placeholder="掌握了什么？哪种方法有效？"
                    className="input-primary w-full resize-y bg-white"
                  />
                </label>
                <label>
                  <span className="label-primary">问题与薄弱点</span>
                  <textarea
                    rows={4}
                    maxLength={500}
                    value={currentDay.summary.difficulty}
                    onChange={(event) => updateDailySummary({ difficulty: event.target.value })}
                    placeholder="今天卡在哪里？哪些题需要回练？"
                    className="input-primary w-full resize-y bg-white"
                  />
                </label>
                <label>
                  <span className="label-primary">明天优先处理</span>
                  <textarea
                    rows={4}
                    maxLength={500}
                    value={currentDay.summary.nextFocus}
                    onChange={(event) => updateDailySummary({ nextFocus: event.target.value })}
                    placeholder="写下明天最重要的训练目标"
                    className="input-primary w-full resize-y bg-white"
                  />
                </label>
              </div>
            </section>
          </section>
        </>
      )}
      <TemplateLibrary
        open={templateLibraryOpen}
        initialTask={templateTask ?? undefined}
        onClose={() => setTemplateLibraryOpen(false)}
      />
      {savedPlan && (
        <div className="pointer-events-none fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-40 flex justify-center md:bottom-5">
          <div className="pointer-events-auto flex max-w-full items-center gap-2 rounded-2xl border border-white/70 bg-slate-950/92 p-2 pl-4 text-white shadow-2xl shadow-slate-900/30 backdrop-blur-xl">
            <div className="hidden min-w-0 sm:block">
              <p className="max-w-52 truncate text-xs font-bold text-white/90">
                {savedPlan.name || '未命名计划'}
              </p>
              <p className="text-[11px] text-white/60">
                {syncStatus === 'saving'
                  ? '正在写入数据库…'
                  : syncStatus === 'saved' && !hasUnsavedChanges
                    ? '云端已保存'
                    : '存在未保存的修改'}
              </p>
            </div>
            <button
              type="button"
              onClick={saveNow}
              disabled={manualSaving || syncStatus === 'saving' || !cloudReady}
              className="min-h-12 whitespace-nowrap rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 px-5 py-3 text-sm font-black text-slate-950 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 disabled:cursor-wait disabled:opacity-60"
            >
              {manualSaving ? '保存中…' : syncStatus === 'saving' ? '自动保存中…' : '💾 立即保存'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
