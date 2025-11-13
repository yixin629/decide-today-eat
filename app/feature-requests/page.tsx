'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { useToast } from '../components/ToastProvider'
import BackButton from '../components/BackButton'
import LoadingSkeleton from '../components/LoadingSkeleton'

interface FeatureRequest {
  id: number
  title: string
  description: string
  requester: string
  status: 'pending' | 'completed' | 'rejected'
  priority: 'low' | 'medium' | 'high'
  completed_at: string | null
  created_at: string
  updated_at: string
}

export default function FeatureRequestsPage() {
  const toast = useToast()
  const [requests, setRequests] = useState<FeatureRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requester: 'zyx',
    priority: 'medium' as 'low' | 'medium' | 'high',
  })

  const loadRequests = useCallback(async () => {
    try {
      let query = supabase
        .from('feature_requests')
        .select('*')
        .order('created_at', { ascending: false })

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus)
      }

      const { data, error } = await query

      if (error) throw error
      setRequests(data || [])
    } catch (error) {
      console.error('加载申请失败:', error)
    } finally {
      setLoading(false)
    }
  }, [filterStatus])

  useEffect(() => {
    loadRequests()
  }, [loadRequests])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingId) {
        // 更新现有申请
        const { error } = await supabase
          .from('feature_requests')
          .update({
            title: formData.title,
            description: formData.description,
            priority: formData.priority,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingId)

        if (error) throw error
      } else {
        // 创建新申请
        const { error } = await supabase.from('feature_requests').insert([
          {
            ...formData,
            status: 'pending',
          },
        ])

        if (error) throw error
      }

      setShowForm(false)
      setEditingId(null)
      setFormData({
        title: '',
        description: '',
        requester: 'zyx',
        priority: 'medium',
      })
      toast.success('功能建议提交成功！')
      loadRequests()
    } catch (error) {
      console.error('提交失败:', error)
      toast.error('提交失败，请重试')
    }
  }

  const toggleStatus = async (id: number, currentStatus: string) => {
    let newStatus: string
    let completed_at: string | null = null

    if (currentStatus === 'pending') {
      newStatus = 'completed'
      completed_at = new Date().toISOString()
    } else if (currentStatus === 'completed') {
      newStatus = 'rejected'
    } else {
      newStatus = 'pending'
    }

    try {
      const { error } = await supabase
        .from('feature_requests')
        .update({
          status: newStatus,
          completed_at,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (error) throw error
      loadRequests()
    } catch (error) {
      console.error('更新状态失败:', error)
    }
  }

  const startEdit = (request: FeatureRequest) => {
    setEditingId(request.id)
    setFormData({
      title: request.title,
      description: request.description,
      requester: request.requester,
      priority: request.priority,
    })
    setShowForm(true)
  }

  const deleteRequest = async (id: number) => {
    if (!confirm('确定要删除这个申请吗？')) return

    try {
      const { error } = await supabase.from('feature_requests').delete().eq('id', id)

      if (error) throw error
      loadRequests()
    } catch (error) {
      console.error('删除失败:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500'
      case 'rejected':
        return 'bg-red-500'
      default:
        return 'bg-yellow-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return '✅ 已完成'
      case 'rejected':
        return '❌ 已拒绝'
      default:
        return '⏳ 待处理'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-500'
      case 'medium':
        return 'text-yellow-500'
      default:
        return 'text-gray-500'
    }
  }

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high':
        return '🔴 高'
      case 'medium':
        return '🟡 中'
      default:
        return '⚪ 低'
    }
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <BackButton href="/" text="返回首页" />

        {loading ? (
          <LoadingSkeleton type="list" count={4} />
        ) : (
          <>
            <div className="card">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">💡 功能申请箱</h1>
                <button
                  onClick={() => {
                    setShowForm(true)
                    setEditingId(null)
                    setFormData({
                      title: '',
                      description: '',
                      requester: 'zyx',
                      priority: 'medium',
                    })
                  }}
                  className="btn-primary"
                >
                  ➕ 新建申请
                </button>
              </div>

              {/* 筛选器 */}
              <div className="flex gap-4 mb-6">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    filterStatus === 'all'
                      ? 'bg-primary text-white'
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  全部 ({requests.length})
                </button>
                <button
                  onClick={() => setFilterStatus('pending')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    filterStatus === 'pending'
                      ? 'bg-yellow-500 text-white'
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  待处理
                </button>
                <button
                  onClick={() => setFilterStatus('completed')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    filterStatus === 'completed'
                      ? 'bg-green-500 text-white'
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  已完成
                </button>
                <button
                  onClick={() => setFilterStatus('rejected')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    filterStatus === 'rejected'
                      ? 'bg-red-500 text-white'
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  已拒绝
                </button>
              </div>

              {/* 申请表单 */}
              {showForm && (
                <div className="mb-6 p-6 bg-white/5 rounded-lg border border-white/10">
                  <h2 className="text-xl font-bold mb-4">
                    {editingId ? '✏️ 编辑申请' : '✨ 新建功能申请'}
                  </h2>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">功能标题 *</label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 focus:border-primary focus:outline-none"
                        placeholder="简短描述功能..."
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2">详细描述 *</label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 focus:border-primary focus:outline-none h-32"
                        placeholder="详细说明你想要的功能..."
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold mb-2">申请人</label>
                        <select
                          value={formData.requester}
                          onChange={(e) => setFormData({ ...formData, requester: e.target.value })}
                          className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 focus:border-primary focus:outline-none"
                          disabled={!!editingId}
                        >
                          <option value="zyx">zyx</option>
                          <option value="zly">zly</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold mb-2">优先级</label>
                        <select
                          value={formData.priority}
                          onChange={(e) =>
                            setFormData({ ...formData, priority: e.target.value as any })
                          }
                          className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 focus:border-primary focus:outline-none"
                        >
                          <option value="low">⚪ 低</option>
                          <option value="medium">🟡 中</option>
                          <option value="high">🔴 高</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <button type="submit" className="btn-primary flex-1">
                        {editingId ? '💾 保存' : '✉️ 提交'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowForm(false)
                          setEditingId(null)
                        }}
                        className="px-6 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 transition-colors"
                      >
                        取消
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* 申请列表 */}
              <div className="space-y-4">
                {requests.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <div className="text-6xl mb-4">📭</div>
                    <p>还没有任何申请，点击上方按钮创建第一个吧！</p>
                  </div>
                ) : (
                  requests.map((request) => (
                    <div
                      key={request.id}
                      className="p-6 bg-white/5 rounded-lg border border-white/10 hover:border-white/30 transition-all"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold">{request.title}</h3>
                            <span
                              className={`text-xs px-2 py-1 rounded ${getStatusColor(
                                request.status
                              )} text-white`}
                            >
                              {getStatusText(request.status)}
                            </span>
                            <span
                              className={`text-sm font-semibold ${getPriorityColor(
                                request.priority
                              )}`}
                            >
                              {getPriorityText(request.priority)}
                            </span>
                          </div>
                          <p className="text-gray-300 mb-3">{request.description}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            <span>👤 申请人: {request.requester}</span>
                            <span>
                              📅{' '}
                              {format(new Date(request.created_at), 'yyyy-MM-dd HH:mm', {
                                locale: zhCN,
                              })}
                            </span>
                            {request.completed_at && (
                              <span>
                                ✅ 完成于:{' '}
                                {format(new Date(request.completed_at), 'yyyy-MM-dd', {
                                  locale: zhCN,
                                })}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => toggleStatus(request.id, request.status)}
                            className="px-3 py-1 rounded bg-primary hover:bg-primary/80 transition-colors text-sm"
                            title="切换状态"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => startEdit(request)}
                            className="px-3 py-1 rounded bg-blue-500 hover:bg-blue-600 transition-colors text-sm"
                            title="编辑"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => deleteRequest(request.id)}
                            className="px-3 py-1 rounded bg-red-500 hover:bg-red-600 transition-colors text-sm"
                            title="删除"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
