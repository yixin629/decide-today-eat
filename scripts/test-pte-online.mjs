import assert from 'node:assert/strict'
import { createRequire } from 'node:module'

const loadModule = createRequire(import.meta.url)
const { chromium } = loadModule(process.env.PLAYWRIGHT_MODULE || 'playwright')

const base = process.env.PTE_ONLINE_URL?.replace(/\/$/, '')
if (!base || !base.startsWith('https://')) {
  throw new Error('请通过 PTE_ONLINE_URL 提供正式网站的 HTTPS 地址。')
}

const browser = await chromium.launch({ channel: 'msedge', headless: true })
try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  await context.addInitScript(() => {
    localStorage.setItem('loggedInUser', 'pte-online-check')
    localStorage.setItem('currentUser', 'pte-online-check')
  })
  const page = await context.newPage()
  await page.goto(`${base}/pte-practice`, { waitUntil: 'domcontentloaded', timeout: 30_000 })
  assert.ok(!page.url().startsWith('https://vercel.com/login'), '网站被 Vercel Deployment Protection 拦截')
  await page.getByRole('heading', { name: 'PTE 学习空间' }).waitFor({ timeout: 15_000 })

  const result = await page.evaluate(async () => {
    const response = await fetch('/api/pte-scoring/writing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ promptText: 'Write one sentence.', text: 'This is a scoring connectivity check.' }),
    })
    return { status: response.status, body: await response.json().catch(() => null) }
  })

  if (result.status === 501) throw new Error('线上评分环境变量未配置，或配置后尚未重新部署')
  if (result.status === 502 || result.status === 504) throw new Error(`线上网站无法使用评分上游：HTTP ${result.status} ${result.body?.message ?? ''}`)
  assert.equal(result.status, 200, `评分接口返回 HTTP ${result.status}`)
  assert.equal(typeof result.body?.grammarScore, 'number', '评分响应缺少 grammarScore')
  console.log(`PTE online checks passed: page is public and scoring gateway returned HTTP 200 (${base}).`)
} finally {
  await browser.close()
}
