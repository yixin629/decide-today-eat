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
 * 为多位发言人（如小组讨论）分配尽量不同的音色。选定具体口音时在该口音内轮换；
 * 每题随机或默认时按口音交错排列，让相邻发言人听起来有区别。
 * 可用音色少于发言人数时会重复使用，调用方可再用音高区分。
 */
export function pickVoices<T extends VoiceLike>(voices: T[], prefs: { accent: AccentChoice }, seed: string, count: number): (T | null)[] {
  if (!voices.length) return Array.from({ length: count }, () => null)
  const rotate = <V,>(list: V[], by: number) => list.map((_, i) => list[(i + by) % list.length])
  let pool: T[]
  if (prefs.accent === 'random' || prefs.accent === 'any') {
    // 先按题目轮换口音顺序、组内轮换音色，再逐轮交错，保证前几位发言人口音各不相同。
    const accents = availableAccents(voices)
    const groups = rotate(accents, hash(seed) % accents.length).map((accent) => {
      const group = sortVoices(voices.filter((voice) => accentOf(voice) === accent))
      return rotate(group, hash(`${seed}:${accent}`) % group.length)
    })
    pool = []
    for (let i = 0; groups.some((group) => group[i]); i += 1) groups.forEach((group) => { if (group[i]) pool.push(group[i]) })
  } else {
    const sameAccent = sortVoices(voices.filter((voice) => accentOf(voice) === prefs.accent))
    pool = sameAccent.length ? sameAccent : sortVoices(voices)
    pool = rotate(pool, hash(seed) % pool.length)
  }
  return Array.from({ length: count }, (_, i) => pool[i % pool.length])
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
