import { supabase } from '@/lib/supabase'
import type { AttemptRecord } from '../types'

const STORAGE_KEY = 'pte-practice-attempts-v1'
const MAX_STORED_ATTEMPTS = 200

/**
 * 练习记录读写层。
 *
 * 云端来源：Supabase `pte_practice_attempts` 表，按 user_id（'zyx' | 'zly'）
 * 区分"我的练习"，同时支持读取全部用户记录用于"练习集锦"共享动态。
 *
 * 本地回退：Supabase 不可用（未配置、网络失败、表未建）时，读写退回浏览器
 * localStorage（key: pte-practice-attempts-v1），保证离线仍可看到本机历史；
 * 本地回退记录不会自动补齐 userId，也不会出现在其他设备或"练习集锦"里。
 */

interface AttemptRow {
  id: string
  user_id: string
  task_type: AttemptRecord['taskType']
  item_id: string
  duration_seconds: number
  dimensions: AttemptRecord['dimensions']
  summary: string
  created_at: string
}

function rowToAttempt(row: AttemptRow): AttemptRecord {
  return {
    id: row.id,
    taskType: row.task_type,
    itemId: row.item_id,
    createdAt: row.created_at,
    durationSeconds: row.duration_seconds,
    dimensions: row.dimensions,
    summary: row.summary,
    isEstimate: true,
    userId: row.user_id,
  }
}

function isBrowser() {
  return typeof window !== 'undefined'
}

function loadLocalAttempts(): AttemptRecord[] {
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

function saveLocalAttempt(attempt: AttemptRecord): AttemptRecord[] {
  if (!isBrowser()) return []
  const existing = loadLocalAttempts()
  const next = [attempt, ...existing].slice(0, MAX_STORED_ATTEMPTS)
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // 存储空间不足或被禁用时静默忽略，不影响当次练习反馈展示。
  }
  return next
}

export interface AttemptQueryResult {
  attempts: AttemptRecord[]
  source: 'cloud' | 'local'
  error: string | null
}

/** 加载指定用户的练习记录（"我的练习"）。 */
export async function loadAttempts(userId: string | null): Promise<AttemptQueryResult> {
  if (!userId) return { attempts: loadLocalAttempts(), source: 'local', error: null }
  try {
    const { data, error } = await supabase
      .from('pte_practice_attempts')
      .select('id,user_id,task_type,item_id,duration_seconds,dimensions,summary,created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(MAX_STORED_ATTEMPTS)

    if (error) throw error
    return { attempts: ((data ?? []) as AttemptRow[]).map(rowToAttempt), source: 'cloud', error: null }
  } catch (err) {
    return {
      attempts: loadLocalAttempts(),
      source: 'local',
      error: err instanceof Error ? err.message : '练习记录加载失败，已显示本机历史',
    }
  }
}

/** 加载所有用户（zyx + zly）的最近练习记录，用于"练习集锦"共享动态。 */
export async function loadAllAttempts(limit = 50): Promise<AttemptQueryResult> {
  try {
    const { data, error } = await supabase
      .from('pte_practice_attempts')
      .select('id,user_id,task_type,item_id,duration_seconds,dimensions,summary,created_at')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return { attempts: ((data ?? []) as AttemptRow[]).map(rowToAttempt), source: 'cloud', error: null }
  } catch (err) {
    return {
      attempts: [],
      source: 'local',
      error: err instanceof Error ? err.message : '共享练习动态暂时无法加载，请稍后重试',
    }
  }
}

/** 保存一条练习记录。userId 为空（未登录）时只写本地。 */
export async function saveAttempt(
  attempt: Omit<AttemptRecord, 'id' | 'userId'>,
  userId: string | null
): Promise<{ attempt: AttemptRecord; source: 'cloud' | 'local'; error: string | null }> {
  if (userId) {
    try {
      const { data, error } = await supabase
        .from('pte_practice_attempts')
        .insert({
          user_id: userId,
          task_type: attempt.taskType,
          item_id: attempt.itemId,
          duration_seconds: attempt.durationSeconds,
          dimensions: attempt.dimensions,
          summary: attempt.summary,
        })
        .select('id,user_id,task_type,item_id,duration_seconds,dimensions,summary,created_at')
        .single()

      if (error) throw error
      return { attempt: rowToAttempt(data as AttemptRow), source: 'cloud', error: null }
    } catch (err) {
      const localRecord: AttemptRecord = { ...attempt, id: `${attempt.itemId}-${Date.now()}`, userId: userId ?? undefined }
      saveLocalAttempt(localRecord)
      return {
        attempt: localRecord,
        source: 'local',
        error: err instanceof Error ? err.message : '练习记录保存到云端失败，已仅保存在本机',
      }
    }
  }

  const localRecord: AttemptRecord = { ...attempt, id: `${attempt.itemId}-${Date.now()}` }
  saveLocalAttempt(localRecord)
  return { attempt: localRecord, source: 'local', error: null }
}

/** 订阅练习记录表的新增事件，用于"练习集锦"共享动态实时刷新。 */
export function subscribeToAttempts(onInsert: (attempt: AttemptRecord) => void) {
  const channel = supabase
    .channel('pte-practice-attempts-realtime')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pte_practice_attempts' }, (payload) => {
      onInsert(rowToAttempt(payload.new as AttemptRow))
    })
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

export function clearLocalAttempts(): void {
  if (!isBrowser()) return
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
