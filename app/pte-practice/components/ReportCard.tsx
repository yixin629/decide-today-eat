import type { ScoreDimensionResult, TaskTypeMeta } from '../types'

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

  return (
    <div className="space-y-4 rounded-xl border border-amber-200 bg-amber-50/60 p-4">
      <div>
        <p className="text-sm font-semibold text-amber-800">练习估分反馈 · 参考分，非官方评分</p>
        <p className="mt-1 text-xs text-amber-700">
          以下分数由本练习的启发式规则或客观对错判定生成，不是 Pearson 官方 PTE 评分算法的结果，不代表真实考试成绩，仅供自我练习参考。
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {dimensions.map((dimension) => (
          <div key={dimension.id} className="rounded-lg bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-800">{dimension.label}</span>
              <span className="text-sm font-semibold text-gray-900">
                {dimension.score} / {dimension.maxScore}
                {dimension.isHeuristic && <span className="ml-1 text-[10px] font-normal text-amber-600">估算</span>}
              </span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-gray-500">{dimension.note}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-500">用时：{Math.round(durationSeconds)} 秒</p>
      <p className="text-xs text-gray-400">{meta.officialNote}</p>
      {hasHeuristic && (
        <p className="text-xs font-medium text-amber-700">
          本题包含启发式估分维度，请结合录音回放/文本自行对照 Pearson 公开的 Score Guide 评分描述进行自我评估。
        </p>
      )}
    </div>
  )
}
