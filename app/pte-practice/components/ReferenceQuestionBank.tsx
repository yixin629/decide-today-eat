'use client'

import { ChevronLeft, ChevronRight, ImageUp, RotateCcw, Search } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useSpeechPlayer } from '../hooks/useSpeechPlayer'
import { referenceToPracticeItem, type ReferenceQuestion } from '../lib/reference-items'
import { SKILL_NAMES, STUDY_SKILLS } from '../lib/study'
import type { PracticeItem, PteSkill } from '../types'

const PAGE_SIZE = 24
const CODES_BY_SKILL: Record<PteSkill, readonly string[]> = {
  speaking: ['RA', 'RS', 'DI', 'RL', 'ASQ', 'SGD'],
  writing: ['SWT', 'WE'],
  reading: ['MCSR', 'MCMR', 'RO', 'FIB', 'FIBD&D'],
  listening: ['FIBL', 'HCS', 'MCSL', 'MCML', 'SST', 'SMW', 'HIW', 'WFD'],
}
const CODES = STUDY_SKILLS.flatMap((skill) => CODES_BY_SKILL[skill])
const CODE_SKILL = Object.fromEntries(STUDY_SKILLS.flatMap((skill) => CODES_BY_SKILL[skill].map((code) => [code, skill]))) as Record<string, PteSkill>
const TEXT_PRACTICE_CODES = new Set(['ASQ', 'SWT', 'WE', 'WFD'])

function canPracticeText(row: ReferenceQuestion, hasImage: boolean) {
  if (row.question_code === 'DI') return hasImage && row.answer_text.trim().length > 0
  if (row.question_code === 'WFD') return false
  return TEXT_PRACTICE_CODES.has(row.question_code) && row.review_status !== 'incomplete'
    && row.question_text.trim().length > (row.question_code === 'ASQ' || row.question_code === 'WFD' ? 10 : 50)
    && row.answer_text.trim().length > 0
}

export default function ReferenceQuestionBank({ onPractice, initialCode, initialQuery = '' }: {
  onPractice: (item: PracticeItem) => void
  initialCode?: string | null
  initialQuery?: string
}) {
  const startingCode = initialCode && CODES.includes(initialCode) ? initialCode : 'all'
  const [query, setQuery] = useState(initialQuery)
  const [skill, setSkill] = useState<PteSkill | 'all'>(startingCode === 'all' ? 'all' : CODE_SKILL[startingCode])
  const [code, setCode] = useState(startingCode)
  const [page, setPage] = useState(0)
  const [rows, setRows] = useState<ReferenceQuestion[]>([])
  const [total, setTotal] = useState(0)
  const [selected, setSelected] = useState<ReferenceQuestion | null>(null)
  const [practicing, setPracticing] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [answer, setAnswer] = useState('')
  const [showAnswer, setShowAnswer] = useState(false)
  const detailRef = useRef<HTMLElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const imageUrlsRef = useRef(new Map<number, string>())
  const [imageUrls, setImageUrls] = useState<Map<number, string>>(new Map())
  const [imageNotice, setImageNotice] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const speech = useSpeechPlayer()

  useEffect(() => {
    const urls = imageUrlsRef.current
    return () => { urls.forEach((url) => URL.revokeObjectURL(url)) }
  }, [])

  function loadLocalImages(files: FileList | null) {
    if (!files) return
    const next = new Map<number, string>()
    let skipped = 0
    for (const file of Array.from(files)) {
      const match = /^DI-(\d+)\.(jpe?g|png|webp)$/i.exec(file.name)
      if (!match || file.size > 10 * 1024 * 1024 || next.has(Number(match[1]))) {
        skipped += 1
        continue
      }
      next.set(Number(match[1]), URL.createObjectURL(file))
    }
    imageUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
    imageUrlsRef.current.clear()
    next.forEach((url, number) => imageUrlsRef.current.set(number, url))
    setImageUrls(new Map(next))
    setImageNotice(`已在本机载入 ${next.size} 张 DI 图片${skipped ? `，跳过 ${skipped} 个不支持的文件` : ''}。刷新页面后需重新选择。`)
    if (imageInputRef.current) imageInputRef.current.value = ''
  }

  function selectQuestion(row: ReferenceQuestion) {
    speech.stop()
    setSelected(row)
    setPracticing(false)
    setSubmitted(false)
    setAnswer('')
    setShowAnswer(false)
    window.requestAnimationFrame(() => detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }))
  }

  function startPractice() {
    speech.stop()
    setAnswer('')
    setSubmitted(false)
    setShowAnswer(false)
    setPracticing(true)
  }

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

  const practiceItem = selected ? referenceToPracticeItem(selected) : null

  return <section className="pte-library">
    <div className="pte-section-heading"><div><p className="pte-eyebrow">SOURCE QUESTION BANK</p><h2>专项题库</h2><p className="pte-muted">{loading ? '正在查询' : `${total} 道题目`} · 按原资料题号查看，未校对内容不自动评分</p></div></div>
    <div className="pte-library-toolbar">
      <label className="pte-search"><Search size={17} /><input aria-label="搜索资料题号或关键词" placeholder="搜索题号、题干或答案关键词" value={query} onChange={(event) => { setQuery(event.target.value); setPage(0); setSelected(null) }} /></label>
      <input ref={imageInputRef} type="file" accept=".jpg,.jpeg,.png,.webp" multiple className="sr-only" tabIndex={-1} onChange={(event) => loadLocalImages(event.target.files)} />
      <button type="button" className="pte-button" title="只在当前浏览器会话读取，不上传" onClick={() => imageInputRef.current?.click()}><ImageUp size={16} />载入本机 DI 图片</button>
    </div>
    {imageNotice && <p className="pte-small-note mb-4" role="status">{imageNotice}</p>}
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
      <div className="pte-question-list order-last lg:order-first">{rows.map((row) => <button key={`${row.question_code}:${row.source_number}`} className="pte-question-row w-full text-left" onClick={() => selectQuestion(row)}><span className={`pte-task-code skill-${CODE_SKILL[row.question_code] ?? 'reading'}`}>{row.question_code}</span><span className="pte-question-copy min-w-0"><strong>#{row.source_number} {row.title}</strong><span className="block line-clamp-2 text-xs text-[#647278]">{row.question_code === 'WFD' ? '听写自练 · 点击进入' : row.question_text || '题干待补全'}</span></span><span className="ml-auto shrink-0 text-xs text-[#647278]">{referenceToPracticeItem(row) ? '可自练' : row.review_status === 'incomplete' ? '待补全' : '资料自练'}</span></button>)}</div>
      <aside ref={detailRef} className="min-w-0 border border-[#e3e8e8] p-4 order-first lg:order-last" aria-live="polite">{selected ? <><h3>{selected.question_code} #{selected.source_number}</h3><p className="pte-muted">{selected.title} · {selected.review_status === 'incomplete' ? '待补全' : selected.review_status === 'reviewed' ? '已校对' : '待校对'}</p>{selected.question_code === 'WFD' && !submitted && !showAnswer ? <p className="pte-small-note mt-5">原句将在提交后显示；播放的是浏览器合成语音，不是原始考试音频。</p> : <><h3 className="mt-5">题干</h3><p className="whitespace-pre-wrap break-words text-sm leading-6">{selected.question_text || '待补全'}</p></>}
        {selected.question_code === 'DI' && (imageUrls.has(selected.source_number) ? <div className="relative mt-4 aspect-[4/3] w-full bg-[#f3f6f4]"><Image src={imageUrls.get(selected.source_number)!} alt={`DI #${selected.source_number} ${selected.title} 原资料图片候选`} fill unoptimized className="object-contain" /></div> : <p className="pte-small-note mt-4">未载入这道 DI 的本机原图；请选择提取目录中的 DI-题号 图片文件。</p>)}
        <div className="mt-5">{practiceItem && <button type="button" className="pte-button mb-3" onClick={() => onPractice(practiceItem)}>{selected.question_code === 'WFD' ? '开始听写自练' : selected.question_code === 'RS' ? '开始复述自练' : '开始朗读自练'}</button>}{!canPracticeText(selected, imageUrls.has(selected.source_number)) && !practiceItem && <p className="pte-small-note mb-3">原资料缺少完整答案、图片、音频或可判分结构；本题只供记录个人作答，不能按考试方式练习或评分。</p>}{!practicing ? practiceItem ? null : <button type="button" className="pte-button" onClick={startPractice}>{canPracticeText(selected, imageUrls.has(selected.source_number)) ? selected.question_code === 'DI' ? '开始看图自练' : '开始文本自练' : '开始资料自练'}</button> : <form onSubmit={(event) => { event.preventDefault(); if (answer.trim()) { speech.stop(); setSubmitted(true) } }}><label className="block text-sm font-semibold" htmlFor="pte-reference-answer">我的作答</label><textarea id="pte-reference-answer" className="mt-2 w-full min-h-32 rounded-md border border-[#dce4df] bg-white p-3 text-sm" value={answer} onChange={(event) => setAnswer(event.target.value)} disabled={submitted} maxLength={5000} required aria-required="true" /><div className="mt-3 flex flex-wrap gap-3">{!submitted ? <button type="submit" className="pte-button">{selected.answer_text.trim() ? '提交并对照' : '完成本次自练'}</button> : <button type="button" className="pte-button" onClick={startPractice}><RotateCcw size={16} />再练一次</button>}</div></form>}</div>
        {(submitted || showAnswer) ? <><h3 className="mt-5">{selected.answer_text.trim() ? '参考答案（未校对）' : '参考答案待补全'}</h3><p className="whitespace-pre-wrap break-words text-sm leading-6">{selected.answer_text || '原资料未提供可核对的答案。'}</p><p className="pte-small-note mt-3">仅供自主对照，不生成分数或练习记录。</p></> : !practicing && <button type="button" className="mt-5 text-sm text-[#087f72] underline" onClick={() => setShowAnswer(true)}>查看参考资料</button>}
        <p className="pte-muted mt-5">来源：{Object.entries(selected.source_pages).map(([name, number]) => `${name} 第 ${number} 页`).join(' · ') || '未记录'}</p></> : <p className="pte-muted">选择题目查看题干、参考答案和来源页码。</p>}</aside>
    </div>
    {!loading && !error && rows.length === 0 && <p className="pte-empty">没有匹配的资料题目。</p>}
    {total > PAGE_SIZE && <div className="pte-pagination"><span>第 {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} 题，共 {total} 题</span><div><button className="pte-icon-button" aria-label="上一页" disabled={page === 0} onClick={() => setPage(page - 1)}><ChevronLeft size={18} /></button><span>{page + 1} / {Math.ceil(total / PAGE_SIZE)}</span><button className="pte-icon-button" aria-label="下一页" disabled={(page + 1) * PAGE_SIZE >= total} onClick={() => setPage(page + 1)}><ChevronRight size={18} /></button></div></div>}
  </section>
}
