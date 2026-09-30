import { WEAK_SPOT_MIN_SAMPLES, WEAK_SPOT_WINDOW_DAYS, type WeakSpotEntry } from '../../lib/analyticsEngine'

// 序列蓝（sequential hue，dataviz 技能默认值）用于表示"达成度"这一量级，越短越弱。
const BAR_COLOR = '#2a78d6'

export default function WeakSpotsPanel({
  entries,
  onPractice,
}: {
  entries: WeakSpotEntry[]
  onPractice: (taskType: WeakSpotEntry['taskType']) => void
}) {
  return (
    <div className="card-compact">
      <div className="mb-1 flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-gray-900">最需要加强的题型</h3>
        <span className="text-xs text-gray-400">
          近 {WEAK_SPOT_WINDOW_DAYS} 天内，至少 {WEAK_SPOT_MIN_SAMPLES} 次练习才纳入排名
        </span>
      </div>

      {entries.length === 0 ? (
        <p className="py-4 text-center text-xs text-gray-400">
          近 {WEAK_SPOT_WINDOW_DAYS} 天内还没有足够的练习样本（每个题型至少 {WEAK_SPOT_MIN_SAMPLES} 次）来做诊断，多练几次后再来看看。
        </p>
      ) : (
        <ul className="space-y-2">
          {entries.map((entry) => (
            <li key={entry.taskType} className="flex items-center gap-3">
              <div className="w-24 shrink-0 text-xs text-gray-700">{entry.label}</div>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.max(4, entry.avgPct)}%`, backgroundColor: BAR_COLOR }}
                  aria-hidden
                />
              </div>
              <div className="w-24 shrink-0 text-right text-xs tabular-nums text-gray-500">
                {entry.avgPct}%（{entry.sampleCount} 次）
              </div>
              <button
                type="button"
                onClick={() => onPractice(entry.taskType)}
                className="shrink-0 rounded-full border border-primary px-3 py-1 text-xs font-medium text-primary hover:bg-primary/5"
              >
                去练习
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-2 text-xs text-gray-400">
        排名混合了客观正误与练习估分两类维度的平均达成度，估分部分不代表真实评分，仅用于发现薄弱题型的相对参考。
      </p>
    </div>
  )
}
