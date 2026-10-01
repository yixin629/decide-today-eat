/**
 * 浏览器语音合成的口音分组与音色选择（纯函数，不访问 window）。
 * 真实 PTE 听力会混合美、英、澳等口音；这里按 voice.lang 分组，
 * 只展示当前浏览器实际提供的口音。
 */

export const ACCENTS = [
  { id: 'en-US', label: '美式' },
  { id: 'en-GB', label: '英式' },
  { id: 'en-AU', label: '澳式' },
  { id: 'en-IN', label: '印度' },
  { id: 'en-CA', label: '加拿大' },
  { id: 'other', label: '其他' },
] as const

export type AccentId = (typeof ACCENTS)[number]['id']
/** random：每道题随机一种口音（同一道题重播时保持不变）；any：浏览器默认英语音色。 */
export type AccentChoice = 'random' | 'any' | AccentId

export interface VoiceLike {
  name: string
  lang: string
  voiceURI: string
  localService?: boolean
}

export function normalizeLang(lang: string) {
  return lang.replace('_', '-')
}

export function isEnglishVoice(voice: VoiceLike) {
  return /^en([-_]|$)/i.test(voice.lang)
}

export function accentOf(voice: VoiceLike): AccentId {
  const lang = normalizeLang(voice.lang).toLowerCase()
  const match = ACCENTS.find((accent) => accent.id !== 'other' && lang.startsWith(accent.id.toLowerCase()))
  return match ? match.id : 'other'
}

export function accentLabel(id: AccentChoice) {
  if (id === 'random') return '每题随机'
  if (id === 'any') return '默认'
  return ACCENTS.find((accent) => accent.id === id)?.label ?? id
}

/** 去掉厂商前缀和语言后缀，如 "Microsoft Libby Online (Natural) - English (United Kingdom)" -> "Libby Online (Natural)"。 */
export function voiceName(voice: VoiceLike) {
  return voice.name.replace(/^(Microsoft|Google)\s+/, '').replace(/\s+-\s+English.*$/, '')
}

export function availableAccents(voices: VoiceLike[]): AccentId[] {
  const present = new Set(voices.map(accentOf))
  return ACCENTS.map((accent) => accent.id).filter((id) => present.has(id))
}

// Edge 的 Natural/Online、Chrome 的 Google 音色通常比系统本地音色自然，优先使用。
function quality(voice: VoiceLike) {
  return /natural|neural|online|google|premium|enhanced/i.test(voice.name) ? 0 : 1
}

export function sortVoices<T extends VoiceLike>(voices: T[]): T[] {
  return [...voices].sort((a, b) => quality(a) - quality(b) || a.name.localeCompare(b.name))
}

function hash(text: string) {
  let value = 0
  for (let i = 0; i < text.length; i += 1) value = (value * 31 + text.charCodeAt(i)) | 0
  return Math.abs(value)
}

/**
 * 按偏好选择音色；返回 null 表示交给浏览器默认英语音色。
 * seed 用于"每题随机"：同一段素材总是得到同一个音色，换题才会换口音。
 */
export function pickVoice<T extends VoiceLike>(voices: T[], prefs: { accent: AccentChoice; voiceURI: string }, seed: string): T | null {
  if (!voices.length) return null
  if (prefs.accent === 'random') {
    const accents = availableAccents(voices)
    const accent = accents[hash(seed) % accents.length]
    const pool = sortVoices(voices.filter((voice) => accentOf(voice) === accent))
    const preferred = pool.filter((voice) => quality(voice) === 0)
    const candidates = preferred.length ? preferred : pool
    return candidates[hash(`${seed}:voice`) % candidates.length] ?? null
  }
  const chosen = prefs.voiceURI ? voices.find((voice) => voice.voiceURI === prefs.voiceURI) : undefined
  if (chosen && (prefs.accent === 'any' || accentOf(chosen) === prefs.accent)) return chosen
  if (prefs.accent === 'any') return null
  return sortVoices(voices.filter((voice) => accentOf(voice) === prefs.accent))[0] ?? null
}
