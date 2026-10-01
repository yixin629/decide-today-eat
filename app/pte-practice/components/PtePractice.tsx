'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowLeft, BarChart3, Bookmark, BookOpen, CalendarDays, ChevronRight, Cloud, FilePlus2, GraduationCap, Headphones, History, LayoutDashboard, ListChecks, MessageSquare, NotebookPen, Timer, WifiOff } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useStudyPreferences } from '../hooks/useStudyPreferences'
import { loadAttempts } from '../lib/attempt-repository'
import { loadPracticeCatalog, type CustomItemInfo } from '../lib/item-repository'
import { getItemsForTaskType } from '../lib/questionBank'
import { itemKey, latestByItem, needsReview } from '../lib/study'
import { TASK_TYPES, type AttemptRecord, type PracticeItem, type TaskType } from '../types'
import AnalyticsDashboard from './analytics/AnalyticsDashboard'
import CommunityFeed from './CommunityFeed'
import HistoryPanel from './HistoryPanel'
import ListeningStudio from './ListeningStudio'
import MockExam from './mock-exam/MockExam'
import PracticeSession from './PracticeSession'
import QuestionLibrary, { type LibraryFilter } from './QuestionLibrary'
import TaskDashboard from './TaskDashboard'
import QuestionUploader from './upload/QuestionUploader'

type Tab = 'dashboard' | 'library' | 'review' | 'bookmarks' | 'listening' | 'mock-exam' | 'history' | 'analytics' | 'feed' | 'upload'
const NAV = [
  { id: 'dashboard', label: '学习工作台', icon: LayoutDashboard },
  { id: 'library', label: '专项题库', icon: BookOpen },
  { id: 'listening', label: '精听跟读', icon: Headphones },
  { id: 'mock-exam', label: '模拟考试', icon: Timer },
  { id: 'review', label: '错题复习', icon: ListChecks },
  { id: 'bookmarks', label: '我的收藏', icon: Bookmark },
  { id: 'history', label: '练习记录', icon: History },
  { id: 'analytics', label: '学习分析', icon: BarChart3 },
  { id: 'feed', label: '练习集锦', icon: MessageSquare },
  { id: 'upload', label: '上传题目', icon: FilePlus2 },
] as const

export default function PtePractice() {
  const { user, loading: authLoading } = useAuth()
  const { preferences, error: preferenceError, update, ready } = useStudyPreferences(user)
  const [tab, setTab] = useState<Tab>('dashboard')
  const [libraryTask, setLibraryTask] = useState<TaskType | undefined>()
  const [libraryKey, setLibraryKey] = useState(0)
  const [catalog, setCatalog] = useState({ items: TASK_TYPES.flatMap(getItemsForTaskType), cloudIds: [] as string[], customItems: [] as CustomItemInfo[], error: null as string | null })
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [history, setHistory] = useState({ attempts: [] as AttemptRecord[], source: 'local' as 'local' | 'cloud', error: null as string | null })
  const [historyLoading, setHistoryLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [session, setSession] = useState<{ queue: PracticeItem[]; index: number } | null>(null)
  const [sessionSaved, setSessionSaved] = useState(false)
  const [mockRunning, setMockRunning] = useState(false)
  const [catalogRefresh, setCatalogRefresh] = useState(0)

  useEffect(() => {
    let cancelled = false
    setCatalogLoading(true)
    loadPracticeCatalog().then((result) => { if (!cancelled) { setCatalog(result); setCatalogLoading(false) } })
    return () => { cancelled = true }
  }, [catalogRefresh])

  useEffect(() => {
    if (authLoading) return
    let cancelled = false
    setHistoryLoading(true)
    loadAttempts(user).then((result) => {
      if (cancelled) return
      setHistory(result)
      setHistoryLoading(false)
    })
    return () => { cancelled = true }
  }, [user, authLoading])

  function navigate(nextTab: Tab) {
    if (mockRunning && !window.confirm('离开模拟考试？已提交的作答会保留，当前模考进度不会保存。')) return
    setMockRunning(false)
    if (session && !sessionSaved && !window.confirm('离开当前练习？尚未提交的作答不会保存。')) return
    setSession(null)
    setTab(nextTab)
    setLibraryTask(undefined)
    setLibraryKey((key) => key + 1)
  }

  function openTask(task: TaskType) {
    setLibraryTask(task)
    setLibraryKey((key) => key + 1)
    setTab('library')
    setSession(null)
  }

  function start(queue: PracticeItem[], index: number) {
    const item = queue[index]
    if (!item) return
    setSession({ queue, index })
    setSessionSaved(false)
    update((p) => ({ ...p, recent: { taskType: item.taskType, itemId: item.id } }))
    window.scrollTo({ top: 0, behavior: 'instant' })
  }

  function startItem(taskType: TaskType, itemId: string) {
    const queue = catalog.items.filter((item) => item.taskType === taskType)
    const index = queue.findIndex((item) => item.id === itemId)
    if (index >= 0) start(queue, index)
    else openTask(taskType)
  }

  function bookmark(key: string) {
    update((p) => ({ ...p, bookmarks: p.bookmarks.includes(key) ? p.bookmarks.filter((id) => id !== key) : [...p.bookmarks, key] }))
  }

  function saved(attempt: AttemptRecord) {
    setHistory((previous) => ({ ...previous, attempts: [attempt, ...previous.attempts.filter((a) => a.id !== attempt.id)].slice(0, 200) }))
    setRefreshKey((key) => key + 1)
    setSessionSaved(true)
  }

  const reviewCount = [...latestByItem(history.attempts).values()].filter(needsReview).length
  const currentItem = session?.queue[session.index]
  const activeKey = currentItem ? itemKey(currentItem) : ''
  const libraryFilter: LibraryFilter = tab === 'bookmarks' ? 'bookmarked' : tab === 'review' ? 'review' : 'all'
  const contentTitle = session ? '专项练习' : NAV.find((item) => item.id === tab)?.label

  return <div className="pte-app">
    <header className="pte-brandbar"><div className="pte-brand"><span className="pte-brand-icon"><GraduationCap size={24} /></span><div><h1>PTE 学习空间</h1><span>Practice a little. Progress every day.</span></div></div><Link href="/" className="pte-mobile-home pte-icon-button" aria-label="返回首页" title="返回首页"><ArrowLeft size={18} /></Link><span className="pte-academic">ACADEMIC</span></header>
    <div className="pte-shell">
      <aside className="pte-sidebar">
        <p className="pte-nav-label">学习中心</p>
        <nav aria-label="PTE 学习导航">{NAV.map(({ id, label, icon: Icon }, index) => <button key={id} className={`pte-nav-item ${tab === id ? 'active' : ''} ${index === 4 ? 'pte-nav-break' : ''}`} aria-current={tab === id ? 'page' : undefined} onClick={() => navigate(id)}><Icon size={18} /><span>{label}</span>{id === 'review' && reviewCount > 0 && <small>{reviewCount}</small>}{id === 'bookmarks' && preferences.bookmarks.length > 0 && <small>{preferences.bookmarks.length}</small>}</button>)}</nav>
        <div className="pte-sidebar-bottom"><Link href="/pte-plan"><CalendarDays size={17} />我的备考计划<ChevronRight size={15} /></Link><Link href="/"><ArrowLeft size={16} />回到我们的小世界</Link><p>原创练习 · 非官方评分</p></div>
      </aside>
      <div className="pte-workspace">
        <div className="pte-workspace-top"><span>学习中心 <ChevronRight size={13} /> <strong>{contentTitle}</strong></span><span className="pte-sync">{history.source === 'cloud' ? <Cloud size={14} /> : <WifiOff size={14} />}{historyLoading ? '读取进度中' : history.source === 'cloud' ? '云端练习记录' : '本机练习记录'}</span></div>
        <div className="pte-content">
          {catalog.error && <div className="pte-notice" role="status">{catalog.error}<button onClick={() => setCatalogRefresh((n) => n + 1)} disabled={catalogLoading}>{catalogLoading ? '连接中' : '重试'}</button></div>}
          {history.error && <div className="pte-notice" role="status">云端记录暂时不可用，已加载当前身份的本机记录。</div>}
          {preferenceError && <div className="pte-notice" role="alert">{preferenceError}</div>}
          {session && currentItem ? <div>
            <div className="pte-session-context"><button className="pte-button" onClick={() => navigate(tab)}><ArrowLeft size={16} />返回列表</button><span>本组 {session.index + 1} / {session.queue.length} 题</span><button className={`pte-button ${preferences.bookmarks.includes(activeKey) ? 'bookmarked' : ''}`} disabled={!ready} aria-pressed={preferences.bookmarks.includes(activeKey)} onClick={() => bookmark(activeKey)}><Bookmark size={16} fill={preferences.bookmarks.includes(activeKey) ? 'currentColor' : 'none'} />{preferences.bookmarks.includes(activeKey) ? '已收藏' : '收藏'}</button></div>
            <div className="pte-session-grid"><PracticeSession key={activeKey} taskType={currentItem.taskType} itemId={currentItem.id} userId={user} onExit={() => { setSession(null); setSessionSaved(false) }} exitLabel="返回题库" onAttemptSaved={saved} onRetry={() => setSessionSaved(false)} onNext={session.index < session.queue.length - 1 ? () => start(session.queue, session.index + 1) : undefined} />
              <aside className="pte-notes"><h3><NotebookPen size={17} />本题笔记</h3><p className="pte-small-note">仅保存在本机</p><textarea aria-label="本题笔记" placeholder="记下生词、易错点或下次想改进的地方…" maxLength={3000} value={preferences.notes[activeKey] ?? ''} disabled={!ready} onChange={(e) => update((p) => ({ ...p, notes: { ...p.notes, [activeKey]: e.target.value } }))} /><small>{(preferences.notes[activeKey] ?? '').length} / 3000</small></aside>
            </div>
          </div> : <>
            {tab === 'dashboard' && <TaskDashboard items={catalog.items} attempts={history.attempts} preferences={preferences} onSelectTaskType={openTask} onContinue={startItem} onReview={() => navigate('review')} onListen={() => navigate('listening')} onGoalChange={(goal) => update((p) => ({ ...p, dailyGoal: goal }))} />}
            {['library', 'review', 'bookmarks'].includes(tab) && <QuestionLibrary key={`${tab}-${libraryKey}`} items={catalog.items} cloudIds={catalog.cloudIds} customKeys={catalog.customItems.map((info) => info.key)} attempts={history.attempts} bookmarks={preferences.bookmarks} initialTask={libraryTask} initialFilter={libraryFilter} onBookmark={bookmark} onStart={start} />}
            {tab === 'listening' && <ListeningStudio items={catalog.items} onPractice={startItem} />}
            {tab === 'mock-exam' && <MockExam userId={user} onRunningChange={setMockRunning} onAttemptSaved={saved} />}
            {tab === 'history' && <HistoryPanel attempts={history.attempts} source={history.source} onPractice={startItem} />}
            {tab === 'analytics' && <AnalyticsDashboard userId={user} refreshKey={refreshKey} onSelectTaskType={openTask} />}
            {tab === 'feed' && <CommunityFeed currentUserId={user} />}
            {tab === 'upload' && <QuestionUploader items={catalog.items} customItems={catalog.customItems} userId={user} onChanged={() => setCatalogRefresh((n) => n + 1)} onPractice={startItem} />}
          </>}
        </div>
        <footer className="pte-footer"><span>练习反馈仅供学习参考</span><a href="https://www.pearsonpte.com/pte-academic/scoring" target="_blank" rel="noreferrer">Pearson 官方评分说明 <ArrowLeft size={12} className="rotate-[135deg]" /></a></footer>
      </div>
    </div>
  </div>
}
