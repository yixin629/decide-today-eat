'use client'

import React from 'react'
import TileComponent from './Tile'
import { Player, Tile } from '../engine/MahjongLogic'

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
  selectedTileIndex,
}: PlayerHandProps) {
  const isSelf = position === 'bottom'

  // ---------- Self (bottom) ----------
  if (isSelf) {
    return (
      <div className="flex flex-col items-center w-full">
        {/* Player badge */}
        <div className={`
          flex items-center gap-2 mb-3 px-4 py-1.5 rounded-full
          ${isCurrentTurn
            ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black shadow-lg shadow-amber-500/30'
            : 'bg-black/50 text-white/80'}
        `}>
          <span className="text-lg">{player.avatar}</span>
          <span className="text-sm font-bold">{player.name}</span>
          {player.status === 'hu' && (
            <span className="text-xs bg-red-600 text-white px-1.5 py-0.5 rounded font-bold">胡</span>
          )}
          {isCurrentTurn && <span className="text-xs font-bold ml-1">出牌中...</span>}
        </div>

        {/* Melds */}
        {player.melds.length > 0 && (
          <div className="flex gap-3 mb-2">
            {player.melds.map((meld, mIdx) => (
              <div key={mIdx} className="flex gap-0.5 bg-black/20 rounded p-1">
                {meld.tiles.map((t, tIdx) => (
                  <TileComponent key={`m-${mIdx}-${tIdx}`} tile={t} size="sm" />
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Hand tiles */}
        <div className="flex gap-[2px] justify-center flex-wrap">
          {player.hand.map((tile, i) => (
            <TileComponent
              key={`h-${i}-${tile.id}`}
              tile={tile}
              size="lg"
              isSelected={selectedTileIndex === i}
              onClick={onTileClick ? () => onTileClick(tile, i) : undefined}
            />
          ))}
        </div>
      </div>
    )
  }

  // ---------- Other players (top / left / right) ----------
  return (
    <div className="flex flex-col items-center">
      {/* Player badge */}
      <div className={`
        flex items-center gap-1.5 mb-2 px-3 py-1 rounded-full text-xs
        ${isCurrentTurn
          ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black shadow-md shadow-amber-500/20'
          : 'bg-black/40 text-white/70'}
      `}>
        <span className="text-base">{player.avatar}</span>
        <span className="font-bold max-w-[60px] truncate">{player.name}</span>
        {player.status === 'hu' && (
          <span className="bg-red-600 text-white px-1 rounded font-bold">胡</span>
        )}
      </div>

      {/* Hidden hand tiles - show count */}
      <div className="flex gap-[1px]">
        {player.hand.map((_, i) => (
          <TileComponent key={`oh-${i}`} isHidden size="xs" />
        ))}
      </div>

      {/* Melds */}
      {player.melds.length > 0 && (
        <div className="flex gap-2 mt-1.5">
          {player.melds.map((meld, mIdx) => (
            <div key={mIdx} className="flex gap-[1px]">
              {meld.tiles.map((t, tIdx) => (
                <TileComponent key={`om-${mIdx}-${tIdx}`} tile={t} size="xs" />
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Discards */}
      {player.discards.length > 0 && (
        <div className="mt-2 grid grid-cols-6 gap-[1px]">
          {player.discards.map((tile, i) => (
            <TileComponent key={`od-${i}-${tile.id}`} tile={tile} size="xs" />
          ))}
        </div>
      )}
    </div>
  )
}
