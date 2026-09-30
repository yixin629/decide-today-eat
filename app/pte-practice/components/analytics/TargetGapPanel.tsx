import type { SkillGapEntry } from '../../lib/analyticsEngine'

const SKILL_LABELS: Record<string, string> = {
  reading: '阅读',
  listening: '听力',
  speaking: '口语',
  writing: '写作',
}

// diverging 对色（蓝=达标/领先，红=落后），中性灰用于"样本不足"占位——取自 dataviz 技能默认 diverging pair。
const COLOR_AHEAD = '#2a78d6'
const COLOR_BEHIND = '#e34948'

export default function TargetGapPanel({ gaps, planName }: { gaps: SkillGapEntry[] | null; planName: string | null }) {
  if (!gaps) {
    return (
      <div className="card-compact">
        <h3 className="mb-1 text-sm font-semibold text-gray-900">目标分数差距</h3>
        <p className="py-4 text-center text-xs text-gray-400">
          还没有检测到备考计划，去{' '}
          <a href="/pte-plan" className="text-primary underline">
            /pte-plan
          </a>{' '}
          设置目标分数后，这里会显示练习表现与目标的差距。
        </p>
      </div>
    )
  }

  return (
    <div className="card-compact">
      <div className="mb-1 flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-gray-900">目标分数差距</h3>
        {planName && <span className="text-xs text-gray-400">来自计划「{planName}」</span>}
      </div>
      <p className="mb-3 text-xs text-gray-400">
        备考计划中的目标分数是官方 10-90 分制，本练习的估分是各题型自己的小分制，两者不能直接相减。这里把两者各自归一化为
        0-100% 的「达成度」再比较，仅作为大致参考，不代表你的真实官方分数或差距。
      </p>
      <ul className="space-y-2">
        {gaps.map((gap) => (
          <li key={gap.skill} className="flex items-center gap-3 text-xs">
            <div className="w-10 shrink-0 text-gray-700">{SKILL_LABELS[gap.skill] ?? gap.skill}</div>
            {gap.currentPct === null ? (
              <span className="text-gray-400">近期无练习样本，暂无法比较</span>
            ) : (
              <>
                <span className="tabular-nums text-gray-600">
                  练习达成度 {gap.currentPct}% / 目标达成度 {gap.targetPct}%
                </span>
                <span
                  className="tabular-nums font-medium"
                  style={{ color: (gap.gapPct ?? 0) > 0 ? COLOR_BEHIND : COLOR_AHEAD }}
                >
                  {(gap.gapPct ?? 0) > 0 ? `还差 ${gap.gapPct}%` : `已达标 +${Math.abs(gap.gapPct ?? 0)}%`}
                </span>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
