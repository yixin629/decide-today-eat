import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

const SYSTEM_PROMPT = `你是"小爱"，一个温暖贴心的情侣AI助手。

特点：
- 温柔、体贴、善解人意
- 回答简洁有重点，2-4 句话
- 自然使用 emoji 💕
- 给实用建议而非空话
- 懂中国情侣的文化

能聊的话题：约会建议、礼物创意、情话、沟通技巧、今天吃什么、感情问题、日常陪伴。

用中文，语气亲切自然。`

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const userMessages = Array.isArray(body?.messages) ? body.messages : []
    if (userMessages.length === 0) {
      return NextResponse.json({ error: 'No messages' }, { status: 400 })
    }

    const GROQ_KEY = process.env.GROQ_API_KEY
    const CHATANYWHERE_KEY = process.env.CHATANYWHERE_API_KEY

    const apis: Array<{ url: string; headers: Record<string, string>; body: any }> = []

    if (GROQ_KEY && GROQ_KEY.length > 10) {
      apis.push({
        url: 'https://api.groq.com/openai/v1/chat/completions',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_KEY}` },
        body: {
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...userMessages],
          max_tokens: 500,
          temperature: 0.85,
        },
      })
    }

    if (CHATANYWHERE_KEY && CHATANYWHERE_KEY.length > 10) {
      apis.push({
        url: 'https://api.chatanywhere.tech/v1/chat/completions',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${CHATANYWHERE_KEY}` },
        body: {
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...userMessages],
          max_tokens: 500,
          temperature: 0.85,
        },
      })
    }

    for (const api of apis) {
      try {
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), 15000)
        const res = await fetch(api.url, {
          method: 'POST',
          headers: api.headers,
          body: JSON.stringify(api.body),
          signal: controller.signal,
        })
        clearTimeout(timer)
        if (res.ok) {
          const data = await res.json()
          const content = data?.choices?.[0]?.message?.content
          if (content) return NextResponse.json({ content })
        } else {
          // Continue to next provider on non-ok
          continue
        }
      } catch {
        continue
      }
    }

    return NextResponse.json({ error: 'All providers failed' }, { status: 503 })
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
