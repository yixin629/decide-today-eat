import type { BattleAction, BattleState, Enemy, EnemyIntent, HeroStats } from '../types'

const ENEMIES: Omit<Enemy, 'hp' | 'maxHp'>[] = [
  { kind: 'mob', name: '泡泡精', icon: '🫧', attack: 8, exp: 18, gold: 12 },
  { kind: 'mob', name: '花妖', icon: '🌺', attack: 10, exp: 22, gold: 15 },
  { kind: 'mob', name: '巡山小妖', icon: '👹', attack: 12, exp: 28, gold: 20 },
]

const BOSS: Omit<Enemy, 'hp' | 'maxHp'> = {
  kind: 'boss',
  name: '赤焰妖王',
  icon: '👺',
  attack: 16,
  exp: 90,
  gold: 68,
}

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
  attack: 6,
  defense: 2,
  crit: 5,
}

export function createBattle(level: number, kind: Enemy['kind'] = 'mob'): BattleState {
  const template = kind === 'boss' ? BOSS : ENEMIES[Math.floor(Math.random() * ENEMIES.length)]
  const maxHp = kind === 'boss'
    ? 145 + level * 24
    : 42 + level * 11 + Math.floor(Math.random() * 12)

  return {
    enemy: {
      ...template,
      hp: maxHp,
      maxHp,
      attack: template.attack + level * (kind === 'boss' ? 3 : 2),
    },
    reinforcements: kind === 'boss'
      ? [
          { ...ENEMIES[2], name: '巡山小妖', hp: 36 + level * 7, maxHp: 36 + level * 7, attack: 4 + level, exp: 0, gold: 0 },
          { ...ENEMIES[1], name: '花妖', hp: 30 + level * 6, maxHp: 30 + level * 6, attack: 3 + level, exp: 0, gold: 0 },
        ]
      : [],
    companion: { name: '泡泡灵宠', model: '泡泡精', attack: 6 + level * 2 },
    lastCompanionAttack: null,
    log: [kind === 'boss' ? `妖气冲天，${template.name}率领两名护卫降临！点击敌人可切换目标。` : `野外突然跳出一只${template.name}！`],
    guarding: false,
    turn: 1,
    intent: 'strike',
    enraged: false,
  }
}

export const INTENT_LABELS: Record<EnemyIntent, { name: string; description: string; icon: string }> = {
  strike: { name: '妖爪突袭', description: '普通单体攻击', icon: '⚔️' },
  inferno: { name: '焚天重击', description: '高额伤害，建议防御', icon: '🔥' },
  roar: { name: '摄魂咆哮', description: '造成伤害并削减法力', icon: '🌋' },
}

function nextIntent(turn: number, enraged: boolean): EnemyIntent {
  if (enraged && turn % 2 === 0) return 'inferno'
  if (turn % 3 === 0) return 'inferno'
  if (turn % 2 === 0) return 'roar'
  return 'strike'
}

function levelUp(stats: HeroStats) {
  let next = { ...stats }
  while (next.exp >= next.level * 60) {
    const needed = next.level * 60
    const maxHp = next.maxHp + 18
    const maxMp = next.maxMp + 8
    next = {
      ...next,
      level: next.level + 1,
      exp: next.exp - needed,
      maxHp,
      hp: maxHp,
      maxMp,
      mp: maxMp,
    }
  }
  return next
}

export function resolveRound(
  stats: HeroStats,
  battle: BattleState,
  action: BattleAction,
  bonuses = { attack: 0, defense: 0, crit: 0 },
  targetIndex = 0,
): { stats: HeroStats; battle: BattleState | null; result?: 'victory' | 'defeat' } {
  let nextStats = { ...stats }
  const enemy = { ...battle.enemy }
  const reinforcements = battle.reinforcements.map((unit) => ({ ...unit }))
  const enemies = [enemy, ...reinforcements]
  const companion = { ...battle.companion }
  const log: string[] = []
  let guarding = false

  if (action === 'potion') {
    if (nextStats.potions <= 0) return { stats, battle: { ...battle, log: ['包里已经没有金创药了。', ...battle.log] } }
    if (nextStats.hp >= nextStats.maxHp) return { stats, battle: { ...battle, log: ['气血已满，无需使用金创药。', ...battle.log] } }
    const healed = Math.min(42, nextStats.maxHp - nextStats.hp)
    nextStats = { ...nextStats, hp: nextStats.hp + healed, potions: nextStats.potions - 1 }
    log.push(`你服下金创药，恢复 ${healed} 点气血。`)
  } else if (action === 'heal') {
    if (nextStats.mp < 10) return { stats, battle: { ...battle, log: ['法力不足，无法施展回春诀。', ...battle.log] } }
    if (nextStats.hp >= nextStats.maxHp) return { stats, battle: { ...battle, log: ['气血已满，无需施展回春诀。', ...battle.log] } }
    const healed = Math.min(26 + nextStats.level * 5, nextStats.maxHp - nextStats.hp)
    nextStats = { ...nextStats, hp: nextStats.hp + healed, mp: nextStats.mp - 10 }
    log.push(`回春诀恢复 ${healed} 点气血。`)
  } else if (action === 'guard') {
    guarding = true
    log.push('你凝神架势，本回合受到的伤害减半。')
  } else {
    const skill = action === 'skill'
    if (skill && nextStats.mp < 12) {
      return { stats, battle: { ...battle, log: ['法力不足，无法施展横扫千星。', ...battle.log] } }
    }
    const critical = Math.random() * 100 < nextStats.crit + bonuses.crit
    const baseDamage = skill
      ? 18 + nextStats.level * 7 + Math.floor(Math.random() * 9)
      : 8 + nextStats.level * 4 + Math.floor(Math.random() * 7)
    const damage = Math.round((baseDamage + nextStats.attack + bonuses.attack) * (critical ? 1.6 : 1))
    nextStats.mp -= skill ? 12 : 0
    if (skill) {
      let totalDamage = 0
      let targetsHit = 0
      enemies.forEach((target, index) => {
        if (target.hp <= 0) return
        const targetDamage = index === targetIndex ? damage : Math.max(1, Math.round(damage * 0.7))
        target.hp = Math.max(0, target.hp - targetDamage)
        totalDamage += targetDamage
        targetsHit += 1
      })
      log.push(`横扫千星席卷 ${targetsHit} 个目标，造成 ${totalDamage} 点伤害${critical ? '（暴击）' : ''}。`)
    } else {
      const fallbackIndex = enemies.findIndex((target) => target.hp > 0)
      const resolvedTargetIndex = enemies[targetIndex]?.hp > 0 ? targetIndex : fallbackIndex
      const target = enemies[resolvedTargetIndex]
      target.hp = Math.max(0, target.hp - damage)
      log.push(`普通攻击命中${target.name}，造成 ${damage} 点伤害${critical ? '（暴击）' : ''}。`)
    }
  }

  let lastCompanionAttack: BattleState['lastCompanionAttack'] = null
  const companionTargetIndex = enemies[targetIndex]?.hp > 0
    ? targetIndex
    : enemies.findIndex((target) => target.hp > 0)
  if (companionTargetIndex >= 0) {
    const target = enemies[companionTargetIndex]
    const companionDamage = companion.attack + Math.floor(Math.random() * 5)
    const previousHp = target.hp
    target.hp = Math.max(0, target.hp - companionDamage)
    lastCompanionAttack = { targetIndex: companionTargetIndex, damage: previousHp - target.hp }
    log.push(`${companion.name}施展灵泡追击，对${target.name}造成 ${lastCompanionAttack.damage} 点伤害。`)
  }

  if (enemies.every((target) => target.hp <= 0)) {
    nextStats = levelUp({
      ...nextStats,
      exp: nextStats.exp + enemy.exp,
      gold: nextStats.gold + enemy.gold,
    })
    return { stats: nextStats, battle: null, result: 'victory' }
  }

  const enraged = battle.enraged || (enemy.kind === 'boss' && enemy.hp > 0 && enemy.hp <= enemy.maxHp / 2)
  if (enraged && !battle.enraged) log.push(`${enemy.name}进入狂暴阶段，焚天重击将更加频繁！`)

  let totalIncomingDamage = 0
  if (enemy.hp > 0) {
    let rawDamage = enemy.attack + Math.floor(Math.random() * 7)
    let ignoresDefense = false
    if (enemy.kind === 'boss' && battle.intent === 'inferno') {
      rawDamage = Math.round(enemy.attack * (enraged ? 1.85 : 1.6)) + Math.floor(Math.random() * 6)
      log.push(`${enemy.name}释放焚天重击！`)
    } else if (enemy.kind === 'boss' && battle.intent === 'roar') {
      rawDamage = Math.round(enemy.attack * 0.8) + Math.floor(Math.random() * 5)
      const drained = Math.min(8, nextStats.mp)
      nextStats.mp -= drained
      ignoresDefense = true
      log.push(`${enemy.name}发出摄魂咆哮，震散 ${drained} 点法力！`)
    }
    const reducedDamage = Math.max(1, rawDamage - (ignoresDefense ? 0 : nextStats.defense + bonuses.defense))
    totalIncomingDamage += guarding ? Math.ceil(reducedDamage / 2) : reducedDamage
  }
  reinforcements.forEach((unit) => {
    if (unit.hp <= 0) return
    const reducedDamage = Math.max(1, unit.attack + Math.floor(Math.random() * 4) - nextStats.defense - bonuses.defense)
    totalIncomingDamage += guarding ? Math.ceil(reducedDamage / 2) : reducedDamage
  })
  nextStats.hp = Math.max(0, nextStats.hp - totalIncomingDamage)
  const attackers = enemies.filter((target) => target.hp > 0).length
  log.push(`${attackers} 名敌人联手反击，造成 ${totalIncomingDamage} 点伤害。`)

  if (nextStats.hp <= 0) {
    nextStats = { ...nextStats, hp: nextStats.maxHp, mp: nextStats.maxMp, gold: Math.max(0, nextStats.gold - 10) }
    return { stats: nextStats, battle: null, result: 'defeat' }
  }

  const turn = battle.turn + 1
  return {
    stats: nextStats,
    battle: {
      enemy,
      reinforcements,
      companion,
      lastCompanionAttack,
      guarding: false,
      turn,
      intent: enemy.kind === 'boss' ? nextIntent(turn, enraged) : 'strike',
      enraged,
      log: [...log, ...battle.log].slice(0, 7),
    },
  }
}
