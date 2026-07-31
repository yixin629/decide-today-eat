'use client'

import { useState, useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

const STORAGE_KEY = 'aiChatHistory_v2'
const MAX_HISTORY = 50

// ── Quick Questions ───────────────────────────────────────
const QUICK_QUESTIONS = [
  { emoji: '🍽️', text: '今天吃什么' },
  { emoji: '🎁', text: '送什么礼物好' },
  { emoji: '💕', text: '说句情话给ta' },
  { emoji: '🎯', text: '推荐约会活动' },
  { emoji: '😊', text: '感情淡了怎么办' },
  { emoji: '🌃', text: '周末干什么好' },
  { emoji: '🤗', text: '怎么哄ta开心' },
  { emoji: '💌', text: '写一段小情书' },
]

// ── API Call (uses server-side /api/chat to keep keys secret) ──
async function callAI(messages: { role: string; content: string }[]): Promise<string> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 15000)
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
      signal: controller.signal,
    })
    if (!res.ok) throw new Error('API_FAILED')
    const data = await res.json()
    if (data?.content) return data.content
    throw new Error('API_FAILED')
  } finally {
    clearTimeout(timer)
  }
}

// ── Expanded Local Smart Replies ──────────────────────────
function getLocalResponse(input: string, history: Message[]): string {
  const s = input.toLowerCase()

  const rand = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

  const rules: Array<{ match: RegExp; reply: () => string }> = [
    // Dating & activities
    {
      match: /约会|去哪|玩什么|出去/,
      reply: () => {
        const plan = [
          '咖啡馆 + 逛书店 📚☕',
          '密室逃脱 + 晚餐 🔐🍽️',
          '公园野餐 + 看日落 🧺🌅',
          '博物馆 + 文创小店 🏛️',
          '电影院 + 夜市小吃 🎬🍢',
          '海边散步 + 拍照 📸🌊',
          '游乐园 + 摩天轮 🎡',
          '剧本杀 + 夜宵 🎭',
        ]
        return `${rand(plan)}\n\n记得提前订位，带上好心情 💕`
      },
    },

    // Gifts
    {
      match: /礼物|送什么|买什么|生日/,
      reply: () => {
        const gifts = [
          '手写信 + 定制相册，回忆杀直接拉满 📸',
          '对方最近念叨的东西（认真听很重要！）',
          '一起去旅行 / 演唱会，体验 > 物质 🎫',
          '定制小饰品（刻上日期或名字）💍',
          '亲手做的晚餐 + 蜡烛摆盘 🍝🕯️',
          '温馨的日常好物（香薰、眼罩、温水杯）',
        ]
        return `送礼的关键是"记得 ta 说过的话"🎁\n\n推荐：${rand(gifts)}`
      },
    },

    // Love words
    {
      match: /情话|甜蜜|表白|喜欢|告白/,
      reply: () =>
        rand([
          '遇见你之前我没想过结婚，遇见你之后没想过别人 💕',
          '你是我见过最美的意外，也是我最想要的未来 ✨',
          '想把世界上最好的都给你，发现世界上最好的就是你 💝',
          '喜欢是乍见之欢，爱是久处不厌。而你，我两者都想要 💗',
          '从遇见你那天起，我的星空开始变得闪亮 🌟',
          '你是我的偏爱，也是我的例外 💕',
          '别人说"我为你摘下月亮"，我觉得月亮哪有你值钱 🌙',
          '风有归处，云有停处，我心有你处 🌸',
        ]),
    },

    // Conflicts
    {
      match: /吵架|生气|矛盾|道歉|冷战/,
      reply: () =>
        `处理矛盾小指南 💕\n\n1️⃣ 先冷静，别在气头上说狠话\n2️⃣ 换位思考，理解对方\n3️⃣ 说"我感到..."而不是"你总是..."\n4️⃣ 吵架不过夜，主动拥抱\n\n爱的本质是解决问题，不是互相指责 🤗`,
    },

    // Long distance
    {
      match: /想念|思念|异地|距离/,
      reply: () =>
        `异地恋小建议 💕\n\n📱 每天固定视频（仪式感！）\n🎬 一起线上看剧 / 游戏\n📅 提前规划下次见面日\n💌 偶尔寄小礼物制造惊喜\n\n距离产生的不是美，是期待见面的心跳 💓`,
    },

    // Food
    {
      match: /吃什么|吃饭|美食|饿|晚餐|午餐|早餐/,
      reply: () => {
        const food = [
          '火锅 🍲',
          '烧烤 🥘',
          '日料 🍣',
          '披萨 🍕',
          '川菜 🌶️',
          '粤式早茶 🥟',
          '韩料 🥢',
          '泰式 🍛',
          '自己动手 👨‍🍳',
          '轻食沙拉 🥗',
        ]
        return `命运之轮转动... 今晚就 ${rand(food)}！🎲\n\n决定困难？试试网站的"今晚吃什么"🍽️`
      },
    },

    // Boredom
    {
      match: /无聊|没意思|干嘛|干什么/,
      reply: () => {
        const ideas = [
          '一起玩网站上的五子棋或麻将 🀄',
          '互相画对方的画像（你画我猜）🎨',
          '选一部没看过的电影一起看 🎬',
          '计划下次旅行目的地 ✈️',
          '翻以前的照片回忆 📸',
          '一起学道新菜 👨‍🍳',
          '开盲盒 / 拼乐高 🎁',
        ]
        return `无聊？来点有趣的！✨\n\n推荐：${rand(ideas)}\n\n两个人在一起，做什么都不无聊 💕`
      },
    },

    // Feelings fading
    {
      match: /感情淡|不浪漫|没感觉|新鲜感/,
      reply: () =>
        `感情是需要经营的 💕\n\n1️⃣ 制造仪式感：纪念日、小惊喜\n2️⃣ 保持新鲜：一起尝试新事物\n3️⃣ 常说"谢谢""我爱你"\n4️⃣ 保留独处的空间\n\n真正的爱情不是找到完美的人，而是一起变好 ✨`,
    },

    // Tired / stressed
    {
      match: /压力|累|烦|难过|伤心|emo/,
      reply: () =>
        `抱抱你 🤗\n\n💬 说出来，两个人一起扛\n🌿 做点放松的事：散步 / 泡澡 / 追剧\n💪 互相支持，也给彼此空间\n\n你不是一个人，有 ta 在 💕`,
    },

    // Weekend
    {
      match: /周末|假期|放假/,
      reply: () =>
        `周末仪式感安排 🌟\n\n🌅 早起一起吃顿好的早午餐\n📚 下午逛书店 / 咖啡馆\n🍽️ 晚上吃一家没去过的店\n🎬 夜晚窝着看一部电影\n\n好好过周末，是对感情的温柔 💕`,
    },

    // Cheer up
    {
      match: /哄|开心|惊喜|高兴/,
      reply: () =>
        `哄 ta 开心小绝招 🥰\n\n1. 说出 ta 最近的可爱之处（真诚夸赞）\n2. 做一件 ta 没想到的小事\n3. 亲自下厨 ta 爱吃的菜\n4. 一个温暖的拥抱 + "辛苦了"\n\n爱的表达不用贵，走心就好 💝`,
    },

    // Love letter
    {
      match: /情书|写信|告白信/,
      reply: () =>
        `亲爱的，\n\n从遇见你的那天起，每一个平凡的日子都开始发光。\n你的笑是我清晨的咖啡，你的声音是我入睡前的月亮。\n谢谢你出现，让我看见"爱"不是抽象的词，而是每天被你温柔对待的感觉。\n\n永远爱你的我 💕`,
    },

    // Health
    {
      match: /健康|身体|运动|锻炼/,
      reply: () =>
        `一起照顾身体 💪\n\n🏃 一起散步 / 慢跑，边运动边聊天\n🥗 互相监督吃健康餐\n💤 约定一起早睡\n🧘 一起做瑜伽 / 拉伸\n\n健康是送给对方最长久的礼物 💕`,
    },

    // Greetings
    {
      match: /你好|hi|hello|在吗|早安|晚安/,
      reply: () =>
        rand([
          '你好呀！💕 今天过得怎么样？',
          '嗨~ 小爱在呢，有什么想聊的？😊',
          '今天也是元气满满的一天呢！✨ 想聊点什么？',
          '抱抱 🤗 想说点什么我都听！',
        ]),
    },

    // Thank / acknowledge
    {
      match: /谢谢|谢啦|thx|thank/,
      reply: () =>
        rand([
          '不客气！有事随时找我 😊💕',
          '小爱能帮上忙就好~ 祝你们甜甜蜜蜜 🌸',
          '😊 两个人幸福就是我最开心的事啦！',
        ]),
    },
  ]

  for (const r of rules) {
    if (r.match.test(s)) return r.reply()
  }

  // Use history to detect follow-up
  if (history.length > 2) {
    const recent = history
      .slice(-4)
      .map((m) => m.content)
      .join(' ')
    if (/好的|嗯|谢/.test(recent)) {
      return '很高兴能帮上忙~ 还有什么想聊的吗？😊💕'
    }
  }

  // Default empathetic responses
  return rand([
    '我听到了 💕 能再多说一点吗？我想更理解你的感受',
    '这个问题挺有意思的！可以说说具体情况吗？😊',
    '感情中最重要的是沟通。具体发生了什么？💝',
    '每段感情都是独特的，告诉我你的情况，一起分析看看 🤗',
    '嗯嗯，我在呢。你愿意的话，可以跟我聊聊细节 💕',
  ])
}

// ── Welcome Message ──
const WELCOME: Message = {
  id: 'welcome',
  role: 'assistant',
  content:
    '你好！我是你的 AI 小助手 💕\n\n可以问我：\n🎯 约会建议 · 🎁 礼物推荐\n💕 情话 · 🍽️ 今天吃什么\n😊 感情问题 · 💌 写情书\n\n聊点什么？',
  timestamp: Date.now(),
}

// ── Component ──────────────────────────────────────────────
export default function AIChatbot() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([WELCOME])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const triggerButtonRef = useRef<HTMLButtonElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLElement>(null)
  const shouldRestoreTriggerFocusRef = useRef(false)
  const hideFloatingAssistant =
    pathname === '/login' || pathname === '/chat' || pathname.startsWith('/chat/')

  // Load history on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as Message[]
        if (parsed.length > 0) setMessages(parsed)
      }
    } catch {}
  }, [])

  // Persist history on change
  useEffect(() => {
    try {
      // Only persist if we have real messages beyond the welcome
      if (messages.length > 1 || messages[0]?.id !== 'welcome') {
        const trimmed = messages.slice(-MAX_HISTORY)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
      }
    } catch {}
  }, [messages])

  const scrollToBottom = () => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    messagesEndRef.current?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' })
  }
  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  useEffect(() => {
    if (hideFloatingAssistant) {
      setIsOpen(false)
    }
  }, [hideFloatingAssistant])

  useEffect(() => {
    if (isOpen || !shouldRestoreTriggerFocusRef.current) return

    shouldRestoreTriggerFocusRef.current = false
    if (hideFloatingAssistant) return

    const focusFrame = window.requestAnimationFrame(() => triggerButtonRef.current?.focus())
    return () => window.cancelAnimationFrame(focusFrame)
  }, [hideFloatingAssistant, isOpen])

  useEffect(() => {
    if (!isOpen || hideFloatingAssistant) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const focusFrame = window.requestAnimationFrame(() => closeButtonRef.current?.focus())

    const handleDialogKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
        return
      }

      if (event.key !== 'Tab' || !dialogRef.current) return
      const focusableElements = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      )
      if (focusableElements.length === 0) {
        event.preventDefault()
        return
      }

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]
      if (
        event.shiftKey &&
        (document.activeElement === firstElement ||
          !dialogRef.current.contains(document.activeElement))
      ) {
        event.preventDefault()
        lastElement.focus()
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }

    window.addEventListener('keydown', handleDialogKeyDown)
    return () => {
      window.cancelAnimationFrame(focusFrame)
      window.removeEventListener('keydown', handleDialogKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [hideFloatingAssistant, isOpen])

  const sendMessage = async (text?: string) => {
    const msg = (text || input).trim()
    if (!msg || isLoading) return

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: msg,
      timestamp: Date.now(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    try {
      const recent = [...messages.slice(-10), userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }))
      const response = await callAI(recent)
      setMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: 'assistant', content: response, timestamp: Date.now() },
      ])
    } catch {
      const local = getLocalResponse(msg, messages)
      setMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: 'assistant', content: local, timestamp: Date.now() },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const regenerate = async () => {
    // Find last user message + remove last assistant message, re-ask
    const lastUserIdx = [...messages].reverse().findIndex((m) => m.role === 'user')
    if (lastUserIdx === -1) return
    const realIdx = messages.length - 1 - lastUserIdx
    const lastUser = messages[realIdx]
    // Remove everything after the last user msg
    const upTo = messages.slice(0, realIdx + 1)
    setMessages(upTo)
    setIsLoading(true)
    try {
      const recent = upTo.slice(-10).map((m) => ({ role: m.role, content: m.content }))
      const response = await callAI(recent)
      setMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: 'assistant', content: response, timestamp: Date.now() },
      ])
    } catch {
      const local = getLocalResponse(lastUser.content, upTo)
      setMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: 'assistant', content: local, timestamp: Date.now() },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const copyMessage = async (msg: Message) => {
    try {
      await navigator.clipboard.writeText(msg.content)
      setCopiedId(msg.id)
      setTimeout(() => setCopiedId(null), 1500)
    } catch {}
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearChat = () => {
    if (!window.confirm('确定清空聊天记录吗？')) return
    setMessages([WELCOME])
    localStorage.removeItem(STORAGE_KEY)
  }

  if (hideFloatingAssistant) return null

  if (!isOpen) {
    // Show unread indicator if there are saved messages
    const hasHistory = messages.length > 1
    return (
      <button
        ref={triggerButtonRef}
        type="button"
        onClick={() => {
          shouldRestoreTriggerFocusRef.current = true
          setIsOpen(true)
        }}
        className="fixed bottom-[calc(env(safe-area-inset-bottom)+4.75rem)] right-3 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-xl text-white shadow-lg transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-xl sm:bottom-6 sm:right-6 sm:h-14 sm:w-14 sm:text-2xl"
        aria-label="打开 AI 助手"
        aria-haspopup="dialog"
        aria-controls="ai-chatbot-dialog"
      >
        <span aria-hidden="true">🤖</span>
        {hasHistory && (
          <span
            className="absolute right-0 top-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500"
            aria-hidden="true"
          />
        )}
      </button>
    )
  }

  return (
    <section
      ref={dialogRef}
      id="ai-chatbot-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-chatbot-title"
      className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-[70] flex h-[calc(100dvh-1.5rem)] max-h-[42rem] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl animate-fade-in dark:border-slate-700 dark:bg-slate-900 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:h-[600px] sm:max-h-[80vh] sm:w-96"
    >
      {/* Header */}
      <div className="flex items-center justify-between bg-gradient-to-r from-primary to-secondary p-3 text-white sm:p-4">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 text-2xl"
            aria-hidden="true"
          >
            🤖
          </div>
          <div className="min-w-0">
            <h2 id="ai-chatbot-title" className="truncate font-bold">
              AI 情侣助手 · 小爱
            </h2>
            <p className="text-xs text-white/80">随时为你服务 · 聊天记录已保存</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            ref={closeButtonRef}
            type="button"
            onClick={clearChat}
            className="flex h-9 w-9 items-center justify-center rounded-full text-sm text-white/80 transition-colors hover:bg-white/20 hover:text-white"
            title="清空聊天"
            aria-label="清空聊天记录"
          >
            <span aria-hidden="true">🗑️</span>
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-white transition-colors hover:bg-white/20"
            aria-label="关闭 AI 助手"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
      </div>

      {/* Quick Questions */}
      <div
        className="flex gap-2 overflow-x-auto border-b border-gray-200 bg-gray-50 p-2 dark:border-slate-700 dark:bg-slate-950"
        aria-label="快捷问题"
      >
        {QUICK_QUESTIONS.map((q, i) => (
          <button
            key={i}
            type="button"
            onClick={() => sendMessage(q.text)}
            className="flex-shrink-0 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 transition-colors hover:border-primary/40 hover:bg-primary/5 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <span aria-hidden="true">{q.emoji}</span> {q.text}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div
        className="flex-1 space-y-4 overflow-y-auto bg-gray-50 p-4 dark:bg-slate-950"
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        aria-busy={isLoading}
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in group`}
          >
            <div
              className={`max-w-[82%] rounded-2xl px-4 py-3 relative ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-primary to-secondary text-white'
                  : 'bg-white text-gray-800 shadow-sm dark:bg-slate-800 dark:text-slate-100'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              <div
                className={`flex items-center justify-between gap-2 mt-1 ${msg.role === 'user' ? 'text-white/70' : 'text-gray-500'}`}
              >
                <p className="text-xs">
                  {new Date(msg.timestamp).toLocaleTimeString('zh-CN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
                {msg.role === 'assistant' && msg.id !== 'welcome' && (
                  <button
                    onClick={() => copyMessage(msg)}
                    type="button"
                    className="text-xs opacity-0 transition-opacity hover:text-primary group-hover:opacity-100 focus-visible:opacity-100"
                    title="复制"
                    aria-label="复制这条回复"
                  >
                    {copiedId === msg.id ? '✓ 已复制' : '📋'}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div
            className="flex justify-start animate-fade-in"
            role="status"
            aria-label="AI 正在回复"
          >
            <div className="rounded-2xl bg-white px-4 py-3 shadow-sm dark:bg-slate-800">
              <div className="flex gap-1">
                <span
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0ms' }}
                />
                <span
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '150ms' }}
                />
                <span
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '300ms' }}
                />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Regenerate button */}
      {!isLoading &&
        messages.length > 1 &&
        messages[messages.length - 1].role === 'assistant' &&
        messages[messages.length - 1].id !== 'welcome' && (
          <div className="border-t border-gray-100 bg-gray-50 px-4 py-1 dark:border-slate-700 dark:bg-slate-950">
            <button
              type="button"
              onClick={regenerate}
              className="flex items-center gap-1 text-xs text-gray-500 transition-colors hover:text-primary"
            >
              🔄 重新生成
            </button>
          </div>
        )}

      {/* Input */}
      <div className="border-t border-gray-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900 sm:p-4">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息... (Enter发送)"
            className="min-w-0 flex-1 resize-none rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            rows={1}
            maxLength={2000}
            disabled={isLoading}
            aria-label="发送给 AI 助手的消息"
          />
          <button
            type="button"
            onClick={() => sendMessage()}
            disabled={!input.trim() || isLoading}
            className="rounded-xl bg-gradient-to-r from-primary to-secondary px-4 py-2 font-semibold text-white transition-shadow hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 sm:px-5"
          >
            发送
          </button>
        </div>
      </div>
    </section>
  )
}
