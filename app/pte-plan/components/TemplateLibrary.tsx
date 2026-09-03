'use client'

import { useEffect, useState } from 'react'
import { PTE_TEMPLATES } from '../lib/templates'

interface TemplateLibraryProps {
  open: boolean
  initialTask?: string
  onClose: () => void
}

export default function TemplateLibrary({ open, initialTask, onClose }: TemplateLibraryProps) {
  const [expandedIds, setExpandedIds] = useState<string[]>([])

  useEffect(() => {
    if (!open) return
    const matchingIds = PTE_TEMPLATES.filter(
      (template) => !initialTask || template.taskTypes.includes(initialTask)
    ).map((template) => template.id)
    setExpandedIds(matchingIds.length > 0 ? [matchingIds[0]] : [PTE_TEMPLATES[0].id])
  }, [initialTask, open])

  useEffect(() => {
    if (!open) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [onClose, open])

  if (!open) return null

  const visibleTemplates = initialTask
    ? PTE_TEMPLATES.filter((template) => template.taskTypes.includes(initialTask))
    : PTE_TEMPLATES

  const toggle = (id: string) => {
    setExpandedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    )
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
        className="h-full w-full overflow-y-auto bg-[#f5f8fa] shadow-2xl sm:max-w-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="sticky top-0 z-10 border-b border-slate-700 bg-[#16324f] px-5 py-5 text-white shadow-md sm:px-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-200">
                Template Library
              </p>
              <h2 id="pte-template-library-title" className="mt-1 text-2xl font-black">
                {initialTask ? `${initialTask} 模板` : 'PTE 口语与写作模板库'}
              </h2>
              <p className="mt-2 text-sm text-slate-200">
                训练时从题型表头打开，不需要离开当天计划。
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-2xl transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label="关闭模板库"
            >
              ×
            </button>
          </div>
        </header>

        <div className="space-y-4 p-4 sm:p-6">
          {visibleTemplates.map((template) => {
            const expanded = expandedIds.includes(template.id)
            return (
              <article
                key={template.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => toggle(template.id)}
                  className="flex w-full items-start justify-between gap-4 px-4 py-4 text-left transition hover:bg-slate-50 sm:px-5"
                  aria-expanded={expanded}
                >
                  <span>
                    <span className="inline-flex rounded-lg bg-cyan-100 px-2 py-1 text-xs font-black text-cyan-800">
                      {template.badge}
                    </span>
                    <span className="mt-2 block text-lg font-black text-gray-900">
                      {template.title}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-gray-500">
                      {template.subtitle}
                    </span>
                  </span>
                  <span className="mt-1 text-xl font-bold text-gray-400" aria-hidden="true">
                    {expanded ? '−' : '+'}
                  </span>
                </button>

                {expanded && (
                  <div className="border-t border-slate-200 px-4 pb-5 pt-4 sm:px-5">
                    <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
                      <p className="text-xs font-black text-amber-800">使用提示</p>
                      <ul className="mt-2 space-y-1 text-xs leading-5 text-amber-900/80">
                        {template.tips.map((tip) => (
                          <li key={tip}>• {tip}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="space-y-3 rounded-xl bg-slate-900 p-4 text-sm leading-7 text-slate-100 sm:p-5">
                      {template.lines.map((line) => (
                        <p key={line}>{line}</p>
                      ))}
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
