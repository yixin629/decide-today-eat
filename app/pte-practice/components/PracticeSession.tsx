'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { scoreAttempt } from '../engine/scoring'
import { saveAttempt } from '../lib/attempt-repository'
import { getItemById } from '../lib/questionBank'
import { getTaskTypeMeta } from '../lib/taskTypes'
import type {
  AnswerPayload,
  AttemptRecord,
  FillBlanksDragItem,
  HighlightSummaryItem,
  ListeningFillBlanksItem,
  McqSingleItem,
  ReadAloudItem,
  ReorderItem,
  ScoreDimensionResult,
  TaskType,
  WritingItem,
} from '../types'
import { FillBlanksDragInput, McqSingleInput, ReorderInput } from './inputs/ReadingInputs'
import { HighlightSummaryInput, ListeningFillBlanksInput } from './inputs/ListeningInputs'
import { ReadAloudInput } from './inputs/SpeakingInput'
import { WritingInput } from './inputs/WritingInput'
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
      return { taskType, recordingSeconds: 0, recognizedTranscript: null }
    case 'writing-summarize-text':
    case 'writing-essay':
      return { taskType, text: '', secondsUsed: 0 }
    default: {
      const exhaustiveCheck: never = taskType
      throw new Error(`未知的 PTE 任务类型: ${String(exhaustiveCheck)}`)
    }
  }
}

export default function PracticeSession({
  taskType,
  itemId,
  onExit,
  onAttemptSaved,
}: {
  taskType: TaskType
  itemId: string
  onExit: () => void
  onAttemptSaved: (attempts: AttemptRecord[]) => void
}) {
  const meta = getTaskTypeMeta(taskType)
  const item = getItemById(taskType, itemId)

  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [dimensions, setDimensions] = useState<ScoreDimensionResult[]>([])
  const [finalDurationSeconds, setFinalDurationSeconds] = useState(0)
  const answerRef = useRef<AnswerPayload>(emptyAnswerFor(taskType))
  const startedAtRef = useRef<number>(Date.now())

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

  const handleSubmit = useCallback(() => {
    if (!item || submitted) return
    const durationSeconds = (Date.now() - startedAtRef.current) / 1000
    let answer = answerRef.current
    if (answer.taskType === 'writing-summarize-text' || answer.taskType === 'writing-essay') {
      answer = { ...answer, secondsUsed: durationSeconds }
    }
    const results = scoreAttempt(taskType, item, answer, meta.timeLimitSeconds ?? durationSeconds)
    setDimensions(results)
    setFinalDurationSeconds(durationSeconds)
    setSubmitted(true)

    const record: AttemptRecord = {
      id: `${itemId}-${Date.now()}`,
      taskType,
      itemId,
      createdAt: new Date().toISOString(),
      durationSeconds,
      dimensions: results,
      summary: `${meta.shortLabel} · ${results.map((dimension) => `${dimension.label} ${dimension.score}/${dimension.maxScore}`).join('，')}`,
      isEstimate: true,
    }
    const attempts = saveAttempt(record)
    onAttemptSaved(attempts)
  }, [item, submitted, taskType, itemId, meta, onAttemptSaved])

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
            onChange={({ recordingSeconds, recognizedTranscript }) => {
              answerRef.current = { taskType: 'speaking-read-aloud', recordingSeconds, recognizedTranscript }
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
      default:
        return null
    }
  }, [item])

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
          <button type="button" onClick={onExit} className="text-sm text-gray-500 underline">
            退出
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">{inputElement}</div>

      {!submitted && (
        <button type="button" onClick={handleSubmit} className="w-full rounded-lg bg-primary py-2.5 font-medium text-white sm:w-auto sm:px-8">
          提交作答
        </button>
      )}

      {submitted && (
        <div className="space-y-4">
          <ReportCard meta={meta} dimensions={dimensions} durationSeconds={finalDurationSeconds} />
          <div className="flex gap-3">
            <button type="button" onClick={onExit} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700">
              返回题型列表
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
