import { supabase } from '@/lib/supabase'
import { getItemById as getStaticItemById, getItemsForTaskType as getStaticItemsForTaskType } from './questionBank'
import { newCustomItemId, type NewPracticeItem } from './custom-items'
import { TASK_TYPES, type PracticeItem, type TaskType } from '../types'

/**
 * PTE 题库读取层：优先从 Supabase 的 `pte_practice_items` 表读取，
 * 与 questionBank.ts 中的原创示例题按 taskType:id 合并（同 id 以云端为准），
 * 请求失败或离线时回退到内置题，保证练习功能在没有 Supabase 的情况下仍然可用。
 * 用户上传的自定义题目同样存放在该表，带 created_by 列（见
 * database/migrations/pte-practice-custom-items.sql）。
 */

interface ItemRow {
  id: string
  task_type: TaskType
  payload: Record<string, unknown>
  created_by?: string | null
  created_at?: string | null
}

export interface CustomItemInfo {
  key: string
  createdBy: string
  createdAt: string | null
}

const SETUP_HINT = '云端还未开启题目上传：请先在 Supabase 执行 database/migrations/pte-practice-custom-items.sql。'
const EDIT_SETUP_HINT = '云端还未开启题目编辑：请先在 Supabase 执行 database/migrations/pte-practice-custom-item-editing.sql。'

function rowToItem(row: ItemRow): PracticeItem {
  return { ...row.payload, id: row.id, taskType: row.task_type } as PracticeItem
}

function rowKey(row: { task_type: TaskType; id: string }) {
  return `${row.task_type}:${row.id}`
}

function mergeWithStatic(rows: ItemRow[], staticItems: PracticeItem[]): PracticeItem[] {
  const cloudKeys = new Set(rows.map(rowKey))
  return [...rows.map(rowToItem), ...staticItems.filter((item) => !cloudKeys.has(`${item.taskType}:${item.id}`))]
}

/** 旧库尚未执行自定义题目迁移时没有 created_by 列，退回只读旧字段，不影响练习。 */
function isMissingColumn(error: { code?: string; message?: string }) {
  return error.code === '42703' || error.code === 'PGRST204' || /created_by|created_at/.test(error.message ?? '')
}

async function selectRows(build: (columns: string) => PromiseLike<{ data: unknown; error: { code?: string; message: string } | null }>) {
  let result = await build('id,task_type,payload,created_by,created_at')
  if (result.error && isMissingColumn(result.error)) result = await build('id,task_type,payload')
  if (result.error) throw result.error
  return (result.data ?? []) as ItemRow[]
}

/** Fetch once for the library; paginate so a large bank is not silently truncated. */
export async function loadPracticeCatalog(): Promise<{ items: PracticeItem[]; cloudIds: string[]; customItems: CustomItemInfo[]; error: string | null }> {
  const fallback = TASK_TYPES.flatMap(getStaticItemsForTaskType)
  try {
    const rows: ItemRow[] = []
    for (let from = 0; ; from += 500) {
      const page = await selectRows((columns) => supabase.from('pte_practice_items').select(columns).order('id').range(from, from + 499))
      rows.push(...page.filter((row) => TASK_TYPES.includes(row.task_type)))
      if (page.length < 500) break
    }
    return {
      items: mergeWithStatic(rows, fallback),
      cloudIds: rows.map(rowKey),
      customItems: rows.filter((row) => row.created_by).map((row) => ({ key: rowKey(row), createdBy: row.created_by as string, createdAt: row.created_at ?? null })),
      error: null,
    }
  } catch {
    return { items: fallback, cloudIds: [], customItems: [], error: '云端题库暂时不可用，当前显示内置原创练习题。' }
  }
}

export async function loadItemsForTaskType(taskType: TaskType): Promise<{ items: PracticeItem[]; source: 'cloud' | 'local'; error: string | null }> {
  const staticItems = getStaticItemsForTaskType(taskType)
  try {
    const { data, error } = await supabase
      .from('pte_practice_items')
      .select('id,task_type,payload')
      .eq('task_type', taskType)

    if (error) throw error

    const rows = (data ?? []) as ItemRow[]
    return { items: mergeWithStatic(rows, staticItems), source: rows.length > 0 ? 'cloud' : 'local', error: null }
  } catch (err) {
    return {
      items: staticItems,
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

function friendlyWriteError(error: { code?: string; message?: string }) {
  if (isMissingColumn(error) || error.code === '42501' || /row-level security|permission denied/i.test(error.message ?? '')) return SETUP_HINT
  if (error.code === '23514') return '题目内容未通过云端校验（可能过长或题型不受支持）。'
  return error.message || '保存失败，请稍后重试。'
}

/** 调用方需先用 validateCustomItem 校验；这里只负责写入。 */
export async function saveCustomItems(items: NewPracticeItem[], userId: string): Promise<{ saved: PracticeItem[]; error: string | null }> {
  if (!items.length) return { saved: [], error: null }
  const rows = items.map((item) => {
    const { taskType, ...payload } = item
    return { id: newCustomItemId(), task_type: taskType, payload, created_by: userId }
  })
  const { data, error } = await supabase.from('pte_practice_items').insert(rows).select('id,task_type,payload')
  if (error) return { saved: [], error: friendlyWriteError(error) }
  return { saved: ((data ?? []) as ItemRow[]).map(rowToItem), error: null }
}

/** Update only the caller's existing custom item; task type and stable item id are preserved. */
export async function updateCustomItem(itemId: string, item: NewPracticeItem, userId: string): Promise<{ saved: PracticeItem | null; error: string | null }> {
  const { taskType, ...payload } = item
  const { data, error } = await supabase
    .from('pte_practice_items')
    .update({ payload })
    .eq('id', itemId)
    .eq('task_type', taskType)
    .eq('created_by', userId)
    .select('id,task_type,payload')
  if (error) {
    const permissionError = error.code === '42501' || /row-level security|permission denied/i.test(error.message ?? '')
    return { saved: null, error: permissionError ? EDIT_SETUP_HINT : friendlyWriteError(error) }
  }
  const row = (data as ItemRow[] | null)?.[0]
  if (!row) return { saved: null, error: '没有更新任何题目：题目可能已被删除、不属于当前用户，或云端尚未开启编辑权限。' }
  return { saved: rowToItem(row), error: null }
}

export async function deleteCustomItem(taskType: TaskType, itemId: string): Promise<{ error: string | null }> {
  const { data, error } = await supabase.from('pte_practice_items').delete().eq('task_type', taskType).eq('id', itemId).select('id')
  if (error) return { error: friendlyWriteError(error) }
  if (!data?.length) return { error: '没有删除任何题目：可能已被删除，或云端未开启删除权限。' }
  return { error: null }
}
