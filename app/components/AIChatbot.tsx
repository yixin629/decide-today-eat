'use client'

import { useState, useRef, useEffect } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

// 系统提示词
const SYSTEM_PROMPT = `你是一个温暖贴心的情侣AI助手，名叫"小爱"。你的任务是帮助情侣们解决感情问题、提供约会建议、推荐礼物、分享情话等。

你的特点：
- 温柔、体贴、善解人意
- 回答简洁但有深度，通常2-4句话
- 适当使用emoji让对话更有趣 💕
- 给出实用的建议，而不是空泛的话
- 理解中国情侣的文化和习惯

你可以帮助的话题：
- 约会地点和活动建议
- 送礼物的创意
- 如何表白或说情话
- 处理感情中的小矛盾
- 增进感情的方法
- 今天吃什么

请用中文回复，语气要亲切自然。`

// 快捷问题
const QUICK_QUESTIONS = [
  { emoji: '🍽️', text: '今天吃什么' },
  { emoji: '🎁', text: '送什么礼物好' },
  { emoji: '💕', text: '说句情话给ta' },
  { emoji: '🎯', text: '推荐约会活动' },
  { emoji: '😊', text: '感情淡了怎么办' },
]

// 使用免费的 AI API (通过代理)
async function callAI(messages: { role: string; content: string }[]): Promise<string> {
  // 使用多个免费 API 作为备选
  const CHATANYWHERE_KEY = process.env.NEXT_PUBLIC_CHATANYWHERE_KEY || ''
  const GROQ_KEY = process.env.NEXT_PUBLIC_GROQ_KEY || ''

  const APIs = [
    {
      // 免费的 GPT API 代理
      url: 'https://api.chatanywhere.tech/v1/chat/completions',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${CHATANYWHERE_KEY || 'sk-free-api-key'}`,
      },
      body: {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
        max_tokens: 500,
        temperature: 0.8,
      },
    },
    {
      // 备用：使用 Groq 免费 API
      url: 'https://api.groq.com/openai/v1/chat/completions',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_KEY || 'gsk_free'}`,
      },
      body: {
        model: 'mixtral-8x7b-32768',
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
        max_tokens: 500,
        temperature: 0.8,
      },
    },
  ]

  // 尝试调用 API
  for (const api of APIs) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10秒超时

      const response = await fetch(api.url, {
        method: 'POST',
        headers: api.headers,
        body: JSON.stringify(api.body),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (response.status === 401) {
        console.error('AI API unauthorized:', api.url)
        continue
      }

      if (response.ok) {
        const data = await response.json()
        if (data.choices?.[0]?.message?.content) {
          return data.choices[0].message.content
        }
      }
    } catch {
      // 继续尝试下一个 API
      continue
    }
  }

  // 所有 API 都失败，使用本地智能回复
  throw new Error('API_FAILED')
}

// 本地智能回复（作为备用）
function getLocalResponse(input: string, conversationHistory: Message[]): string {
  const lowerInput = input.toLowerCase()

  // 关键词匹配的智能回复
  const responses: Record<string, () => string> = {
    '约会|去哪|玩什么': () => {
      const places = [
        '咖啡厅',
        '电影院',
        '公园野餐',
        '密室逃脱',
        '剧本杀',
        '博物馆',
        '游乐园',
        '海边',
        '山顶看日落',
      ]
      const activities = ['一起做饭', '打游戏', '看星星', '逛书店', '骑自行车', '拍照片']
      return `约会建议来啦！💕\n\n📍 地点：${
        places[Math.floor(Math.random() * places.length)]
      }\n🎯 活动：${
        activities[Math.floor(Math.random() * activities.length)]
      }\n\n重要的不是去哪，而是和谁一起 ✨`
    },
    '礼物|送什么|买什么': () => {
      const gifts = [
        '手写信+定制相册，记录你们的美好瞬间 📸',
        'ta最近提到想要的东西（认真观察很重要！）',
        '一起体验的活动券，比如旅行、演唱会 🎫',
        '实用的贴心物品，比如围巾、护手霜 🧣',
        '有特殊意义的定制饰品 💍',
      ]
      return `送礼物的关键是"用心"！🎁\n\n建议：${
        gifts[Math.floor(Math.random() * gifts.length)]
      }\n\n记住：最好的礼物是你记得ta说过的话 💝`
    },
    '情话|甜蜜|表白|喜欢': () => {
      const quotes = [
        '遇见你之前，我没想过结婚；遇见你之后，没想过别人 💕',
        '你是我见过最美的意外，也是我最想要的未来 ✨',
        '我想把世界上最好的都给你，却发现世界上最好的就是你 💝',
        '喜欢是乍见之欢，爱是久处不厌。而你，我两者都想要 💗',
        '从遇见你那天起，我的星空开始变得闪亮 🌟',
        '你是我的例外，也是我的偏爱 💕',
      ]
      return quotes[Math.floor(Math.random() * quotes.length)]
    },
    '吵架|生气|矛盾|道歉': () => {
      return `处理矛盾小建议 💕\n\n1️⃣ 先冷静，不要在气头上说伤人的话\n2️⃣ 换位思考，理解对方的感受\n3️⃣ 主动沟通，说"我觉得..."而不是"你总是..."\n4️⃣ 吵架不过夜，睡前和好\n\n爱一个人就是愿意为ta改变 🤗`
    },
    '想念|思念|异地': () => {
      return `思念是爱的证明 💕\n\n异地恋建议：\n📱 每天固定时间视频\n🎬 一起在线看电影\n📅 规划下次见面的计划\n💌 偶尔写封信或寄小礼物\n\n距离产生的不是美，是期待见面的心跳 💓`
    },
    '吃什么|吃饭|美食|饿': () => {
      const foods = [
        '火锅🍲',
        '烧烤🥘',
        '日料🍣',
        '披萨🍕',
        '中餐🍜',
        '韩国料理🥘',
        '泰国菜🍛',
        '自己做饭👨‍🍳',
      ]
      const food = foods[Math.floor(Math.random() * foods.length)]
      return `命运之轮转动...今天吃 ${food}！🎲\n\n或者试试网站的"今晚吃什么"功能，让缘分来决定 😋`
    },
    '无聊|没意思|干嘛': () => {
      const activities = [
        '一起玩本站的五子棋或记忆游戏 🎮',
        '互相画对方的画像（你画我猜）🎨',
        '一起看一部电影或综艺 🎬',
        '计划下次旅行目的地 ✈️',
        '翻看以前的照片回忆往事 📸',
        '一起做一道新菜 👨‍🍳',
      ]
      return `无聊？来点有趣的！✨\n\n建议：${
        activities[Math.floor(Math.random() * activities.length)]
      }\n\n两个人在一起，做什么都不无聊 💕`
    },
    '感情淡|不浪漫|没感觉': () => {
      return `感情需要经营 💕\n\n小建议：\n1️⃣ 制造仪式感：记住重要日子，准备小惊喜\n2️⃣ 保持新鲜感：尝试新事物，一起学习\n3️⃣ 真诚沟通：说出"我爱你"，表达感谢\n4️⃣ 保留独处时间：距离产生美\n\n爱情不是找到完美的人，是一起变得更好 ✨`
    },
    '压力|累|烦|难过|伤心': () => {
      return `抱抱你 🤗\n\n感到压力时：\n💬 和ta分享你的感受，两人分担\n🌿 一起做放松的事：散步、看剧、吃美食\n💪 互相支持，但也给彼此空间\n\n你不是一个人在战斗，有我们陪着你 💕`
    },
  }

  // 匹配关键词
  for (const [pattern, getResponse] of Object.entries(responses)) {
    const regex = new RegExp(pattern, 'i')
    if (regex.test(lowerInput)) {
      return getResponse()
    }
  }

  // 根据对话历史给出更智能的回复
  if (conversationHistory.length > 2) {
    const recentTopics = conversationHistory
      .slice(-4)
      .map((m) => m.content)
      .join(' ')
    if (recentTopics.includes('谢') || recentTopics.includes('好的')) {
      return '不客气！有任何问题随时问我 😊 祝你们幸福甜蜜 💕'
    }
  }

  // 默认回复
  const defaults = [
    '我理解你的感受 💕 能具体说说是什么情况吗？我来帮你想想办法',
    '这个问题很好！你可以告诉我更多细节吗？比如你们的相处情况 😊',
    '感情中最重要的是真诚沟通。有什么具体想聊的话题吗？💝',
    '每段感情都是独特的。说说你的情况，我们一起分析 🤗',
  ]

  return defaults[Math.floor(Math.random() * defaults.length)]
}

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        '你好！我是你们的AI小助手 💕\n\n我可以帮你：\n🎯 约会建议\n🎁 礼物推荐\n💕 情话大全\n🍽️ 今天吃什么\n😊 解答情感问题\n\n有什么可以帮你的？',
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

  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim()
    if (!messageText || isLoading) return

    const userMessage: Message = {
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      // 准备对话历史（最近5轮对话）
      const recentMessages = [...messages.slice(-10), userMessage].map((m) => ({
        role: m.role,
        content: m.content,
      }))

      // 尝试调用 AI API
      const response = await callAI(recentMessages)

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: response,
          timestamp: new Date(),
        },
      ])
    } catch {
      // API 失败，使用本地智能回复
      const localResponse = getLocalResponse(messageText, messages)

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: localResponse,
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

  const clearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content:
          '聊天记录已清空 ✨\n\n我可以帮你：约会建议、礼物推荐、情话大全、解答情感问题等。有什么想问的？',
        timestamp: new Date(),
      },
    ])
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
            <h3 className="font-bold">AI 情侣助手</h3>
            <p className="text-xs text-white/80">在线 · 随时为你服务</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={clearChat}
            className="text-white/80 hover:text-white hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center transition-all text-sm"
            title="清空聊天"
          >
            🗑️
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="text-white hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center transition-all"
          >
            ×
          </button>
        </div>
      </div>

      {/* Quick Questions */}
      <div className="flex gap-2 p-2 bg-gray-50 border-b overflow-x-auto">
        {QUICK_QUESTIONS.map((q, i) => (
          <button
            key={i}
            onClick={() => sendMessage(q.text)}
            className="flex-shrink-0 px-3 py-1 bg-white rounded-full text-xs border border-gray-200 hover:border-pink-300 hover:bg-pink-50 transition-all"
          >
            {q.emoji} {q.text}
          </button>
        ))}
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
            onClick={() => sendMessage()}
            disabled={!input.trim() || isLoading}
            className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            发送
          </button>
        </div>
      </div>
    </div>
  )
}
