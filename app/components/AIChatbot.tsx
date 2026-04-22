'use client'

import { useState, useRef, useEffect } from 'react'

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
    { match: /约会|去哪|玩什么|出去/, reply: () => {
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
    }},

    // Gifts
    { match: /礼物|送什么|买什么|生日/, reply: () => {
      const gifts = [
        '手写信 + 定制相册，回忆杀直接拉满 📸',
        '对方最近念叨的东西（认真听很重要！）',
        '一起去旅行 / 演唱会，体验 > 物质 🎫',
        '定制小饰品（刻上日期或名字）💍',
        '亲手做的晚餐 + 蜡烛摆盘 🍝🕯️',
        '温馨的日常好物（香薰、眼罩、温水杯）',
      ]
      return `送礼的关键是"记得 ta 说过的话"🎁\n\n推荐：${rand(gifts)}`
    }},

    // Love words
    { match: /情话|甜蜜|表白|喜欢|告白/, reply: () => rand([
      '遇见你之前我没想过结婚，遇见你之后没想过别人 💕',
      '你是我见过最美的意外，也是我最想要的未来 ✨',
      '想把世界上最好的都给你，发现世界上最好的就是你 💝',
      '喜欢是乍见之欢，爱是久处不厌。而你，我两者都想要 💗',
      '从遇见你那天起，我的星空开始变得闪亮 🌟',
      '你是我的偏爱，也是我的例外 💕',
      '别人说"我为你摘下月亮"，我觉得月亮哪有你值钱 🌙',
      '风有归处，云有停处，我心有你处 🌸',
    ])},

    // Conflicts
    { match: /吵架|生气|矛盾|道歉|冷战/, reply: () => `处理矛盾小指南 💕\n\n1️⃣ 先冷静，别在气头上说狠话\n2️⃣ 换位思考，理解对方\n3️⃣ 说"我感到..."而不是"你总是..."\n4️⃣ 吵架不过夜，主动拥抱\n\n爱的本质是解决问题，不是互相指责 🤗` },

    // Long distance
    { match: /想念|思念|异地|距离/, reply: () => `异地恋小建议 💕\n\n📱 每天固定视频（仪式感！）\n🎬 一起线上看剧 / 游戏\n📅 提前规划下次见面日\n💌 偶尔寄小礼物制造惊喜\n\n距离产生的不是美，是期待见面的心跳 💓` },

    // Food
    { match: /吃什么|吃饭|美食|饿|晚餐|午餐|早餐/, reply: () => {
      const food = ['火锅 🍲', '烧烤 🥘', '日料 🍣', '披萨 🍕', '川菜 🌶️', '粤式早茶 🥟', '韩料 🥢', '泰式 🍛', '自己动手 👨‍🍳', '轻食沙拉 🥗']
      return `命运之轮转动... 今晚就 ${rand(food)}！🎲\n\n决定困难？试试网站的"今晚吃什么"🍽️`
    }},

    // Boredom
    { match: /无聊|没意思|干嘛|干什么/, reply: () => {
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
    }},

    // Feelings fading
    { match: /感情淡|不浪漫|没感觉|新鲜感/, reply: () => `感情是需要经营的 💕\n\n1️⃣ 制造仪式感：纪念日、小惊喜\n2️⃣ 保持新鲜：一起尝试新事物\n3️⃣ 常说"谢谢""我爱你"\n4️⃣ 保留独处的空间\n\n真正的爱情不是找到完美的人，而是一起变好 ✨` },

    // Tired / stressed
    { match: /压力|累|烦|难过|伤心|emo/, reply: () => `抱抱你 🤗\n\n💬 说出来，两个人一起扛\n🌿 做点放松的事：散步 / 泡澡 / 追剧\n💪 互相支持，也给彼此空间\n\n你不是一个人，有 ta 在 💕` },

    // Weekend
    { match: /周末|假期|放假/, reply: () => `周末仪式感安排 🌟\n\n🌅 早起一起吃顿好的早午餐\n📚 下午逛书店 / 咖啡馆\n🍽️ 晚上吃一家没去过的店\n🎬 夜晚窝着看一部电影\n\n好好过周末，是对感情的温柔 💕` },

    // Cheer up
    { match: /哄|开心|惊喜|高兴/, reply: () => `哄 ta 开心小绝招 🥰\n\n1. 说出 ta 最近的可爱之处（真诚夸赞）\n2. 做一件 ta 没想到的小事\n3. 亲自下厨 ta 爱吃的菜\n4. 一个温暖的拥抱 + "辛苦了"\n\n爱的表达不用贵，走心就好 💝` },

    // Love letter
    { match: /情书|写信|告白信/, reply: () => `亲爱的，\n\n从遇见你的那天起，每一个平凡的日子都开始发光。\n你的笑是我清晨的咖啡，你的声音是我入睡前的月亮。\n谢谢你出现，让我看见"爱"不是抽象的词，而是每天被你温柔对待的感觉。\n\n永远爱你的我 💕` },

    // Health
    { match: /健康|身体|运动|锻炼/, reply: () => `一起照顾身体 💪\n\n🏃 一起散步 / 慢跑，边运动边聊天\n🥗 互相监督吃健康餐\n💤 约定一起早睡\n🧘 一起做瑜伽 / 拉伸\n\n健康是送给对方最长久的礼物 💕` },

    // Greetings
    { match: /你好|hi|hello|在吗|早安|晚安/, reply: () => rand([
      '你好呀！💕 今天过得怎么样？',
      '嗨~ 小爱在呢，有什么想聊的？😊',
      '今天也是元气满满的一天呢！✨ 想聊点什么？',
      '抱抱 🤗 想说点什么我都听！',
    ])},

    // Thank / acknowledge
    { match: /谢谢|谢啦|thx|thank/, reply: () => rand([
      '不客气！有事随时找我 😊💕',
      '小爱能帮上忙就好~ 祝你们甜甜蜜蜜 🌸',
      '😊 两个人幸福就是我最开心的事啦！',
    ])},
  ]

  for (const r of rules) {
    if (r.match.test(s)) return r.reply()
  }

  // Use history to detect follow-up
  if (history.length > 2) {
    const recent = history.slice(-4).map(m => m.content).join(' ')
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
  content: '你好！我是你的 AI 小助手 💕\n\n可以问我：\n🎯 约会建议 · 🎁 礼物推荐\n💕 情话 · 🍽️ 今天吃什么\n😊 感情问题 · 💌 写情书\n\n聊点什么？',
  timestamp: Date.now(),
}

// ── Component ──────────────────────────────────────────────
export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([WELCOME])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  useEffect(() => { scrollToBottom() }, [messages, isLoading])

  const sendMessage = async (text?: string) => {
    const msg = (text || input).trim()
    if (!msg || isLoading) return

    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', content: msg, timestamp: Date.now() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    try {
      const recent = [...messages.slice(-10), userMsg].map(m => ({ role: m.role, content: m.content }))
      const response = await callAI(recent)
      setMessages(prev => [...prev, { id: `a-${Date.now()}`, role: 'assistant', content: response, timestamp: Date.now() }])
    } catch {
      const local = getLocalResponse(msg, messages)
      setMessages(prev => [...prev, { id: `a-${Date.now()}`, role: 'assistant', content: local, timestamp: Date.now() }])
    } finally {
      setIsLoading(false)
    }
  }

  const regenerate = async () => {
    // Find last user message + remove last assistant message, re-ask
    const lastUserIdx = [...messages].reverse().findIndex(m => m.role === 'user')
    if (lastUserIdx === -1) return
    const realIdx = messages.length - 1 - lastUserIdx
    const lastUser = messages[realIdx]
    // Remove everything after the last user msg
    const upTo = messages.slice(0, realIdx + 1)
    setMessages(upTo)
    setIsLoading(true)
    try {
      const recent = upTo.slice(-10).map(m => ({ role: m.role, content: m.content }))
      const response = await callAI(recent)
      setMessages(prev => [...prev, { id: `a-${Date.now()}`, role: 'assistant', content: response, timestamp: Date.now() }])
    } catch {
      const local = getLocalResponse(lastUser.content, upTo)
      setMessages(prev => [...prev, { id: `a-${Date.now()}`, role: 'assistant', content: local, timestamp: Date.now() }])
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

  if (!isOpen) {
    // Show unread indicator if there are saved messages
    const hasHistory = messages.length > 1
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center text-white text-2xl z-50 animate-bounce"
        aria-label="打开AI助手"
      >
        🤖
        {hasHistory && (
          <span className="absolute top-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full" />
        )}
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 max-w-[calc(100vw-3rem)] h-[600px] max-h-[80vh] bg-white rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden animate-fade-in dark:bg-slate-800">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-4 flex items-center justify-between text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-2xl">🤖</div>
          <div>
            <h3 className="font-bold">AI 情侣助手 · 小爱</h3>
            <p className="text-xs text-white/80">随时为你服务 · 聊天记录已保存</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={clearChat}
            className="text-white/80 hover:text-white hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center transition-all text-sm"
            title="清空聊天"
          >🗑️</button>
          <button onClick={() => setIsOpen(false)}
            className="text-white hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center transition-all"
          >×</button>
        </div>
      </div>

      {/* Quick Questions */}
      <div className="flex gap-2 p-2 bg-gray-50 border-b overflow-x-auto">
        {QUICK_QUESTIONS.map((q, i) => (
          <button key={i} onClick={() => sendMessage(q.text)}
            className="flex-shrink-0 px-3 py-1 bg-white rounded-full text-xs border border-gray-200 hover:border-pink-300 hover:bg-pink-50 transition-all"
          >{q.emoji} {q.text}</button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in group`}>
            <div className={`max-w-[82%] rounded-2xl px-4 py-3 relative ${
              msg.role === 'user'
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                : 'bg-white shadow-md text-gray-800'
            }`}>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              <div className={`flex items-center justify-between gap-2 mt-1 ${msg.role === 'user' ? 'text-white/70' : 'text-gray-500'}`}>
                <p className="text-xs">
                  {new Date(msg.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                </p>
                {msg.role === 'assistant' && msg.id !== 'welcome' && (
                  <button onClick={() => copyMessage(msg)}
                    className="text-xs hover:text-pink-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="复制"
                  >
                    {copiedId === msg.id ? '✓ 已复制' : '📋'}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start animate-fade-in">
            <div className="bg-white shadow-md rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Regenerate button */}
      {!isLoading && messages.length > 1 && messages[messages.length - 1].role === 'assistant' && messages[messages.length - 1].id !== 'welcome' && (
        <div className="px-4 py-1 bg-gray-50 border-t border-gray-100">
          <button onClick={regenerate}
            className="text-xs text-gray-500 hover:text-pink-500 flex items-center gap-1 transition-colors"
          >
            🔄 重新生成
          </button>
        </div>
      )}

      {/* Input */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex gap-2">
          <textarea
            value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
            placeholder="输入消息... (Enter发送)"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-200 resize-none text-sm"
            rows={1} disabled={isLoading}
          />
          <button onClick={() => sendMessage()} disabled={!input.trim() || isLoading}
            className="px-5 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >发送</button>
        </div>
      </div>
    </div>
  )
}
