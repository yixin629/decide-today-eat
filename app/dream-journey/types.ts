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
}

export interface Enemy {
  name: string
  icon: string
  hp: number
  maxHp: number
  attack: number
  exp: number
  gold: number
}

export interface BattleState {
  enemy: Enemy
  log: string[]
  guarding: boolean
}

export type BattleAction = 'attack' | 'skill' | 'guard' | 'potion'

export interface NpcDefinition extends Point {
  id: string
  name: string
  icon: string
  title: string
  dialogue: string
}
