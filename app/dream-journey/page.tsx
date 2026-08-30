'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import BackButton from '@/app/components/ui/BackButton'
import CombatPanel from './components/CombatPanel'
import BattleResultPanel from './components/BattleResultPanel'
import CaveCanvas from './components/CaveCanvas'
import CaveGuide from './components/CaveGuide'
import CaveMiniMap from './components/CaveMiniMap'
import GameCanvas from './components/GameCanvas'
import InventoryPanel from './components/InventoryPanel'
import MiniMap from './components/MiniMap'
import PetPanel from './components/PetPanel'
import QuestGuide from './components/QuestGuide'
import ShopPanel from './components/ShopPanel'
import { createBattle, INITIAL_STATS, resolveRound } from './engine/combat'
import { INITIAL_EQUIPMENT, INITIAL_INVENTORY, ITEMS, equipmentBonuses } from './engine/equipment'
import { INITIAL_PET, starUpPet, trainPet, upgradePetSkill } from './engine/pet'
import { getQuestTarget, getSceneName } from './engine/world'
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
  BattleResult,
  BattleState,
  EquipmentState,
  HeroStats,
  InventoryState,
  ItemId,
  NpcDefinition,
  Point,
  PetState,
  QuestStage,
  SceneId,
  WorldFlags,
} from './types'

const SAVE_KEY = 'dream-journey-save-v5'
const PREVIOUS_SAVE_KEY = 'dream-journey-save-v4'
const OLDER_SAVE_KEY = 'dream-journey-save-v3'
const EARLIER_SAVE_KEY = 'dream-journey-save-v2'
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
  const [scene, setScene] = useState<SceneId>('overworld')
  const [inventory, setInventory] = useState<InventoryState>(INITIAL_INVENTORY)
  const [equipment, setEquipment] = useState<EquipmentState>(INITIAL_EQUIPMENT)
  const [worldFlags, setWorldFlags] = useState<WorldFlags>({ caveChestOpened: false })
  const [pet, setPet] = useState<PetState>(INITIAL_PET)
  const [battle, setBattle] = useState<BattleState | null>(null)
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null)
  const [nearbyNpc, setNearbyNpc] = useState<NpcDefinition | null>(null)
  const [dialogue, setDialogue] = useState<DialogueState | null>(null)
  const [shopOpen, setShopOpen] = useState(false)
  const [inventoryOpen, setInventoryOpen] = useState(false)
  const [petOpen, setPetOpen] = useState(false)
  const [notice, setNotice] = useState(questNotice('not-started', 0))
  const [sceneName, setSceneName] = useState('长安郊野')
  const [navigationRequest, setNavigationRequest] = useState<{ id: number; target: Point; name: string } | null>(null)
  const [navigationNpc, setNavigationNpc] = useState<NpcDefinition | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const saved = parseGameSave(
      window.localStorage.getItem(SAVE_KEY) ?? window.localStorage.getItem(PREVIOUS_SAVE_KEY) ?? window.localStorage.getItem(OLDER_SAVE_KEY) ?? window.localStorage.getItem(EARLIER_SAVE_KEY),
      window.localStorage.getItem(LEGACY_SAVE_KEY),
    )
    setStats(saved.stats)
    setPosition(saved.position)
    setQuestStage(saved.questStage)
    setScene(saved.scene)
    setInventory(saved.inventory)
    setEquipment(saved.equipment)
    setWorldFlags(saved.worldFlags)
    setPet(saved.pet)
    setNotice(questNotice(saved.questStage, saved.stats.questProgress))
    setSceneName(saved.scene === 'crimson-cave' ? '赤焰妖王洞窟' : getSceneName(saved.position))
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (!loaded) return
    window.localStorage.setItem(SAVE_KEY, JSON.stringify({
      version: 5,
      stats,
      position,
      questStage,
      scene,
      inventory,
      equipment,
      worldFlags,
      pet,
    }))
  }, [equipment, inventory, loaded, pet, position, questStage, scene, stats, worldFlags])

  const bonuses = useMemo(() => equipmentBonuses(equipment), [equipment])

  const beginEncounter = useCallback(() => {
    if (questStage !== 'hunting' && questStage !== 'completed') return
    setBattleResult(null)
    setBattle((current) => current ?? createBattle(stats.level, 'mob', pet))
  }, [pet, questStage, stats.level])

  const beginBossEncounter = () => {
    if (questStage !== 'boss-ready') return
    setDialogue(null)
    setBattleResult(null)
    setBattle(createBattle(stats.level, 'boss', pet))
    setNotice('赤焰妖王现身，小心它的重击！')
  }

  const handleNpcChange = useCallback((npc: NpcDefinition | null) => setNearbyNpc(npc), [])
  const handlePositionChange = useCallback((nextPosition: Point) => setPosition(nextPosition), [])
  const handleSceneChange = useCallback((nextScene: string) => setSceneName(nextScene), [])

  const handleAction = (action: BattleAction, targetIndex = 0) => {
    if (!battle) return
    const defeatedEnemy = battle.enemy
    const previousLevel = stats.level
    const outcome = resolveRound(stats, battle, action, bonuses, targetIndex)
    let nextStats = outcome.stats
    setBattle(outcome.battle)

    if (outcome.result === 'victory') {
      const levelMessage = nextStats.level > previousLevel ? ` 升到 ${nextStats.level} 级！` : ''
      let resultMessage = '这场战斗已经结束，可以继续在长安境内历练。'
      if (defeatedEnemy.kind === 'boss' && questStage === 'boss-ready') {
        setQuestStage('returning')
        setInventory((current) => ({ ...current, 'crimson-charm': current['crimson-charm'] + 1 }))
        resultMessage = '赤焰妖王已被击败，并掉落赤焰护符。回到长安后找云游师父复命。'
        setNotice(`击败${defeatedEnemy.name}，获得赤焰护符、${defeatedEnemy.exp} 修为和 ${defeatedEnemy.gold} 两银子。${levelMessage}`)
      } else if (defeatedEnemy.kind === 'mob' && questStage === 'hunting') {
        const progress = Math.min(QUEST_TARGET, nextStats.questProgress + 1)
        nextStats = { ...nextStats, questProgress: progress }
        if (progress >= QUEST_TARGET) {
          setQuestStage('boss-ready')
          resultMessage = '小妖试炼已完成，东北方的赤焰洞窟已经开启。小地图会为你指路。'
          setNotice(`已击退 ${QUEST_TARGET} 只小妖！赤焰洞窟在东北方开启。${levelMessage}`)
        } else {
          resultMessage = `城外试炼进度 ${progress}/${QUEST_TARGET}，继续巡逻即可找到下一只小妖。`
          setNotice(`已击退 ${progress}/${QUEST_TARGET} 只小妖，获得 ${defeatedEnemy.exp} 修为和 ${defeatedEnemy.gold} 两银子。${levelMessage}`)
        }
      } else {
        setNotice(`击败${defeatedEnemy.name}，获得 ${defeatedEnemy.exp} 修为和 ${defeatedEnemy.gold} 两银子。${levelMessage}`)
      }
      setBattleResult({
        outcome: 'victory',
        enemyName: defeatedEnemy.name,
        enemyIcon: defeatedEnemy.icon,
        enemyKind: defeatedEnemy.kind,
        expGained: defeatedEnemy.exp,
        goldChange: defeatedEnemy.gold,
        leveledUp: nextStats.level > previousLevel,
        message: resultMessage,
      })
    }
    if (outcome.result === 'defeat') {
      const goldLost = stats.gold - nextStats.gold
      const resultMessage = `你被送回城中休养，损失了 ${goldLost} 两银子。可以去药铺补给后再次出发。`
      setNotice(resultMessage)
      setBattleResult({
        outcome: 'defeat',
        enemyName: defeatedEnemy.name,
        enemyIcon: defeatedEnemy.icon,
        enemyKind: defeatedEnemy.kind,
        expGained: 0,
        goldChange: -goldLost,
        leveledUp: false,
        message: resultMessage,
      })
    }
    setStats(nextStats)
  }

  const interactWithNpc = (npc: NpcDefinition) => {
    if (npc.id === 'cave-chest') {
      if (worldFlags.caveChestOpened) return
      setWorldFlags((current) => ({ ...current, caveChestOpened: true }))
      setStats((current) => ({ ...current, gold: current.gold + 45, potions: current.potions + 2 }))
      setNearbyNpc(null)
      setNotice('开启熔岩宝箱：获得 45 两银子和 2 枚金创药。宝箱奖励已永久记录。')
      return
    }
    if (npc.id === 'cave-gate') {
      setDialogue(null)
      setPosition({ x: 450, y: 475 })
      setScene('crimson-cave')
      setSceneName('赤焰妖王洞窟')
      setNotice('沿洞窟石路前往火焰祭坛，靠近妖王后按 E 发起挑战。')
      return
    }
    if (npc.id === 'boss') {
      beginBossEncounter()
      return
    }
    if (npc.id === 'merchant') {
      setShopOpen(true)
      return
    }
    if (npc.id === 'master') {
      if (questStage === 'not-started') {
        setDialogue({
          npc,
          message: `城外妖气异常。先击退 ${QUEST_TARGET} 只小妖，再将现身的妖王除去，可敢接受试炼？`,
          action: 'accept-quest',
        })
      } else if (questStage === 'hunting') {
        setDialogue({ npc, message: `已击退 ${stats.questProgress}/${QUEST_TARGET} 只小妖。保持警惕，药铺掌柜可以帮你补给。` })
      } else if (questStage === 'boss-ready') {
        setDialogue({ npc, message: '东北方的赤焰洞窟已经开启。地图上的金色光环会为你指路。' })
      } else if (questStage === 'returning') {
        setDialogue({
          npc,
          message: '妖王已除，长安境内重归安宁。这是你应得的试炼奖励。',
          action: 'claim-reward',
        })
      } else {
        setDialogue({ npc, message: '新手试炼已完成。继续历练、提升修为，新的故事还会到来。' })
      }
      return
    }
    setDialogue({
      npc,
      message: questStage === 'boss-ready'
        ? '仙子望向东北方：妖火已落在海滩，出发前记得补足气血。'
        : npc.dialogue,
    })
  }

  const navigateToQuestTarget = (target: Point) => {
    const objective = getQuestTarget(questStage)
    setNavigationNpc(objective?.id === 'spirit-patrol' ? null : objective)
    setNavigationRequest({ id: Date.now(), target, name: objective?.name ?? '地图目标' })
    setNotice(`自动寻路已开启：正在前往${objective?.name ?? '地图目标'}。使用方向键可随时取消。`)
  }

  const navigateToMapTarget = (target: Point, name: string, npc?: NpcDefinition) => {
    setNavigationNpc(npc ?? null)
    setNavigationRequest({ id: Date.now(), target, name })
    setNotice(`地图寻路已开启：正在前往${name}。使用方向键可随时取消。`)
  }

  const navigateInCave = (target: Point, name: string) => {
    setNavigationNpc(null)
    setNavigationRequest({ id: Date.now(), target, name })
    setNotice(`洞窟寻路已开启：正在前往${name}。使用方向键可随时取消。`)
  }

  const handleGuideArrival = () => {
    if (navigationNpc) {
      const npc = navigationNpc
      setNavigationNpc(null)
      setNotice(`已抵达${npc.name}，可以开始互动。`)
      interactWithNpc(npc)
      return
    }
    if (questStage === 'hunting') {
      setNotice('已抵达妖气巡逻区，小妖现身！')
      beginEncounter()
      return
    }
    const objective = getQuestTarget(questStage)
    if (objective) interactWithNpc(objective)
  }

  const handleGuideCancel = () => {
    setNavigationNpc(null)
    setNotice('自动寻路已取消。你可以点击地图目标重新开始，或继续手动探索。')
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

  const handleLeaveCave = useCallback(() => {
    setPosition({ x: 1950, y: 760 })
    setScene('overworld')
    setSceneName('长安郊野')
    setNearbyNpc(null)
    setNotice(questStage === 'returning' ? '妖王已败，回去找云游师父复命。' : questNotice(questStage, stats.questProgress))
  }, [questStage, stats.questProgress])

  const handleCaveGuideArrival = () => {
    if (questStage === 'boss-ready') beginBossEncounter()
  }

  const handleEquip = (itemId: ItemId) => {
    const item = ITEMS[itemId]
    if (inventory[itemId] <= 0) return
    setEquipment((current) => ({ ...current, [item.slot]: itemId }))
    setNotice(`已装备${item.name}：攻击 +${item.attack}，防御 +${item.defense}，暴击 +${item.crit}%。`)
  }

  const applyPetProgress = (result: ReturnType<typeof trainPet>) => {
    if (result.success) {
      setPet(result.pet)
      setStats(result.stats)
    }
    setNotice(result.message)
  }

  const handleTrainPet = () => applyPetProgress(trainPet(pet, stats))
  const handleStarUpPet = () => applyPetProgress(starUpPet(pet, stats))
  const handleUpgradePetSkill = () => applyPetProgress(upgradePetSkill(pet, stats))

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#4338ca_0,_#172554_36%,_#071120_100%)] px-3 py-5 pb-24 text-white md:px-6 md:pb-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <BackButton className="mb-0 border-white/20 bg-white/10 text-white hover:bg-white/20" />
          <div className="text-center">
            <p className="text-xs tracking-[0.25em] text-amber-200">东方幻想 · {sceneName} · 回合冒险</p>
            <h1 className="text-3xl font-black text-amber-100 drop-shadow md:text-4xl">梦境长安</h1>
          </div>
          <span className="rounded-full border border-amber-300/40 bg-amber-100/10 px-4 py-2 text-sm text-amber-100">任务与位置自动存档</span>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
          <section className="relative">
            {loaded ? (
              scene === 'overworld' ? (
                <GameCanvas
                  paused={Boolean(battle || battleResult || dialogue || shopOpen || inventoryOpen || petOpen)}
                  initialPosition={position}
                  questStage={questStage}
                  onEncounter={beginEncounter}
                  onInteract={interactWithNpc}
                  onNpcChange={handleNpcChange}
                  onPositionChange={handlePositionChange}
                  onSceneChange={handleSceneChange}
                  navigationRequest={navigationRequest}
                  onGuideArrival={handleGuideArrival}
                  onGuideCancel={handleGuideCancel}
                />
              ) : (
                <CaveCanvas
                  paused={Boolean(battle || battleResult || inventoryOpen || petOpen)}
                  bossActive={questStage === 'boss-ready'}
                  chestOpened={worldFlags.caveChestOpened}
                  initialPosition={position}
                  onInteract={interactWithNpc}
                  onNpcChange={handleNpcChange}
                  onPositionChange={handlePositionChange}
                  onLeave={handleLeaveCave}
                  navigationRequest={navigationRequest}
                  onGuideArrival={handleCaveGuideArrival}
                  onGuideCancel={handleGuideCancel}
                />
              )
            ) : (
              <div className="grid aspect-[9/5.6] place-items-center rounded-2xl border-4 border-amber-200/80 bg-slate-950 text-amber-100">正在读取游戏存档…</div>
            )}
            {battle && <CombatPanel battle={battle} stats={stats} onAction={handleAction} />}
            {battleResult && <BattleResultPanel result={battleResult} onContinue={() => setBattleResult(null)} />}
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
            {inventoryOpen && <InventoryPanel inventory={inventory} equipment={equipment} onEquip={handleEquip} onClose={() => setInventoryOpen(false)} />}
            {petOpen && <PetPanel pet={pet} gold={stats.gold} onTrain={handleTrainPet} onStarUp={handleStarUpPet} onUpgradeSkill={handleUpgradePetSkill} onClose={() => setPetOpen(false)} />}
          </section>

          <aside className="flex flex-col gap-4">
            <div className="order-4 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
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
                <p className="flex justify-between"><span>⚔️ 攻击</span><b>{stats.attack + bonuses.attack}</b></p>
                <p className="flex justify-between"><span>🛡️ 防御</span><b>{stats.defense + bonuses.defense}</b></p>
                <p className="flex justify-between"><span>🎯 暴击</span><b>{stats.crit + bonuses.crit}%</b></p>
              </div>
              <button type="button" onClick={() => setInventoryOpen(true)} className="mt-3 w-full rounded-xl bg-amber-300 px-3 py-2 font-black text-slate-950">🎒 装备背包</button>
              <button type="button" onClick={() => setPetOpen(true)} className="mt-2 w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-3 py-2 font-black text-white">🫧 宠物养成 · {pet.level}级</button>
            </div>

            <div className="order-1">
              {scene === 'overworld' ? (
                <QuestGuide position={position} progress={stats.questProgress} questStage={questStage} onNavigate={navigateToQuestTarget} onFreePatrol={beginEncounter} />
              ) : (
                <CaveGuide position={position} questStage={questStage} chestOpened={worldFlags.caveChestOpened} onNavigate={navigateInCave} />
              )}
            </div>

            <div className="order-3 rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-xs leading-5 text-slate-300">
              <b className="mr-2 text-sky-300">历练动态</b>{notice}
            </div>

            <div className="order-2">
              {scene === 'overworld' ? <MiniMap position={position} questStage={questStage} sceneName={sceneName} onNavigate={navigateToMapTarget} /> : (
                <CaveMiniMap position={position} questStage={questStage} chestOpened={worldFlags.caveChestOpened} onNavigate={navigateInCave} />
              )}
            </div>

            {nearbyNpc ? (
              <button type="button" onClick={() => interactWithNpc(nearbyNpc)} className="order-5 w-full animate-pulse rounded-2xl bg-gradient-to-r from-amber-300 to-orange-400 p-4 font-black text-slate-950 shadow-lg">
                {nearbyNpc.id === 'boss' ? '⚔️' : '💬'} E · {nearbyNpc.actionLabel ?? `与${nearbyNpc.name}交谈`}
              </button>
            ) : (
              <div className="order-5 rounded-2xl border border-dashed border-white/20 p-4 text-center text-sm text-slate-300">靠近头顶有名字的人物即可交互</div>
            )}

          </aside>
        </div>
      </div>
    </main>
  )
}
