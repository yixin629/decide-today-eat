'use client'

import { useMemo } from 'react'
import { MOCK_EXAM_SECTIONS } from '../../lib/mockExam'
import { getTaskTypeMeta } from '../../lib/taskTypes'
import type { MockExamStepResult } from './MockExamRunner'

interface SectionStats {
  sectionId: string
  sectionLabel: string
  attempted: number
  total: number
  objectiveScored: number
  objectiveMax: number
  subjectiveScored: number
  subjectiveMax: number
}

function computeStats(results: MockExamStepResult[]): SectionStats[] {
  return MOCK_EXAM_SECTIONS.map((section) => {
    const sectionResults = results.filter((result) => result.step.sectionId === section.id)
    const stats: SectionStats = {
      sectionId: section.id,
      sectionLabel: section.label,
      attempted: sectionResults.filter((result) => result.attempt !== null).length,
      total: sectionResults.length,
      objectiveScored: 0,
      objectiveMax: 0,
      subjectiveScored: 0,
      subjectiveMax: 0,
    }
    for (const result of sectionResults) {
      if (!result.attempt) continue
      for (const dimension of result.attempt.dimensions) {
        if (dimension.isHeuristic) {
          stats.subjectiveScored += dimension.score
          stats.subjectiveMax += dimension.maxScore
        } else {
          stats.objectiveScored += dimension.score
          stats.objectiveMax += dimension.maxScore
        }
      }
    }
    return stats
  })
}

export default function MockExamResults({
  results,
  onRestart,
  onExit,
}: {
  results: MockExamStepResult[]
  onRestart: () => void
  onExit: () => void
}) {
  const sectionStats = useMemo(() => computeStats(results), [results])
  const totalAttempted = results.filter((result) => result.attempt !== null).length

  const overallObjective = sectionStats.reduce(
    (acc, section) => ({ scored: acc.scored + section.objectiveScored, max: acc.max + section.objectiveMax }),
    { scored: 0, max: 0 }
  )
  const overallSubjective = sectionStats.reduce(
    (acc, section) => ({ scored: acc.scored + section.subjectiveScored, max: acc.max + section.subjectiveMax }),
    { scored: 0, max: 0 }
  )

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-sm text-blue-800">
        模考结束，共完成 {totalAttempted}/{results.length} 题。以下统计为<strong>本项目内部估算</strong>，
        并非 Pearson 官方评分或官方 0-90 分换算结果，仅供自我训练参考。
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">客观题正确率（阅读/听力客观题等，精确对错判定）</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {overallObjective.max > 0 ? `${Math.round((overallObjective.scored / overallObjective.max) * 100)}%` : '暂无客观题数据'}
          </p>
          {overallObjective.max > 0 && (
            <p className="text-xs text-gray-400">
              {overallObjective.scored.toFixed(1)} / {overallObjective.max} 分
            </p>
          )}
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">主观题练习估分均值（口语/写作等启发式估分，非官方评分）</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {overallSubjective.max > 0 ? `${Math.round((overallSubjective.scored / overallSubjective.max) * 100)}%` : '暂无主观题数据'}
          </p>
          {overallSubjective.max > 0 && (
            <p className="text-xs text-gray-400">
              {overallSubjective.scored.toFixed(1)} / {overallSubjective.max} 分
            </p>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {sectionStats.map((section) => (
          <div key={section.sectionId} className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">{section.sectionLabel}</h3>
              <span className="text-sm text-gray-500">
                完成 {section.attempted}/{section.total} 题
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
              <span>
                客观题：{section.objectiveMax > 0 ? `${section.objectiveScored.toFixed(1)}/${section.objectiveMax}` : '无'}
              </span>
              <span>
                主观题估分：{section.subjectiveMax > 0 ? `${section.subjectiveScored.toFixed(1)}/${section.subjectiveMax}` : '无'}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold text-gray-900">逐题详情</h3>
        <div className="grid gap-2">
          {results.map((result, index) => {
            const meta = getTaskTypeMeta(result.step.taskType)
            return (
              <div key={`${result.step.taskType}-${result.step.itemId}-${index}`} className="rounded-lg border border-gray-200 bg-white p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-800">
                    {result.step.sectionShortLabel} · {meta.shortLabel}
                  </span>
                  <span className="text-gray-400">第 {result.step.globalIndex} 题</span>
                </div>
                {result.attempt ? (
                  <p className="mt-1 text-gray-600">{result.attempt.summary}</p>
                ) : (
                  <p className="mt-1 text-amber-600">未作答（提前跳过或退出）</p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={onRestart} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white">
          再来一次模考
        </button>
        <button type="button" onClick={onExit} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700">
          返回模考入口
        </button>
      </div>
    </div>
  )
}
