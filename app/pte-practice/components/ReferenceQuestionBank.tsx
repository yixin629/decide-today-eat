'use client'

import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { SKILL_NAMES, STUDY_SKILLS } from '../lib/study'
import type { PteSkill } from '../types'

type ReferenceQuestion = {
  question_code: string
  source_number: number
  title: string
  question_text: string
  answer_text: string
  source_pages: Record<string, number>
  review_status: 'needs-review' | 'reviewed' | 'incomplete'
}

const PAGE_SIZE = 24
const CODES_BY_SKILL: Record<PteSkill, readonly string[]> = {
  speaking: ['RA', 'RS', 'DI', 'RL', 'ASQ', 'SGD'],
  writing: ['SWT', 'WE'],
  reading: ['MCSR', 'MCMR', 'RO', 'FIB', 'FIBD&D'],
  listening: ['FIBL', 'HCS', 'MCSL', 'MCML', 'SST', 'SMW', 'HIW', 'WFD'],
}
const CODES = STUDY_SKILLS.flatMap((skill) => CODES_BY_SKILL[skill])
const CODE_SKILL = Object.fromEntries(STUDY_SKILLS.flatMap((skill) => CODES_BY_SKILL[skill].map((code) => [code, skill]))) as Record<string, PteSkill>

export default function ReferenceQuestionBank() {
  const [query, setQuery] = useState('')
  const [skill, setSkill] = useState<PteSkill | 'all'>('all')
  const [code, setCode] = useState('all')
  const [page, setPage] = useState(0)
  const [rows, setRows] = useState<ReferenceQuestion[]>([])
  const [total, setTotal] = useState(0)
  const [selected, setSelected] = useState<ReferenceQuestion | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const timeout = window.setTimeout(async () => {
      setLoading(true)
      const term = query.trim().replace(/[^\p{L}\p{N} #&-]/gu, '').slice(0, 80)
      let request = supabase.from('pte_reference_questions')
        .select('question_code,source_number,title,question_text,answer_text,source_pages,review_status', { count: 'exact' })
        .order('question_code').order('source_number')
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
      if (code !== 'all') request = request.eq('question_code', code)
      else if (skill !== 'all') request = request.in('question_code', [...CODES_BY_SKILL[skill]])
      if (term) {
        const number = Number(term.replace(/^#/, ''))
        const tagged = term.toUpperCase().match(/^([A-Z&]+)\s*#?\s*(\d+)$/)
        if (Number.isInteger(number) && number > 0) request = request.eq('source_number', number)
        else if (tagged && CODES.includes(tagged[1])) request = request.eq('question_code', tagged[1]).eq('source_number', Number(tagged[2]))
        else request = request.or(`title.ilike.%${term}%,question_text.ilike.%${term}%,answer_text.ilike.%${term}%`)
      }
      const result = await request
      if (!active) return
      setLoading(false)
      if (result.error) {
        setError(result.error.message)
        setRows([])
        setTotal(0)
        return
      }
      setError(null)
      setRows((result.data ?? []) as ReferenceQuestion[])
      setTotal(result.count ?? 0)
    }, 250)
    return () => { active = false; window.clearTimeout(timeout) }
  }, [query, skill, code, page])

  return <section className="pte-library">
    <div className="pte-section-heading"><div><p className="pte-eyebrow">SOURCE MATERIAL</p><h2>资料题目</h2><p className="pte-muted">{loading ? '正在查询' : `${total} 道题目`} · 原资料提取内容，答案需逐题校对</p></div></div>
    <div className="pte-library-toolbar">
      <label className="pte-search"><Search size={17} /><input aria-label="搜索资料题号或关键词" placeholder="搜索题号、题干或答案关键词" value={query} onChange={(event) => { setQuery(event.target.value); setPage(0); setSelected(null) }} /></label>
    </div>
    <div className="pte-task-picker" role="group" aria-label="资料题型分类">
      <div className="pte-skill-tabs" role="tablist" aria-label="资料题型：技能">
        <button type="button" role="tab" aria-selected={skill === 'all'} className={skill === 'all' ? 'active' : ''} onClick={() => { setSkill('all'); setCode('all'); setPage(0); setSelected(null) }}>全部</button>
        {STUDY_SKILLS.map((value) => <button key={value} type="button" role="tab" aria-selected={skill === value} className={skill === value ? 'active' : ''} onClick={() => { setSkill(value); setCode('all'); setPage(0); setSelected(null) }}>{SKILL_NAMES[value]}</button>)}
      </div>
      <div className="pte-type-chips">
        {skill !== 'all' && <button type="button" aria-pressed={code === 'all'} className={code === 'all' ? 'active' : ''} onClick={() => { setCode('all'); setPage(0); setSelected(null) }}>全部{SKILL_NAMES[skill]}</button>}
        {(skill === 'all' ? CODES : CODES_BY_SKILL[skill]).map((value) => <button key={value} type="button" aria-pressed={code === value} className={code === value ? 'active' : ''} onClick={() => { setSkill(CODE_SKILL[value]); setCode(value); setPage(0); setSelected(null) }}><span className={`pte-chip-code skill-${CODE_SKILL[value]}`}>{value}</span></button>)}
      </div>
    </div>
    {error && <p className="pte-notice" role="alert">资料题库尚不可用：{error}</p>}
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,1fr)]">
      <div className="pte-question-list">{rows.map((row) => <button key={`${row.question_code}:${row.source_number}`} className="pte-question-row w-full text-left" onClick={() => setSelected(row)}><span className={`pte-task-code skill-${CODE_SKILL[row.question_code] ?? 'reading'}`}>{row.question_code}</span><span className="pte-question-copy min-w-0"><strong>#{row.source_number} {row.title}</strong><span className="block line-clamp-2 text-xs text-[#647278]">{row.question_text || '题干待补全'}</span></span><span className="ml-auto shrink-0 text-xs text-[#647278]">{row.review_status === 'reviewed' ? '已校对' : row.review_status === 'incomplete' ? '待补全' : '待校对'}</span></button>)}</div>
      <aside className="min-w-0 border border-[#e3e8e8] p-4">{selected ? <><h3>{selected.question_code} #{selected.source_number}</h3><p className="pte-muted">{selected.title} · {selected.review_status === 'incomplete' ? '待补全' : selected.review_status === 'reviewed' ? '已校对' : '待校对'}</p><h3 className="mt-5">题干</h3><p className="whitespace-pre-wrap break-words text-sm leading-6">{selected.question_text || '待补全'}</p><h3 className="mt-5">参考答案</h3><p className="whitespace-pre-wrap break-words text-sm leading-6">{selected.answer_text || '待补全'}</p><p className="pte-muted mt-5">来源：{Object.entries(selected.source_pages).map(([name, number]) => `${name} 第 ${number} 页`).join(' · ') || '未记录'}</p></> : <p className="pte-muted">选择题目查看题干、参考答案和来源页码。</p>}</aside>
    </div>
    {!loading && !error && rows.length === 0 && <p className="pte-empty">没有匹配的资料题目。</p>}
    {total > PAGE_SIZE && <div className="pte-pagination"><span>第 {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} 题，共 {total} 题</span><div><button className="pte-icon-button" aria-label="上一页" disabled={page === 0} onClick={() => setPage(page - 1)}><ChevronLeft size={18} /></button><span>{page + 1} / {Math.ceil(total / PAGE_SIZE)}</span><button className="pte-icon-button" aria-label="下一页" disabled={(page + 1) * PAGE_SIZE >= total} onClick={() => setPage(page + 1)}><ChevronRight size={18} /></button></div></div>}
  </section>
}
