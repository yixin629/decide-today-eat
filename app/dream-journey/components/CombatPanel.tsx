'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { INTENT_LABELS } from '../engine/combat'
import type { BattleAction, BattleState, EnemyIntent, HeroStats } from '../types'
import AtlasSprite, { monsterQuadrant } from './AtlasSprite'

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
  const [phase, setPhase] = useState<BattlePhase>('idle')
  const [activeAction, setActiveAction] = useState<BattleAction | null>(null)
  const [enemyActionIntent, setEnemyActionIntent] = useState<EnemyIntent | null>(null)
  const [enemyPopup, setEnemyPopup] = useState<string | null>(null)
  const [heroPopup, setHeroPopup] = useState<string | null>(null)
  const timersRef = useRef<Array<ReturnType<typeof setTimeout>>>([])
  const previousEnemyHpRef = useRef(battle.enemy.hp)
  const previousHeroHpRef = useRef(stats.hp)
  const busy = phase !== 'idle'

  useEffect(() => () => {
    timersRef.current.forEach(clearTimeout)
  }, [])

  useEffect(() => {
    const enemyDifference = previousEnemyHpRef.current - battle.enemy.hp
    const heroDifference = previousHeroHpRef.current - stats.hp
    if (enemyDifference > 0) setEnemyPopup(`-${enemyDifference}`)
    if (heroDifference > 0) setHeroPopup(`-${heroDifference}`)
    if (heroDifference < 0) setHeroPopup(`+${Math.abs(heroDifference)}`)
    previousEnemyHpRef.current = battle.enemy.hp
    previousHeroHpRef.current = stats.hp
    const timer = window.setTimeout(() => { setEnemyPopup(null); setHeroPopup(null) }, 900)
    return () => window.clearTimeout(timer)
  }, [battle.enemy.hp, stats.hp])

  const runAction = (action: BattleAction) => {
    if (busy) return
    setActiveAction(action)
    setEnemyActionIntent(battle.intent)
    setPhase('hero-action')
    timersRef.current.push(setTimeout(() => {
      onAction(action)
      setPhase('enemy-counter')
    }, 680))
    timersRef.current.push(setTimeout(() => {
      setPhase('idle')
      setActiveAction(null)
      setEnemyActionIntent(null)
      timersRef.current = []
    }, 1480))
  }

  const heroFrame = '/games/dream-journey/jxk/stand/02000.png'
  const displayIntent = phase === 'enemy-counter' && enemyActionIntent ? enemyActionIntent : battle.intent
  const intent = INTENT_LABELS[displayIntent]
  const actionName = activeAction === 'attack'
    ? '普通攻击'
    : activeAction === 'skill'
      ? '横扫千星'
      : activeAction === 'heal'
        ? '回春诀'
        : activeAction === 'guard'
          ? '凝神防御'
          : activeAction === 'potion'
            ? '使用金创药'
            : null

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/80 p-3 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="动态回合战斗">
      <div className="w-full max-w-4xl overflow-hidden rounded-3xl border-2 border-amber-300 bg-gradient-to-b from-indigo-950 to-slate-950 text-white shadow-2xl">
        <div className={`relative h-80 overflow-hidden transition-colors duration-500 md:h-[390px] ${phase === 'enemy-counter' ? 'motion-safe:animate-pulse' : ''}`}>
          <Image src="/games/dream-journey/battle/arena-night-v1.png" alt="月下长安斜向战斗场景" fill sizes="896px" className={`object-cover transition-all duration-500 ${battle.enraged ? 'scale-105 saturate-150 contrast-125' : ''}`} priority unoptimized />
          <div className={`absolute inset-0 bg-gradient-to-tr transition-colors duration-500 ${battle.enraged ? 'from-red-950/55 via-transparent to-orange-600/20' : 'from-indigo-950/20 via-transparent to-sky-500/10'}`} />
          {phase === 'enemy-counter' && <div className={`absolute inset-0 ${displayIntent === 'inferno' ? 'bg-orange-500/20' : 'bg-fuchsia-500/10'} motion-safe:animate-pulse`} />}
          <div className="absolute left-1/2 top-3 -translate-x-1/2 rounded-full border border-white/20 bg-slate-950/60 px-4 py-1 text-xs font-bold tracking-widest text-amber-100">
            {phase === 'idle' ? '请选择行动' : phase === 'hero-action' ? actionName : `${battle.enemy.name} · ${intent.name}`}
          </div>
          {battle.enemy.kind === 'boss' && <div className={`absolute right-3 top-3 rounded-xl border px-3 py-2 text-right text-xs backdrop-blur ${displayIntent === 'inferno' ? 'animate-pulse border-orange-300 bg-red-950/85 text-orange-100' : 'border-white/20 bg-slate-950/65 text-white'}`}><b>{intent.icon} {phase === 'enemy-counter' ? '正在施放' : '妖王意图'}：{intent.name}</b><span className="block text-[11px] opacity-80">{intent.description}</span></div>}
          {battle.enraged && <div className="absolute left-3 top-3 animate-pulse rounded-full bg-rose-600 px-3 py-1 text-xs font-black">🔥 狂暴阶段</div>}

          <div className={`absolute bottom-[6%] left-[14%] z-10 flex w-36 flex-col items-center transition-[filter] duration-300 md:left-[18%] ${phase === 'hero-action' ? 'brightness-125' : phase === 'enemy-counter' ? 'brightness-75' : ''}`}>
            <div className="absolute bottom-5 h-8 w-28 rounded-[50%] bg-slate-950/55 blur-sm" />
            <div className="absolute -top-3 left-1/2 z-20 w-28 -translate-x-1/2 rounded-full border border-white/25 bg-slate-950/85 p-1 shadow-lg">
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-800"><div className="h-full bg-rose-500 transition-all duration-500" style={{ width: `${stats.hp / stats.maxHp * 100}%` }} /></div>
            </div>
            <div className="relative h-44 w-32 md:h-52 md:w-40">
              <Image src={heroFrame} alt="逍遥少侠战斗动画" fill sizes="160px" className="object-contain drop-shadow-[0_14px_10px_rgba(0,0,0,0.65)]" unoptimized />
              {activeAction === 'guard' && phase === 'hero-action' && <span className="absolute inset-0 grid place-items-center text-7xl opacity-80 animate-pulse">🛡️</span>}
              {phase === 'enemy-counter' && <span className="absolute -right-2 top-12 text-5xl animate-ping">💥</span>}
            </div>
            {heroPopup && <span className={`absolute top-5 z-30 text-3xl font-black drop-shadow-[0_2px_2px_rgba(0,0,0,1)] ${heroPopup.startsWith('+') ? 'text-emerald-300' : 'text-rose-300'}`}>{heroPopup}</span>}
            <b className="relative -mt-5 rounded-full border border-white/20 bg-slate-950/80 px-3 py-1 text-sm shadow">逍遥少侠</b>
          </div>

          <div className={`absolute right-[11%] top-[20%] z-10 flex w-44 flex-col items-center transition-[filter] duration-300 md:right-[15%] md:w-56 ${phase === 'hero-action' && activeAction !== 'guard' && activeAction !== 'potion' && activeAction !== 'heal' ? 'brightness-150' : phase === 'enemy-counter' ? 'brightness-125' : ''}`}>
            <div className="absolute bottom-5 h-9 w-32 rounded-[50%] bg-slate-950/60 blur-sm" />
            <div className="absolute -top-3 left-1/2 z-20 w-32 -translate-x-1/2 rounded-full border border-white/25 bg-slate-950/85 p-1 shadow-lg">
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-800"><div className="h-full bg-rose-500 transition-all duration-500" style={{ width: `${battle.enemy.hp / battle.enemy.maxHp * 100}%` }} /></div>
            </div>
            <div className={`relative ${battle.enraged ? 'drop-shadow-[0_0_28px_rgba(251,80,30,0.95)]' : 'drop-shadow-[0_16px_12px_rgba(0,0,0,0.65)]'}`}>
              <AtlasSprite atlas="monsters" quadrant={monsterQuadrant(battle.enemy.name)} alt={`${battle.enemy.name}战斗模型`} className="h-44 w-44 md:h-56 md:w-56" />
            </div>
            {enemyPopup && <span className="absolute top-8 z-30 text-3xl font-black text-amber-200 drop-shadow-[0_2px_2px_rgba(0,0,0,1)]">{enemyPopup}</span>}
            <div className="relative -mt-4 rounded-full border border-white/20 bg-slate-950/80 px-3 py-1 shadow"><b>{battle.enemy.name}</b>{battle.enemy.kind === 'boss' && <span className="ml-2 rounded-full bg-rose-600 px-2 py-0.5 text-xs">首领</span>}</div>
          </div>

          {phase === 'hero-action' && activeAction === 'attack' && <AtlasSprite atlas="effects" quadrant="top-left" alt="金色剑气斩击" className="absolute right-[15%] top-[20%] z-20 h-52 w-52 animate-pulse md:h-64 md:w-64" />}
          {phase === 'hero-action' && activeAction === 'skill' && <AtlasSprite atlas="effects" quadrant="top-right" alt="横扫千星技能特效" className="absolute right-[12%] top-[14%] z-20 h-56 w-56 animate-pulse md:h-72 md:w-72" />}
          {phase === 'hero-action' && activeAction === 'heal' && <AtlasSprite atlas="effects" quadrant="bottom-left" alt="回春诀治疗特效" className="absolute bottom-[3%] left-[12%] z-20 h-52 w-52 animate-pulse md:h-64 md:w-64" />}
          {phase === 'hero-action' && activeAction === 'potion' && <AtlasSprite atlas="items" quadrant="bottom-right" alt="金创药" className="absolute bottom-[24%] left-[29%] z-20 h-24 w-24 animate-bounce" />}
          {phase === 'enemy-counter' && displayIntent === 'inferno' && <AtlasSprite atlas="effects" quadrant="bottom-right" alt="焚天重击特效" className="absolute bottom-[1%] left-[8%] z-20 h-64 w-64 animate-pulse md:h-80 md:w-80" />}
          {phase === 'enemy-counter' && displayIntent === 'roar' && <div className="absolute inset-0 z-20 bg-[radial-gradient(circle_at_28%_72%,rgba(168,85,247,0.55),transparent_28%)] animate-pulse" />}
        </div>

        <div className="grid gap-4 p-4 md:grid-cols-[1fr_1.25fr]">
          <div className="space-y-3">
            <div><div className="mb-1 flex justify-between text-xs"><span>气血</span><span>{stats.hp}/{stats.maxHp}</span></div><Bar value={stats.hp} max={stats.maxHp} color="bg-rose-500" /></div>
            <div><div className="mb-1 flex justify-between text-xs"><span>法力</span><span>{stats.mp}/{stats.maxMp}</span></div><Bar value={stats.mp} max={stats.maxMp} color="bg-sky-400" /></div>
            <div><div className="mb-1 flex justify-between text-xs"><span>{battle.enemy.name}</span><span>{battle.enemy.hp}/{battle.enemy.maxHp}</span></div><Bar value={battle.enemy.hp} max={battle.enemy.maxHp} color="bg-amber-400" /></div>
            {battle.enemy.kind === 'boss' && <div className={`rounded-xl border p-2 text-xs ${battle.intent === 'inferno' ? 'border-orange-300 bg-orange-500/20 text-orange-100' : 'border-white/10 bg-white/5 text-slate-200'}`}><b>第 {battle.turn} 回合 · {INTENT_LABELS[battle.intent].icon} {INTENT_LABELS[battle.intent].name}</b><span className="block mt-0.5">{INTENT_LABELS[battle.intent].description}</span></div>}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button onClick={() => runAction('attack')} disabled={busy} className="inline-flex items-center justify-center gap-1 rounded-xl bg-amber-500 px-3 py-2 font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-40"><AtlasSprite atlas="effects" quadrant="top-left" alt="" className="h-8 w-8" />攻击</button>
              <button onClick={() => runAction('skill')} disabled={busy || stats.mp < 12} className="inline-flex items-center justify-center gap-1 rounded-xl bg-fuchsia-600 px-3 py-2 font-bold hover:bg-fuchsia-500 disabled:opacity-40"><AtlasSprite atlas="effects" quadrant="top-right" alt="" className="h-8 w-8" />横扫千星</button>
              <button onClick={() => runAction('heal')} disabled={busy || stats.mp < 10 || stats.hp >= stats.maxHp} className="inline-flex items-center justify-center gap-1 rounded-xl bg-emerald-600 px-3 py-2 font-bold hover:bg-emerald-500 disabled:opacity-40"><AtlasSprite atlas="effects" quadrant="bottom-left" alt="" className="h-8 w-8" />回春诀</button>
              <button onClick={() => runAction('guard')} disabled={busy} className={`rounded-xl px-3 py-2 font-bold hover:bg-sky-600 disabled:opacity-40 ${battle.intent === 'inferno' ? 'animate-pulse ring-2 ring-orange-300 bg-sky-600' : 'bg-sky-700'}`}>🛡️ 防御</button>
              <button onClick={() => runAction('potion')} disabled={busy || stats.potions === 0 || stats.hp >= stats.maxHp} className="inline-flex items-center justify-center gap-1 rounded-xl bg-emerald-700 px-3 py-2 font-bold hover:bg-emerald-600 disabled:opacity-40"><AtlasSprite atlas="items" quadrant="bottom-right" alt="" className="h-8 w-8" />丹药 ×{stats.potions}</button>
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
