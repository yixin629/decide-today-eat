import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import ts from 'typescript'

const loadModule = createRequire(import.meta.url)
let cloudAvailable = false
let cloudRows = []
const query = {
  select() { return this }, eq() { return this }, order() { return this }, insert() { return this },
  async limit() { return { data: cloudRows, error: cloudAvailable ? null : new Error('Fixture offline') } },
  async single() { return { data: null, error: new Error('Fixture offline') } },
}
loadModule.extensions['.ts'] = (module, filename) => {
  const originalRequire = module.require.bind(module)
  module.require = (specifier) => specifier === '@/lib/supabase' ? { supabase: { from: () => query } } : originalRequire(specifier)
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } })
  module._compile(outputText, filename)
}
const storage = new Map()
let blocked = false
globalThis.window = { localStorage: {
  getItem: (key) => { if (blocked) throw new Error('Blocked'); return storage.get(key) ?? null },
  setItem: (key, value) => { if (blocked) throw new Error('Blocked'); storage.set(key, value) },
} }
const { loadAttempts, saveAttempt } = loadModule('../app/pte-practice/lib/attempt-repository.ts')
const { parseLocalHistory, mergeAttemptHistory } = loadModule('../app/pte-practice/lib/attempt-history.ts')
const key = 'pte-practice-attempts-v1'
const record = { id: 'offline-a', userId: 'fixture-a', taskType: 'reading-mcq-single', itemId: 'fixture-question', createdAt: '2026-10-01T12:00:00Z', durationSeconds: 10, dimensions: [{ id: 'content', label: 'Content', score: 1, maxScore: 1, isHeuristic: false, note: 'Correct' }], summary: 'Fixture', isEstimate: true }
const other = { ...record, id: 'offline-b', userId: 'fixture-b' }
storage.set(key, JSON.stringify([record, other]))
assert.deepEqual((await loadAttempts('fixture-a')).attempts.map((entry) => entry.id), ['offline-a'])
assert.equal((await loadAttempts(null)).attempts.length, 0)

cloudAvailable = true
cloudRows = [{ id: 'cloud-a', user_id: 'fixture-a', task_type: record.taskType, item_id: record.itemId, created_at: '2026-10-02T12:00:00Z', duration_seconds: 10, dimensions: record.dimensions, summary: 'Cloud fixture' }]
const recovered = await loadAttempts('fixture-a')
assert.equal(recovered.source, 'mixed')
assert.deepEqual(recovered.attempts.map((entry) => entry.id), ['cloud-a', 'offline-a'])
assert.equal(storage.get(key), JSON.stringify([record, other]), 'Reading must not upload or rewrite offline records')
assert.equal(mergeAttemptHistory([record], [record, other], 'fixture-a').attempts.length, 1)
assert.equal(mergeAttemptHistory([record], [record], 'fixture-a').hasLocal, false)

assert.ok(parseLocalHistory('bad-json').error)
assert.ok(parseLocalHistory(JSON.stringify([null, { ...record, taskType: 'unknown' }])).error)
storage.set(key, 'bad-json')
const failedSave = await saveAttempt(record, 'fixture-a')
assert.ok(failedSave.error.includes('均保存失败'))
assert.equal(storage.get(key), 'bad-json', 'Damaged history must not be overwritten')

storage.set(key, JSON.stringify([other, ...Array.from({ length: 200 }, (_, i) => ({ ...record, id: `a-${i}` }))]))
await saveAttempt(record, 'fixture-a')
const retained = parseLocalHistory(storage.get(key)).attempts
assert.equal(retained.filter((entry) => entry.userId === 'fixture-a').length, 200)
assert.equal(retained.filter((entry) => entry.userId === 'fixture-b').length, 1)
blocked = true
assert.ok((await loadAttempts('fixture-a')).error)
assert.ok((await saveAttempt(record, null)).error)
delete globalThis.window
console.log('PTE history checks passed: offline recovery, identity filtering, duplicate IDs, corruption preservation, per-user retention and blocked storage. No external calls.')
