import Image from 'next/image'

export type AtlasQuadrant = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
export type AtlasName = 'monsters' | 'items' | 'effects' | 'heroes'

interface AtlasSpriteProps {
  atlas: AtlasName
  quadrant: AtlasQuadrant
  alt: string
  className?: string
  imageClassName?: string
}

const ATLAS_PATHS: Record<AtlasName, string> = {
  monsters: '/games/dream-journey/battle/monsters-atlas-v1.png',
  items: '/games/dream-journey/battle/items-atlas-v1.png',
  effects: '/games/dream-journey/battle/effects-atlas-v1.png',
  heroes: '/games/dream-journey/battle/hero-combat-atlas-v1.png',
}

const POSITIONS: Record<AtlasQuadrant, string> = {
  'top-left': 'left-0 top-0',
  'top-right': '-left-full top-0',
  'bottom-left': 'left-0 -top-full',
  'bottom-right': '-left-full -top-full',
}

export default function AtlasSprite({ atlas, quadrant, alt, className = '', imageClassName = '' }: AtlasSpriteProps) {
  const positionedAbsolutely = className.split(/\s+/).includes('absolute')
  return (
    <span
      className={`block overflow-hidden ${className}`}
      style={{ position: positionedAbsolutely ? 'absolute' : 'relative' }}
      role={alt ? 'img' : undefined}
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true}
    >
      <Image
        src={ATLAS_PATHS[atlas]}
        alt=""
        width={1240}
        height={1240}
        sizes="256px"
        className={`pointer-events-none absolute h-[200%] w-[200%] max-w-none object-fill ${POSITIONS[quadrant]} ${imageClassName}`}
        unoptimized
      />
    </span>
  )
}

export function monsterQuadrant(name: string): AtlasQuadrant {
  if (name === '泡泡精') return 'top-left'
  if (name === '花妖') return 'top-right'
  if (name === '巡山小妖') return 'bottom-left'
  return 'bottom-right'
}

export function itemQuadrant(itemId: string): AtlasQuadrant {
  if (itemId === 'traveler-sword') return 'top-left'
  if (itemId === 'cloud-robe') return 'top-right'
  if (itemId === 'crimson-charm') return 'bottom-left'
  return 'bottom-right'
}

export function heroQuadrant(phase: 'idle' | 'attack' | 'cast' | 'hurt'): AtlasQuadrant {
  if (phase === 'attack') return 'top-right'
  if (phase === 'cast') return 'bottom-left'
  if (phase === 'hurt') return 'bottom-right'
  return 'top-left'
}
