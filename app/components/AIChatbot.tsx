'use client'

import { useState, useRef, useEffect } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '你好！我是你们的AI小助手 💕 有什么可以帮助你们的吗？',
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      // 使用免费的 HuggingFace Inference API
      const response = await fetch(
        'https://api-inference.huggingface.co/models/tiiuae/falcon-7b-instruct',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: `你是一个温暖、有爱心的AI助手，专门帮助情侣解决问题和提供建议。请用友好、温馨的语气回答。\n\n用户问题：${input.trim()}\n\n回答：`,
            parameters: {
              max_new_tokens: 200,
              temperature: 0.7,
              top_p: 0.9,
            },
          }),
        }
      )

      if (!response.ok) {
        throw new Error('API请求失败')
      }

      const data = await response.json()
      let aiResponse = data[0]?.generated_text || '抱歉，我现在有点累了，请稍后再试 😊'

      // 清理响应文本（提取实际回答部分）
      const answerIndex = aiResponse.indexOf('回答：')
      if (answerIndex !== -1) {
        aiResponse = aiResponse.substring(answerIndex + 3).trim()
      }
      const assistantMessage: Message = {
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error('AI响应错误:', error)

      // 降级到预设回复
      const fallbackResponses = [
        '我理解你的感受 💕 在感情中，沟通是最重要的。',
        '这是个很好的问题！建议你们坦诚地聊一聊彼此的想法。',
        '每段感情都有挑战，重要的是一起面对。我相信你们可以的！',
        '试着从对方的角度想一想，也许会有新的发现 💝',
        '记住，爱是需要用心经营的。小小的惊喜和关心都很重要！',
      ]

      const randomResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)]

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: randomResponse,
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center text-white text-2xl z-50 animate-bounce"
        aria-label="打开AI助手"
      >
        🤖
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 max-w-[calc(100vw-3rem)] h-[600px] max-h-[80vh] bg-white rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-4 flex items-center justify-between text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-2xl">
            🤖
          </div>
          <div>
            <h3 className="font-bold">AI 小助手</h3>
            <p className="text-xs text-white/80">在线 · 随时为你服务</p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-white hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center transition-all"
        >
          ×
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            } animate-fade-in`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                  : 'bg-white shadow-md text-gray-800'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <p
                className={`text-xs mt-1 ${
                  message.role === 'user' ? 'text-white/70' : 'text-gray-500'
                }`}
              >
                {message.timestamp.toLocaleTimeString('zh-CN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start animate-fade-in">
            <div className="bg-white shadow-md rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                <span
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0ms' }}
                ></span>
                <span
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '150ms' }}
                ></span>
                <span
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '300ms' }}
                ></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="输入消息... (Enter发送)"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-200 resize-none"
            rows={1}
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            发送
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          💡 我可以帮你解答问题、提供建议和陪你聊天
        </p>
      </div>
    </div>
  )
}
