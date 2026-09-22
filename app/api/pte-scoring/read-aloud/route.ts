import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

// 服务端专用配置：绝不出现在客户端 bundle 中，也不加 NEXT_PUBLIC_ 前缀。
const SERVICE_URL = process.env.PTE_SCORING_SERVICE_URL
const SERVICE_TOKEN = process.env.PTE_SCORING_SERVICE_TOKEN

const MAX_PROMPT_LENGTH = 2000
const MAX_AUDIO_BYTES = 15 * 1024 * 1024 // 15MB，足够容纳 40 秒左右的朗读录音
const FETCH_TIMEOUT_MS = 20000

/**
 * 代理口语 Read Aloud 的评分请求到用户自托管的开源评分服务网关（见仓库
 * pte-scoring-service/ 目录）。这是唯一可能出现真实发音/内容信号的地方；
 * 若未配置 PTE_SCORING_SERVICE_URL，返回 501，前端据此回退到本地启发式估分。
 *
 * 请求：multipart/form-data，字段 promptText（string）、audio（音频文件）。
 * 响应： { transcript, contentScore, pronunciationScore, fluencyScore, details }
 *   分数均为 0-5 的小分制（与 Pearson 公开的 Read Aloud 单题评分维度量表一致）。
 */
export async function POST(req: NextRequest) {
  if (!SERVICE_URL) {
    return NextResponse.json(
      { error: 'not_configured', message: 'PTE_SCORING_SERVICE_URL 未配置，请使用本地估算回退。' },
      { status: 501 }
    )
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'invalid_request', message: '请求体必须是 multipart/form-data。' }, { status: 400 })
  }

  const promptText = formData.get('promptText')
  const audio = formData.get('audio')

  if (typeof promptText !== 'string' || promptText.trim().length === 0) {
    return NextResponse.json({ error: 'invalid_request', message: 'promptText 为必填字段。' }, { status: 400 })
  }
  if (promptText.length > MAX_PROMPT_LENGTH) {
    return NextResponse.json({ error: 'invalid_request', message: `promptText 超过最大长度 ${MAX_PROMPT_LENGTH}。` }, { status: 400 })
  }
  if (!(audio instanceof Blob) || audio.size === 0) {
    return NextResponse.json({ error: 'invalid_request', message: 'audio 为必填的录音文件字段。' }, { status: 400 })
  }
  if (audio.size > MAX_AUDIO_BYTES) {
    return NextResponse.json({ error: 'invalid_request', message: `录音文件超过最大大小 ${MAX_AUDIO_BYTES} 字节。` }, { status: 400 })
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const upstreamForm = new FormData()
    upstreamForm.set('promptText', promptText)
    upstreamForm.set('audio', audio, 'recording.webm')

    const upstreamRes = await fetch(`${SERVICE_URL.replace(/\/$/, '')}/score/read-aloud`, {
      method: 'POST',
      headers: SERVICE_TOKEN ? { Authorization: `Bearer ${SERVICE_TOKEN}` } : undefined,
      body: upstreamForm,
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
