'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { TASK_TYPES, type TaskType } from '../types'

export interface StudyPreferences {
  bookmarks: string[]
  notes: Record<string, string>
  dailyGoal: number
  recent: { taskType: TaskType; itemId: string } | null
}

const EMPTY: StudyPreferences = { bookmarks: [], notes: {}, dailyGoal: 10, recent: null }

function parsePreferences(raw: string | null): StudyPreferences {
  if (!raw) return { ...EMPTY }
  const value: unknown = JSON.parse(raw)
  if (!value || typeof value !== 'object') throw new Error('Invalid study preferences')
  const obj = value as Record<string, unknown>
  const notes: Record<string, string> = {}
  if (obj.notes && typeof obj.notes === 'object') {
    for (const [key, note] of Object.entries(obj.notes)) {
      if (typeof note === 'string' && key.length < 250) notes[key] = note.slice(0, 3000)
    }
  }
  let recent: StudyPreferences['recent'] = null
  if (obj.recent && typeof obj.recent === 'object') {
    const r = obj.recent as Record<string, unknown>
    if (TASK_TYPES.includes(r.taskType as TaskType) && typeof r.itemId === 'string') recent = { taskType: r.taskType as TaskType, itemId: r.itemId }
  }
  return {
    bookmarks: Array.isArray(obj.bookmarks) ? obj.bookmarks.filter((v): v is string => typeof v === 'string' && v.length < 250) : [],
    notes, recent,
    dailyGoal: typeof obj.dailyGoal === 'number' && Number.isInteger(obj.dailyGoal) && obj.dailyGoal >= 1 && obj.dailyGoal <= 100 ? obj.dailyGoal : 10,
  }
}

export function useStudyPreferences(userId: string | null) {
  const key = `pte-study-v1:${userId ?? 'guest'}`
  const [state, setState] = useState<StudyPreferences>(EMPTY)
  const [loadedKey, setLoadedKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const current = useRef<StudyPreferences>(EMPTY)
  useEffect(() => {
    function load() {
      try {
        const next = parsePreferences(localStorage.getItem(key))
        current.current = next
        setState(next)
        setError(null)
      } catch {
        current.current = { ...EMPTY }
        setState({ ...EMPTY })
        setError('本机学习偏好读取失败；原有存储未删除。')
      }
      setLoadedKey(key)
    }
    load()
    const sync = (event: StorageEvent) => { if (event.key === key) load() }
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [key])

  const update = useCallback((change: (previous: StudyPreferences) => StudyPreferences) => {
    if (loadedKey !== key) return false
    const next = change(current.current)
    try {
      localStorage.setItem(key, JSON.stringify(next))
      current.current = next
      setState(next)
      setError(null)
      return true
    } catch {
      setError('本机存储不可用，收藏、笔记或目标未保存。请检查浏览器存储空间。')
      return false
    }
  }, [key, loadedKey])

  return { preferences: loadedKey === key ? state : EMPTY, ready: loadedKey === key, error, update }
}
