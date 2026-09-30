import type { StreakStats } from '../../lib/analyticsEngine'

export default function StreakTiles({ stats }: { stats: StreakStats }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="card-compact text-center">
        <div className="text-2xl font-bold tabular-nums text-gray-900">{stats.currentStreakDays}</div>
        <div className="mt-1 text-xs text-gray-500">连续练习天数{stats.practicedToday ? '' : '（今天还没练，抓紧啦）'}</div>
      </div>
      <div className="card-compact text-center">
        <div className="text-2xl font-bold tabular-nums text-gray-900">{stats.last7DaysCount}</div>
        <div className="mt-1 text-xs text-gray-500">近 7 天练习次数</div>
      </div>
      <div className="card-compact text-center">
        <div className="text-2xl font-bold tabular-nums text-gray-900">{stats.totalAttempts}</div>
        <div className="mt-1 text-xs text-gray-500">累计练习次数</div>
      </div>
    </div>
  )
}
