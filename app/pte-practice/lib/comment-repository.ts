import { supabase } from '@/lib/supabase'
import type { PracticeComment, TaskType } from '../types'

/**
 * 讨论区评论读写层：Supabase `pte_practice_comments` 表。
 * 该功能没有本地回退（离线时直接展示错误提示），因为评论本质上是需要
 * 共享给对方看到的数据，本地保存没有意义。
 */

interface CommentRow {
  id: string
  item_id: string
  task_type: TaskType
  user_id: string
  body: string
  exam_location: string | null
  exam_date: string | null
  created_at: string
}

function rowToComment(row: CommentRow): PracticeComment {
  return {
    id: row.id,
    itemId: row.item_id,
    taskType: row.task_type,
    userId: row.user_id,
    body: row.body,
    examLocation: row.exam_location,
    examDate: row.exam_date,
    createdAt: row.created_at,
  }
}

export async function loadCommentsForItem(itemId: string): Promise<{ comments: PracticeComment[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('pte_practice_comments')
      .select('id,item_id,task_type,user_id,body,exam_location,exam_date,created_at')
      .eq('item_id', itemId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return { comments: ((data ?? []) as CommentRow[]).map(rowToComment), error: null }
  } catch (err) {
    return { comments: [], error: err instanceof Error ? err.message : '评论加载失败，请稍后重试' }
  }
}

export async function loadRecentComments(limit = 30): Promise<{ comments: PracticeComment[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('pte_practice_comments')
      .select('id,item_id,task_type,user_id,body,exam_location,exam_date,created_at')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return { comments: ((data ?? []) as CommentRow[]).map(rowToComment), error: null }
  } catch (err) {
    return { comments: [], error: err instanceof Error ? err.message : '评论加载失败，请稍后重试' }
  }
}

export async function addComment(input: {
  itemId: string
  taskType: TaskType
  userId: string
  body: string
  examLocation: string | null
  examDate: string | null
}): Promise<{ comment: PracticeComment | null; error: string | null }> {
  const trimmedBody = input.body.trim()
  if (!trimmedBody) return { comment: null, error: '评论内容不能为空' }
  if (trimmedBody.length > 2000) return { comment: null, error: '评论内容过长（最多 2000 字）' }

  try {
    const { data, error } = await supabase
      .from('pte_practice_comments')
      .insert({
        item_id: input.itemId,
        task_type: input.taskType,
        user_id: input.userId,
        body: trimmedBody,
        exam_location: input.examLocation?.trim() || null,
        exam_date: input.examDate || null,
      })
      .select('id,item_id,task_type,user_id,body,exam_location,exam_date,created_at')
      .single()

    if (error) throw error
    return { comment: rowToComment(data as CommentRow), error: null }
  } catch (err) {
    return { comment: null, error: err instanceof Error ? err.message : '评论发送失败，请稍后重试' }
  }
}

/** 订阅评论表的新增事件，用于"练习集锦"和单题评论区的实时刷新。 */
export function subscribeToComments(onInsert: (row: PracticeComment) => void) {
  const channel = supabase
    .channel('pte-practice-comments-realtime')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pte_practice_comments' }, (payload) => {
      onInsert(rowToComment(payload.new as CommentRow))
    })
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
