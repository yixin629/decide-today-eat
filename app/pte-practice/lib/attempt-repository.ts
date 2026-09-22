import type { AttemptRecord } from '../types'

const STORAGE_KEY = 'pte-practice-attempts-v1'
const MAX_STORED_ATTEMPTS = 200

/**
 * 练习记录使用浏览器 localStorage 保存，不接入 Supabase。
 *
 * 原因：本模块的练习记录只是本地即时反馈历史，不涉及情侣共享数据，
 * 也不需要跨设备同步；为避免在没有真实授权题库前新增数据库表/RLS 策略，
 * 这里沿用仓库中其它轻量、单人使用场景的本地持久化方式。若后续需要跨
 * 设备同步，可在不改动组件调用方式的前提下，将本文件替换为 Supabase 版本
 * （参考 app/pte-plan/lib/plan-repository.ts 的写法）。
 */

function isBrowser() {
  return typeof window !== 'undefined'
}

export function loadAttempts(): AttemptRecord[] {
  if (!isBrowser()) return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed as AttemptRecord[]
  } catch {
    return []
  }
}

export function saveAttempt(attempt: AttemptRecord): AttemptRecord[] {
  if (!isBrowser()) return []
  const existing = loadAttempts()
  const next = [attempt, ...existing].slice(0, MAX_STORED_ATTEMPTS)
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // 存储空间不足或被禁用时静默忽略，不影响当次练习反馈展示。
  }
  return next
}

export function clearAttempts(): void {
  if (!isBrowser()) return
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
