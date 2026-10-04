'use client'

import { useState } from 'react'
import type { AttemptRecord } from '../../types'
import { buildMockExamRun, type MockExamRun } from '../../engine/mockExamEngine'
import MockExamEntry from './MockExamEntry'
import MockExamResults from './MockExamResults'
import MockExamRunner, { type MockExamStepResult } from './MockExamRunner'

type MockExamView =
  | { name: 'entry' }
  | { name: 'running'; run: MockExamRun }
  | { name: 'results'; results: MockExamStepResult[] }

export default function MockExam({ userId, onRunningChange, onAttemptSaved }: {
  userId: string | null
  onRunningChange: (running: boolean) => void
  onAttemptSaved: (attempt: AttemptRecord, source: 'cloud' | 'local') => void
}) {
  const [view, setView] = useState<MockExamView>({ name: 'entry' })
  const [starting, setStarting] = useState(false)
  const [startError, setStartError] = useState<string | null>(null)

  async function handleStart() {
    if (starting) return
    onRunningChange(true)
    setStarting(true)
    setStartError(null)
    try {
      const run = await buildMockExamRun()
      if (run.steps.length === 0) {
        onRunningChange(false)
        setStartError('题库暂时无法加载，无法生成模拟考试，请稍后重试。')
        setStarting(false)
        return
      }
      setView({ name: 'running', run })
    } catch (err) {
      onRunningChange(false)
      setStartError(err instanceof Error ? err.message : '生成模拟考试失败，请稍后重试。')
    } finally {
      setStarting(false)
    }
  }

  if (view.name === 'entry') {
    return <MockExamEntry onStart={handleStart} starting={starting} error={startError} />
  }

  if (view.name === 'running') {
    return (
      <MockExamRunner
        run={view.run}
        userId={userId}
        onAttemptSaved={onAttemptSaved}
        onFinish={(results) => { onRunningChange(false); setView({ name: 'results', results }) }}
        onAbort={(partialResults) => {
          onRunningChange(false)
          setView(partialResults.length > 0 ? { name: 'results', results: partialResults } : { name: 'entry' })
        }}
      />
    )
  }

  return (
    <MockExamResults
      results={view.results}
      onRestart={handleStart}
      onExit={() => setView({ name: 'entry' })}
    />
  )
}
