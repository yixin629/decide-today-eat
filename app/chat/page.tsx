'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import BackButton from '../components/BackButton'
import { useToast } from '../components/ToastProvider'

interface ChatMessage {
  id: string
  sender: string
  content: string
  message_type: string
  is_read: boolean
  created_at: string
}

// 快捷表情
const QUICK_EMOJIS = ['❤️', '😘', '🥰', '😍', '💕', '💗', '🤗', '😊', '😂', '🥺', '😭', '👍']

// 快捷消息
const QUICK_MESSAGES = ['想你了 💕', '在干嘛呀？', '吃饭了吗？', '爱你哦 ❤️', '晚安 🌙', '早安 ☀️']

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [showEmojis, setShowEmojis] = useState(false)
  const [showQuickMessages, setShowQuickMessages] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { showToast } = useToast()

  // 获取当前用户
  useEffect(() => {
    const user = localStorage.getItem('currentUser')
    if (!user) {
      window.location.href = '/login'
      return
    }
    setCurrentUser(user)
  }, [])

  // 滚动到底部
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // 加载消息
  const loadMessages = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(100)

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error('加载消息失败:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 标记消息为已读
  const markAsRead = useCallback(async () => {
    if (!currentUser) return

    try {
      await supabase
        .from('chat_messages')
        .update({ is_read: true })
        .neq('sender', currentUser)
        .eq('is_read', false)
    } catch (error) {
      console.error('标记已读失败:', error)
    }
  }, [currentUser])

  // 初始加载和实时订阅
  useEffect(() => {
    if (!currentUser) return

    loadMessages()

    // 订阅实时消息
    const channel = supabase
      .channel('chat_messages_channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage
          setMessages((prev) => [...prev, newMsg])

          // 如果不是自己发的消息，显示通知
          if (newMsg.sender !== currentUser) {
            // 播放提示音
            try {
              const audio = new Audio('/notification.mp3')
              audio.volume = 0.5
              audio.play().catch(() => {})
            } catch {}

            showToast(`${newMsg.sender}: ${newMsg.content.slice(0, 20)}...`, 'info')
          }
        }
      )
      .subscribe()

    // 标记已读
    markAsRead()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUser, loadMessages, markAsRead, showToast])

  // 消息更新后滚动到底部
  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // 计算未读消息
  useEffect(() => {
    if (!currentUser) return
    const unread = messages.filter((m) => m.sender !== currentUser && !m.is_read).length
    setUnreadCount(unread)
  }, [messages, currentUser])

  // 发送消息
  const sendMessage = async (content?: string) => {
    const messageContent = content || newMessage.trim()
    if (!messageContent || !currentUser || isSending) return

    setIsSending(true)
    setNewMessage('')
    setShowEmojis(false)
    setShowQuickMessages(false)

    try {
      const { error } = await supabase.from('chat_messages').insert({
        sender: currentUser,
        content: messageContent,
        message_type: 'text',
      })

      if (error) throw error
    } catch (error) {
      console.error('发送失败:', error)
      showToast('发送失败，请重试', 'error')
      setNewMessage(messageContent)
    } finally {
      setIsSending(false)
      inputRef.current?.focus()
    }
  }

  // 处理按键
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // 清空聊天记录
  const clearChat = async () => {
    if (!confirm('确定要清空所有聊天记录吗？这个操作不可恢复！')) return

    try {
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .gte('id', '00000000-0000-0000-0000-000000000000')

      if (error) throw error

      setMessages([])
      showToast('聊天记录已清空', 'success')
    } catch (error) {
      console.error('清空失败:', error)
      showToast('清空失败', 'error')
    }
  }

  // 格式化时间
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()

    if (isToday) {
      return date.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      })
    }

    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    const isYesterday = date.toDateString() === yesterday.toDateString()

    if (isYesterday) {
      return `昨天 ${date.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      })}`
    }

    return date.toLocaleDateString('zh-CN', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // 获取对方用户名
  const getPartnerName = () => {
    return currentUser === 'zyx' ? 'zly' : 'zyx'
  }

  // 获取头像
  const getAvatar = (sender: string) => {
    return sender === 'zyx' ? '👨' : '👩'
  }

  if (!currentUser) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-blue-100 flex items-center justify-center">
        <div className="text-xl">加载中...</div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-blue-100 flex flex-col">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm shadow-md sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BackButton />
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-xl">
                {getAvatar(getPartnerName())}
              </div>
              <div>
                <h1 className="font-bold text-gray-800">{getPartnerName()}</h1>
                <p className="text-xs text-green-500 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  在线
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={clearChat}
            className="text-gray-500 hover:text-red-500 transition-colors p-2"
            title="清空聊天"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 max-w-2xl mx-auto w-full">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <div className="text-6xl mb-4">💬</div>
            <p>还没有消息</p>
            <p className="text-sm">发送第一条消息开始聊天吧！</p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              const isMe = message.sender === currentUser
              const showAvatar = index === 0 || messages[index - 1]?.sender !== message.sender

              return (
                <div
                  key={message.id}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in`}
                >
                  <div
                    className={`flex items-end gap-2 max-w-[80%] ${isMe ? 'flex-row-reverse' : ''}`}
                  >
                    {/* Avatar */}
                    {showAvatar ? (
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${
                          isMe
                            ? 'bg-gradient-to-br from-blue-400 to-purple-500'
                            : 'bg-gradient-to-br from-pink-400 to-purple-500'
                        }`}
                      >
                        {getAvatar(message.sender)}
                      </div>
                    ) : (
                      <div className="w-8 flex-shrink-0"></div>
                    )}

                    {/* Message Bubble */}
                    <div
                      className={`rounded-2xl px-4 py-2 ${
                        isMe
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-br-sm'
                          : 'bg-white shadow-md text-gray-800 rounded-bl-sm'
                      }`}
                    >
                      <p className="break-words whitespace-pre-wrap">{message.content}</p>
                      <p className={`text-xs mt-1 ${isMe ? 'text-white/70' : 'text-gray-400'}`}>
                        {formatTime(message.created_at)}
                        {isMe && <span className="ml-1">{message.is_read ? '✓✓' : '✓'}</span>}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Quick Messages Panel */}
      {showQuickMessages && (
        <div className="bg-white border-t border-gray-200 p-3 max-w-2xl mx-auto w-full">
          <div className="flex flex-wrap gap-2">
            {QUICK_MESSAGES.map((msg, i) => (
              <button
                key={i}
                onClick={() => sendMessage(msg)}
                className="px-3 py-1.5 bg-pink-50 hover:bg-pink-100 rounded-full text-sm text-pink-600 transition-colors"
              >
                {msg}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Emoji Panel */}
      {showEmojis && (
        <div className="bg-white border-t border-gray-200 p-3 max-w-2xl mx-auto w-full">
          <div className="flex flex-wrap gap-2">
            {QUICK_EMOJIS.map((emoji, i) => (
              <button
                key={i}
                onClick={() => setNewMessage((prev) => prev + emoji)}
                className="w-10 h-10 text-2xl hover:bg-gray-100 rounded-lg transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="bg-white/90 backdrop-blur-sm border-t border-gray-200 p-3 sticky bottom-0">
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          {/* Quick Actions */}
          <button
            onClick={() => {
              setShowEmojis(!showEmojis)
              setShowQuickMessages(false)
            }}
            className={`p-2 rounded-full transition-colors ${
              showEmojis ? 'bg-pink-100 text-pink-600' : 'hover:bg-gray-100'
            }`}
          >
            😊
          </button>
          <button
            onClick={() => {
              setShowQuickMessages(!showQuickMessages)
              setShowEmojis(false)
            }}
            className={`p-2 rounded-full transition-colors ${
              showQuickMessages ? 'bg-pink-100 text-pink-600' : 'hover:bg-gray-100'
            }`}
          >
            ⚡
          </button>

          {/* Input */}
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="输入消息..."
            className="flex-1 px-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-pink-300 transition-all"
            disabled={isSending}
          />

          {/* Send Button */}
          <button
            onClick={() => sendMessage()}
            disabled={!newMessage.trim() || isSending}
            className="px-5 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? <span className="animate-spin">⏳</span> : '发送'}
          </button>
        </div>
      </div>

      {/* Unread Indicator */}
      {unreadCount > 0 && (
        <button
          onClick={scrollToBottom}
          className="fixed bottom-24 right-4 bg-pink-500 text-white px-3 py-1 rounded-full text-sm shadow-lg animate-bounce"
        >
          {unreadCount} 条新消息 ↓
        </button>
      )}
    </main>
  )
}
