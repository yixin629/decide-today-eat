import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import ts from 'typescript'

const loadModule = createRequire(import.meta.url)
loadModule.extensions['.ts'] = (module, filename) => {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  })
  module._compile(outputText, filename)
}

const { readLimitedBody, BodyLimitError } = loadModule('../app/api/pte-scoring/lib/body-limit.ts')
const { parseReadAloudResult, parseWritingResult } = loadModule('../app/api/pte-scoring/lib/response-contract.ts')
assert.equal(parseReadAloudResult({ transcript: '', contentScore: Infinity, pronunciationScore: 4, fluencyScore: 4 }), null)
assert.equal(parseReadAloudResult({ transcript: '', contentScore: 6, pronunciationScore: 4, fluencyScore: 4 }), null)
assert.equal(parseWritingResult({ grammarScore: 1, spellingScore: 1 }), null)
assert.equal(parseWritingResult({ grammarScore: 1, spellingScore: 1, grammarIssues: ['bad'], spellingIssues: [] }), null)
const clean = parseReadAloudResult({ transcript: 'test', contentScore: 4, pronunciationScore: null, fluencyScore: 3, details: { internal: 'not-for-clients' } })
assert.equal('details' in clean, false)
assert.equal(new TextDecoder().decode(await readLimitedBody(new Response('abc'), 3)), 'abc')
await assert.rejects(readLimitedBody(new Response('abcd'), 3), (error) => error instanceof BodyLimitError && error.status === 413)
await assert.rejects(readLimitedBody(new Response('x', { headers: { 'Content-Length': '100' } }), 3), (error) => error.status === 413)
await assert.rejects(readLimitedBody(new Response(new ReadableStream()), 3, 10), (error) => error.status === 408)

// Fixture configuration and fetch replacement prevent any external service or database access.
process.env.PTE_SCORING_SERVICE_URL = 'https://scoring.invalid'
process.env.PTE_SCORING_SERVICE_TOKEN = 'test-only-token'
const writing = loadModule('../app/api/pte-scoring/writing/route.ts')
const speaking = loadModule('../app/api/pte-scoring/read-aloud/route.ts')
let calls = 0
let upstream = { grammarScore: 1, spellingScore: 1, grammarIssues: [], spellingIssues: [] }
const originalFetch = globalThis.fetch
globalThis.fetch = async () => { calls += 1; return Response.json(upstream) }
try {
  const jsonRequest = (value) => new Request('http://localhost/api/pte-scoring/writing', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(value) })
  assert.equal((await writing.POST(jsonRequest({ promptText: 'p', text: 'x'.repeat(200000) }))).status, 413)
  assert.equal((await writing.POST(jsonRequest({ promptText: 'p', text: '' }))).status, 400)
  assert.equal(calls, 0)
  const valid = { promptText: 'Describe education.', text: 'Education matters.' }
  const success = await writing.POST(jsonRequest(valid))
  assert.equal(success.status, 200)
  assert.equal(success.headers.get('cache-control'), 'no-store')
  upstream = { grammarScore: 9, spellingScore: 1, grammarIssues: [], spellingIssues: [] }
  assert.equal((await writing.POST(jsonRequest(valid))).status, 502)
  const form = new FormData()
  form.append('promptText', 'Read this.')
  form.append('promptText', 'Duplicate prompt.')
  form.append('audio', new Blob(['fixture'], { type: 'audio/webm' }), 'fixture.webm')
  assert.equal((await speaking.POST(new Request('http://localhost/api/pte-scoring/read-aloud', { method: 'POST', body: form }))).status, 400)
  assert.equal(calls, 2)
} finally { globalThis.fetch = originalFetch }

console.log('PTE API checks passed: byte limits, slow-body timeout, duplicate fields, result validation, no-store and zero external calls.')
