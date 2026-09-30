'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { MockExamRun, MockExamStep } from '../../engine/mockExamEngine'
import type { AttemptRecord } from '../../types'
import PracticeSession from '../PracticeSession'

export interface MockExamStepResult {
  step: MockExamStep
  attempt: AttemptRecord | null
}

export default function MockExamRunner({
  run,
  userId,
  onFinish,
  onAbort,
}: {
  run: MockExamRun
  userId: string | null
  onFinish: (results: MockExamStepResult[]) => void
  /** 提前结束模考时回调，携带已完成的题目结果（未完成的当前题不计入），
   * 由调用方决定展示结果页还是回到入口——完全不传结果会导致"确定要提前
   * 结束模考吗？已完成的作答会保留在结果页"这句提示文案失真。 */
  onAbort: (partialResults: MockExamStepResult[]) => void
}) {
  const [stepIndex, setStepIndex] = useState(0)
  const [results, setResults] = useState<MockExamStepResult[]>([])
  const [examStartedAt] = useState(() => Date.now())
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  const currentStep = run.steps[stepIndex]
  const isLastStep = stepIndex >= run.steps.length - 1
  const lastAttemptRef = useRef<AttemptRecord | null>(null)

  useEffect(() => {
    const interval = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - examStartedAt) / 1000))
    }, 1000)
    return () => window.clearInterval(interval)
  }, [examStartedAt])

  // 2026 版 PTE 考试为连续流程，不再有可选休息；刷新或离开页面会丢失当前模考
  // 进度（未持久化会话状态），因此在考试进行中对刷新/关闭标签页做出提醒。
  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  const currentResultsRef = useMemo(() => results, [results])

  function advanceToNext() {
    const nextResults = [...currentResultsRef, { step: currentStep, attempt: lastAttemptRef.current }]
    lastAttemptRef.current = null
    setResults(nextResults)
    if (isLastStep) {
      onFinish(nextResults)
    } else {
      setStepIndex((index) => index + 1)
    }
  }

  const elapsedLabel = `${Math.floor(elapsedSeconds / 60)}:${(elapsedSeconds % 60).toString().padStart(2, '0')}`

  function confirmAndAbort() {
    if (window.confirm('确定要提前结束本次模拟考试吗？已完成的作答会保留在结果页，未完成部分不计入。')) {
      onAbort(currentResultsRef)
    }
  }

  if (!currentStep) {
    return null
  }

  return (
    <div className="space-y-4">
      <div className="card-compact flex flex-wrap items-center justify-between gap-2 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-primary/10 px-3 py-1 font-medium text-primary">{currentStep.sectionShortLabel}</span>
          <span className="text-gray-600">
            {currentStep.sectionLabel} · 第 {currentStep.indexInSection}/{currentStep.totalInSection} 题
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-gray-500">
          <span className="tabular-nums">模考总用时 {elapsedLabel}</span>
          <span className="tabular-nums">总进度 {currentStep.globalIndex}/{currentStep.totalGlobal}</span>
          <button type="button" onClick={confirmAndAbort} className="text-red-500 underline transition-colors hover:text-red-700">
            提前结束模考
          </button>
        </div>
      </div>

      <div className="score-track">
        <div
          className="score-fill bg-primary"
          style={{ width: `${(currentStep.globalIndex / currentStep.totalGlobal) * 100}%` }}
        />
      </div>

      <PracticeSession
        key={`${currentStep.taskType}-${currentStep.itemId}-${stepIndex}`}
        taskType={currentStep.taskType}
        itemId={currentStep.itemId}
        userId={userId}
        hideCommentThread
        exitLabel={isLastStep ? '查看模考结果' : '下一题'}
        onExit={() => advanceToNext()}
        onQuit={confirmAndAbort}
        onAttemptSaved={(attempt) => {
          lastAttemptRef.current = attempt
        }}
      />
    </div>
  )
}
