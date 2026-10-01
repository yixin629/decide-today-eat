import { Info } from 'lucide-react'
import { isAssessed } from '../lib/score-display'
import type { ScoreDimensionResult, TaskTypeMeta } from '../types'

export default function ReportCard({ meta, dimensions, durationSeconds }: {
  meta: TaskTypeMeta
  dimensions: ScoreDimensionResult[]
  durationSeconds: number
}) {
  const objective = dimensions.filter((dimension) => isAssessed(dimension) && !dimension.isHeuristic)
  const total = objective.reduce((sum, dimension) => sum + dimension.score, 0)
  const max = objective.reduce((sum, dimension) => sum + dimension.maxScore, 0)

  return <section className="space-y-5" aria-label="练习反馈">
    <header className="flex flex-wrap items-start justify-between gap-3 border-b pb-4">
      <div><p className="pte-eyebrow">练习反馈 · 非官方成绩</p><h3 className="title-h3">{max > 0 ? `客观维度 ${Number(total.toFixed(2))} / ${max}` : '口语与写作反馈'}</h3></div>
      <span className="text-sm text-gray-500">用时 {Math.round(durationSeconds)} 秒</span>
    </header>
    <div className="divide-y">
      {dimensions.map((dimension) => {
        const assessed = isAssessed(dimension)
        const pct = Math.max(0, Math.min(100, dimension.score / dimension.maxScore * 100))
        return <div key={dimension.id} className="py-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-sm font-medium">{dimension.label}</h4>
            <span className="text-sm font-semibold">{assessed ? `${dimension.score} / ${dimension.maxScore}` : '未评估'}{assessed && dimension.isHeuristic && <span className="ml-2 badge-amber">估算</span>}</span>
          </div>
          {assessed && <div className="score-track mt-2" role="progressbar" aria-label={dimension.label} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}><div className="score-fill score-fill-mid" style={{ width: `${pct}%` }} /></div>}
          <p className="mt-2 text-xs leading-relaxed text-gray-500">{assessed ? dimension.note : '缺少可靠的评分信号，请结合参考答案及录音回放自评；此维度不计入学习趋势。'}</p>
        </div>
      })}
    </div>
    <div className="pte-notice"><Info size={17} className="shrink-0" /><div>客观判分与启发式估算分别展示，不换算成 Pearson 10–90 分，也不判断考试是否达标。{meta.officialNote && <p className="mt-1 text-xs">{meta.officialNote}</p>}</div></div>
  </section>
}
