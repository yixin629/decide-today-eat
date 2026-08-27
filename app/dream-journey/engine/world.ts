import type { NpcDefinition, Point } from '../types'

export const WORLD_SIZE = 2410

export const NPCS: readonly NpcDefinition[] = [
  { id: 'master', name: '云游师父', icon: '🧙', title: '新手指引', dialogue: '少侠，城外近日妖气浮动。', actionLabel: '与师父交谈', x: 1280, y: 1120 },
  { id: 'merchant', name: '药铺掌柜', icon: '👨‍⚕️', title: '药铺', dialogue: '出门在外，记得带上金创药。', actionLabel: '打开药铺', x: 965, y: 1350 },
  { id: 'fairy', name: '月宫仙子', icon: '🧚', title: '传闻', dialogue: '水榭东边常有花妖出没，战胜它们能得到不少修为。', actionLabel: '听听传闻', x: 1530, y: 920 },
]

export const BOSS: NpcDefinition = {
  id: 'boss',
  name: '赤焰妖王',
  icon: '👺',
  title: '试炼首领',
  dialogue: '妖气冲天，赤焰妖王正等着你的挑战。',
  actionLabel: '挑战赤焰妖王',
  x: 2050,
  y: 700,
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
