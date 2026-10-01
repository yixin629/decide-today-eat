'use client'

import { useCallback, useSyncExternalStore } from 'react'
import { ACCENTS, type AccentChoice } from '../lib/voices'

export interface AudioPreferences {
  accent: AccentChoice
  voiceURI: string
  rate: number
}

export const RATES = [0.75, 0.9, 1, 1.1, 1.25] as const

const KEY = 'pte-audio-v1'
const DEFAULTS: AudioPreferences = { accent: 'random', voiceURI: '', rate: 1 }
const listeners = new Set<() => void>()
let cachedRaw: string | null | undefined
let cached: AudioPreferences = DEFAULTS
// 本机存储写入失败（隐私模式等）时，偏好只保存在内存里，当前页面仍然生效。
let memory: AudioPreferences | null = null

function parse(raw: string | null): AudioPreferences {
  try {
    const value = raw ? (JSON.parse(raw) as Partial<AudioPreferences>) : {}
    const accents: string[] = ['random', 'any', ...ACCENTS.map((accent) => accent.id)]
    return {
      accent: typeof value.accent === 'string' && accents.includes(value.accent) ? value.accent : DEFAULTS.accent,
      voiceURI: typeof value.voiceURI === 'string' ? value.voiceURI : '',
      rate: typeof value.rate === 'number' && (RATES as readonly number[]).includes(value.rate) ? value.rate : DEFAULTS.rate,
    }
  } catch {
    return DEFAULTS
  }
}

function read(): AudioPreferences {
  if (memory) return memory
  let raw: string | null = null
  try { raw = window.localStorage.getItem(KEY) } catch { return cached }
  if (raw !== cachedRaw) { cachedRaw = raw; cached = parse(raw) }
  return cached
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  const onStorage = (event: StorageEvent) => { if (event.key === KEY) listener() }
  window.addEventListener('storage', onStorage)
  return () => { listeners.delete(listener); window.removeEventListener('storage', onStorage) }
}

/** 口音、音色和语速偏好：保存在本机浏览器，做题页和精听页共用。 */
export function useAudioPreferences() {
  const prefs = useSyncExternalStore(subscribe, read, () => DEFAULTS)
  const update = useCallback((patch: Partial<AudioPreferences>) => {
    const next = { ...read(), ...patch }
    try { window.localStorage.setItem(KEY, JSON.stringify(next)); memory = null } catch { memory = next }
    listeners.forEach((listener) => listener())
  }, [])
  return { prefs, update }
}
