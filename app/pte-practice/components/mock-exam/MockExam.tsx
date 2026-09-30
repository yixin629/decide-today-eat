'use client'

import { useState } from 'react'
import { buildMockExamRun, type MockExamRun } from '../../engine/mockExamEngine'
import MockExamEntry from './MockExamEntry'
import MockExamResults from './MockExamResults'
import MockExamRunner, { type MockExamStepResult } from './MockExamRunner'

type MockExamView =
  | { name: 'entry' }
  | { name: 'running'; run: MockExamRun }
  | { name: 'results'; results: MockExamStepResult[] }

export default function MockExam({ userId }: { userId: string | null }) {
  const [view, setView] = useState<MockExamView>({ name: 'entry' })
  const [starting, setStarting] = useState(false)
  const [startError, setStartError] = useState<string | null>(null)

  async function handleStart() {
    setStarting(true)
    setStartError(null)
    try {
      const run = await buildMockExamRun()
      if (run.steps.length === 0) {
        setStartError('题库暂时无法加载，无法生成模拟考试，请稍后重试。')
        setStarting(false)
        return
      }
      setView({ name: 'running', run })
    } catch (err) {
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
        onFinish={(results) => setView({ name: 'results', results })}
        onAbort={(partialResults) =>
          setView(partialResults.length > 0 ? { name: 'results', results: partialResults } : { name: 'entry' })
        }
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
