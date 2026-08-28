export type Direction = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7

export interface Point {
  x: number
  y: number
}

export interface HeroStats {
  level: number
  hp: number
  maxHp: number
  mp: number
  maxMp: number
  exp: number
  gold: number
  potions: number
  questProgress: number
  attack: number
  defense: number
  crit: number
}

export type SceneId = 'overworld' | 'crimson-cave'
export type EquipmentSlot = 'weapon' | 'armor' | 'accessory'
export type ItemId = 'traveler-sword' | 'cloud-robe' | 'crimson-charm'
export type InventoryState = Record<ItemId, number>
export type EquipmentState = Record<EquipmentSlot, ItemId | null>

export interface WorldFlags {
  caveChestOpened: boolean
}

export type QuestStage = 'not-started' | 'hunting' | 'boss-ready' | 'returning' | 'completed'

export interface GameSave {
  version: 4
  stats: HeroStats
  position: Point
  questStage: QuestStage
  scene: SceneId
  inventory: InventoryState
  equipment: EquipmentState
  worldFlags: WorldFlags
}

export interface Enemy {
  kind: 'mob' | 'boss'
  name: string
  icon: string
  hp: number
  maxHp: number
  attack: number
  exp: number
  gold: number
}

export interface BattleCompanion {
  name: string
  model: '泡泡精'
  attack: number
}

export interface CompanionAttack {
  targetIndex: number
  damage: number
}

export interface BattleState {
  enemy: Enemy
  reinforcements: Enemy[]
  companion: BattleCompanion
  lastCompanionAttack: CompanionAttack | null
  log: string[]
  guarding: boolean
  turn: number
  intent: EnemyIntent
  enraged: boolean
}

export type EnemyIntent = 'strike' | 'inferno' | 'roar'

export interface BattleResult {
  outcome: 'victory' | 'defeat'
  enemyName: string
  enemyIcon: string
  enemyKind: Enemy['kind']
  expGained: number
  goldChange: number
  leveledUp: boolean
  message: string
}

export type BattleAction = 'attack' | 'skill' | 'heal' | 'guard' | 'potion'

export interface NpcDefinition extends Point {
  id: string
  name: string
  icon: string
  title: string
  dialogue: string
  actionLabel?: string
}

export interface PortalDefinition extends Point {
  id: string
  name: string
  destination: Point
  destinationName: string
}
