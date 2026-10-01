'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowRight, Clock3, RotateCcw, Send } from 'lucide-react'
import { scoreAttemptAsync } from '../engine/scoring'
import { emptyAnswerFor } from '../lib/answers'
import { scoreSummary } from '../lib/score-display'
import { saveAttempt } from '../lib/attempt-repository'
import { loadItemById } from '../lib/item-repository'
import { getTaskTypeMeta } from '../lib/taskTypes'
import type { AnswerPayload, AttemptRecord, PracticeItem, ScoreDimensionResult, TaskType } from '../types'
import CommentThread from './CommentThread'
import ReportCard from './ReportCard'
import AnswerReview from './session/AnswerReview'
import PracticeInput from './session/PracticeInput'
import { RecordingContext } from './session/RecordingContext'

export default function PracticeSession({
  taskType, itemId, userId, onExit, onQuit, onNext, onAttemptSaved, onRetry,
  exitLabel = '返回题型列表', hideCommentThread = false,
}: {
  taskType: TaskType
  itemId: string
  userId: string | null
  onExit: () => void
  onQuit?: () => void
  onNext?: () => void
  onRetry?: () => void
  onAttemptSaved: (attempt: AttemptRecord) => void
  exitLabel?: string
  hideCommentThread?: boolean
}) {
  const meta = getTaskTypeMeta(taskType)
  const [item, setItem] = useState<PracticeItem>()
  const [itemLoading, setItemLoading] = useState(true)
  const [itemLoadError, setItemLoadError] = useState<string | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [dimensions, setDimensions] = useState<ScoreDimensionResult[]>([])
  const [finalDurationSeconds, setFinalDurationSeconds] = useState(0)
  const [mode, setMode] = useState<'practice' | 'timed'>(hideCommentThread ? 'timed' : 'practice')
  const [retryKey, setRetryKey] = useState(0)
  const [reviewAnswer, setReviewAnswer] = useState<AnswerPayload | null>(null)
  const answerRef = useRef<AnswerPayload>(emptyAnswerFor(taskType))
  const startedAtRef = useRef(0)
  const mounted = useRef(false)
  const locked = useRef(false)
  const expired = useRef(false)
  const stopRecording = useRef<(() => Promise<void>) | null>(null)

  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  useEffect(() => {
    let cancelled = false
    setItemLoading(true)
    loadItemById(taskType, itemId).then((result) => {
      if (cancelled) return
      answerRef.current = emptyAnswerFor(taskType, result.item)
      startedAtRef.current = Date.now()
      setItem(result.item)
      setItemLoadError(result.error)
      setItemLoading(false)
    })
    return () => { cancelled = true }
  }, [taskType, itemId])

  useEffect(() => {
    if (submitted || submitting || itemLoading || !item) return
    const interval = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAtRef.current) / 1000))
    }, 250)
    return () => window.clearInterval(interval)
  }, [submitted, submitting, itemLoading, item, retryKey])

  useEffect(() => {
    if (submitted) return
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [submitted])

  const remaining = mode === 'timed' && meta.timeLimitSeconds !== null ? Math.max(meta.timeLimitSeconds - elapsedSeconds, 0) : null
  const displaySeconds = remaining ?? elapsedSeconds

  const handleSubmit = useCallback(async () => {
    if (!item || itemLoading || submitted || locked.current) return
    locked.current = true
    setSubmitting(true)
    setSubmitError(null)
    setSaveError(null)
    try {
      await stopRecording.current?.()
      if (!mounted.current) return
      window.speechSynthesis?.cancel()
      const durationSeconds = (Date.now() - startedAtRef.current) / 1000
      let answer = answerRef.current
      if ('secondsUsed' in answer) answer = { ...answer, secondsUsed: durationSeconds }
      const results = await scoreAttemptAsync(taskType, item, answer, mode === 'timed' ? meta.timeLimitSeconds ?? durationSeconds : Infinity)
      if (!mounted.current) return
      setReviewAnswer(answer)
      setDimensions(results)
      setFinalDurationSeconds(durationSeconds)
      setSubmitted(true)
      const saveResult = await saveAttempt({
        taskType, itemId, createdAt: new Date().toISOString(), durationSeconds, dimensions: results,
        summary: `${meta.shortLabel} · ${scoreSummary(results)}`,
        isEstimate: true,
      }, userId)
      if (!mounted.current) return
      if (saveResult.error) setSaveError(saveResult.error)
      onAttemptSaved(saveResult.attempt)
    } catch (error) {
      if (mounted.current) setSubmitError(error instanceof Error ? error.message : '提交失败，请重试。')
    } finally {
      locked.current = false
      if (mounted.current) setSubmitting(false)
    }
  }, [item, itemLoading, submitted, taskType, itemId, mode, meta, userId, onAttemptSaved])

  useEffect(() => {
    if (remaining === 0 && !expired.current && !submitted && !itemLoading) {
      expired.current = true
      void handleSubmit()
    }
  }, [remaining, submitted, itemLoading, handleSubmit])

  function retry() {
    onRetry?.()
    answerRef.current = emptyAnswerFor(taskType, item)
    startedAtRef.current = Date.now()
    expired.current = false
    setElapsedSeconds(0)
    setSubmitted(false)
    setDimensions([])
    setReviewAnswer(null)
    setSaveError(null)
    setSubmitError(null)
    setRetryKey((key) => key + 1)
  }

  function quit() {
    if (submitting) return
    if (!submitted && !hideCommentThread && !window.confirm('离开当前练习？尚未提交的作答不会保存。')) return
    ;(onQuit ?? onExit)()
  }

  if (itemLoading) return <div className="loading-state"><span className="loading-spinner" aria-hidden />加载题目中…</div>
  if (!item) return <div className="pte-empty"><h3>未找到这道题</h3><button className="pte-button" onClick={onQuit ?? onExit}>返回题库</button></div>

  return <div className="pte-session space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="pte-eyebrow">#{itemId}</p><h2 className="title-h3">{meta.shortLabel}</h2></div>
      <div className="flex flex-wrap items-center gap-3">
        <span className={`inline-flex items-center gap-2 text-sm tabular-nums ${remaining !== null && remaining < 15 ? 'text-red-600' : 'text-gray-500'}`}><Clock3 size={16} />{remaining === null ? '用时' : '剩余'} {Math.floor(displaySeconds / 60)}:{(displaySeconds % 60).toString().padStart(2, '0')}</span>
        <button type="button" onClick={quit} disabled={submitting} className="pte-button">退出</button>
      </div>
    </div>
    {!hideCommentThread && !submitted && <div className="pte-filter-tabs" aria-label="练习模式">
      <button type="button" aria-pressed={mode === 'practice'} className={mode === 'practice' ? 'active' : ''} disabled={submitting} onClick={() => setMode('practice')}>自由练习</button>
      <button type="button" aria-pressed={mode === 'timed'} className={mode === 'timed' ? 'active' : ''} disabled={submitting} onClick={() => setMode('timed')}>限时练习</button>
    </div>}
    {itemLoadError && <div className="pte-notice" role="status">云端题目暂时不可用，已使用内置练习。</div>}
    <RecordingContext.Provider value={stopRecording}>
      <fieldset disabled={submitted || submitting} className="min-w-0 border-0 p-0">
        <PracticeInput key={`${itemId}-${retryKey}`} item={item} onChange={(answer) => { answerRef.current = answer }} />
      </fieldset>
    </RecordingContext.Provider>
    {submitError && <div className="pte-notice" role="alert">{submitError}</div>}
    {!submitted && <button type="button" onClick={() => void handleSubmit()} disabled={submitting} className="pte-button primary"><Send size={16} />{submitting ? '正在提交并评分…' : '提交作答'}</button>}
    {submitted && <div className="space-y-5" aria-live="polite">
      <ReportCard meta={meta} dimensions={dimensions} durationSeconds={finalDurationSeconds} />
      {reviewAnswer && <AnswerReview item={item} answer={reviewAnswer} />}
      {saveError && <div className="pte-notice" role="status">{saveError}</div>}
      <div className="flex flex-wrap gap-3">
        {onNext && <button className="pte-button primary" disabled={submitting} onClick={onNext}>下一题<ArrowRight size={16} /></button>}
        {!hideCommentThread && <button className="pte-button" disabled={submitting} onClick={retry}><RotateCcw size={16} />再练一次</button>}
        <button className="pte-button" disabled={submitting} onClick={onExit}>{exitLabel}</button>
      </div>
      {!hideCommentThread && <CommentThread itemId={itemId} taskType={taskType} userId={userId} />}
    </div>}
  </div>
}
