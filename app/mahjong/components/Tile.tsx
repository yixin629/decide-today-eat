'use client'

import { Tile as TileType } from '../engine/MahjongLogic'

interface TileProps {
  tile?: TileType
  isHidden?: boolean
  isSideways?: boolean   // for discards or melds
  isSelected?: boolean
  onClick?: () => void
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const TILE_MAP: Record<string, string> = {
  // Characters
  'characters-1': '🀇', 'characters-2': '🀈', 'characters-3': '🀉',
  'characters-4': '🀊', 'characters-5': '🀋', 'characters-6': '🀌',
  'characters-7': '🀍', 'characters-8': '🀎', 'characters-9': '🀏',
  // Bamboos
  'bamboo-1': '🀐', 'bamboo-2': '🀑', 'bamboo-3': '🀒',
  'bamboo-4': '🀓', 'bamboo-5': '🀔', 'bamboo-6': '🀕',
  'bamboo-7': '🀖', 'bamboo-8': '🀗', 'bamboo-9': '🀘',
  // Dots
  'dots-1': '🀙', 'dots-2': '🀚', 'dots-3': '🀛',
  'dots-4': '🀜', 'dots-5': '🀝', 'dots-6': '🀞',
  'dots-7': '🀟', 'dots-8': '🀠', 'dots-9': '🀡',
  // Back
  'back': '🀫'
}

export default function Tile({
  tile,
  isHidden = false,
  isSideways = false,
  isSelected = false,
  onClick,
  className = '',
  size = 'md'
}: TileProps) {

  const unicode = isHidden ? TILE_MAP['back'] : (tile ? TILE_MAP[`${tile.suit}-${tile.value}`] : '🀫')
  
  const sizeClasses = {
    sm: 'text-3xl w-8 h-12',
    md: 'text-4xl w-10 h-14',
    lg: 'text-5xl w-12 h-16'
  }
  
  const baseClasses = `
    inline-flex items-center justify-center
    bg-gradient-to-br from-white to-gray-200
    border-b-4 border-r-2 border-l border-t border-gray-400
    rounded shadow-sm
    select-none
    transition-transform
  `
  
  // Custom rotation for sideways (melds) or selection jumping
  let transformClass = ''
  if (isSelected) transformClass = '-translate-y-4 shadow-lg'
  if (isSideways) transformClass += ' rotate-90 ' // Note: might need exact width/height adjustments if fully 90 deg

  // If hidden, render the green back
  if (isHidden) {
    return (
      <div 
        className={`${baseClasses} ${sizeClasses[size]} bg-gradient-to-br from-green-500 to-green-700 border-green-800 text-transparent ${transformClass} ${className}`}
      >
        .
      </div>
    )
  }

  // Use a slight styling distinction between suits so they are readable even if font lacks color
  const colorMap = {
    'characters': 'text-red-600',
    'bamboo': 'text-green-600',
    'dots': 'text-blue-600'
  }
  
  const textColor = tile ? colorMap[tile.suit] : 'text-gray-800'

  return (
    <div 
      onClick={onClick}
      className={`
        ${baseClasses} 
        ${sizeClasses[size]} 
        ${textColor}
        ${onClick ? 'cursor-pointer hover:-translate-y-1' : ''} 
        ${transformClass} 
        ${className}
      `}
      style={{
         // Reset text shadow for a cleaner tile look
         textShadow: 'none',
         lineHeight: 1 // Keep characters centered perfectly
      }}
    >
      <span className="block -mt-1">{unicode}</span>
    </div>
  )
}
