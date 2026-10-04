import { supabase } from '@/lib/supabase'
import type { AttemptRecord } from '../types'
import { mergeAttemptHistory, parseLocalHistory } from './attempt-history'

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

function loadLocalAttempts(): { attempts: AttemptRecord[]; error: string | null } {
  if (!isBrowser()) return { attempts: [], error: null }
  try {
    return parseLocalHistory(window.localStorage.getItem(STORAGE_KEY))
  } catch {
    return { attempts: [], error: '浏览器阻止了本机存储访问，无法读取离线记录。' }
  }
}

function saveLocalAttempt(attempt: AttemptRecord): boolean {
  if (!isBrowser()) return false
  const existing = loadLocalAttempts()
  if (existing.error) return false
  const own = existing.attempts.filter((record) => record.userId === attempt.userId && record.id !== attempt.id)
  const others = existing.attempts.filter((record) => record.userId !== attempt.userId)
  const next = [...[attempt, ...own].slice(0, MAX_STORED_ATTEMPTS), ...others]
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    return true
  } catch {
    return false
  }
}

export interface AttemptQueryResult {
  attempts: AttemptRecord[]
  source: 'cloud' | 'local' | 'mixed'
  error: string | null
}

/** 加载指定用户的练习记录（"我的练习"）。 */
export async function loadAttempts(userId: string | null): Promise<AttemptQueryResult> {
  const local = loadLocalAttempts()
  const localAttempts = mergeAttemptHistory([], local.attempts, userId).attempts
  if (!userId) return { attempts: localAttempts, source: 'local', error: local.error }
  try {
    const { data, error } = await supabase
      .from('pte_practice_attempts')
      .select('id,user_id,task_type,item_id,duration_seconds,dimensions,summary,created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(MAX_STORED_ATTEMPTS)

    if (error) throw error
    const merged = mergeAttemptHistory(((data ?? []) as AttemptRow[]).map(rowToAttempt), localAttempts, userId)
    return { attempts: merged.attempts, source: merged.hasLocal ? 'mixed' : 'cloud', error: local.error }
  } catch {
    return {
      attempts: localAttempts,
      source: 'local',
      error: ['云端记录暂时不可用，已显示当前身份的本机历史。', local.error].filter(Boolean).join(' '),
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

      if (error || !data) throw error ?? new Error('练习记录保存未返回结果')
      return { attempt: rowToAttempt(data as AttemptRow), source: 'cloud', error: null }
    } catch {
      const localRecord: AttemptRecord = { ...attempt, id: crypto.randomUUID(), userId }
      const stored = saveLocalAttempt(localRecord)
      return {
        attempt: localRecord,
        source: 'local',
        error: stored ? '云端保存失败，本次记录已保存在当前身份的本机历史。' : '云端和本机均保存失败，本次反馈仅在当前页面可见，请勿关闭页面。',
      }
    }
  }

  const localRecord: AttemptRecord = { ...attempt, id: crypto.randomUUID() }
  const stored = saveLocalAttempt(localRecord)
  return { attempt: localRecord, source: 'local', error: stored ? null : '本机存储不可用，本次反馈仅在当前页面可见，请勿关闭页面。' }
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
