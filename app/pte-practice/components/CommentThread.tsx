'use client'

import { useEffect, useState } from 'react'
import { addComment, loadCommentsForItem, subscribeToComments } from '../lib/comment-repository'
import type { PracticeComment, TaskType } from '../types'

const USER_LABELS: Record<string, string> = { zyx: 'ZYX', zly: 'ZLY' }

export default function CommentThread({ itemId, taskType, userId }: { itemId: string; taskType: TaskType; userId: string | null }) {
  const [comments, setComments] = useState<PracticeComment[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [body, setBody] = useState('')
  const [examLocation, setExamLocation] = useState('')
  const [examDate, setExamDate] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    loadCommentsForItem(itemId).then((result) => {
      if (cancelled) return
      setComments(result.comments)
      setLoadError(result.error)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [itemId])

  useEffect(() => {
    return subscribeToComments((comment) => {
      if (comment.itemId !== itemId) return
      setComments((prev) => (prev.some((existing) => existing.id === comment.id) ? prev : [...prev, comment]))
    })
  }, [itemId])

  const handleSubmit = async () => {
    if (!userId || submitting) return
    if (!body.trim()) {
      setSubmitError('请先填写评论内容')
      return
    }
    setSubmitting(true)
    setSubmitError(null)
    const result = await addComment({
      itemId,
      taskType,
      userId,
      body,
      examLocation: examLocation || null,
      examDate: examDate || null,
    })
    setSubmitting(false)
    if (result.error || !result.comment) {
      setSubmitError(result.error ?? '评论发送失败，请稍后重试')
      return
    }
    setComments((prev) => (prev.some((existing) => existing.id === result.comment!.id) ? prev : [...prev, result.comment!]))
    setBody('')
    setExamLocation('')
    setExamDate('')
  }

  return (
    <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-gray-900">这道题的讨论 / 考场记录</h3>

      {loadError && <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">{loadError}</p>}

      {loading ? (
        <p className="text-sm text-gray-400">加载评论中…</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-gray-400">还没有人留言，快来记录一下有没有考到过这道题吧。</p>
      ) : (
        <ul className="space-y-2">
          {comments.map((comment) => (
            <li key={comment.id} className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-700">{USER_LABELS[comment.userId] ?? comment.userId}</span>
                <span className="text-xs text-gray-400">{new Date(comment.createdAt).toLocaleString('zh-CN')}</span>
              </div>
              <p className="mt-1 text-gray-700">{comment.body}</p>
              {(comment.examLocation || comment.examDate) && (
                <p className="mt-1 text-xs text-primary">
                  {comment.examLocation ? `考场：${comment.examLocation}` : ''}
                  {comment.examLocation && comment.examDate ? ' · ' : ''}
                  {comment.examDate ? `日期：${comment.examDate}` : ''}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      {userId ? (
        <div className="space-y-2 border-t border-gray-100 pt-3">
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            maxLength={2000}
            rows={3}
            placeholder="留下你的想法，或者记录一下这道题是否在真实考场遇到过……"
            className="w-full rounded-lg border border-gray-200 p-2 text-sm"
          />
          <div className="flex flex-wrap gap-2">
            <input
              value={examLocation}
              onChange={(event) => setExamLocation(event.target.value)}
              maxLength={100}
              placeholder="在哪里考过（可选）"
              className="flex-1 rounded-lg border border-gray-200 p-2 text-sm"
            />
            <input
              type="date"
              value={examDate}
              onChange={(event) => setExamDate(event.target.value)}
              className="rounded-lg border border-gray-200 p-2 text-sm"
            />
          </div>
          {submitError && <p className="text-xs text-red-600">{submitError}</p>}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {submitting ? '发送中…' : '发布评论'}
          </button>
        </div>
      ) : (
        <p className="border-t border-gray-100 pt-3 text-xs text-gray-400">未识别登录身份，暂时无法发表评论。</p>
      )}
    </div>
  )
}
