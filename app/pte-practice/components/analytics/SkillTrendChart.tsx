'use client'

import { useId, useState } from 'react'
import type { SkillTrend } from '../../lib/analyticsEngine'

const SKILL_LABELS: Record<string, string> = {
  reading: '阅读 Reading',
  listening: '听力 Listening',
  speaking: '口语 Speaking',
  writing: '写作 Writing',
}

// 取自 dataviz 技能默认配色：series-1（蓝，客观/可信维度）与 series-2（橙，启发式/估算维度），
// 两者在浅色/深色模式下均通过 CVD 与对比度校验，且从不混用成一条曲线。
const COLOR_OBJECTIVE = '#2a78d6'
const COLOR_HEURISTIC = '#eb6834'

const WIDTH = 320
const HEIGHT = 120
const PAD_X = 12
const PAD_Y = 16

function buildPath(values: (number | null)[]): { path: string; points: { x: number; y: number; v: number; i: number }[] } {
  const usable = values.map((v, i) => ({ v, i })).filter((p): p is { v: number; i: number } => p.v !== null)
  const points = usable.map(({ v, i }) => ({
    x: PAD_X + (values.length === 1 ? 0 : (i / (values.length - 1)) * (WIDTH - PAD_X * 2)),
    y: PAD_Y + (1 - v / 100) * (HEIGHT - PAD_Y * 2),
    v,
    i,
  }))
  const path = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  return { path, points }
}

export default function SkillTrendChart({ trend }: { trend: SkillTrend }) {
  const gradId = useId()
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)

  const weekCount = trend.points.length
  const objectiveValues = trend.points.map((p) => p.objectivePct)
  const heuristicValues = trend.points.map((p) => p.heuristicPct)
  const { path: objectivePath, points: objectivePoints } = buildPath(objectiveValues)
  const { path: heuristicPath, points: heuristicPoints } = buildPath(heuristicValues)

  const noData = weekCount === 0

  return (
    <div className="card-compact">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">{SKILL_LABELS[trend.skill] ?? trend.skill}</h3>
        <div className="flex gap-3 text-xs text-gray-500">
          {trend.hasObjective && (
            <span className="flex items-center gap-1">
              <span className="inline-block h-0.5 w-3 rounded-full" style={{ backgroundColor: COLOR_OBJECTIVE }} />
              客观正误
            </span>
          )}
          {trend.hasHeuristic && (
            <span className="flex items-center gap-1">
              <span className="inline-block h-0.5 w-3 rounded-full border-t border-dashed" style={{ borderColor: COLOR_HEURISTIC }} />
              估分
            </span>
          )}
        </div>
      </div>

      {noData ? (
        <p className="flex h-[120px] items-center justify-center text-xs text-gray-400">该技能近 12 周暂无练习记录</p>
      ) : (
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full"
          role="img"
          aria-label={`${SKILL_LABELS[trend.skill] ?? trend.skill}近 12 周达成度趋势`}
          onMouseLeave={() => setHoverIdx(null)}
        >
          <defs>
            <clipPath id={`clip-${gradId}`}>
              <rect x={0} y={0} width={WIDTH} height={HEIGHT} />
            </clipPath>
          </defs>
          {/* 网格线：25/50/75% 基线，用于阅读数值，颜色取自 dataviz 技能的 hairline gridline 规范 */}
          {[25, 50, 75].map((pct) => {
            const y = PAD_Y + (1 - pct / 100) * (HEIGHT - PAD_Y * 2)
            return <line key={pct} x1={PAD_X} x2={WIDTH - PAD_X} y1={y} y2={y} stroke="#e1e0d9" strokeWidth={1} />
          })}

          {objectivePath && <path d={objectivePath} fill="none" stroke={COLOR_OBJECTIVE} strokeWidth={2} strokeLinecap="round" />}
          {heuristicPath && (
            <path d={heuristicPath} fill="none" stroke={COLOR_HEURISTIC} strokeWidth={2} strokeDasharray="4 3" strokeLinecap="round" />
          )}

          {objectivePoints.map((p) => (
            <circle key={`o-${p.i}`} cx={p.x} cy={p.y} r={hoverIdx === p.i ? 4 : 2.5} fill={COLOR_OBJECTIVE} />
          ))}
          {heuristicPoints.map((p) => (
            <circle key={`h-${p.i}`} cx={p.x} cy={p.y} r={hoverIdx === p.i ? 4 : 2.5} fill={COLOR_HEURISTIC} />
          ))}

          {/* 透明的逐周命中区域，用于 hover 显示提示 */}
          {trend.points.map((p, i) => {
            const x = PAD_X + (weekCount === 1 ? 0 : (i / (weekCount - 1)) * (WIDTH - PAD_X * 2))
            const bandWidth = weekCount === 1 ? WIDTH - PAD_X * 2 : (WIDTH - PAD_X * 2) / weekCount
            return (
              <rect
                key={p.weekStart}
                x={x - bandWidth / 2}
                y={0}
                width={bandWidth}
                height={HEIGHT}
                fill="transparent"
                onMouseEnter={() => setHoverIdx(i)}
              />
            )
          })}
        </svg>
      )}

      {hoverIdx !== null && trend.points[hoverIdx] && (
        <div className="mt-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600 shadow-sm">
          <div className="font-medium text-gray-700">周起始 {trend.points[hoverIdx].weekStart}</div>
          {trend.points[hoverIdx].objectivePct !== null && (
            <div>
              客观达成度 {trend.points[hoverIdx].objectivePct}%（{trend.points[hoverIdx].objectiveSamples} 项）
            </div>
          )}
          {trend.points[hoverIdx].heuristicPct !== null && (
            <div>
              估分达成度 {trend.points[hoverIdx].heuristicPct}%（{trend.points[hoverIdx].heuristicSamples} 项，练习估分非官方）
            </div>
          )}
        </div>
      )}
    </div>
  )
}
