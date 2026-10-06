'use client'

import { Eye, EyeOff, Play, Settings2, Square, Users } from 'lucide-react'
import { useRef, useState } from 'react'
import { useAudioPreferences } from '../../hooks/useAudioPreferences'
import { useSpeechPlayer } from '../../hooks/useSpeechPlayer'
import { accentLabel, accentOf, pickVoices } from '../../lib/voices'
import type { GroupDiscussionTurn } from '../../types'
import AudioSettings from '../audio/AudioSettings'

// 可用音色不足以区分每位发言人时，用音高辅助区分。
const PITCHES = [1, 0.85, 1.15, 0.95]

/** 小组讨论播放器：按顺序朗读每段台词，不同发言人使用不同音色。 */
export default function DiscussionPlayer({ seed, turns }: { seed: string; turns: GroupDiscussionTurn[] }) {
  const player = useSpeechPlayer()
  const { prefs, update } = useAudioPreferences()
  const [current, setCurrent] = useState(-1)
  const [revealed, setRevealed] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const runId = useRef(0)
  const speakers = [...new Set(turns.map((turn) => turn.speaker))]
  const voices = pickVoices(player.voices, prefs, seed, speakers.length)
  const distinctVoices = new Set(voices.map((voice) => voice?.voiceURI ?? '')).size

  function stop() {
    runId.current += 1
    player.stop()
    setCurrent(-1)
  }

  function start() {
    runId.current += 1
    playFrom(0)
  }

  function playFrom(index: number) {
    const id = runId.current
    if (!turns[index]) { setCurrent(-1); return }
    const speakerIndex = speakers.indexOf(turns[index].speaker)
    setCurrent(index)
    player.play(turns[index].text, {
      rate: prefs.rate,
      voice: voices[speakerIndex],
      pitch: distinctVoices < speakers.length ? PITCHES[speakerIndex % PITCHES.length] : 1,
      onEnd: () => { if (id === runId.current) playFrom(index + 1) },
    })
  }

  return <div className="pte-audio-player">
    <div className="pte-player-controls">
      <Users size={18} className="text-gray-400" />
      <button type="button" className="pte-button primary" disabled={!player.supported} onClick={() => (current >= 0 ? stop() : start())}>
        {current >= 0 ? <Square size={16} /> : <Play size={16} />}{current >= 0 ? '停止' : '播放讨论'}
      </button>
      <button type="button" className="pte-icon-button" title="口音、音色与语速" aria-label="口音、音色与语速" aria-expanded={showSettings} onClick={() => setShowSettings((value) => !value)}><Settings2 size={17} /></button>
      <button type="button" className="pte-icon-button" title={revealed ? '隐藏文字稿' : '查看文字稿'} aria-label={revealed ? '隐藏文字稿' : '查看文字稿'} aria-pressed={revealed} onClick={() => setRevealed((value) => !value)}>{revealed ? <EyeOff size={17} /> : <Eye size={17} />}</button>
    </div>
    <p className="pte-player-status">
      {current >= 0 ? `正在播放 ${turns[current].speaker}（第 ${current + 1} / ${turns.length} 段）` : `${speakers.length} 位发言人 · ${turns.length} 段`}
      {' · '}{speakers.map((speaker, i) => `${speaker}${voices[i] ? `：${accentLabel(accentOf(voices[i]!))}` : ''}`).join('，')} · 合成音频，非官方录音
    </p>
    {showSettings && player.supported && <AudioSettings voices={player.voices} prefs={prefs} onChange={(patch) => { stop(); update(patch) }} />}
    {player.error && <p role="alert" className="text-xs text-red-600">{player.error}</p>}
    {revealed && <div className="pte-discussion-script">{turns.map((turn, index) => <p key={index} className={index === current ? 'active' : ''}><strong>{turn.speaker}</strong>{turn.text}</p>)}</div>}
  </div>
}
