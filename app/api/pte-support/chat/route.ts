import { NextResponse } from 'next/server'
import { authenticatedUser } from '@/lib/pte-commercial/server/auth'
import { commercialConfig } from '@/lib/pte-commercial/server/config'

export const runtime = 'nodejs'

interface ChatMessage { role: 'user' | 'assistant'; content: string }

const SYSTEM_PROMPT = `你是 PTE 学习平台内的 AI 助教，不是真人客服。
只回答 PTE Academic 备考、英语学习、平台使用和常见故障排查问题。默认使用简洁中文，需要时提供英文例句。
必须遵守：
1. 清楚区分练习估分与 Pearson 官方成绩，不声称与 Pearson 存在官方合作，不保证分数、签证或录取结果。
2. 不索要密码、银行卡、身份证件或完整支付信息；账号、退款和隐私问题引导用户提交人工工单。
3. 不提供、搜集或复述来源不明的回忆题、泄题或受版权保护的完整题库；可生成原创练习。
4. 不确定时明确说明，不编造考试政策、平台状态或工单处理结果。
5. 回答尽量给出可执行的下一步；平台故障建议附上页面、操作步骤、预期结果和实际结果后提交工单。`

function completion(data: unknown) {
  if (!data || typeof data !== 'object' || !('choices' in data)) return null
  const choices = (data as { choices?: unknown }).choices
  if (!Array.isArray(choices) || !choices[0] || typeof choices[0] !== 'object') return null
  const message = (choices[0] as { message?: unknown }).message
  if (!message || typeof message !== 'object') return null
  const content = (message as { content?: unknown }).content
  return typeof content === 'string' && content.trim() ? content : null
}

function parseMessages(value: unknown): ChatMessage[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > 16) return null
  let total = 0
  const result: ChatMessage[] = []
  for (const item of value) {
    if (!item || typeof item !== 'object') return null
    const { role, content } = item as { role?: unknown; content?: unknown }
    if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string') return null
    const text = content.trim()
    if (!text || text.length > 1800) return null
    total += text.length
    if (total > 7000) return null
    result.push({ role, content: text })
  }
  return result
}

export async function POST(request: Request) {
  if (process.env.PTE_SUPPORT_AI_ENABLED !== 'true') return NextResponse.json({ error: 'AI 助教尚未开启。' }, { status: 404 })
  if (commercialConfig().enabled && !(await authenticatedUser(request))) return NextResponse.json({ error: '请先登录 PTE 正式账号。' }, { status: 401 })

  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ error: '请求格式无效。' }, { status: 400 }) }
  const messages = parseMessages(body && typeof body === 'object' ? (body as { messages?: unknown }).messages : null)
  if (!messages) return NextResponse.json({ error: '对话内容无效或过长。' }, { status: 400 })

  const providers = [
    process.env.GROQ_API_KEY ? { url: 'https://api.groq.com/openai/v1/chat/completions', key: process.env.GROQ_API_KEY, model: 'groq/compound' } : null,
    process.env.CHATANYWHERE_API_KEY ? { url: 'https://api.chatanywhere.tech/v1/chat/completions', key: process.env.CHATANYWHERE_API_KEY, model: 'gpt-3.5-turbo' } : null,
  ].filter((provider): provider is { url: string; key: string; model: string } => Boolean(provider?.key && provider.key.length > 10))

  for (const provider of providers) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 20000)
    try {
      const response = await fetch(provider.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${provider.key}` },
        body: JSON.stringify({ model: provider.model, messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages], max_tokens: 800, temperature: 0.35 }),
        signal: controller.signal,
      })
      if (!response.ok) continue
      const content = completion(await response.json())
      if (content) return NextResponse.json({ content }, { headers: { 'Cache-Control': 'no-store' } })
    } catch {
      continue
    } finally {
      clearTimeout(timeout)
    }
  }
  return NextResponse.json({ error: providers.length ? 'AI 服务暂时繁忙，请稍后再试。' : '尚未配置 AI 服务密钥。' }, { status: 503 })
}
