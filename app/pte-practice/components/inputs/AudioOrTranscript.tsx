'use client'

import { Eye, EyeOff, Pause, Play, Settings2, Square, Volume2 } from 'lucide-react'
import { useState } from 'react'
import { useAudioPreferences } from '../../hooks/useAudioPreferences'
import { useSpeechPlayer } from '../../hooks/useSpeechPlayer'
import { accentLabel, accentOf, pickVoice } from '../../lib/voices'
import AudioSettings from '../audio/AudioSettings'

export default function AudioOrTranscript({ text, revealText }: { text: string; revealText?: string }) {
  const player = useSpeechPlayer()
  const { prefs, update } = useAudioPreferences()
  const [revealed, setRevealed] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const voice = pickVoice(player.voices, prefs, text)

  function changeSettings(patch: Parameters<typeof update>[0]) {
    player.stop()
    update(patch)
  }

  return <div className="pte-audio-player">
    <div className="pte-player-controls">
      <Volume2 size={18} className="text-gray-400" />
      <button type="button" className="pte-button primary" disabled={!player.supported} onClick={() => player.status === 'idle' ? player.play(text, { rate: prefs.rate, voice }) : player.togglePause()}>
        {player.status === 'playing' ? <Pause size={16} /> : <Play size={16} />}{player.status === 'playing' ? '暂停' : player.status === 'paused' ? '继续播放' : '播放音频'}
      </button>
      <button type="button" className="pte-icon-button" title="停止播放" aria-label="停止播放" disabled={player.status === 'idle'} onClick={player.stop}><Square size={16} /></button>
      <button type="button" className="pte-icon-button" title="口音、音色与语速" aria-label="口音、音色与语速" aria-expanded={showSettings} onClick={() => setShowSettings((value) => !value)}><Settings2 size={17} /></button>
      <button type="button" className="pte-icon-button" title={revealed ? '隐藏文字稿' : '查看文字稿'} aria-label={revealed ? '隐藏文字稿' : '查看文字稿'} aria-pressed={revealed} onClick={() => setRevealed((value) => !value)}>{revealed ? <EyeOff size={17} /> : <Eye size={17} />}</button>
    </div>
    <p className="pte-player-status">
      合成音频 · {voice ? `${accentLabel(accentOf(voice))}口音` : '默认音色'} · {prefs.rate}x · 非官方录音
      {!player.supported ? ' · 当前浏览器不支持播放，可查看文字稿' : ''}
    </p>
    {showSettings && player.supported && <AudioSettings voices={player.voices} prefs={prefs} onChange={changeSettings} />}
    {player.error && <p role="alert" className="text-xs text-red-600">{player.error}</p>}
    {revealed && <p className="whitespace-pre-line text-sm leading-8">{revealText ?? text}</p>}
  </div>
}
