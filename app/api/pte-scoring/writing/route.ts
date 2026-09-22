import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

const SERVICE_URL = process.env.PTE_SCORING_SERVICE_URL
const SERVICE_TOKEN = process.env.PTE_SCORING_SERVICE_TOKEN

const MAX_TEXT_LENGTH = 8000
const FETCH_TIMEOUT_MS = 20000

interface WritingScoringBody {
  promptText: string
  sourceText?: string
  text: string
}

function parseBody(body: unknown): WritingScoringBody | null {
  if (!body || typeof body !== 'object') return null
  const { promptText, sourceText, text } = body as Record<string, unknown>
  if (typeof promptText !== 'string' || promptText.trim().length === 0) return null
  if (typeof text !== 'string' || text.trim().length === 0) return null
  if (sourceText !== undefined && typeof sourceText !== 'string') return null
  return { promptText, sourceText, text }
}

/**
 * 代理 Writing（SWT / Essay）评分请求到自托管评分网关。网关内部调用
 * LanguageTool 做语法/拼写检查，并返回词汇多样性、内容关键词覆盖率等信号。
 * 未配置服务时返回 501，前端据此回退到本地启发式估分。
 *
 * 响应：{ grammarIssues, spellingIssues, grammarScore, spellingScore,
 *          vocabularyDiversity, contentKeywordCoverage }
 */
export async function POST(req: NextRequest) {
  if (!SERVICE_URL) {
    return NextResponse.json(
      { error: 'not_configured', message: 'PTE_SCORING_SERVICE_URL 未配置，请使用本地估算回退。' },
      { status: 501 }
    )
  }

  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_request', message: '请求体必须是合法 JSON。' }, { status: 400 })
  }

  const body = parseBody(raw)
  if (!body) {
    return NextResponse.json(
      { error: 'invalid_request', message: 'promptText 与 text 为必填字符串字段，sourceText 可选。' },
      { status: 400 }
    )
  }
  if (body.promptText.length > MAX_TEXT_LENGTH || body.text.length > MAX_TEXT_LENGTH || (body.sourceText?.length ?? 0) > MAX_TEXT_LENGTH) {
    return NextResponse.json({ error: 'invalid_request', message: `字段超过最大长度 ${MAX_TEXT_LENGTH}。` }, { status: 400 })
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const upstreamRes = await fetch(`${SERVICE_URL.replace(/\/$/, '')}/score/writing`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(SERVICE_TOKEN ? { Authorization: `Bearer ${SERVICE_TOKEN}` } : {}),
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    if (!upstreamRes.ok) {
      return NextResponse.json(
        { error: 'upstream_error', message: `评分服务返回错误状态 ${upstreamRes.status}。` },
        { status: 502 }
      )
    }

    const data: unknown = await upstreamRes.json()
    return NextResponse.json(data)
  } catch (error) {
    const isAbort = error instanceof Error && error.name === 'AbortError'
    return NextResponse.json(
      { error: isAbort ? 'timeout' : 'network_error', message: isAbort ? '评分服务响应超时。' : '无法连接到评分服务。' },
      { status: 504 }
    )
  } finally {
    clearTimeout(timer)
  }
}
