import { supabase } from '@/lib/supabase'
import { getItemById as getStaticItemById, getItemsForTaskType as getStaticItemsForTaskType } from './questionBank'
import { TASK_TYPES, type PracticeItem, type TaskType } from '../types'

/**
 * PTE 题库读取层：优先从 Supabase 的 `pte_practice_items` 表读取，
 * 该表为空、请求失败或离线时，回退到 questionBank.ts 中的原创示例题，
 * 保证练习功能在没有 Supabase 的情况下仍然可用。
 */

interface ItemRow {
  id: string
  task_type: TaskType
  payload: Record<string, unknown>
}

function rowToItem(row: ItemRow): PracticeItem {
  return { ...row.payload, id: row.id, taskType: row.task_type } as PracticeItem
}

/** Fetch once for the library; paginate so a large bank is not silently truncated. */
export async function loadPracticeCatalog(): Promise<{ items: PracticeItem[]; cloudIds: string[]; error: string | null }> {
  const fallback = TASK_TYPES.flatMap(getStaticItemsForTaskType)
  try {
    const rows: ItemRow[] = []
    for (let from = 0; ; from += 500) {
      const { data, error } = await supabase.from('pte_practice_items')
        .select('id,task_type,payload').order('id').range(from, from + 499)
      if (error) throw error
      const page = (data ?? []) as ItemRow[]
      rows.push(...page.filter((row) => TASK_TYPES.includes(row.task_type)))
      if ((data?.length ?? 0) < 500) break
    }
    const cloudTypes = new Set(rows.map((row) => row.task_type))
    return {
      items: [...rows.map(rowToItem), ...fallback.filter((item) => !cloudTypes.has(item.taskType))],
      cloudIds: rows.map((row) => `${row.task_type}:${row.id}`), error: null,
    }
  } catch {
    return { items: fallback, cloudIds: [], error: '云端题库暂时不可用，当前显示内置原创练习题。' }
  }
}

export async function loadItemsForTaskType(taskType: TaskType): Promise<{ items: PracticeItem[]; source: 'cloud' | 'local'; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('pte_practice_items')
      .select('id,task_type,payload')
      .eq('task_type', taskType)

    if (error) throw error

    const rows = (data ?? []) as ItemRow[]
    if (rows.length > 0) {
      return { items: rows.map(rowToItem), source: 'cloud', error: null }
    }
    return { items: getStaticItemsForTaskType(taskType), source: 'local', error: null }
  } catch (err) {
    return {
      items: getStaticItemsForTaskType(taskType),
      source: 'local',
      error: err instanceof Error ? err.message : '题库加载失败，已使用本地内置题库',
    }
  }
}

export async function loadItemById(taskType: TaskType, itemId: string): Promise<{ item: PracticeItem | undefined; source: 'cloud' | 'local'; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('pte_practice_items')
      .select('id,task_type,payload')
      .eq('task_type', taskType)
      .eq('id', itemId)
      .maybeSingle()

    if (error) throw error

    if (data) {
      return { item: rowToItem(data as ItemRow), source: 'cloud', error: null }
    }
    return { item: getStaticItemById(taskType, itemId), source: 'local', error: null }
  } catch (err) {
    return {
      item: getStaticItemById(taskType, itemId),
      source: 'local',
      error: err instanceof Error ? err.message : '题库加载失败，已使用本地内置题库',
    }
  }
}
