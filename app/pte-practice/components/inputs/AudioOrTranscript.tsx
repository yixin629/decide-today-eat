'use client'

import { Eye, EyeOff, Pause, Play, Square, Volume2 } from 'lucide-react'
import { useState } from 'react'
import { useSpeechPlayer } from '../../hooks/useSpeechPlayer'

export default function AudioOrTranscript({ text, revealText }: { text: string; revealText?: string }) {
  const player = useSpeechPlayer()
  const [revealed, setRevealed] = useState(false)
  const [rate, setRate] = useState(1)
  return <div className="pte-audio-player">
    <div className="pte-player-controls">
      <Volume2 size={18} className="text-gray-400" />
      <button type="button" className="pte-button primary" disabled={!player.supported} onClick={() => player.status === 'idle' ? player.play(text, { rate }) : player.togglePause()}>
        {player.status === 'playing' ? <Pause size={16} /> : <Play size={16} />}{player.status === 'playing' ? '暂停' : player.status === 'paused' ? '继续播放' : '播放音频'}
      </button>
      <button type="button" className="pte-icon-button" title="停止播放" aria-label="停止播放" disabled={player.status === 'idle'} onClick={player.stop}><Square size={16} /></button>
      <select aria-label="播放速度" value={rate} onChange={(e) => { player.stop(); setRate(Number(e.target.value)) }}>{[0.75, 0.9, 1, 1.1, 1.25].map((r) => <option key={r} value={r}>{r}x</option>)}</select>
      <button type="button" className="pte-icon-button" title={revealed ? '隐藏文字稿' : '查看文字稿'} aria-label={revealed ? '隐藏文字稿' : '查看文字稿'} aria-pressed={revealed} onClick={() => setRevealed((value) => !value)}>{revealed ? <EyeOff size={17} /> : <Eye size={17} />}</button>
    </div>
    <p className="pte-player-status">合成音频 · 非官方录音{!player.supported ? ' · 当前浏览器不支持播放，可查看文字稿' : ''}</p>
    {player.error && <p role="alert" className="text-xs text-red-600">{player.error}</p>}
    {revealed && <p className="whitespace-pre-line text-sm leading-8">{revealText ?? text}</p>}
  </div>
}
