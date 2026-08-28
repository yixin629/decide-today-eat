import type { EquipmentState, GameSave, HeroStats, InventoryState, PetState, Point, QuestStage, SceneId, WorldFlags } from '../types'
import { INITIAL_STATS } from './combat'
import { INITIAL_EQUIPMENT, INITIAL_INVENTORY } from './equipment'
import { INITIAL_PET } from './pet'

export const QUEST_TARGET = 3
export const POTION_PRICE = 18
export const REST_PRICE = 12
export const CHAPTER_REWARD = { gold: 120, potions: 3 } as const
export const INITIAL_POSITION: Point = { x: 1205, y: 1240 }

export const INITIAL_SAVE: GameSave = {
  version: 5,
  stats: INITIAL_STATS,
  position: INITIAL_POSITION,
  questStage: 'not-started',
  scene: 'overworld',
  inventory: INITIAL_INVENTORY,
  equipment: INITIAL_EQUIPMENT,
  worldFlags: { caveChestOpened: false },
  pet: INITIAL_PET,
}

const QUEST_STAGES: readonly QuestStage[] = [
  'not-started',
  'hunting',
  'boss-ready',
  'returning',
  'completed',
]

function finiteNumber(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function parseStats(value: unknown): HeroStats {
  const saved = value && typeof value === 'object' ? value as Partial<HeroStats> : {}
  return {
    level: Math.max(1, Math.floor(finiteNumber(saved.level, INITIAL_STATS.level))),
    hp: Math.max(0, finiteNumber(saved.hp, INITIAL_STATS.hp)),
    maxHp: Math.max(1, finiteNumber(saved.maxHp, INITIAL_STATS.maxHp)),
    mp: Math.max(0, finiteNumber(saved.mp, INITIAL_STATS.mp)),
    maxMp: Math.max(1, finiteNumber(saved.maxMp, INITIAL_STATS.maxMp)),
    exp: Math.max(0, finiteNumber(saved.exp, INITIAL_STATS.exp)),
    gold: Math.max(0, finiteNumber(saved.gold, INITIAL_STATS.gold)),
    potions: Math.max(0, Math.floor(finiteNumber(saved.potions, INITIAL_STATS.potions))),
    questProgress: Math.min(
      QUEST_TARGET,
      Math.max(0, Math.floor(finiteNumber(saved.questProgress, INITIAL_STATS.questProgress))),
    ),
    attack: Math.max(0, finiteNumber(saved.attack, INITIAL_STATS.attack)),
    defense: Math.max(0, finiteNumber(saved.defense, INITIAL_STATS.defense)),
    crit: Math.min(100, Math.max(0, finiteNumber(saved.crit, INITIAL_STATS.crit))),
  }
}

function parseInventory(value: unknown): InventoryState {
  const saved = value && typeof value === 'object' ? value as Partial<InventoryState> : {}
  return Object.fromEntries(Object.entries(INITIAL_INVENTORY).map(([id, fallback]) => [
    id,
    Math.max(0, Math.floor(finiteNumber(saved[id as keyof InventoryState], fallback))),
  ])) as InventoryState
}

function parseEquipment(value: unknown, inventory: InventoryState): EquipmentState {
  const saved = value && typeof value === 'object' ? value as Partial<EquipmentState> : {}
  const valid = <T extends keyof EquipmentState>(slot: T, fallback: EquipmentState[T]) => {
    const itemId = saved[slot]
    return itemId && inventory[itemId] > 0 ? itemId : fallback
  }
  return {
    weapon: valid('weapon', INITIAL_EQUIPMENT.weapon),
    armor: valid('armor', INITIAL_EQUIPMENT.armor),
    accessory: valid('accessory', INITIAL_EQUIPMENT.accessory),
  }
}

function parseWorldFlags(value: unknown): WorldFlags {
  const saved = value && typeof value === 'object' ? value as Partial<WorldFlags> : {}
  return { caveChestOpened: saved.caveChestOpened === true }
}

function parsePet(value: unknown): PetState {
  const saved = value && typeof value === 'object' ? value as Partial<PetState> : {}
  return {
    level: Math.min(30, Math.max(1, Math.floor(finiteNumber(saved.level, INITIAL_PET.level)))),
    exp: Math.max(0, Math.floor(finiteNumber(saved.exp, INITIAL_PET.exp))),
    stars: Math.min(5, Math.max(0, Math.floor(finiteNumber(saved.stars, INITIAL_PET.stars)))),
    skillLevel: Math.min(5, Math.max(1, Math.floor(finiteNumber(saved.skillLevel, INITIAL_PET.skillLevel)))),
  }
}

export function parseGameSave(raw: string | null, legacyRaw: string | null): GameSave {
  try {
    if (raw) {
      const saved = JSON.parse(raw) as Partial<GameSave>
      const position = saved.position && typeof saved.position === 'object'
        ? {
            x: Math.min(2390, Math.max(20, finiteNumber(saved.position.x, INITIAL_POSITION.x))),
            y: Math.min(2390, Math.max(45, finiteNumber(saved.position.y, INITIAL_POSITION.y))),
          }
        : INITIAL_POSITION
      const inventory = parseInventory(saved.inventory)
      return {
        version: 5,
        stats: parseStats(saved.stats),
        position,
        questStage: QUEST_STAGES.includes(saved.questStage as QuestStage)
          ? saved.questStage as QuestStage
          : 'not-started',
        scene: saved.scene === 'crimson-cave' ? 'crimson-cave' : 'overworld' as SceneId,
        inventory,
        equipment: parseEquipment(saved.equipment, inventory),
        worldFlags: parseWorldFlags(saved.worldFlags),
        pet: parsePet(saved.pet),
      }
    }
    if (legacyRaw) {
      const stats = parseStats(JSON.parse(legacyRaw))
      return {
        ...INITIAL_SAVE,
        stats,
        questStage: stats.questProgress >= QUEST_TARGET
          ? 'boss-ready'
          : stats.questProgress > 0
            ? 'hunting'
            : 'not-started',
      }
    }
  } catch {
    return INITIAL_SAVE
  }
  return INITIAL_SAVE
}

export function questNotice(stage: QuestStage, progress: number) {
  if (stage === 'not-started') return '去找云游师父领取城外试炼'
  if (stage === 'hunting') return `在野外击退小妖：${progress}/${QUEST_TARGET}`
  if (stage === 'boss-ready') return '东北方的赤焰洞窟已经开启，进入洞窟挑战妖王'
  if (stage === 'returning') return '妖王已败，回去找云游师父复命'
  return '新手章节已完成，可继续在长安境内历练'
}

export function buyPotion(stats: HeroStats) {
  if (stats.gold < POTION_PRICE) return { stats, message: `银两不足，一枚金创药需要 ${POTION_PRICE} 两。`, success: false }
  return {
    stats: { ...stats, gold: stats.gold - POTION_PRICE, potions: stats.potions + 1 },
    message: '购买成功：获得 1 枚金创药。',
    success: true,
  }
}

export function rest(stats: HeroStats) {
  if (stats.hp === stats.maxHp && stats.mp === stats.maxMp) return { stats, message: '你现在精神饱满，无需休息。', success: false }
  if (stats.gold < REST_PRICE) return { stats, message: `银两不足，调息需要 ${REST_PRICE} 两。`, success: false }
  return {
    stats: { ...stats, gold: stats.gold - REST_PRICE, hp: stats.maxHp, mp: stats.maxMp },
    message: '调息完成，气血与法力已恢复。',
    success: true,
  }
}
