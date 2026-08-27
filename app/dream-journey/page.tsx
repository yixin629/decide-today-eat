'use client'

import { useCallback, useEffect, useState } from 'react'
import BackButton from '@/app/components/ui/BackButton'
import CombatPanel from './components/CombatPanel'
import GameCanvas from './components/GameCanvas'
import { createBattle, INITIAL_STATS, resolveRound } from './engine/combat'
import type { BattleAction, BattleState, HeroStats, NpcDefinition } from './types'

const SAVE_KEY = 'dream-journey-save-v1'

export default function DreamJourneyPage() {
  const [stats, setStats] = useState<HeroStats>(INITIAL_STATS)
  const [battle, setBattle] = useState<BattleState | null>(null)
  const [nearbyNpc, setNearbyNpc] = useState<NpcDefinition | null>(null)
  const [dialogue, setDialogue] = useState<NpcDefinition | null>(null)
  const [notice, setNotice] = useState('去找云游师父领取试炼任务')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(SAVE_KEY)
      if (saved) setStats({ ...INITIAL_STATS, ...JSON.parse(saved) as HeroStats })
    } catch {
      window.localStorage.removeItem(SAVE_KEY)
    } finally {
      setLoaded(true)
    }
  }, [])

  useEffect(() => {
    if (loaded) window.localStorage.setItem(SAVE_KEY, JSON.stringify(stats))
  }, [loaded, stats])

  const beginEncounter = useCallback(() => {
    setBattle((current) => current ?? createBattle(stats.level))
  }, [stats.level])

  const handleNpcChange = useCallback((npc: NpcDefinition | null) => setNearbyNpc(npc), [])

  const handleAction = (action: BattleAction) => {
    if (!battle) return
    const outcome = resolveRound(stats, battle, action)
    setStats(outcome.stats)
    setBattle(outcome.battle)
    if (outcome.result === 'victory') setNotice(outcome.stats.questProgress >= 3 ? '试炼完成！回去找云游师父复命' : `已击退 ${outcome.stats.questProgress}/3 只小妖`)
    if (outcome.result === 'defeat') setNotice('你被送回城中休养，损失了 10 两银子')
  }

  const talkToNpc = () => {
    if (!nearbyNpc) return
    setDialogue(nearbyNpc)
    if (nearbyNpc.id === 'master' && stats.questProgress >= 3) {
      setStats((current) => ({ ...current, gold: current.gold + 80, potions: current.potions + 2, questProgress: 0 }))
      setNotice('试炼完成：获得 80 两银子和 2 枚金创药')
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#4338ca_0,_#172554_36%,_#071120_100%)] px-3 py-5 text-white md:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <BackButton className="border-white/20 bg-white/10 text-white hover:bg-white/20" />
          <div className="text-center">
            <p className="text-xs tracking-[0.35em] text-amber-200">东方幻想 · 回合冒险</p>
            <h1 className="text-3xl font-black text-amber-100 drop-shadow md:text-4xl">梦境长安</h1>
          </div>
          <span className="rounded-full border border-amber-300/40 bg-amber-100/10 px-4 py-2 text-sm text-amber-100">自动存档</span>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_290px]">
          <section className="relative">
            <GameCanvas paused={Boolean(battle || dialogue)} onEncounter={beginEncounter} onNpcChange={handleNpcChange} />
            {battle && <CombatPanel battle={battle} stats={stats} onAction={handleAction} />}
            {dialogue && (
              <div className="absolute inset-x-3 bottom-3 z-20 rounded-2xl border-2 border-amber-200 bg-slate-950/95 p-4 shadow-2xl">
                <div className="flex gap-3"><span className="text-4xl">{dialogue.icon}</span><div className="flex-1"><b className="text-amber-200">{dialogue.name} · {dialogue.title}</b><p className="mt-1 text-slate-200">{dialogue.dialogue}</p></div></div>
                <button onClick={() => setDialogue(null)} className="mt-3 float-right rounded-full bg-amber-400 px-5 py-2 font-bold text-slate-950">知道了</button>
              </div>
            )}
          </section>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
              <div className="mb-3 flex items-center gap-3"><div className="grid h-12 w-12 place-items-center rounded-full bg-amber-300 text-2xl">⚔️</div><div><b className="text-lg">逍遥少侠</b><p className="text-xs text-sky-200">等级 {stats.level} · 人族</p></div></div>
              <div className="space-y-2 text-sm">
                <p className="flex justify-between"><span>❤️ 气血</span><b>{stats.hp}/{stats.maxHp}</b></p>
                <p className="flex justify-between"><span>💧 法力</span><b>{stats.mp}/{stats.maxMp}</b></p>
                <p className="flex justify-between"><span>⭐ 修为</span><b>{stats.exp}/{stats.level * 60}</b></p>
                <p className="flex justify-between"><span>🪙 银两</span><b>{stats.gold}</b></p>
                <p className="flex justify-between"><span>🧪 金创药</span><b>{stats.potions}</b></p>
              </div>
            </div>

            <div className="rounded-2xl border border-amber-300/30 bg-amber-100/10 p-4">
              <p className="text-xs font-bold tracking-widest text-amber-300">当前任务</p>
              <h2 className="mt-1 font-bold">初入长安 · 城外试炼</h2>
              <p className="mt-2 text-sm leading-6 text-slate-200">{notice}</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-900"><div className="h-full bg-amber-400 transition-all" style={{ width: `${stats.questProgress / 3 * 100}%` }} /></div>
            </div>

            {nearbyNpc ? (
              <button onClick={talkToNpc} className="w-full animate-pulse rounded-2xl bg-gradient-to-r from-amber-300 to-orange-400 p-4 font-black text-slate-950 shadow-lg">💬 与{nearbyNpc.name}交谈</button>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/20 p-4 text-center text-sm text-slate-300">靠近头顶有名字的人物即可交谈</div>
            )}

            <button onClick={beginEncounter} className="w-full rounded-2xl border border-fuchsia-300/30 bg-fuchsia-500/20 p-3 font-bold hover:bg-fuchsia-500/30">⚡ 立即测试一场战斗</button>
          </aside>
        </div>
      </div>
    </main>
  )
}
