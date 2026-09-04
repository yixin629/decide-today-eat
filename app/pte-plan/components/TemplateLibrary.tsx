'use client'

import { useEffect, useState } from 'react'
import { useToast } from '@/app/components/feedback/ToastProvider'
import {
  deleteCustomTemplate,
  loadCustomTemplates,
  saveCustomTemplate,
} from '../lib/template-repository'
import {
  PTE_TEMPLATES,
  PTE_TEMPLATE_TASK_TYPES,
  type PteTemplate,
  type SavedPteTemplate,
} from '../lib/templates'

interface TemplateLibraryProps {
  open: boolean
  initialTask?: string
  userId: string | null
  onClose: () => void
}

interface TemplateForm {
  id: string | null
  taskTypes: string[]
  badge: string
  title: string
  subtitle: string
  tips: string
  lines: string
}

function createTemplateId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16)
    const value = character === 'x' ? random : (random & 0x3) | 0x8
    return value.toString(16)
  })
}

function blankForm(taskType?: string): TemplateForm {
  return {
    id: null,
    taskTypes: [taskType || 'DI'],
    badge: taskType || '我的模板',
    title: '',
    subtitle: '',
    tips: '',
    lines: '',
  }
}

function splitLines(value: string) {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

export default function TemplateLibrary({
  open,
  initialTask,
  userId,
  onClose,
}: TemplateLibraryProps) {
  const toast = useToast()
  const [expandedIds, setExpandedIds] = useState<string[]>([])
  const [customTemplates, setCustomTemplates] = useState<SavedPteTemplate[]>([])
  const [activeFilter, setActiveFilter] = useState(initialTask || '全部')
  const [form, setForm] = useState<TemplateForm | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [databaseError, setDatabaseError] = useState(false)

  useEffect(() => {
    if (!open) return
    setActiveFilter(initialTask || '全部')
    const matchingIds = PTE_TEMPLATES.filter(
      (template) => !initialTask || template.taskTypes.includes(initialTask)
    ).map((template) => template.id)
    setExpandedIds(matchingIds.length > 0 ? [matchingIds[0]] : [PTE_TEMPLATES[0].id])
  }, [initialTask, open])

  useEffect(() => {
    if (!open || !userId) return
    let cancelled = false
    setLoading(true)
    setDatabaseError(false)
    loadCustomTemplates(userId)
      .then((templates) => {
        if (!cancelled) setCustomTemplates(templates)
      })
      .catch(() => {
        if (!cancelled) setDatabaseError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, userId])

  useEffect(() => {
    if (!open) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (form) setForm(null)
        else onClose()
      }
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [form, onClose, open])

  if (!open) return null

  const allTemplates: { template: PteTemplate; custom: boolean }[] = [
    ...customTemplates.map((template) => ({ template, custom: true })),
    ...PTE_TEMPLATES.map((template) => ({ template, custom: false })),
  ]
  const visibleTemplates = allTemplates.filter(
    ({ template }) => activeFilter === '全部' || template.taskTypes.includes(activeFilter)
  )

  const toggle = (id: string) => {
    setExpandedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    )
  }

  const startEditing = (template: SavedPteTemplate) => {
    setForm({
      id: template.id,
      taskTypes: [...template.taskTypes],
      badge: template.badge,
      title: template.title,
      subtitle: template.subtitle,
      tips: template.tips.join('\n'),
      lines: template.lines.join('\n'),
    })
  }

  const saveForm = async () => {
    if (!form || !userId) {
      toast.error('请先登录后再保存个人模板')
      return
    }
    const lines = splitLines(form.lines)
    if (!form.title.trim() || !form.badge.trim() || form.taskTypes.length === 0 || lines.length === 0) {
      toast.error('请填写模板名称、标签、所属题型和模板正文')
      return
    }

    const existing = form.id ? customTemplates.find((template) => template.id === form.id) : null
    const now = new Date().toISOString()
    const template: SavedPteTemplate = {
      id: form.id || createTemplateId(),
      taskTypes: form.taskTypes,
      badge: form.badge.trim(),
      title: form.title.trim(),
      subtitle: form.subtitle.trim(),
      tips: splitLines(form.tips),
      lines,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    }

    setSaving(true)
    try {
      const saved = await saveCustomTemplate(userId, template)
      setCustomTemplates((current) => [saved, ...current.filter((item) => item.id !== saved.id)])
      setExpandedIds((current) => [saved.id, ...current.filter((id) => id !== saved.id)])
      setActiveFilter(saved.taskTypes[0])
      setForm(null)
      setDatabaseError(false)
      toast.success(existing ? '个人模板已更新' : '个人模板已保存到数据库')
    } catch {
      setDatabaseError(true)
      toast.error('模板保存失败，请确认已执行模板数据库迁移')
    } finally {
      setSaving(false)
    }
  }

  const removeTemplate = async (template: SavedPteTemplate) => {
    if (!userId || !window.confirm(`确定删除“${template.title}”吗？`)) return
    try {
      await deleteCustomTemplate(userId, template.id)
      setCustomTemplates((current) => current.filter((item) => item.id !== template.id))
      setExpandedIds((current) => current.filter((id) => id !== template.id))
      toast.success('个人模板已删除')
    } catch {
      toast.error('删除失败，请稍后重试')
    }
  }

  const copyTemplate = async (template: PteTemplate) => {
    try {
      await navigator.clipboard.writeText(template.lines.join('\n'))
      toast.success('模板正文已复制')
    } catch {
      toast.error('复制失败，请手动选择模板文字')
    }
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex justify-end bg-slate-950/55 backdrop-blur-sm"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="pte-template-library-title"
        className="h-full w-full overflow-y-auto bg-[#f5f8fa] shadow-2xl sm:max-w-3xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="sticky top-0 z-20 border-b border-slate-700 bg-[#16324f] px-5 py-5 text-white shadow-md sm:px-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-200">Template Library</p>
              <h2 id="pte-template-library-title" className="mt-1 text-2xl font-black">PTE 模板库</h2>
              <p className="mt-2 text-sm text-slate-200">内置你的示例模板，也可以把自己的版本保存到数据库。</p>
            </div>
            <button type="button" onClick={onClose} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-2xl transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white" aria-label="关闭模板库">×</button>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setForm(blankForm(activeFilter === '全部' ? initialTask : activeFilter))} className="min-h-10 rounded-xl bg-cyan-300 px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">＋ 添加自己的模板</button>
            <span className="text-xs text-cyan-100">个人模板仅显示在当前登录账户中</span>
          </div>
        </header>

        <div className="sticky top-[10.7rem] z-10 border-b border-slate-200 bg-[#f5f8fa]/95 px-4 py-3 backdrop-blur sm:px-6">
          <div className="flex gap-2 overflow-x-auto pb-1" aria-label="按题型筛选模板">
            {['全部', ...PTE_TEMPLATE_TASK_TYPES].map((taskType) => (
              <button type="button" key={taskType} onClick={() => setActiveFilter(taskType)} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${activeFilter === taskType ? 'bg-[#16324f] text-white' : 'border border-slate-200 bg-white text-slate-600 hover:border-cyan-300 hover:text-cyan-800'}`}>{taskType}</button>
            ))}
          </div>
        </div>

        <div className="space-y-4 p-4 sm:p-6">
          {databaseError && (
            <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-900">示例模板仍可正常使用；个人模板数据库暂未连接，请执行 <span className="font-black">pte-templates-table.sql</span> 后重试。</div>
          )}

          {form && (
            <section className="rounded-3xl border border-cyan-200 bg-white p-4 shadow-lg sm:p-6" aria-label="个人模板编辑器">
              <div className="flex items-center justify-between gap-3">
                <div><p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-700">MY TEMPLATE</p><h3 className="mt-1 text-xl font-black text-slate-950">{form.id ? '编辑个人模板' : '添加个人模板'}</h3></div>
                <button type="button" onClick={() => setForm(null)} className="rounded-xl px-3 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100">取消</button>
              </div>

              <fieldset className="mt-5">
                <legend className="text-sm font-black text-slate-800">所属题型（可多选）</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {PTE_TEMPLATE_TASK_TYPES.map((taskType) => {
                    const selected = form.taskTypes.includes(taskType)
                    return (
                      <label key={taskType} className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-black ${selected ? 'border-cyan-500 bg-cyan-50 text-cyan-800' : 'border-slate-200 text-slate-500'}`}>
                        <input type="checkbox" checked={selected} onChange={() => setForm((current) => current ? ({ ...current, taskTypes: selected ? current.taskTypes.filter((item) => item !== taskType) : [...current.taskTypes, taskType] }) : current)} className="sr-only" />
                        {selected ? '✓ ' : ''}{taskType}
                      </label>
                    )
                  })}
                </div>
              </fieldset>

              <div className="mt-4 grid gap-4 sm:grid-cols-[0.7fr_1.3fr]">
                <label><span className="label-primary">标签 *</span><input value={form.badge} maxLength={30} onChange={(event) => setForm({ ...form, badge: event.target.value })} className="input-primary w-full bg-white" placeholder="例如：DI 数据类" /></label>
                <label><span className="label-primary">模板名称 *</span><input value={form.title} maxLength={80} onChange={(event) => setForm({ ...form, title: event.target.value })} className="input-primary w-full bg-white" placeholder="例如：我的柱状图模板" /></label>
              </div>
              <label className="mt-4 block"><span className="label-primary">简短说明</span><input value={form.subtitle} maxLength={160} onChange={(event) => setForm({ ...form, subtitle: event.target.value })} className="input-primary w-full bg-white" placeholder="适用场景、时间或使用方式" /></label>
              <label className="mt-4 block"><span className="label-primary">使用提示（每行一条）</span><textarea value={form.tips} rows={3} onChange={(event) => setForm({ ...form, tips: event.target.value })} className="input-primary w-full resize-y bg-white" placeholder={'先找主题词\n只记录有把握的数字'} /></label>
              <label className="mt-4 block"><span className="label-primary">模板正文（每行一句）*</span><textarea value={form.lines} rows={9} onChange={(event) => setForm({ ...form, lines: event.target.value })} className="input-primary w-full resize-y bg-white font-mono text-sm leading-6" placeholder={'This graph shows information about [主题].\nThe largest number can be found in [类别].'} /></label>
              <button type="button" disabled={saving || !userId} onClick={saveForm} className="mt-5 min-h-11 w-full rounded-xl bg-[#16324f] px-4 py-2 text-sm font-black text-white transition hover:bg-[#21496f] disabled:cursor-not-allowed disabled:opacity-50">{saving ? '正在保存到数据库…' : userId ? '保存个人模板' : '登录后可以保存'}</button>
            </section>
          )}

          {loading && <p className="py-4 text-center text-sm text-slate-500">正在读取个人模板…</p>}
          {!loading && visibleTemplates.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">这个题型还没有模板，你可以点击上方按钮添加自己的模板。</div>}

          {visibleTemplates.map(({ template, custom }) => {
            const expanded = expandedIds.includes(template.id)
            const savedTemplate = custom ? (template as SavedPteTemplate) : null
            return (
              <article key={template.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <button type="button" onClick={() => toggle(template.id)} className="flex w-full items-start justify-between gap-4 px-4 py-4 text-left transition hover:bg-slate-50 sm:px-5" aria-expanded={expanded}>
                  <span>
                    <span className={`inline-flex rounded-lg px-2 py-1 text-xs font-black ${custom ? 'bg-violet-100 text-violet-800' : 'bg-cyan-100 text-cyan-800'}`}>{custom ? '我的' : '示例'} · {template.badge}</span>
                    <span className="mt-2 block text-lg font-black text-gray-900">{template.title}</span>
                    <span className="mt-1 block text-xs leading-5 text-gray-500">{template.taskTypes.join(' / ')}{template.subtitle ? ` · ${template.subtitle}` : ''}</span>
                  </span>
                  <span className="mt-1 text-xl font-bold text-gray-400" aria-hidden="true">{expanded ? '−' : '+'}</span>
                </button>

                {expanded && (
                  <div className="border-t border-slate-200 px-4 pb-5 pt-4 sm:px-5">
                    {template.tips.length > 0 && <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3"><p className="text-xs font-black text-amber-800">使用提示</p><ul className="mt-2 space-y-1 text-xs leading-5 text-amber-900/80">{template.tips.map((tip, index) => <li key={`${tip}-${index}`}>• {tip}</li>)}</ul></div>}
                    <div className="space-y-3 rounded-xl bg-slate-900 p-4 text-sm leading-7 text-slate-100 sm:p-5">{template.lines.map((line, index) => <p key={`${line}-${index}`}>{line}</p>)}</div>
                    <div className="mt-4 flex flex-wrap justify-end gap-2">
                      <button type="button" onClick={() => copyTemplate(template)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50">复制正文</button>
                      {savedTemplate && <><button type="button" onClick={() => startEditing(savedTemplate)} className="rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-black text-cyan-800 hover:bg-cyan-100">编辑</button><button type="button" onClick={() => removeTemplate(savedTemplate)} className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-black text-rose-600 hover:bg-rose-50">删除</button></>}
                    </div>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}
