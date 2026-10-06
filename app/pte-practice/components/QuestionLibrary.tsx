'use client'

import { ArrowDownWideNarrow, ArrowRight, Bookmark, CheckCircle2, ChevronLeft, ChevronRight, Search, Shuffle } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { AttemptRecord, PracticeItem, TaskType } from '../types'
import { TASK_TYPE_META } from '../lib/taskTypes'
import { itemKey, itemPreview, itemSourceLabel, latestByItem, needsReview, objectivePercent, SKILL_NAMES, TASK_CODES } from '../lib/study'
import TaskTypePicker, { type SkillFilter } from './TaskTypePicker'

export type LibraryFilter = 'all' | 'unpracticed' | 'practiced' | 'bookmarked' | 'review'
const FILTER_LABELS: Record<LibraryFilter, string> = { all: '全部题目', unpracticed: '未练习', practiced: '已练习', bookmarked: '我的收藏', review: '错题复习' }
const PAGE_SIZE = 12

export default function QuestionLibrary({ items, cloudIds, customKeys = [], attempts, bookmarks, initialTask, initialFilter = 'all', onBookmark, onStart }: {
  items: PracticeItem[]; cloudIds: string[]; customKeys?: string[]; attempts: AttemptRecord[]; bookmarks: string[]
  initialTask?: TaskType; initialFilter?: LibraryFilter
  onBookmark: (key: string) => void
  onStart: (items: PracticeItem[], index: number) => void
}) {
  const [task, setTask] = useState<TaskType | 'all'>(initialTask ?? 'all')
  const [skill, setSkill] = useState<SkillFilter>(initialTask ? TASK_TYPE_META[initialTask].skill : 'all')
  const [filter, setFilter] = useState<LibraryFilter>(initialFilter)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('default')
  const [page, setPage] = useState(0)
  const latest = useMemo(() => latestByItem(attempts), [attempts])
  const bookmarkSet = new Set(bookmarks)
  const cloudSet = new Set(cloudIds)
  const customSet = new Set(customKeys)
  // 先按练习状态和搜索过滤，题型芯片上的数量据此计算，再按技能/题型收窄。
  const matching = items.filter((item) => {
    const key = itemKey(item)
    const attempt = latest.get(key)
    if ((filter === 'unpracticed' && attempt) || (filter === 'practiced' && !attempt)) return false
    if ((filter === 'bookmarked' && !bookmarkSet.has(key)) || (filter === 'review' && !needsReview(attempt))) return false
    return `${item.id} ${TASK_CODES[item.taskType]} ${TASK_TYPE_META[item.taskType].shortLabel} ${itemPreview(item)}`.toLowerCase().includes(query.trim().toLowerCase())
  })
  const counts: Partial<Record<TaskType, number>> = {}
  for (const item of matching) counts[item.taskType] = (counts[item.taskType] ?? 0) + 1
  const filtered = matching.filter((item) => (task === 'all' ? skill === 'all' || TASK_TYPE_META[item.taskType].skill === skill : item.taskType === task)).sort((a, b) => sort === 'recent'
    ? Date.parse(latest.get(itemKey(b))?.createdAt ?? '1970-01-01') - Date.parse(latest.get(itemKey(a))?.createdAt ?? '1970-01-01')
    : sort === 'id' ? a.id.localeCompare(b.id, undefined, { numeric: true }) : 0)
  const safePage = Math.min(page, Math.max(0, Math.ceil(filtered.length / PAGE_SIZE) - 1))
  const visible = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE)
  const changeFilter = (value: LibraryFilter) => { setFilter(value); setPage(0) }

  return <div className="pte-library">
    <div className="pte-section-heading"><div><p className="pte-eyebrow">QUESTION BANK</p><h2>{filter === 'review' ? '错题复习' : filter === 'bookmarked' ? '我的收藏' : '练习题库'}</h2><p className="pte-muted">{filtered.length} 道题目{task !== 'all' ? ` · ${TASK_TYPE_META[task].label}` : skill !== 'all' ? ` · ${SKILL_NAMES[skill]}` : ' · PTE Academic'}</p></div><button className="pte-button" disabled={!filtered.length} onClick={() => onStart(filtered, Math.floor(Math.random() * filtered.length))}><Shuffle size={16} />随机练习</button></div>
    <div className="pte-library-toolbar">
      <label className="pte-search"><Search size={17} /><input aria-label="搜索题号或题目" placeholder="搜索题号、题型或题目内容" value={query} onChange={(e) => { setQuery(e.target.value); setPage(0) }} /></label>
      <label className="pte-select-label"><ArrowDownWideNarrow size={16} /><select aria-label="题目排序" value={sort} onChange={(e) => { setSort(e.target.value); setPage(0) }}><option value="default">默认排序</option><option value="recent">最近练习</option><option value="id">按题号</option></select></label>
    </div>
    <TaskTypePicker skill={skill} task={task} counts={counts} onChange={(next) => { setSkill(next.skill); setTask(next.task); setPage(0) }} />
    <div className="pte-filter-tabs" aria-label="练习状态">{(Object.keys(FILTER_LABELS) as LibraryFilter[]).map((f) => <button key={f} aria-pressed={filter === f} className={filter === f ? 'active' : ''} onClick={() => changeFilter(f)}>{FILTER_LABELS[f]}</button>)}</div>
    {filter === 'review' && <p className="pte-small-note my-3">按每道题最近一次客观内容得分整理；重练全对后自动移出。口语与写作估分不自动判为错题。</p>}
    <div className="pte-question-list">{visible.map((item, index) => {
      const key = itemKey(item)
      const meta = TASK_TYPE_META[item.taskType]
      const attempt = latest.get(key)
      const pct = attempt ? objectivePercent(attempt) : null
      return <article className="pte-question-row" key={key}>
        <span className={`pte-task-code skill-${meta.skill}`}>{TASK_CODES[item.taskType]}</span>
        <div className="pte-question-copy"><div className="pte-question-meta"><span>#{item.id}</span><span>{itemSourceLabel(item, customSet.has(key))}{customSet.has(key) ? ' · 自定义' : cloudSet.has(key) ? ' · 云端' : ''}</span>{attempt && <span className={needsReview(attempt) ? 'pte-review-label' : 'pte-complete-label'}><CheckCircle2 size={12} />{pct !== null ? `客观项 ${pct}%` : '已练习'}</span>}</div><button onClick={() => onStart(filtered, safePage * PAGE_SIZE + index)} className="pte-question-title">{itemPreview(item)}</button><p>{meta.shortLabel} · {meta.timeLimitSeconds ? `${meta.timeLimitSeconds < 60 ? `${meta.timeLimitSeconds} 秒` : `${meta.timeLimitSeconds / 60} 分钟`}练习计时` : '自由练习'}{item.provenance ? ` · ${item.provenance.sourceTitle}` : ''}</p></div>
        <div className="pte-row-actions"><button className={`pte-icon-button ${bookmarkSet.has(key) ? 'bookmarked' : ''}`} aria-label={bookmarkSet.has(key) ? `取消收藏 ${item.id}` : `收藏 ${item.id}`} title={bookmarkSet.has(key) ? '取消收藏' : '收藏题目'} aria-pressed={bookmarkSet.has(key)} onClick={() => onBookmark(key)}><Bookmark size={18} fill={bookmarkSet.has(key) ? 'currentColor' : 'none'} /></button><button className="pte-icon-button start" aria-label={`练习 ${item.id}`} title="开始练习" onClick={() => onStart(filtered, safePage * PAGE_SIZE + index)}><ArrowRight size={19} /></button></div>
      </article>
    })}</div>
    {!visible.length && <div className="pte-empty"><Search size={30} /><h3>{filter === 'review' ? '暂时没有待复习错题' : '没有匹配的题目'}</h3><p>{filter === 'bookmarked' ? '收藏的题目会保留在这台设备上。' : '可以调整题型、练习状态或搜索内容。'}</p><button className="pte-button" onClick={() => { setQuery(''); setTask('all'); setSkill('all'); changeFilter('all') }}>查看全部题目</button></div>}
    {!!filtered.length && <div className="pte-pagination"><span>第 {safePage * PAGE_SIZE + 1}–{Math.min((safePage + 1) * PAGE_SIZE, filtered.length)} 题，共 {filtered.length} 题</span><div><button className="pte-icon-button" title="上一页" aria-label="上一页" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}><ChevronLeft size={18} /></button><span>{safePage + 1} / {Math.ceil(filtered.length / PAGE_SIZE)}</span><button className="pte-icon-button" title="下一页" aria-label="下一页" disabled={(safePage + 1) * PAGE_SIZE >= filtered.length} onClick={() => setPage(safePage + 1)}><ChevronRight size={18} /></button></div></div>}
  </div>
}
