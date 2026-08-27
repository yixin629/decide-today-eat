import { BOSS, NPCS, WORLD_SIZE, getQuestTarget } from '../engine/world'
import type { Point, QuestStage } from '../types'

interface MiniMapProps {
  position: Point
  questStage: QuestStage
}

function markerPosition(point: Point) {
  return {
    left: `${point.x / WORLD_SIZE * 100}%`,
    top: `${point.y / WORLD_SIZE * 100}%`,
  }
}

function directionTo(from: Point, to: Point) {
  const directions = ['东', '东南', '南', '西南', '西', '西北', '北', '东北']
  const angle = Math.atan2(to.y - from.y, to.x - from.x)
  const index = Math.round((angle / (Math.PI / 4) + 8)) % 8
  return directions[index]
}

export default function MiniMap({ position, questStage }: MiniMapProps) {
  const target = getQuestTarget(questStage)
  const distance = target ? Math.round(Math.hypot(target.x - position.x, target.y - position.y) / 10) : 0
  const entities = questStage === 'boss-ready' ? [...NPCS, BOSS] : NPCS

  return (
    <div className="rounded-2xl border border-sky-300/25 bg-sky-950/30 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div><p className="text-xs font-bold tracking-widest text-sky-300">小地图</p><p className="text-xs text-slate-300">蓝点是你，金圈是当前目标</p></div>
        {target && <span className="rounded-full bg-amber-300 px-2 py-1 text-xs font-bold text-slate-950">{directionTo(position, target)} · {distance} 步</span>}
      </div>
      <div
        className="relative aspect-square overflow-hidden rounded-xl border border-white/20 bg-cover bg-center shadow-inner"
        style={{ backgroundImage: "url('/games/dream-journey/background/bg.jpg')" }}
        role="img"
        aria-label={target ? `小地图，当前任务目标${target.name}位于${directionTo(position, target)}方向` : '梦境长安小地图'}
      >
        <div className="absolute inset-0 bg-slate-950/15" />
        {entities.map((entity) => {
          const objective = entity.id === target?.id
          return (
            <span
              key={entity.id}
              className={`absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border shadow ${objective ? 'animate-pulse border-white bg-amber-300 ring-4 ring-amber-300/45' : 'border-white/80 bg-fuchsia-400'}`}
              style={markerPosition(entity)}
              title={entity.name}
            />
          )
        })}
        <span
          className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-sky-400 shadow-lg ring-4 ring-sky-400/30"
          style={markerPosition(position)}
          title="当前位置"
        />
      </div>
    </div>
  )
}
