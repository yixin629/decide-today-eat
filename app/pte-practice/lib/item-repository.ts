import { supabase } from '@/lib/supabase'
import { getItemById as getStaticItemById, getItemsForTaskType as getStaticItemsForTaskType } from './questionBank'
import type { PracticeItem, TaskType } from '../types'

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
  return { id: row.id, taskType: row.task_type, ...row.payload } as PracticeItem
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
