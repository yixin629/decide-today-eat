'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { scoreAttemptAsync } from '../engine/scoring'
import { saveAttempt } from '../lib/attempt-repository'
import { loadItemById } from '../lib/item-repository'
import { getTaskTypeMeta } from '../lib/taskTypes'
import type {
  AnswerPayload,
  AnswerShortQuestionItem,
  AttemptRecord,
  DescribeImageItem,
  FillBlanksDragItem,
  FillBlanksDropdownItem,
  HighlightIncorrectWordsItem,
  HighlightSummaryItem,
  ListeningFillBlanksItem,
  ListeningMcqMultipleItem,
  ListeningMcqSingleItem,
  ListeningSummarizeItem,
  McqMultipleItem,
  McqSingleItem,
  PracticeItem,
  ReadAloudItem,
  RepeatSentenceItem,
  ReorderItem,
  RetellLectureItem,
  ScoreDimensionResult,
  SelectMissingWordItem,
  TaskType,
  WriteFromDictationItem,
  WritingItem,
} from '../types'
import { FillBlanksDragInput, FillBlanksDropdownInput, McqMultipleInput, McqSingleInput, ReorderInput } from './inputs/ReadingInputs'
import {
  HighlightIncorrectWordsInput,
  HighlightSummaryInput,
  ListeningFillBlanksInput,
  ListeningMcqMultipleInput,
  ListeningMcqSingleInput,
  ListeningSummarizeInput,
  SelectMissingWordInput,
  WriteFromDictationInput,
} from './inputs/ListeningInputs'
import { AnswerShortQuestionInput, DescribeImageInput, ReadAloudInput, RepeatSentenceInput, RetellLectureInput } from './inputs/SpeakingInput'
import { WritingInput } from './inputs/WritingInput'
import CommentThread from './CommentThread'
import ReportCard from './ReportCard'

function emptyAnswerFor(taskType: TaskType): AnswerPayload {
  switch (taskType) {
    case 'reading-mcq-single':
      return { taskType, selectedIndex: null }
    case 'reading-reorder':
      return { taskType, order: [] }
    case 'reading-fill-blanks-drag':
      return { taskType, answers: [] }
    case 'listening-fill-blanks-typed':
      return { taskType, answers: [] }
    case 'listening-highlight-summary':
      return { taskType, selectedIndex: null }
    case 'speaking-read-aloud':
      return { taskType, recordingSeconds: 0, recognizedTranscript: null, audioBlob: null }
    case 'writing-summarize-text':
    case 'writing-essay':
      return { taskType, text: '', secondsUsed: 0 }
    case 'reading-mcq-multiple':
      return { taskType, selectedIndexes: [] }
    case 'reading-fill-blanks-dropdown':
      return { taskType, answers: [] }
    case 'listening-mcq-single':
      return { taskType, selectedIndex: null }
    case 'listening-mcq-multiple':
      return { taskType, selectedIndexes: [] }
    case 'listening-summarize-spoken-text':
      return { taskType, text: '', secondsUsed: 0 }
    case 'listening-select-missing-word':
      return { taskType, selectedIndex: null }
    case 'listening-highlight-incorrect-words':
      return { taskType, selectedWordIndexes: [] }
    case 'listening-write-from-dictation':
      return { taskType, text: '' }
    case 'speaking-repeat-sentence':
    case 'speaking-retell-lecture':
    case 'speaking-describe-image':
      return { taskType, recordingSeconds: 0, recognizedTranscript: null, audioBlob: null }
    case 'speaking-answer-short-question':
      return { taskType, recordingSeconds: 0, recognizedTranscript: null, audioBlob: null }
    default: {
      const exhaustiveCheck: never = taskType
      throw new Error(`未知的 PTE 任务类型: ${String(exhaustiveCheck)}`)
    }
  }
}

export default function PracticeSession({
  taskType,
  itemId,
  userId,
  onExit,
  onQuit,
  onAttemptSaved,
  exitLabel = '返回题型列表',
  hideCommentThread = false,
}: {
  taskType: TaskType
  itemId: string
  userId: string | null
  /** 提交后"下一题/查看结果/返回"按钮的行为。 */
  onExit: () => void
  /**
   * 顶部"退出"按钮（提交前随时可见）的行为。单独练习场景下退出即是返回题库，
   * 与 onExit 语义相同，因此不传时默认退回 onExit；但在模拟考试等连续流程里，
   * onExit 实际是"提交后前进到下一题"，如果顶部退出按钮也直接复用它，会让
   * 用户以为在退出整场考试，实际却只是跳过当前这一题且不计分——这是真实
   * 出现过的一处交互歧义，因此拆成独立的 onQuit，由调用方决定"退出"到底
   * 应该做什么（模拟考试场景下应弹确认框并终止整场考试，而不是跳题）。
   */
  onQuit?: () => void
  onAttemptSaved: (attempt: AttemptRecord) => void
  /** 提交后退出按钮文案，模拟考试等连续流程场景下可传入"下一题"/"查看模考结果"。 */
  exitLabel?: string
  /** 模拟考试连续作答流程下隐藏题目下方的评论区，避免打断考试节奏。 */
  hideCommentThread?: boolean
}) {
  const meta = getTaskTypeMeta(taskType)
  const [item, setItem] = useState<PracticeItem | undefined>(undefined)
  const [itemLoading, setItemLoading] = useState(true)
  const [itemLoadError, setItemLoadError] = useState<string | null>(null)

  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [scoringInProgress, setScoringInProgress] = useState(false)
  const [dimensions, setDimensions] = useState<ScoreDimensionResult[]>([])
  const [finalDurationSeconds, setFinalDurationSeconds] = useState(0)
  const answerRef = useRef<AnswerPayload>(emptyAnswerFor(taskType))
  const startedAtRef = useRef<number>(Date.now())

  useEffect(() => {
    let cancelled = false
    setItemLoading(true)
    loadItemById(taskType, itemId).then((result) => {
      if (cancelled) return
      setItem(result.item)
      setItemLoadError(result.error)
      setItemLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [taskType, itemId])

  useEffect(() => {
    if (submitted) return
    const interval = window.setInterval(() => {
      setElapsedSeconds((seconds) => seconds + 1)
    }, 1000)
    return () => window.clearInterval(interval)
  }, [submitted])

  const timeLimitSeconds = meta.timeLimitSeconds
  const remainingSeconds = timeLimitSeconds !== null ? Math.max(timeLimitSeconds - elapsedSeconds, 0) : null

  const minutes = remainingSeconds !== null ? Math.floor(remainingSeconds / 60) : null
  const seconds = remainingSeconds !== null ? remainingSeconds % 60 : null

  const handleSubmit = useCallback(async () => {
    if (!item || submitted || submitting) return
    setSubmitting(true)
    setSaveError(null)
    const durationSeconds = (Date.now() - startedAtRef.current) / 1000
    let answer = answerRef.current
    if (answer.taskType === 'writing-summarize-text' || answer.taskType === 'writing-essay' || answer.taskType === 'listening-summarize-spoken-text') {
      answer = { ...answer, secondsUsed: durationSeconds }
    }
    setScoringInProgress(true)
    const results = await scoreAttemptAsync(taskType, item, answer, meta.timeLimitSeconds ?? durationSeconds)
    setScoringInProgress(false)
    setDimensions(results)
    setFinalDurationSeconds(durationSeconds)
    setSubmitted(true)

    const record = {
      taskType,
      itemId,
      createdAt: new Date().toISOString(),
      durationSeconds,
      dimensions: results,
      summary: `${meta.shortLabel} · ${results.map((dimension) => `${dimension.label} ${dimension.score}/${dimension.maxScore}`).join('，')}`,
      isEstimate: true as const,
    }
    const saveResult = await saveAttempt(record, userId)
    setSubmitting(false)
    if (saveResult.source === 'local' && saveResult.error) {
      setSaveError(saveResult.error)
    }
    onAttemptSaved(saveResult.attempt)
  }, [item, submitted, submitting, taskType, itemId, meta, userId, onAttemptSaved])

  useEffect(() => {
    if (!submitted && remainingSeconds === 0) {
      handleSubmit()
    }
  }, [remainingSeconds, submitted, handleSubmit])

  const inputElement = useMemo(() => {
    if (!item) return null
    switch (item.taskType) {
      case 'reading-mcq-single':
        return (
          <McqSingleInput
            item={item as McqSingleItem}
            onChange={(selectedIndex) => {
              answerRef.current = { taskType: 'reading-mcq-single', selectedIndex }
            }}
          />
        )
      case 'reading-reorder':
        return (
          <ReorderInput
            item={item as ReorderItem}
            onChange={(order) => {
              answerRef.current = { taskType: 'reading-reorder', order }
            }}
          />
        )
      case 'reading-fill-blanks-drag':
        return (
          <FillBlanksDragInput
            item={item as FillBlanksDragItem}
            onChange={(answers) => {
              answerRef.current = { taskType: 'reading-fill-blanks-drag', answers }
            }}
          />
        )
      case 'listening-fill-blanks-typed':
        return (
          <ListeningFillBlanksInput
            item={item as ListeningFillBlanksItem}
            onChange={(answers) => {
              answerRef.current = { taskType: 'listening-fill-blanks-typed', answers }
            }}
          />
        )
      case 'listening-highlight-summary':
        return (
          <HighlightSummaryInput
            item={item as HighlightSummaryItem}
            onChange={(selectedIndex) => {
              answerRef.current = { taskType: 'listening-highlight-summary', selectedIndex }
            }}
          />
        )
      case 'speaking-read-aloud':
        return (
          <ReadAloudInput
            item={item as ReadAloudItem}
            onChange={({ recordingSeconds, recognizedTranscript, audioBlob }) => {
              answerRef.current = { taskType: 'speaking-read-aloud', recordingSeconds, recognizedTranscript, audioBlob }
            }}
          />
        )
      case 'writing-summarize-text':
      case 'writing-essay':
        return (
          <WritingInput
            item={item as WritingItem}
            onChange={(text) => {
              answerRef.current = { taskType: item.taskType, text, secondsUsed: 0 }
            }}
          />
        )
      case 'reading-mcq-multiple':
        return (
          <McqMultipleInput
            item={item as McqMultipleItem}
            onChange={(selectedIndexes) => {
              answerRef.current = { taskType: 'reading-mcq-multiple', selectedIndexes }
            }}
          />
        )
      case 'reading-fill-blanks-dropdown':
        return (
          <FillBlanksDropdownInput
            item={item as FillBlanksDropdownItem}
            onChange={(answers) => {
              answerRef.current = { taskType: 'reading-fill-blanks-dropdown', answers }
            }}
          />
        )
      case 'listening-mcq-single':
        return (
          <ListeningMcqSingleInput
            item={item as ListeningMcqSingleItem}
            onChange={(selectedIndex) => {
              answerRef.current = { taskType: 'listening-mcq-single', selectedIndex }
            }}
          />
        )
      case 'listening-mcq-multiple':
        return (
          <ListeningMcqMultipleInput
            item={item as ListeningMcqMultipleItem}
            onChange={(selectedIndexes) => {
              answerRef.current = { taskType: 'listening-mcq-multiple', selectedIndexes }
            }}
          />
        )
      case 'listening-summarize-spoken-text':
        return (
          <ListeningSummarizeInput
            item={item as ListeningSummarizeItem}
            onChange={(text) => {
              answerRef.current = { taskType: 'listening-summarize-spoken-text', text, secondsUsed: 0 }
            }}
          />
        )
      case 'listening-select-missing-word':
        return (
          <SelectMissingWordInput
            item={item as SelectMissingWordItem}
            onChange={(selectedIndex) => {
              answerRef.current = { taskType: 'listening-select-missing-word', selectedIndex }
            }}
          />
        )
      case 'listening-highlight-incorrect-words':
        return (
          <HighlightIncorrectWordsInput
            item={item as HighlightIncorrectWordsItem}
            onChange={(selectedWordIndexes) => {
              answerRef.current = { taskType: 'listening-highlight-incorrect-words', selectedWordIndexes }
            }}
          />
        )
      case 'listening-write-from-dictation':
        return (
          <WriteFromDictationInput
            item={item as WriteFromDictationItem}
            onChange={(text) => {
              answerRef.current = { taskType: 'listening-write-from-dictation', text }
            }}
          />
        )
      case 'speaking-repeat-sentence':
        return (
          <RepeatSentenceInput
            item={item as RepeatSentenceItem}
            onChange={({ recordingSeconds, recognizedTranscript, audioBlob }) => {
              answerRef.current = { taskType: 'speaking-repeat-sentence', recordingSeconds, recognizedTranscript, audioBlob }
            }}
          />
        )
      case 'speaking-describe-image':
        return (
          <DescribeImageInput
            item={item as DescribeImageItem}
            onChange={({ recordingSeconds, recognizedTranscript, audioBlob }) => {
              answerRef.current = { taskType: 'speaking-describe-image', recordingSeconds, recognizedTranscript, audioBlob }
            }}
          />
        )
      case 'speaking-retell-lecture':
        return (
          <RetellLectureInput
            item={item as RetellLectureItem}
            onChange={({ recordingSeconds, recognizedTranscript, audioBlob }) => {
              answerRef.current = { taskType: 'speaking-retell-lecture', recordingSeconds, recognizedTranscript, audioBlob }
            }}
          />
        )
      case 'speaking-answer-short-question':
        return (
          <AnswerShortQuestionInput
            item={item as AnswerShortQuestionItem}
            onChange={({ recordingSeconds, recognizedTranscript, audioBlob }) => {
              answerRef.current = { taskType: 'speaking-answer-short-question', recordingSeconds, recognizedTranscript, audioBlob }
            }}
          />
        )
      default:
        return null
    }
  }, [item])

  if (itemLoading) {
    return <p className="text-sm text-gray-400">加载题目中…</p>
  }

  if (!item) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        未找到题目，请返回题库重新选择。
        <button type="button" onClick={onExit} className="ml-3 underline">
          返回
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{meta.label}</p>
          <h2 className="text-lg font-semibold text-gray-900">{meta.shortLabel} 练习</h2>
        </div>
        <div className="flex items-center gap-3">
          {minutes !== null && seconds !== null ? (
            <span className={`rounded-full px-3 py-1 text-sm font-medium ${remainingSeconds && remainingSeconds < 15 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
              剩余 {minutes}:{seconds.toString().padStart(2, '0')}
            </span>
          ) : (
            <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">已用时 {elapsedSeconds}s</span>
          )}
          <button type="button" onClick={onQuit ?? onExit} className="text-sm text-gray-500 underline">
            退出
          </button>
        </div>
      </div>

      {itemLoadError && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">{itemLoadError}</p>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">{inputElement}</div>

      {!submitted && (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full rounded-lg bg-primary py-2.5 font-medium text-white disabled:opacity-60 sm:w-auto sm:px-8"
        >
          {scoringInProgress ? '正在评分…' : submitting ? '提交中…' : '提交作答'}
        </button>
      )}

      {submitted && (
        <div className="space-y-4">
          <ReportCard meta={meta} dimensions={dimensions} durationSeconds={finalDurationSeconds} />
          {saveError && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">{saveError}</p>
          )}
          <div className="flex gap-3">
            <button type="button" onClick={onExit} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700">
              {exitLabel}
            </button>
          </div>
          {!hideCommentThread && <CommentThread itemId={itemId} taskType={taskType} userId={userId} />}
        </div>
      )}
    </div>
  )
}
