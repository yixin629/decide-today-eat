'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Direction, NpcDefinition, Point, QuestStage } from '../types'
import { BOSS, NPCS, WORLD_SIZE, isBlocked } from '../engine/world'

const FRAME_COUNT = 8
const SPEED = 190
const ASSET_ROOT = '/games/dream-journey'

interface GameCanvasProps {
  paused: boolean
  initialPosition: Point
  questStage: QuestStage
  onEncounter: () => void
  onNpcChange: (npc: NpcDefinition | null) => void
  onPositionChange: (position: Point) => void
}

function directionFrom(dx: number, dy: number): Direction {
  const angle = Math.atan2(dy, dx)
  const octant = Math.round((angle / (Math.PI / 4) + 8)) % 8
  return ([2, 3, 4, 5, 6, 7, 0, 1] as const)[octant]
}

export default function GameCanvas({
  paused,
  initialPosition,
  questStage,
  onEncounter,
  onNpcChange,
  onPositionChange,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const positionRef = useRef<Point>({ ...initialPosition })
  const targetRef = useRef<Point>({ ...initialPosition })
  const keysRef = useRef(new Set<string>())
  const distanceRef = useRef(0)
  const encounterCooldownRef = useRef(0)
  const nearbyIdRef = useRef<string | null>(null)
  const pausedRef = useRef(paused)
  const questStageRef = useRef(questStage)
  const onEncounterRef = useRef(onEncounter)
  const onNpcChangeRef = useRef(onNpcChange)
  const onPositionChangeRef = useRef(onPositionChange)
  const [ready, setReady] = useState(false)

  useEffect(() => { pausedRef.current = paused }, [paused])
  useEffect(() => { questStageRef.current = questStage }, [questStage])
  useEffect(() => { onEncounterRef.current = onEncounter }, [onEncounter])
  useEffect(() => { onNpcChangeRef.current = onNpcChange }, [onNpcChange])
  useEffect(() => { onPositionChangeRef.current = onPositionChange }, [onPositionChange])

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

  const setControlKey = (key: string, active: boolean) => {
    if (active) keysRef.current.add(key)
    else keysRef.current.delete(key)
  }

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
    const persistedPosition = positionRef.current

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

    let requestId = 0
    let previous = performance.now()
    let elapsed = 0
    let direction: Direction = 4
    let cancelled = false
    let lastPositionReport = 0

    const render = (now: number) => {
      if (cancelled) return
      const delta = Math.max(0, Math.min(0.04, (now - previous) / 1000))
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

      const wantsToMove = !pausedRef.current && (dx !== 0 || dy !== 0)
      let moved = false
      if (wantsToMove) {
        direction = directionFrom(dx, dy)
        const step = SPEED * delta
        const nextX = { x: Math.max(20, Math.min(WORLD_SIZE - 20, position.x + dx * step)), y: position.y }
        if (!isBlocked(nextX)) {
          position.x = nextX.x
          moved = true
        }
        const nextY = { x: position.x, y: Math.max(45, Math.min(WORLD_SIZE - 20, position.y + dy * step)) }
        if (!isBlocked(nextY)) {
          position.y = nextY.y
          moved = true
        }
        if (!moved) targetRef.current = { ...position }
      }

      if (moved) {
        const step = SPEED * delta
        distanceRef.current += step
        encounterCooldownRef.current = Math.max(0, encounterCooldownRef.current - step)
        if (now - lastPositionReport > 700) {
          lastPositionReport = now
          onPositionChangeRef.current({ ...position })
        }
        if (distanceRef.current > 760 && encounterCooldownRef.current === 0 && Math.random() < 0.012) {
          distanceRef.current = 0
          encounterCooldownRef.current = 500
          onEncounterRef.current()
        }
      }

      elapsed += delta
      const animationFrame = Math.floor(elapsed * (moved ? 9 : 5)) % FRAME_COUNT
      const cameraX = Math.max(0, Math.min(WORLD_SIZE - canvas.width, position.x - canvas.width / 2))
      const cameraY = Math.max(0, Math.min(WORLD_SIZE - canvas.height, position.y - canvas.height / 2))
      context.clearRect(0, 0, canvas.width, canvas.height)
      if (background.complete) context.drawImage(background, -cameraX, -cameraY)

      const entities = questStageRef.current === 'boss-ready' ? [...NPCS, BOSS] : NPCS
      let nearest: NpcDefinition | null = null
      for (const entity of entities) {
        const screenX = entity.x - cameraX
        const screenY = entity.y - cameraY
        const near = Math.hypot(entity.x - position.x, entity.y - position.y) < 105
        const objective = (
          (entity.id === 'master' && ['not-started', 'returning'].includes(questStageRef.current))
          || (entity.id === 'boss' && questStageRef.current === 'boss-ready')
        )
        if (near) nearest = entity
        if (objective) {
          context.beginPath()
          context.arc(screenX, screenY - 18, 35 + Math.sin(elapsed * 4) * 4, 0, Math.PI * 2)
          context.strokeStyle = '#fde047'
          context.lineWidth = 3
          context.stroke()
        }
        context.font = entity.id === 'boss' ? '54px sans-serif' : '42px sans-serif'
        context.textAlign = 'center'
        context.fillText(entity.icon, screenX, screenY)
        context.fillStyle = near || objective ? '#fef08a' : '#fff'
        context.font = 'bold 14px sans-serif'
        context.strokeStyle = 'rgba(15, 23, 42, .85)'
        context.lineWidth = 4
        context.strokeText(entity.name, screenX, screenY - 42)
        context.fillText(entity.name, screenX, screenY - 42)
      }
      const nearestId = nearest?.id ?? null
      if (nearestId !== nearbyIdRef.current) {
        nearbyIdRef.current = nearestId
        onNpcChangeRef.current(nearest)
      }

      const sprite = frames[moved ? 'run' : 'stand'][direction]?.[animationFrame]
      if (sprite?.complete) {
        const screenX = position.x - cameraX
        const screenY = position.y - cameraY
        context.drawImage(sprite, screenX - sprite.width / 2, screenY - sprite.height + 20)
      }
      requestId = requestAnimationFrame(render)
    }

    background.onload = () => setReady(true)
    requestId = requestAnimationFrame(render)
    return () => {
      cancelled = true
      onPositionChangeRef.current({ ...persistedPosition })
      cancelAnimationFrame(requestId)
    }
  }, [])

  const directionButton = (label: string, key: string, className: string) => (
    <button
      type="button"
      aria-label={label}
      className={`pointer-events-auto grid h-11 w-11 select-none place-items-center rounded-xl border border-white/30 bg-slate-950/75 text-lg font-black text-white shadow-lg backdrop-blur active:bg-amber-400 active:text-slate-950 ${className}`}
      onPointerDown={(event) => { event.preventDefault(); setControlKey(key, true) }}
      onPointerUp={() => setControlKey(key, false)}
      onPointerCancel={() => setControlKey(key, false)}
      onPointerLeave={() => setControlKey(key, false)}
    >
      {label}
    </button>
  )

  return (
    <div className="relative overflow-hidden rounded-2xl border-4 border-amber-200/80 bg-slate-900 shadow-2xl">
      <canvas
        ref={canvasRef}
        width={900}
        height={560}
        className="block aspect-[9/5.6] w-full touch-none cursor-crosshair"
        onPointerDown={(event) => setTargetFromPointer(event.clientX, event.clientY)}
        aria-label="梦境长安游戏地图，使用方向键、WASD、虚拟方向键或点击地图移动"
      />
      {!ready && <div className="absolute inset-0 grid place-items-center bg-slate-950 text-amber-100">正在进入梦境长安…</div>}
      <div className="pointer-events-none absolute left-3 top-3 rounded-full bg-slate-950/70 px-3 py-1 text-xs text-white backdrop-blur">WASD / 方向键 / 点击移动</div>
      <div className="pointer-events-none absolute bottom-3 right-3 grid grid-cols-3 gap-1 md:hidden">
        {directionButton('↑', 'w', 'col-start-2')}
        {directionButton('←', 'a', 'col-start-1 row-start-2')}
        {directionButton('↓', 's', 'col-start-2 row-start-2')}
        {directionButton('→', 'd', 'col-start-3 row-start-2')}
      </div>
    </div>
  )
}
