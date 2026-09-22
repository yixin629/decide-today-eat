'use client'

import { useEffect, useMemo, useState } from 'react'
import { loadAllAttempts, subscribeToAttempts } from '../lib/attempt-repository'
import { loadRecentComments, subscribeToComments } from '../lib/comment-repository'
import { getTaskTypeMeta } from '../lib/taskTypes'
import type { AttemptRecord, PracticeComment } from '../types'

const USER_LABELS: Record<string, string> = { zyx: 'ZYX', zly: 'ZLY' }

type FeedEntry =
  | { kind: 'attempt'; at: string; attempt: AttemptRecord }
  | { kind: 'comment'; at: string; comment: PracticeComment }

export default function CommunityFeed({ currentUserId }: { currentUserId: string | null }) {
  const [attempts, setAttempts] = useState<AttemptRecord[]>([])
  const [comments, setComments] = useState<PracticeComment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([loadAllAttempts(50), loadRecentComments(30)]).then(([attemptsResult, commentsResult]) => {
      if (cancelled) return
      setAttempts(attemptsResult.attempts)
      setComments(commentsResult.comments)
      setError(attemptsResult.error ?? commentsResult.error)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const unsubscribeAttempts = subscribeToAttempts((attempt) => {
      setAttempts((prev) => (prev.some((existing) => existing.id === attempt.id) ? prev : [attempt, ...prev].slice(0, 50)))
    })
    const unsubscribeComments = subscribeToComments((comment) => {
      setComments((prev) => (prev.some((existing) => existing.id === comment.id) ? prev : [comment, ...prev].slice(0, 30)))
    })
    return () => {
      unsubscribeAttempts()
      unsubscribeComments()
    }
  }, [])

  const feed = useMemo<FeedEntry[]>(() => {
    const attemptEntries: FeedEntry[] = attempts.map((attempt) => ({ kind: 'attempt', at: attempt.createdAt, attempt }))
    const commentEntries: FeedEntry[] = comments.map((comment) => ({ kind: 'comment', at: comment.createdAt, comment }))
    return [...attemptEntries, ...commentEntries].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
  }, [attempts, comments])

  if (loading) {
    return <p className="text-sm text-gray-400">加载共享动态中…</p>
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">ZYX 与 ZLY 的最近练习与讨论，实时更新。</p>
      {error && <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">{error}</p>}
      {feed.length === 0 ? (
        <p className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-400">
          还没有任何共享记录，完成一次练习或发一条评论试试。
        </p>
      ) : (
        <ul className="space-y-2">
          {feed.map((entry) =>
            entry.kind === 'attempt' ? (
              <li key={`attempt-${entry.attempt.id}`} className="rounded-lg border border-gray-200 bg-white p-3 text-sm shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-800">
                    {USER_LABELS[entry.attempt.userId ?? ''] ?? entry.attempt.userId ?? '未知用户'}
                    {entry.attempt.userId === currentUserId && <span className="ml-1 text-xs text-primary">（我）</span>}
                    <span className="ml-2 text-gray-400">完成了 {getTaskTypeMeta(entry.attempt.taskType).shortLabel}</span>
                  </span>
                  <span className="text-xs text-gray-400">{new Date(entry.attempt.createdAt).toLocaleString('zh-CN')}</span>
                </div>
                <p className="mt-1 text-xs text-gray-500">{entry.attempt.summary}</p>
              </li>
            ) : (
              <li key={`comment-${entry.comment.id}`} className="rounded-lg border border-blue-100 bg-blue-50/50 p-3 text-sm shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-800">
                    {USER_LABELS[entry.comment.userId] ?? entry.comment.userId}
                    {entry.comment.userId === currentUserId && <span className="ml-1 text-xs text-primary">（我）</span>}
                    <span className="ml-2 text-gray-400">评论了 {getTaskTypeMeta(entry.comment.taskType).shortLabel}</span>
                  </span>
                  <span className="text-xs text-gray-400">{new Date(entry.comment.createdAt).toLocaleString('zh-CN')}</span>
                </div>
                <p className="mt-1 text-gray-700">{entry.comment.body}</p>
                {(entry.comment.examLocation || entry.comment.examDate) && (
                  <p className="mt-1 text-xs text-primary">
                    {entry.comment.examLocation ? `考场：${entry.comment.examLocation}` : ''}
                    {entry.comment.examLocation && entry.comment.examDate ? ' · ' : ''}
                    {entry.comment.examDate ? `日期：${entry.comment.examDate}` : ''}
                  </p>
                )}
              </li>
            )
          )}
        </ul>
      )}
    </div>
  )
}
