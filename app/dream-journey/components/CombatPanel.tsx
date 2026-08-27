'use client'

import type { BattleAction, BattleState, HeroStats } from '../types'

interface CombatPanelProps {
  battle: BattleState
  stats: HeroStats
  onAction: (action: BattleAction) => void
}

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  return <div className="h-2 overflow-hidden rounded-full bg-slate-800"><div className={`h-full ${color} transition-all`} style={{ width: `${Math.max(0, value / max) * 100}%` }} /></div>
}

export default function CombatPanel({ battle, stats, onAction }: CombatPanelProps) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/75 p-3 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="回合战斗">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl border-2 border-amber-300 bg-gradient-to-b from-indigo-950 to-slate-950 text-white shadow-2xl">
        <div className="relative h-52 overflow-hidden bg-gradient-to-b from-sky-700 via-indigo-700 to-fuchsia-950">
          <div className="absolute inset-x-0 bottom-0 h-20 bg-[radial-gradient(ellipse_at_center,_#fde68a55,_transparent_65%)]" />
          <div className="absolute left-[16%] bottom-7 text-center"><div className="text-7xl drop-shadow-xl">⚔️</div><b>少侠</b></div>
          <div className="absolute right-[16%] bottom-7 text-center animate-bounce"><div className="text-7xl drop-shadow-xl">{battle.enemy.icon}</div><b>{battle.enemy.name}</b>{battle.enemy.kind === 'boss' && <span className="ml-2 rounded-full bg-rose-600 px-2 py-0.5 text-xs">首领</span>}</div>
        </div>
        <div className="grid gap-4 p-4 md:grid-cols-[1fr_1.25fr]">
          <div className="space-y-3">
            <div><div className="mb-1 flex justify-between text-xs"><span>气血</span><span>{stats.hp}/{stats.maxHp}</span></div><Bar value={stats.hp} max={stats.maxHp} color="bg-rose-500" /></div>
            <div><div className="mb-1 flex justify-between text-xs"><span>法力</span><span>{stats.mp}/{stats.maxMp}</span></div><Bar value={stats.mp} max={stats.maxMp} color="bg-sky-400" /></div>
            <div><div className="mb-1 flex justify-between text-xs"><span>{battle.enemy.name}</span><span>{battle.enemy.hp}/{battle.enemy.maxHp}</span></div><Bar value={battle.enemy.hp} max={battle.enemy.maxHp} color="bg-amber-400" /></div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button onClick={() => onAction('attack')} className="rounded-xl bg-amber-500 px-3 py-2 font-bold text-slate-950 hover:bg-amber-400">⚔️ 攻击</button>
              <button onClick={() => onAction('skill')} disabled={stats.mp < 12} className="rounded-xl bg-fuchsia-600 px-3 py-2 font-bold hover:bg-fuchsia-500 disabled:opacity-40">✨ 横扫千星</button>
              <button onClick={() => onAction('guard')} className="rounded-xl bg-sky-700 px-3 py-2 font-bold hover:bg-sky-600">🛡️ 防御</button>
              <button onClick={() => onAction('potion')} disabled={stats.potions === 0 || stats.hp >= stats.maxHp} className="rounded-xl bg-emerald-700 px-3 py-2 font-bold hover:bg-emerald-600 disabled:opacity-40">🧪 丹药 ×{stats.potions}</button>
            </div>
          </div>
          <div className="min-h-40 rounded-2xl border border-white/10 bg-black/30 p-3 text-sm leading-7" aria-live="polite">
            {battle.log.map((line, index) => <p key={`${line}-${index}`} className={index === 0 ? 'text-amber-200' : 'text-slate-300'}>{line}</p>)}
          </div>
        </div>
      </div>
    </div>
  )
}
