import type { ScoreDimensionResult, TaskTypeMeta } from '../types'

function pctOf(dimension: ScoreDimensionResult): number {
  if (dimension.maxScore <= 0) return 0
  return Math.round((dimension.score / dimension.maxScore) * 100)
}

function scoreTier(pct: number): { fillClass: string; label: string; textClass: string } {
  if (pct >= 75) return { fillClass: 'score-fill-good', label: '达标', textClass: 'text-emerald-700' }
  if (pct >= 45) return { fillClass: 'score-fill-mid', label: '待提升', textClass: 'text-amber-700' }
  return { fillClass: 'score-fill-low', label: '需加强', textClass: 'text-red-700' }
}

export default function ReportCard({
  meta,
  dimensions,
  durationSeconds,
}: {
  meta: TaskTypeMeta
  dimensions: ScoreDimensionResult[]
  durationSeconds: number
}) {
  const hasHeuristic = dimensions.some((dimension) => dimension.isHeuristic)
  const totalScore = dimensions.reduce((sum, d) => sum + d.score, 0)
  const totalMax = dimensions.reduce((sum, d) => sum + d.maxScore, 0)
  const overallPct = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0
  const overallTier = scoreTier(overallPct)

  return (
    <div className="card space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b pb-4" style={{ borderColor: 'var(--border-subtle)' }}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">练习估分反馈 · 参考分，非官方评分</p>
          <h3 className="title-h3 mt-1">
            {totalScore.toFixed(1)}
            <span className="text-base font-medium text-gray-400"> / {totalMax}</span>
          </h3>
          <p className={`mt-1 text-sm font-semibold ${overallTier.textClass}`}>
            综合达成度 {overallPct}% · {overallTier.label}
          </p>
        </div>
        <p className="text-xs text-gray-500">用时：{Math.round(durationSeconds)} 秒</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {dimensions.map((dimension) => {
          const pct = pctOf(dimension)
          const tier = scoreTier(pct)
          return (
            <div key={dimension.id} className="card-compact">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-gray-800">{dimension.label}</span>
                <span className="whitespace-nowrap text-sm font-semibold text-gray-900">
                  {dimension.score} / {dimension.maxScore}
                  {dimension.isHeuristic && <span className="ml-1.5 badge-amber">估算</span>}
                </span>
              </div>
              <div className="score-track mt-2">
                <div className={`score-fill ${tier.fillClass}`} style={{ width: `${Math.max(4, pct)}%` }} aria-hidden />
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-gray-500">{dimension.note}</p>
            </div>
          )
        })}
      </div>

      <div className="note-warning">
        <span className="note-callout-icon" aria-hidden>ℹ️</span>
        <span>
          以下分数由本练习的启发式规则或客观对错判定生成，不是 Pearson 官方 PTE 评分算法的结果，不代表真实考试成绩，仅供自我练习参考。
          {meta.officialNote && <span className="mt-1 block text-xs text-amber-700/80">{meta.officialNote}</span>}
          {hasHeuristic && (
            <span className="mt-1 block font-medium">
              本题包含启发式估分维度，请结合录音回放/文本自行对照 Pearson 公开的 Score Guide 评分描述进行自我评估。
            </span>
          )}
        </span>
      </div>
    </div>
  )
}
