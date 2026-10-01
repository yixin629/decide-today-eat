'use client'

import { RATES, type AudioPreferences } from '../../hooks/useAudioPreferences'
import { accentLabel, accentOf, availableAccents, sortVoices, voiceName, type AccentChoice } from '../../lib/voices'

/** 口音 / 音色 / 语速设置；偏好由 useAudioPreferences 保存在本机，所有听力播放器共用。 */
export default function AudioSettings({ voices, prefs, onChange }: {
  voices: SpeechSynthesisVoice[]
  prefs: AudioPreferences
  onChange: (patch: Partial<AudioPreferences>) => void
}) {
  const accents = availableAccents(voices)
  const choices: AccentChoice[] = accents.length > 1 ? ['random', ...accents, 'any'] : [...accents, 'any']
  const pool = sortVoices(prefs.accent === 'any' || prefs.accent === 'random' ? voices : voices.filter((voice) => accentOf(voice) === prefs.accent))

  if (!voices.length) return <p className="pte-small-note">当前浏览器没有可用的英语音色，将使用系统默认朗读。</p>

  return <div className="pte-audio-settings">
    <div className="pte-setting-row">
      <span>口音</span>
      <div className="pte-chip-group" role="group" aria-label="口音">
        {choices.map((choice) => <button key={choice} type="button" aria-pressed={prefs.accent === choice} className={prefs.accent === choice ? 'active' : ''} onClick={() => onChange({ accent: choice, voiceURI: '' })}>{accentLabel(choice)}</button>)}
      </div>
    </div>
    {prefs.accent !== 'random' && pool.length > 1 && <label className="pte-setting-row">
      <span>音色</span>
      <select aria-label="英语音色" value={prefs.voiceURI} onChange={(e) => onChange({ voiceURI: e.target.value })}>
        <option value="">自动选择（{pool.length} 个可选）</option>
        {pool.map((voice) => <option key={voice.voiceURI} value={voice.voiceURI}>{voiceName(voice)} · {accentLabel(accentOf(voice))}</option>)}
      </select>
    </label>}
    <div className="pte-setting-row">
      <span>语速</span>
      <div className="pte-chip-group" role="group" aria-label="语速">
        {RATES.map((rate) => <button key={rate} type="button" aria-pressed={prefs.rate === rate} className={prefs.rate === rate ? 'active' : ''} onClick={() => onChange({ rate })}>{rate}x</button>)}
      </div>
    </div>
    <p className="pte-small-note">
      {prefs.accent === 'random' ? '每道题随机换一种口音，重播同一题时保持不变，更接近真实考试。' : '偏好保存在本机，做题和精听都会使用。'}
      {accents.length <= 1 && ' 当前浏览器只提供一种口音；Edge 或 Chrome 通常有美、英、澳等更多英语音色。'}
    </p>
  </div>
}
