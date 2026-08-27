import type { NpcDefinition, Point, PortalDefinition, QuestStage } from '../types'

export const WORLD_SIZE = 2410

export const NPCS: readonly NpcDefinition[] = [
  { id: 'master', name: '云游师父', icon: '🧙', title: '新手指引', dialogue: '少侠，城外近日妖气浮动。', actionLabel: '与师父交谈', x: 1260, y: 1150 },
  { id: 'merchant', name: '药铺掌柜', icon: '👨‍⚕️', title: '药铺', dialogue: '出门在外，记得带上金创药。', actionLabel: '打开药铺', x: 965, y: 1350 },
  { id: 'fairy', name: '月宫仙子', icon: '🧚', title: '传闻', dialogue: '水榭东边常有花妖出没，战胜它们能得到不少修为。', actionLabel: '听听传闻', x: 1530, y: 920 },
]

export const BOSS: NpcDefinition = {
  id: 'cave-gate',
  name: '赤焰洞窟',
  icon: '🌀',
  title: '妖王巢穴',
  dialogue: '灼热妖气从洞口涌出，赤焰妖王就在深处。',
  actionLabel: '进入赤焰洞窟',
  x: 2050,
  y: 700,
}

export const PORTALS: readonly PortalDefinition[] = [
  { id: 'north-grove', name: '翠林仙径', x: 550, y: 85, destination: { x: 115, y: 2180 }, destinationName: '南海沙洲' },
  { id: 'south-shore', name: '南海归途', x: 50, y: 2280, destination: { x: 550, y: 175 }, destinationName: '翠林秘境' },
  { id: 'west-grove', name: '西林驿站', x: 55, y: 665, destination: { x: 1940, y: 2135 }, destinationName: '东海码头' },
  { id: 'east-dock', name: '东海渡口', x: 2035, y: 2215, destination: { x: 140, y: 665 }, destinationName: '西林驿站' },
]

export function getWorldEntities(stage: QuestStage): readonly NpcDefinition[] {
  return stage === 'boss-ready' ? [...NPCS, BOSS] : NPCS
}

export function getSceneName(point: Point) {
  if (point.y > 1900 && point.x < 800) return '南海沙洲'
  if (point.y > 1850 && point.x > 1650) return '东海码头'
  if (point.x < 680 && point.y < 1000) return '翠林秘境'
  return '长安郊野'
}

export function getQuestTarget(stage: QuestStage): NpcDefinition | null {
  if (stage === 'not-started' || stage === 'returning') return NPCS[0]
  if (stage === 'boss-ready') return BOSS
  return null
}

interface CollisionRect {
  x: number
  y: number
  width: number
  height: number
}

// 以角色脚下坐标为准的基础障碍区，保留桥梁、石阶和沙滩通道。
const COLLISION_RECTS: readonly CollisionRect[] = [
  { x: 755, y: 0, width: 265, height: 505 },
  { x: 875, y: 500, width: 285, height: 285 },
  { x: 1450, y: 0, width: 430, height: 355 },
  { x: 1690, y: 375, width: 315, height: 300 },
  { x: 1475, y: 685, width: 245, height: 315 },
  { x: 500, y: 855, width: 215, height: 310 },
  { x: 1390, y: 1320, width: 330, height: 310 },
  { x: 960, y: 1990, width: 560, height: 255 },
]

export function isBlocked(point: Point) {
  const radius = 16
  return COLLISION_RECTS.some((rect) => (
    point.x + radius > rect.x
    && point.x - radius < rect.x + rect.width
    && point.y + radius > rect.y
    && point.y - radius < rect.y + rect.height
  ))
}
