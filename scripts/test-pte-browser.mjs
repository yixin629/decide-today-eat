import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'

const loadModule = createRequire(import.meta.url)
const { chromium } = loadModule(process.env.PLAYWRIGHT_MODULE || 'playwright')

async function main() {
  const base = process.env.PTE_TEST_URL || 'http://localhost:3100'
  const artifacts = await fs.mkdtemp(path.join(os.tmpdir(), 'pte-browser-'))
  const browser = await chromium.launch({ channel: 'msedge', headless: true })
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
    // Isolate test fixtures: no production database, external API or realtime requests.
    await context.route('**/*', async (route) => {
      const url = new URL(route.request().url())
      if (url.origin === base && !url.pathname.startsWith('/api/')) return route.continue()
      if (url.pathname.startsWith('/api/')) return route.fulfill({ status: 503, json: { error: 'Test scoring service unavailable' } })
      const single = route.request().headers().accept?.includes('vnd.pgrst.object')
      return route.fulfill({ status: route.request().method() === 'POST' ? 503 : 200, json: single ? null : [] })
    })
    await context.routeWebSocket('**/*', (socket) => {
      if (new URL(socket.url()).host === new URL(base).host) socket.connectToServer()
      else socket.close()
    })
    await context.addInitScript(() => {
      localStorage.setItem('loggedInUser', 'pte-ui-test')
      localStorage.setItem('currentUser', 'pte-ui-test')
      window.__pteSpeech = { text: '', paused: false, stops: 0 }
      Object.defineProperty(window, 'speechSynthesis', { value: {
        cancel() { window.__pteSpeech.stops += 1 },
        speak(utterance) { window.__pteSpeech.text = utterance.text },
        pause() { window.__pteSpeech.paused = true },
        resume() { window.__pteSpeech.paused = false },
        getVoices() { return [] }, addEventListener() {}, removeEventListener() {},
      } })
      window.__pteRecorder = { stopped: false }
      Object.defineProperty(navigator, 'mediaDevices', { value: { getUserMedia: async () => ({ getTracks: () => [{ stop() {} }] }) } })
      window.MediaRecorder = class {
        state = 'inactive'
        mimeType = 'audio/webm'
        start() { this.state = 'recording' }
        stop() {
          this.state = 'inactive'
          window.__pteRecorder.stopped = true
          setTimeout(() => { this.ondataavailable?.({ data: new Blob(['fixture'], { type: this.mimeType }) }); this.onstop?.() }, 50)
        }
      }
      window.SpeechRecognition = class {
        start() { this.onresult?.({ results: [[{ transcript: 'The university library is open.' }]] }) }
        stop() {}
      }
    })
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    page.on('requestfailed', (request) => {
      if (request.url().startsWith(base)) console.log('Local request failed:', new URL(request.url()).pathname, request.failure()?.errorText)
    })
    await page.goto(`${base}/pte-practice`)
    await page.getByRole('heading', { name: 'PTE 学习空间' }).waitFor().catch(async (error) => {
      console.log('Startup errors:', errors)
      console.log('Page:', page.url(), (await page.locator('body').innerText()).slice(0, 2000))
      console.log('Scripts:', await page.evaluate(() => ({ ready: document.readyState, scripts: [...document.scripts].map((script) => script.src).filter(Boolean), fixture: localStorage.getItem('loggedInUser') === 'pte-ui-test' })))
      await page.screenshot({ path: path.join(artifacts, 'startup-error.png') })
      throw error
    })
    const nav = page.getByRole('navigation', { name: 'PTE 学习导航' })
    await page.screenshot({ path: path.join(artifacts, 'dashboard-desktop.png'), fullPage: true })
    await nav.getByRole('button', { name: '上传题目' }).click()
    await page.getByRole('button', { name: 'JSON 批量导入' }).click()
    await page.getByRole('button', { name: '填入示例' }).click()
    await page.getByRole('button', { name: '校验', exact: true }).click()
    await page.getByText('请先勾选商用授权确认，再校验或导入', { exact: true }).waitFor()
    await page.getByLabel('来源名称').fill('Playwright 原创题库')
    await page.getByLabel('授权依据').fill('测试夹具由项目自行原创，仅用于自动化验证。')
    await page.getByRole('checkbox').check()
    await page.getByRole('button', { name: '写入来源模板' }).click()
    await page.getByRole('button', { name: '校验', exact: true }).click()
    await page.getByText('校验通过：1 道题可以导入。', { exact: true }).waitFor()
    await page.setViewportSize({ width: 390, height: 844 })
    await page.screenshot({ path: path.join(artifacts, 'upload-mobile.png'), fullPage: true })
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, 'Question provenance form fits mobile viewport')
    await page.setViewportSize({ width: 1440, height: 1000 })
    await nav.getByRole('button', { name: '专项题库' }).click()
    await page.locator('.pte-task-picker [data-task="reading-mcq-single"]').click()
    await page.locator('.pte-question-row .start').first().click()
    await page.getByRole('button', { name: '提交作答', exact: true }).click()
    await page.getByRole('region', { name: '练习反馈' }).waitFor()
    await page.getByRole('button', { name: '再练一次' }).click()
    const dialog = page.waitForEvent('dialog').then((event) => event.dismiss())
    await nav.getByRole('button', { name: '专项题库' }).click()
    await dialog
    assert.equal(await page.locator('.pte-session').count(), 1, 'Retry restores unsaved navigation guard')
    page.once('dialog', (event) => event.accept())
    await nav.getByRole('button', { name: '专项题库' }).click()
    await page.locator('.pte-task-picker [data-task="speaking-read-aloud"]').click()
    await page.locator('.pte-question-row .start').first().click()
    await page.getByRole('button', { name: '开始录音', exact: true }).click()
    await page.getByRole('button', { name: '停止录音', exact: true }).waitFor()
    await page.getByRole('button', { name: '提交作答', exact: true }).click()
    await page.getByRole('region', { name: '练习反馈' }).waitFor()
    assert.equal(await page.evaluate(() => window.__pteRecorder.stopped), true)
    assert.ok(await page.locator('audio[aria-label="我的录音回放"]').getAttribute('src'))
    assert.ok(await page.locator('.pte-pron-word').count() > 0, 'Read Aloud report shows word-level pronunciation marks')
    await page.screenshot({ path: path.join(artifacts, 'report-desktop.png'), fullPage: true })
    await nav.getByRole('button', { name: '精听跟读' }).click()
    await page.getByRole('button', { name: '播放', exact: true }).click()
    await page.getByRole('button', { name: '暂停', exact: true }).click()
    assert.equal(await page.evaluate(() => window.__pteSpeech.paused), true)
    await page.getByRole('button', { name: '继续播放', exact: true }).click()
    assert.equal(await page.evaluate(() => window.__pteSpeech.paused), false)
    await page.locator('.pte-task-picker [data-task="listening-select-missing-word"]').click()
    await page.getByRole('button', { name: '播放', exact: true }).click()
    assert.ok(!(await page.evaluate(() => window.__pteSpeech.text)).includes('____'))
    await page.setViewportSize({ width: 390, height: 844 })
    await page.screenshot({ path: path.join(artifacts, 'listening-mobile.png'), fullPage: true })
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, 'No mobile horizontal overflow')
    await page.evaluate(() => document.documentElement.classList.add('dark-mode'))
    await page.screenshot({ path: path.join(artifacts, 'listening-mobile-dark.png'), fullPage: true })
    await nav.getByRole('button', { name: '模拟考试' }).click()
    await page.getByRole('button', { name: '开始模拟考试' }).click()
    await page.locator('.pte-session').waitFor()
    page.once('dialog', (event) => event.dismiss())
    await nav.getByRole('button', { name: '学习工作台' }).click()
    assert.equal(await page.locator('.pte-session').count(), 1, 'Mock navigation guard keeps current exam')
    await page.getByRole('button', { name: '提交作答', exact: true }).click()
    await page.getByRole('region', { name: '练习反馈' }).waitFor()
    page.once('dialog', (event) => event.accept())
    await page.getByRole('button', { name: '提前结束模考' }).click()
    await page.getByText('逐题详情', { exact: true }).waitFor()
    assert.ok((await page.locator('.pte-content').innerText()).includes('共完成 1/1 题'))
    const savedCount = await page.evaluate(() => JSON.parse(localStorage.getItem('pte-practice-attempts-v1') || '[]').length)
    assert.ok(savedCount >= 3, 'Failed cloud saves retain local practice attempts')
    await page.reload()
    await page.getByRole('heading', { name: 'PTE 学习空间' }).waitFor()
    await page.getByText('云端 + 本机记录', { exact: true }).waitFor()
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('pte-practice-attempts-v1') || '[]').length), savedCount, 'Cloud recovery does not overwrite offline history')
    await nav.getByRole('button', { name: '练习记录', exact: true }).click()
    await page.getByRole('button', { name: '同步本机记录', exact: true }).click()
    await page.getByText('同步失败，本机记录仍已保留，请检查网络后重试。', { exact: true }).waitFor()
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('pte-practice-attempts-v1') || '[]').length), savedCount, 'Failed sync preserves offline history')
    await page.getByLabel('筛选记录题型').selectOption('reading-mcq-single')
    await page.getByText('查看反馈详情', { exact: true }).first().click()
    assert.ok(await page.locator('details[open] dd').count() > 0, 'Saved dimension feedback can be reviewed')
    await page.getByLabel('搜索练习记录').fill('no-such-fixture')
    await page.getByText('没有符合条件的记录。', { exact: true }).waitFor()
    await page.getByRole('button', { name: '重置筛选', exact: true }).click()
    await page.screenshot({ path: path.join(artifacts, 'history-mobile.png'), fullPage: true })
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, 'History fits mobile viewport')
    await page.setViewportSize({ width: 1440, height: 1000 })
    await page.screenshot({ path: path.join(artifacts, 'history-desktop.png'), fullPage: true })
    await page.getByRole('button', { name: '再练一次', exact: true }).first().click()
    await page.locator('.pte-session').waitFor()
    assert.deepEqual(errors, [])
    console.log(`PTE browser smoke checks passed. Screenshots: ${artifacts}`)
    await context.close()
  } finally { await browser.close() }
}

main().catch((error) => { console.error(error); process.exitCode = 1 })
