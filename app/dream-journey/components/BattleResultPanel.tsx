'use client'

import type { BattleResult } from '../types'
import AtlasSprite, { monsterAtlas, monsterQuadrant } from './AtlasSprite'

interface BattleResultPanelProps {
  result: BattleResult
  onContinue: () => void
}

export default function BattleResultPanel({ result, onContinue }: BattleResultPanelProps) {
  const victory = result.outcome === 'victory'
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/80 p-3 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={victory ? '战斗胜利结算' : '战斗失败结算'}>
      <div className={`w-full max-w-md overflow-hidden rounded-3xl border-2 bg-gradient-to-b p-6 text-center text-white shadow-2xl ${victory ? 'border-amber-300 from-amber-950 to-slate-950' : 'border-rose-400 from-rose-950 to-slate-950'}`}>
        <AtlasSprite atlas={monsterAtlas(result.enemyName)} quadrant={monsterQuadrant(result.enemyName)} alt={result.enemyName} className={`mx-auto h-32 w-32 ${victory ? '' : 'grayscale opacity-70'}`} />
        <p className={`mt-3 text-xs font-black tracking-[0.3em] ${victory ? 'text-amber-300' : 'text-rose-300'}`}>
          {victory ? '战斗胜利' : '战斗失败'}
        </p>
        <h2 className="mt-1 text-3xl font-black">{result.enemyName}</h2>
        {(result.enemyKind === 'boss' || result.elite) && <span className="mt-2 inline-flex rounded-full bg-rose-600/80 px-3 py-1 text-xs font-bold">{result.enemyKind === 'boss' ? '首领战' : '精英悬赏'}</span>}

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white/10 p-3"><span className="text-xs text-slate-300">修为</span><b className="mt-1 block text-xl">{result.expGained > 0 ? `+${result.expGained}` : '—'}</b></div>
          <div className="rounded-2xl bg-white/10 p-3"><span className="text-xs text-slate-300">银两</span><b className={`mt-1 block text-xl ${result.goldChange < 0 ? 'text-rose-300' : 'text-amber-200'}`}>{result.goldChange > 0 ? `+${result.goldChange}` : result.goldChange}</b></div>
        </div>
        {result.leveledUp && <p className="mt-3 rounded-xl bg-fuchsia-500/20 px-3 py-2 font-bold text-fuchsia-200">⬆️ 等级提升，气血与法力已恢复</p>}
        <p className="mt-4 text-sm leading-6 text-slate-200">{result.message}</p>
        <button type="button" onClick={onContinue} className={`mt-5 w-full rounded-full px-5 py-3 font-black text-slate-950 ${victory ? 'bg-amber-400 hover:bg-amber-300' : 'bg-rose-300 hover:bg-rose-200'}`}>
          {victory ? '继续历练' : '重整旗鼓'}
        </button>
      </div>
    </div>
  )
}
