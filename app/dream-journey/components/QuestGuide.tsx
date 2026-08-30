import { getQuestGuidance, getQuestTarget } from '../engine/world'
import type { Point, QuestStage } from '../types'

interface QuestGuideProps {
  position: Point
  progress: number
  questStage: QuestStage
  onNavigate: (target: Point) => void
  onFreePatrol: () => void
}

export default function QuestGuide({ position, progress, questStage, onNavigate, onFreePatrol }: QuestGuideProps) {
  const guide = getQuestGuidance(questStage, progress)
  const target = getQuestTarget(questStage)
  const distance = target ? Math.round(Math.hypot(target.x - position.x, target.y - position.y) / 10) : 0

  return (
    <section className="overflow-hidden rounded-2xl border border-amber-300/40 bg-[linear-gradient(145deg,rgba(67,56,202,.72),rgba(15,23,42,.94))] shadow-xl">
      <div className="flex items-center justify-between border-b border-white/10 bg-slate-950/35 px-4 py-3">
        <div>
          <p className="text-[10px] font-black tracking-[0.24em] text-amber-300">主线任务 · 第一章</p>
          <p className="mt-0.5 text-xs text-sky-100">初入长安 · 城外试炼</p>
        </div>
        <span className="grid h-9 w-9 place-items-center rounded-full border border-amber-200/50 bg-amber-300 font-black text-slate-950">{guide.step}</span>
      </div>
      <div className="p-4">
        <div className="flex gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-amber-200/40 bg-amber-300/15 text-2xl">{target?.icon ?? '✓'}</span>
          <div className="min-w-0">
            <h2 className="font-black text-amber-100">{guide.title}</h2>
            <p className="mt-1 text-xs leading-5 text-slate-200">{guide.description}</p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-950/45 px-3 py-2 text-xs">
          <span className="text-sky-200">任务进度</span>
          <b className="text-amber-200">{guide.progress}</b>
        </div>
        <button
          type="button"
          onClick={() => target ? onNavigate(target) : onFreePatrol()}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-amber-300 to-orange-500 px-4 py-3 font-black text-slate-950 shadow-[0_4px_0_#9a3412] transition active:translate-y-1 active:shadow-none"
        >
          <span aria-hidden>➤</span>
          {guide.actionLabel}
          {target && <span className="rounded-full bg-slate-950/15 px-2 py-0.5 text-[10px]">{distance} 步</span>}
        </button>
      </div>
    </section>
  )
}
