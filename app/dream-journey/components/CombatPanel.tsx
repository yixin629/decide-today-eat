'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { INTENT_LABELS } from '../engine/combat'
import type { BattleAction, BattleState, EnemyIntent, HeroStats } from '../types'

interface CombatPanelProps {
  battle: BattleState
  stats: HeroStats
  onAction: (action: BattleAction) => void
}

type BattlePhase = 'idle' | 'hero-action' | 'enemy-counter'

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  return <div className="h-2 overflow-hidden rounded-full bg-slate-800"><div className={`h-full ${color} transition-all duration-500`} style={{ width: `${Math.max(0, value / max) * 100}%` }} /></div>
}

export default function CombatPanel({ battle, stats, onAction }: CombatPanelProps) {
  const [frame, setFrame] = useState(0)
  const [phase, setPhase] = useState<BattlePhase>('idle')
  const [activeAction, setActiveAction] = useState<BattleAction | null>(null)
  const [enemyActionIntent, setEnemyActionIntent] = useState<EnemyIntent | null>(null)
  const timersRef = useRef<Array<ReturnType<typeof setTimeout>>>([])
  const busy = phase !== 'idle'

  useEffect(() => {
    const timer = window.setInterval(() => setFrame((current) => (current + 1) % 8), phase === 'idle' ? 150 : 85)
    return () => window.clearInterval(timer)
  }, [phase])

  useEffect(() => () => {
    timersRef.current.forEach(clearTimeout)
  }, [])

  const runAction = (action: BattleAction) => {
    if (busy) return
    setActiveAction(action)
    setEnemyActionIntent(battle.intent)
    setPhase('hero-action')
    timersRef.current.push(setTimeout(() => {
      onAction(action)
      setPhase('enemy-counter')
    }, 420))
    timersRef.current.push(setTimeout(() => {
      setPhase('idle')
      setActiveAction(null)
      setEnemyActionIntent(null)
      timersRef.current = []
    }, 880))
  }

  const movingHero = phase === 'hero-action' && (activeAction === 'attack' || activeAction === 'skill')
  const heroState = movingHero ? 'run' : 'stand'
  const heroFrame = `/games/dream-journey/jxk/${heroState}/02${frame.toString().padStart(3, '0')}.png`
  const displayIntent = phase === 'enemy-counter' && enemyActionIntent ? enemyActionIntent : battle.intent
  const intent = INTENT_LABELS[displayIntent]

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/80 p-3 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="动态回合战斗">
      <div className="w-full max-w-3xl overflow-hidden rounded-3xl border-2 border-amber-300 bg-gradient-to-b from-indigo-950 to-slate-950 text-white shadow-2xl">
        <div className={`relative h-60 overflow-hidden bg-gradient-to-b transition-colors duration-500 ${battle.enraged ? 'from-rose-950 via-red-800 to-orange-950' : 'from-sky-700 via-indigo-700 to-fuchsia-950'}`}>
          <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_50%_120%,#fde68a_0,transparent_55%)]" />
          <div className="absolute inset-x-0 bottom-0 h-20 bg-slate-950/35" />
          <div className="absolute left-1/2 top-3 -translate-x-1/2 rounded-full border border-white/20 bg-slate-950/60 px-4 py-1 text-xs font-bold tracking-widest text-amber-100">
            {phase === 'idle' ? '请选择行动' : phase === 'hero-action' ? '少侠出手' : `${battle.enemy.name}反击`}
          </div>
          {battle.enemy.kind === 'boss' && <div className={`absolute right-3 top-3 rounded-xl border px-3 py-2 text-right text-xs backdrop-blur ${displayIntent === 'inferno' ? 'animate-pulse border-orange-300 bg-red-950/85 text-orange-100' : 'border-white/20 bg-slate-950/65 text-white'}`}><b>{intent.icon} {phase === 'enemy-counter' ? '正在施放' : '妖王意图'}：{intent.name}</b><span className="block text-[11px] opacity-80">{intent.description}</span></div>}
          {battle.enraged && <div className="absolute left-3 top-3 animate-pulse rounded-full bg-rose-600 px-3 py-1 text-xs font-black">🔥 狂暴阶段</div>}

          <div className={`absolute bottom-6 left-[14%] flex w-28 flex-col items-center transition-transform duration-300 ${movingHero ? 'translate-x-28 scale-110' : phase === 'enemy-counter' ? '-translate-x-3' : ''}`}>
            <div className="relative h-32 w-24">
              <Image src={heroFrame} alt="逍遥少侠战斗动画" fill sizes="96px" className="object-contain drop-shadow-2xl" unoptimized />
              {activeAction === 'guard' && phase === 'hero-action' && <span className="absolute inset-0 grid place-items-center text-7xl opacity-80 animate-pulse">🛡️</span>}
              {activeAction === 'potion' && phase === 'hero-action' && <span className="absolute -right-5 top-2 text-5xl animate-bounce">🧪</span>}
              {activeAction === 'heal' && phase === 'hero-action' && <span className="absolute -right-5 top-2 text-5xl animate-pulse">🌿</span>}
              {phase === 'enemy-counter' && <span className="absolute -right-4 top-6 text-5xl animate-ping">💥</span>}
            </div>
            <b className="rounded-full bg-slate-950/70 px-3 py-1 text-sm">少侠</b>
          </div>

          <div className={`absolute bottom-7 right-[14%] flex w-32 flex-col items-center transition-transform duration-300 ${phase === 'hero-action' && activeAction !== 'guard' && activeAction !== 'potion' && activeAction !== 'heal' ? 'scale-90 translate-x-3' : phase === 'enemy-counter' ? '-translate-x-16 scale-110 rotate-6' : ''}`}>
            <div className={`relative grid h-28 w-28 place-items-center text-8xl drop-shadow-2xl ${phase === 'idle' ? 'animate-bounce' : ''} ${battle.enraged ? 'drop-shadow-[0_0_24px_rgba(251,146,60,0.9)]' : ''}`}>
              {battle.enemy.icon}
              {phase === 'hero-action' && activeAction === 'attack' && <span className="absolute text-7xl animate-ping">⚔️</span>}
              {phase === 'hero-action' && activeAction === 'skill' && <span className="absolute text-8xl text-fuchsia-200 animate-pulse">✨</span>}
              {phase === 'enemy-counter' && displayIntent === 'inferno' && <span className="absolute text-9xl animate-ping">🔥</span>}
              {phase === 'enemy-counter' && displayIntent === 'roar' && <span className="absolute text-8xl animate-ping">🌋</span>}
            </div>
            <div><b>{battle.enemy.name}</b>{battle.enemy.kind === 'boss' && <span className="ml-2 rounded-full bg-rose-600 px-2 py-0.5 text-xs">首领</span>}</div>
          </div>
        </div>

        <div className="grid gap-4 p-4 md:grid-cols-[1fr_1.25fr]">
          <div className="space-y-3">
            <div><div className="mb-1 flex justify-between text-xs"><span>气血</span><span>{stats.hp}/{stats.maxHp}</span></div><Bar value={stats.hp} max={stats.maxHp} color="bg-rose-500" /></div>
            <div><div className="mb-1 flex justify-between text-xs"><span>法力</span><span>{stats.mp}/{stats.maxMp}</span></div><Bar value={stats.mp} max={stats.maxMp} color="bg-sky-400" /></div>
            <div><div className="mb-1 flex justify-between text-xs"><span>{battle.enemy.name}</span><span>{battle.enemy.hp}/{battle.enemy.maxHp}</span></div><Bar value={battle.enemy.hp} max={battle.enemy.maxHp} color="bg-amber-400" /></div>
            {battle.enemy.kind === 'boss' && <div className={`rounded-xl border p-2 text-xs ${battle.intent === 'inferno' ? 'border-orange-300 bg-orange-500/20 text-orange-100' : 'border-white/10 bg-white/5 text-slate-200'}`}><b>第 {battle.turn} 回合 · {INTENT_LABELS[battle.intent].icon} {INTENT_LABELS[battle.intent].name}</b><span className="block mt-0.5">{INTENT_LABELS[battle.intent].description}</span></div>}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button onClick={() => runAction('attack')} disabled={busy} className="rounded-xl bg-amber-500 px-3 py-2 font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-40">⚔️ 攻击</button>
              <button onClick={() => runAction('skill')} disabled={busy || stats.mp < 12} className="rounded-xl bg-fuchsia-600 px-3 py-2 font-bold hover:bg-fuchsia-500 disabled:opacity-40">✨ 横扫千星</button>
              <button onClick={() => runAction('heal')} disabled={busy || stats.mp < 10 || stats.hp >= stats.maxHp} className="rounded-xl bg-emerald-600 px-3 py-2 font-bold hover:bg-emerald-500 disabled:opacity-40">🌿 回春诀</button>
              <button onClick={() => runAction('guard')} disabled={busy} className={`rounded-xl px-3 py-2 font-bold hover:bg-sky-600 disabled:opacity-40 ${battle.intent === 'inferno' ? 'animate-pulse ring-2 ring-orange-300 bg-sky-600' : 'bg-sky-700'}`}>🛡️ 防御</button>
              <button onClick={() => runAction('potion')} disabled={busy || stats.potions === 0 || stats.hp >= stats.maxHp} className="rounded-xl bg-emerald-700 px-3 py-2 font-bold hover:bg-emerald-600 disabled:opacity-40">🧪 丹药 ×{stats.potions}</button>
            </div>
          </div>
          <div className="min-h-40 rounded-2xl border border-white/10 bg-black/30 p-3 text-sm leading-7" aria-live="polite">
            {battle.log.map((line, index) => <p key={`${line}-${index}`} className={index === 0 ? 'text-amber-200 animate-fade-in' : 'text-slate-300'}>{line}</p>)}
          </div>
        </div>
      </div>
    </div>
  )
}
