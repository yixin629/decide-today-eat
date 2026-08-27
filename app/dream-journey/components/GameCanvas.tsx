'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Direction, NpcDefinition, Point } from '../types'

const WORLD_SIZE = 2410
const FRAME_COUNT = 8
const SPEED = 190
const ASSET_ROOT = '/games/dream-journey'

const NPCS: NpcDefinition[] = [
  { id: 'master', name: '云游师父', icon: '🧙', title: '新手指引', dialogue: '少侠，城外近日妖气浮动。击退三只小妖，回来便有奖励。', x: 1280, y: 1120 },
  { id: 'merchant', name: '药铺掌柜', icon: '👨‍⚕️', title: '药铺', dialogue: '出门在外，记得带上金创药。愿少侠平安归来。', x: 965, y: 1350 },
  { id: 'fairy', name: '月宫仙子', icon: '🧚', title: '传闻', dialogue: '水榭东边常有花妖出没，战胜它们能得到不少修为。', x: 1530, y: 920 },
]

interface GameCanvasProps {
  paused: boolean
  onEncounter: () => void
  onNpcChange: (npc: NpcDefinition | null) => void
}

function directionFrom(dx: number, dy: number): Direction {
  const angle = Math.atan2(dy, dx)
  const octant = Math.round((angle / (Math.PI / 4) + 8)) % 8
  return ([2, 3, 4, 5, 6, 7, 0, 1] as const)[octant]
}

export default function GameCanvas({ paused, onEncounter, onNpcChange }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const positionRef = useRef<Point>({ x: 1205, y: 1240 })
  const targetRef = useRef<Point>({ x: 1205, y: 1240 })
  const keysRef = useRef(new Set<string>())
  const distanceRef = useRef(0)
  const encounterCooldownRef = useRef(0)
  const [ready, setReady] = useState(false)

  const setTargetFromPointer = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const position = positionRef.current
    const cameraX = Math.max(0, Math.min(WORLD_SIZE - canvas.width, position.x - canvas.width / 2))
    const cameraY = Math.max(0, Math.min(WORLD_SIZE - canvas.height, position.y - canvas.height / 2))
    targetRef.current = {
      x: Math.max(25, Math.min(WORLD_SIZE - 25, cameraX + (clientX - rect.left) * scaleX)),
      y: Math.max(45, Math.min(WORLD_SIZE - 20, cameraY + (clientY - rect.top) * scaleY)),
    }
  }, [])

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(event.key)) {
        event.preventDefault()
        keysRef.current.add(event.key.toLowerCase())
      }
    }
    const up = (event: KeyboardEvent) => keysRef.current.delete(event.key.toLowerCase())
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return

    const background = new Image()
    const frames: Record<'run' | 'stand', HTMLImageElement[][]> = { run: [], stand: [] }
    background.src = `${ASSET_ROOT}/background/bg.jpg`
    for (const state of ['run', 'stand'] as const) {
      frames[state] = Array.from({ length: 8 }, (_, direction) =>
        Array.from({ length: FRAME_COUNT }, (_, frame) => {
          const image = new Image()
          image.src = `${ASSET_ROOT}/jxk/${state}/${direction.toString().padStart(2, '0')}${frame.toString().padStart(3, '0')}.png`
          return image
        }),
      )
    }

    let animationFrame = 0
    let previous = performance.now()
    let elapsed = 0
    let direction: Direction = 4
    let cancelled = false

    const render = (now: number) => {
      if (cancelled) return
      const delta = Math.min(0.04, (now - previous) / 1000)
      previous = now
      const position = positionRef.current
      const keys = keysRef.current
      let dx = Number(keys.has('d') || keys.has('arrowright')) - Number(keys.has('a') || keys.has('arrowleft'))
      let dy = Number(keys.has('s') || keys.has('arrowdown')) - Number(keys.has('w') || keys.has('arrowup'))

      if (!dx && !dy) {
        dx = targetRef.current.x - position.x
        dy = targetRef.current.y - position.y
        const distance = Math.hypot(dx, dy)
        if (distance < 4) dx = dy = 0
        else { dx /= distance; dy /= distance }
      } else {
        const magnitude = Math.hypot(dx, dy)
        dx /= magnitude
        dy /= magnitude
        targetRef.current = { ...position }
      }

      const moving = !paused && (dx !== 0 || dy !== 0)
      if (moving) {
        direction = directionFrom(dx, dy)
        const step = SPEED * delta
        position.x = Math.max(20, Math.min(WORLD_SIZE - 20, position.x + dx * step))
        position.y = Math.max(45, Math.min(WORLD_SIZE - 20, position.y + dy * step))
        distanceRef.current += step
        encounterCooldownRef.current = Math.max(0, encounterCooldownRef.current - step)
        if (distanceRef.current > 760 && encounterCooldownRef.current === 0 && Math.random() < 0.012) {
          distanceRef.current = 0
          encounterCooldownRef.current = 500
          onEncounter()
        }
      }

      elapsed += delta
      animationFrame = Math.floor(elapsed * (moving ? 9 : 5)) % FRAME_COUNT
      const cameraX = Math.max(0, Math.min(WORLD_SIZE - canvas.width, position.x - canvas.width / 2))
      const cameraY = Math.max(0, Math.min(WORLD_SIZE - canvas.height, position.y - canvas.height / 2))
      context.clearRect(0, 0, canvas.width, canvas.height)
      if (background.complete) context.drawImage(background, -cameraX, -cameraY)

      let nearest: NpcDefinition | null = null
      for (const npc of NPCS) {
        const screenX = npc.x - cameraX
        const screenY = npc.y - cameraY
        const near = Math.hypot(npc.x - position.x, npc.y - position.y) < 105
        if (near) nearest = npc
        context.font = '42px sans-serif'
        context.textAlign = 'center'
        context.fillText(npc.icon, screenX, screenY)
        context.fillStyle = near ? '#fef08a' : '#fff'
        context.font = 'bold 14px sans-serif'
        context.strokeStyle = 'rgba(15, 23, 42, .85)'
        context.lineWidth = 4
        context.strokeText(npc.name, screenX, screenY - 42)
        context.fillText(npc.name, screenX, screenY - 42)
      }
      onNpcChange(nearest)

      const sprite = frames[moving ? 'run' : 'stand'][direction][animationFrame]
      if (sprite.complete) {
        const screenX = position.x - cameraX
        const screenY = position.y - cameraY
        context.drawImage(sprite, screenX - sprite.width / 2, screenY - sprite.height + 20)
      }
      animationFrame = requestAnimationFrame(render)
    }

    background.onload = () => setReady(true)
    animationFrame = requestAnimationFrame(render)
    return () => {
      cancelled = true
      cancelAnimationFrame(animationFrame)
    }
  }, [onEncounter, onNpcChange, paused])

  return (
    <div className="relative overflow-hidden rounded-2xl border-4 border-amber-200/80 bg-slate-900 shadow-2xl">
      <canvas
        ref={canvasRef}
        width={900}
        height={560}
        className="block aspect-[9/5.6] w-full touch-none cursor-crosshair"
        onPointerDown={(event) => setTargetFromPointer(event.clientX, event.clientY)}
        aria-label="梦境长安游戏地图，使用方向键、WASD 或点击地图移动"
      />
      {!ready && <div className="absolute inset-0 grid place-items-center bg-slate-950 text-amber-100">正在进入梦境长安…</div>}
      <div className="pointer-events-none absolute left-3 top-3 rounded-full bg-slate-950/70 px-3 py-1 text-xs text-white backdrop-blur">WASD / 方向键 / 点击移动</div>
    </div>
  )
}
