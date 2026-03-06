'use client'

import React from 'react'
import TileComponent from './Tile'
import { Player, Tile, Meld } from '../engine/MahjongLogic'

interface PlayerHandProps {
  player: Player
  position: 'bottom' | 'top' | 'left' | 'right'
  isCurrentTurn: boolean
  onTileClick?: (tile: Tile, index: number) => void
  selectedTileIndex?: number | null
}

export default function PlayerHand({
  player,
  position,
  isCurrentTurn,
  onTileClick,
  selectedTileIndex
}: PlayerHandProps) {

  // For non-bottom players, their hand is typically hidden unless revealed at the end
  const isSelf = position === 'bottom'
  const isHiddenState = !isSelf && player.status !== 'hu'

  // Styles based on position
  const wrapperClass = {
    bottom: 'flex flex-col items-center justify-end w-full',
    top: 'flex flex-col items-center justify-start w-full transform rotate-180',
    left: 'flex flex-row items-center justify-start h-full transform origin-left rotate-90 translate-x-[400px]',
    right: 'flex flex-row items-center justify-end h-full transform origin-right -rotate-90 -translate-x-[400px]',
  }[position]

  return (
    <div className={`relative ${wrapperClass} p-4`}>
      {/* Player Info (Name, Avatar, Status) */}
      <div className={`
        flex items-center gap-2 mb-2 bg-black/50 text-white px-3 py-1 rounded-full
        ${isCurrentTurn ? 'ring-2 ring-yellow-400' : ''}
      `}>
        <span className="text-xl">{player.avatar}</span>
        <span className="text-xs font-bold max-w-[80px] truncate">{player.name}</span>
        {player.status === 'hu' && <span className="text-xs bg-red-500 px-1 rounded">胡</span>}
      </div>

      {/* Melds Area */}
      {player.melds.length > 0 && (
        <div className="flex gap-4 mb-2">
          {player.melds.map((meld, mIdx) => (
            <div key={mIdx} className="flex gap-0.5">
              {meld.tiles.map((t, tIdx) => (
                <TileComponent 
                  key={`meld-${mIdx}-${tIdx}-${t.id}`} 
                  tile={t} 
                  size={isSelf ? 'md' : 'sm'} 
                />
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Hand Area */}
      <div className="flex gap-0.5 relative">
        {player.hand.map((tile, i) => (
          <div key={`hand-${i}-${tile.id}`}>
             {isSelf ? (
               <TileComponent 
                 tile={tile}
                 size="lg"
                 isSelected={selectedTileIndex === i}
                 onClick={() => onTileClick && onTileClick(tile, i)}
                 className="mx-[1px]"
               />
             ) : (
               <div className="w-6 h-10 bg-green-700 rounded-sm border border-green-800 shadow-md transform rotate-180 -mt-2">
                 {/* Simplified hidden tile representation for other players */}
               </div>
             )}
          </div>
        ))}
      </div>

      {/* Discards Area */}
      <div className={`
        mt-4 grid grid-cols-6 gap-0.5 overflow-hidden max-w-[300px]
      `}>
        {player.discards.map((tile, i) => (
           <TileComponent 
             key={`discard-${i}-${tile.id}`} 
             tile={tile} 
             size="sm" 
           />
        ))}
      </div>
    </div>
  )
}
