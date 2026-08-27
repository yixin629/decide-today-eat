'use client'

import { useCallback, useEffect, useState } from 'react'
import BackButton from '@/app/components/ui/BackButton'
import CombatPanel from './components/CombatPanel'
import GameCanvas from './components/GameCanvas'
import ShopPanel from './components/ShopPanel'
import { createBattle, INITIAL_STATS, resolveRound } from './engine/combat'
import {
  CHAPTER_REWARD,
  INITIAL_POSITION,
  QUEST_TARGET,
  buyPotion,
  parseGameSave,
  questNotice,
  rest,
} from './engine/progression'
import type {
  BattleAction,
  BattleState,
  HeroStats,
  NpcDefinition,
  Point,
  QuestStage,
} from './types'

const SAVE_KEY = 'dream-journey-save-v2'
const LEGACY_SAVE_KEY = 'dream-journey-save-v1'

interface DialogueState {
  npc: NpcDefinition
  message: string
  action?: 'accept-quest' | 'claim-reward'
}

export default function DreamJourneyPage() {
  const [stats, setStats] = useState<HeroStats>(INITIAL_STATS)
  const [position, setPosition] = useState<Point>(INITIAL_POSITION)
  const [questStage, setQuestStage] = useState<QuestStage>('not-started')
  const [battle, setBattle] = useState<BattleState | null>(null)
  const [nearbyNpc, setNearbyNpc] = useState<NpcDefinition | null>(null)
  const [dialogue, setDialogue] = useState<DialogueState | null>(null)
  const [shopOpen, setShopOpen] = useState(false)
  const [notice, setNotice] = useState(questNotice('not-started', 0))
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const saved = parseGameSave(
      window.localStorage.getItem(SAVE_KEY),
      window.localStorage.getItem(LEGACY_SAVE_KEY),
    )
    setStats(saved.stats)
    setPosition(saved.position)
    setQuestStage(saved.questStage)
    setNotice(questNotice(saved.questStage, saved.stats.questProgress))
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (!loaded) return
    window.localStorage.setItem(SAVE_KEY, JSON.stringify({
      version: 2,
      stats,
      position,
      questStage,
    }))
  }, [loaded, position, questStage, stats])

  const beginEncounter = useCallback(() => {
    if (questStage !== 'hunting' && questStage !== 'completed') return
    setBattle((current) => current ?? createBattle(stats.level))
  }, [questStage, stats.level])

  const beginBossEncounter = () => {
    if (questStage !== 'boss-ready') return
    setDialogue(null)
    setBattle(createBattle(stats.level, 'boss'))
    setNotice('赤焰妖王现身，小心它的重击！')
  }

  const handleNpcChange = useCallback((npc: NpcDefinition | null) => setNearbyNpc(npc), [])
  const handlePositionChange = useCallback((nextPosition: Point) => setPosition(nextPosition), [])

  const handleAction = (action: BattleAction) => {
    if (!battle) return
    const defeatedEnemy = battle.enemy
    const previousLevel = stats.level
    const outcome = resolveRound(stats, battle, action)
    let nextStats = outcome.stats
    setBattle(outcome.battle)

    if (outcome.result === 'victory') {
      const levelMessage = nextStats.level > previousLevel ? ` 升到 ${nextStats.level} 级！` : ''
      if (defeatedEnemy.kind === 'boss' && questStage === 'boss-ready') {
        setQuestStage('returning')
        setNotice(`击败${defeatedEnemy.name}，获得 ${defeatedEnemy.exp} 修为和 ${defeatedEnemy.gold} 两银子。${levelMessage}回去找师父复命。`)
      } else if (defeatedEnemy.kind === 'mob' && questStage === 'hunting') {
        const progress = Math.min(QUEST_TARGET, nextStats.questProgress + 1)
        nextStats = { ...nextStats, questProgress: progress }
        if (progress >= QUEST_TARGET) {
          setQuestStage('boss-ready')
          setNotice(`已击退 ${QUEST_TARGET} 只小妖！赤焰妖王出现在东北海滩。${levelMessage}`)
        } else {
          setNotice(`已击退 ${progress}/${QUEST_TARGET} 只小妖，获得 ${defeatedEnemy.exp} 修为和 ${defeatedEnemy.gold} 两银子。${levelMessage}`)
        }
      } else {
        setNotice(`击败${defeatedEnemy.name}，获得 ${defeatedEnemy.exp} 修为和 ${defeatedEnemy.gold} 两银子。${levelMessage}`)
      }
    }
    if (outcome.result === 'defeat') {
      setNotice(`你被${defeatedEnemy.name}送回城中休养，损失了 10 两银子。`)
    }
    setStats(nextStats)
  }

  const talkToNpc = () => {
    if (!nearbyNpc) return
    if (nearbyNpc.id === 'boss') {
      beginBossEncounter()
      return
    }
    if (nearbyNpc.id === 'merchant') {
      setShopOpen(true)
      return
    }
    if (nearbyNpc.id === 'master') {
      if (questStage === 'not-started') {
        setDialogue({
          npc: nearbyNpc,
          message: `城外妖气异常。先击退 ${QUEST_TARGET} 只小妖，再将现身的妖王除去，可敢接受试炼？`,
          action: 'accept-quest',
        })
      } else if (questStage === 'hunting') {
        setDialogue({ npc: nearbyNpc, message: `已击退 ${stats.questProgress}/${QUEST_TARGET} 只小妖。保持警惕，药铺掌柜可以帮你补给。` })
      } else if (questStage === 'boss-ready') {
        setDialogue({ npc: nearbyNpc, message: '赤焰妖王已在东北海滩现身。地图上的金色光环会为你指路。' })
      } else if (questStage === 'returning') {
        setDialogue({
          npc: nearbyNpc,
          message: '妖王已除，长安境内重归安宁。这是你应得的试炼奖励。',
          action: 'claim-reward',
        })
      } else {
        setDialogue({ npc: nearbyNpc, message: '新手试炼已完成。继续历练、提升修为，新的故事还会到来。' })
      }
      return
    }
    setDialogue({
      npc: nearbyNpc,
      message: questStage === 'boss-ready'
        ? '仙子望向东北方：妖火已落在海滩，出发前记得补足气血。'
        : nearbyNpc.dialogue,
    })
  }

  const handleDialogueAction = () => {
    if (!dialogue?.action) return
    if (dialogue.action === 'accept-quest') {
      setStats((current) => ({ ...current, questProgress: 0 }))
      setQuestStage('hunting')
      setNotice(questNotice('hunting', 0))
    } else {
      setStats((current) => ({
        ...current,
        gold: current.gold + CHAPTER_REWARD.gold,
        potions: current.potions + CHAPTER_REWARD.potions,
        hp: current.maxHp,
        mp: current.maxMp,
      }))
      setQuestStage('completed')
      setNotice(`章节完成：获得 ${CHAPTER_REWARD.gold} 两银子、${CHAPTER_REWARD.potions} 枚金创药，并恢复全部状态。`)
    }
    setDialogue(null)
  }

  const handleBuyPotion = () => {
    const result = buyPotion(stats)
    setStats(result.stats)
    setNotice(result.message)
  }

  const handleRest = () => {
    const result = rest(stats)
    setStats(result.stats)
    setNotice(result.message)
  }

  const questPercent = questStage === 'completed'
    ? 100
    : questStage === 'returning'
      ? 90
      : questStage === 'boss-ready'
        ? 75
        : questStage === 'hunting'
          ? stats.questProgress / (QUEST_TARGET + 1) * 100
          : 0
  const canPatrol = questStage === 'hunting' || questStage === 'completed'

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#4338ca_0,_#172554_36%,_#071120_100%)] px-3 py-5 pb-24 text-white md:px-6 md:pb-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <BackButton className="mb-0 border-white/20 bg-white/10 text-white hover:bg-white/20" />
          <div className="text-center">
            <p className="text-xs tracking-[0.35em] text-amber-200">东方幻想 · 回合冒险</p>
            <h1 className="text-3xl font-black text-amber-100 drop-shadow md:text-4xl">梦境长安</h1>
          </div>
          <span className="rounded-full border border-amber-300/40 bg-amber-100/10 px-4 py-2 text-sm text-amber-100">任务与位置自动存档</span>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
          <section className="relative">
            {loaded ? (
              <GameCanvas
                paused={Boolean(battle || dialogue || shopOpen)}
                initialPosition={position}
                questStage={questStage}
                onEncounter={beginEncounter}
                onNpcChange={handleNpcChange}
                onPositionChange={handlePositionChange}
              />
            ) : (
              <div className="grid aspect-[9/5.6] place-items-center rounded-2xl border-4 border-amber-200/80 bg-slate-950 text-amber-100">正在读取游戏存档…</div>
            )}
            {battle && <CombatPanel battle={battle} stats={stats} onAction={handleAction} />}
            {dialogue && (
              <div className="absolute inset-x-3 bottom-3 z-20 rounded-2xl border-2 border-amber-200 bg-slate-950/95 p-4 shadow-2xl">
                <div className="flex gap-3">
                  <span className="text-4xl">{dialogue.npc.icon}</span>
                  <div className="flex-1">
                    <b className="text-amber-200">{dialogue.npc.name} · {dialogue.npc.title}</b>
                    <p className="mt-1 text-slate-200">{dialogue.message}</p>
                  </div>
                </div>
                <div className="mt-3 flex justify-end gap-2">
                  <button type="button" onClick={() => setDialogue(null)} className="rounded-full border border-white/20 px-5 py-2 font-bold text-slate-200">稍后再说</button>
                  {dialogue.action && (
                    <button type="button" onClick={handleDialogueAction} className="rounded-full bg-amber-400 px-5 py-2 font-bold text-slate-950">
                      {dialogue.action === 'accept-quest' ? '接受试炼' : '领取奖励'}
                    </button>
                  )}
                </div>
              </div>
            )}
            {shopOpen && (
              <ShopPanel
                stats={stats}
                onBuyPotion={handleBuyPotion}
                onRest={handleRest}
                onClose={() => setShopOpen(false)}
              />
            )}
          </section>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
              <div className="mb-3 flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-amber-300 text-2xl">⚔️</div>
                <div><b className="text-lg">逍遥少侠</b><p className="text-xs text-sky-200">等级 {stats.level} · 人族</p></div>
              </div>
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
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-900">
                <div className="h-full bg-amber-400 transition-all" style={{ width: `${questPercent}%` }} />
              </div>
            </div>

            {nearbyNpc ? (
              <button type="button" onClick={talkToNpc} className="w-full animate-pulse rounded-2xl bg-gradient-to-r from-amber-300 to-orange-400 p-4 font-black text-slate-950 shadow-lg">
                {nearbyNpc.id === 'boss' ? '⚔️' : '💬'} {nearbyNpc.actionLabel ?? `与${nearbyNpc.name}交谈`}
              </button>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/20 p-4 text-center text-sm text-slate-300">靠近头顶有名字的人物即可交互</div>
            )}

            <button
              type="button"
              onClick={beginEncounter}
              disabled={!canPatrol || Boolean(battle)}
              className="w-full rounded-2xl border border-fuchsia-300/30 bg-fuchsia-500/20 p-3 font-bold hover:bg-fuchsia-500/30 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ⚡ {canPatrol ? '前往野外巡逻' : questStage === 'boss-ready' ? '前往东北海滩挑战妖王' : '请先推进当前任务'}
            </button>
          </aside>
        </div>
      </div>
    </main>
  )
}
