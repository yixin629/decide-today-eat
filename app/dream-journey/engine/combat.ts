import type { BattleAction, BattleState, Enemy, HeroStats } from '../types'

const ENEMIES: Omit<Enemy, 'hp' | 'maxHp'>[] = [
  { name: '泡泡精', icon: '🫧', attack: 8, exp: 18, gold: 12 },
  { name: '花妖', icon: '🌺', attack: 10, exp: 22, gold: 15 },
  { name: '巡山小妖', icon: '👹', attack: 12, exp: 28, gold: 20 },
]

export const INITIAL_STATS: HeroStats = {
  level: 1,
  hp: 100,
  maxHp: 100,
  mp: 45,
  maxMp: 45,
  exp: 0,
  gold: 36,
  potions: 3,
  questProgress: 0,
}

export function createBattle(level: number): BattleState {
  const template = ENEMIES[Math.floor(Math.random() * ENEMIES.length)]
  const maxHp = 42 + level * 11 + Math.floor(Math.random() * 12)

  return {
    enemy: { ...template, hp: maxHp, maxHp, attack: template.attack + level * 2 },
    log: [`野外突然跳出一只${template.name}！`],
    guarding: false,
  }
}

function levelUp(stats: HeroStats) {
  const needed = stats.level * 60
  if (stats.exp < needed) return stats

  const maxHp = stats.maxHp + 18
  const maxMp = stats.maxMp + 8
  return {
    ...stats,
    level: stats.level + 1,
    exp: stats.exp - needed,
    maxHp,
    hp: maxHp,
    maxMp,
    mp: maxMp,
  }
}

export function resolveRound(
  stats: HeroStats,
  battle: BattleState,
  action: BattleAction,
): { stats: HeroStats; battle: BattleState | null; result?: 'victory' | 'defeat' } {
  let nextStats = { ...stats }
  const enemy = { ...battle.enemy }
  const log: string[] = []
  let guarding = false

  if (action === 'potion') {
    if (nextStats.potions <= 0) return { stats, battle: { ...battle, log: ['包里已经没有金创药了。', ...battle.log] } }
    const healed = Math.min(42, nextStats.maxHp - nextStats.hp)
    nextStats = { ...nextStats, hp: nextStats.hp + healed, potions: nextStats.potions - 1 }
    log.push(`你服下金创药，恢复 ${healed} 点气血。`)
  } else if (action === 'guard') {
    guarding = true
    log.push('你凝神架势，本回合受到的伤害减半。')
  } else {
    const skill = action === 'skill'
    if (skill && nextStats.mp < 12) {
      return { stats, battle: { ...battle, log: ['法力不足，无法施展横扫千星。', ...battle.log] } }
    }
    const damage = skill
      ? 22 + nextStats.level * 7 + Math.floor(Math.random() * 9)
      : 11 + nextStats.level * 4 + Math.floor(Math.random() * 7)
    enemy.hp = Math.max(0, enemy.hp - damage)
    nextStats.mp -= skill ? 12 : 0
    log.push(`${skill ? '横扫千星' : '普通攻击'}造成 ${damage} 点伤害。`)
  }

  if (enemy.hp <= 0) {
    nextStats = levelUp({
      ...nextStats,
      exp: nextStats.exp + enemy.exp,
      gold: nextStats.gold + enemy.gold,
      questProgress: Math.min(3, nextStats.questProgress + 1),
    })
    return { stats: nextStats, battle: null, result: 'victory' }
  }

  const rawDamage = enemy.attack + Math.floor(Math.random() * 7)
  const damage = guarding ? Math.ceil(rawDamage / 2) : rawDamage
  nextStats.hp = Math.max(0, nextStats.hp - damage)
  log.push(`${enemy.name}反击，造成 ${damage} 点伤害。`)

  if (nextStats.hp <= 0) {
    nextStats = { ...nextStats, hp: nextStats.maxHp, mp: nextStats.maxMp, gold: Math.max(0, nextStats.gold - 10) }
    return { stats: nextStats, battle: null, result: 'defeat' }
  }

  return { stats: nextStats, battle: { enemy, guarding: false, log: [...log, ...battle.log].slice(0, 5) } }
}
