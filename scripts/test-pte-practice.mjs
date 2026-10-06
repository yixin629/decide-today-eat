import assert from 'node:assert/strict'
import fs from 'node:fs'
import ts from 'typescript'
import { createRequire } from 'node:module'

const loadModule = createRequire(import.meta.url)

// Compile only imported pure modules, without loading Next.js, secrets or database clients.
loadModule.extensions['.ts'] = (module, filename) => {
  const source = fs.readFileSync(filename, 'utf8')
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } })
  module._compile(outputText, filename)
}

const scoring = loadModule('../app/pte-practice/engine/scoring.ts')
const { emptyAnswerFor } = loadModule('../app/pte-practice/lib/answers.ts')
const { isAssessed, scoreSummary } = loadModule('../app/pte-practice/lib/score-display.ts')
const { computeSkillTrends, computeTargetGaps } = loadModule('../app/pte-practice/lib/analyticsEngine.ts')
const { TASK_TYPES } = loadModule('../app/pte-practice/types.ts')
const { alignWords } = loadModule('../app/pte-practice/engine/wordAlignment.ts')
const { applyProvenanceTemplate, parseImportJson } = loadModule('../app/pte-practice/lib/custom-items.ts')
const { itemSourceLabel } = loadModule('../app/pte-practice/lib/study.ts')
const reorder = { id: 'test-order', taskType: 'reading-reorder', paragraphs: ['A', 'B', 'C', 'D'], correctOrder: [0, 1, 2, 3] }
assert.equal(scoring.scoreReorder(reorder, [2, 3, 0, 1])[0].score, 2)
assert.equal(scoring.scoreReorder(reorder, [0, 1, 2, 3])[0].score, 3)
assert.equal(scoring.scoreReorder(reorder, [0, 1, 0, 1])[0].score, 0)
assert.deepEqual(emptyAnswerFor('reading-reorder', reorder).order, [0, 1, 2, 3])
for (const task of TASK_TYPES) assert.equal(emptyAnswerFor(task).taskType, task)

const reading = { id: 'test-read', taskType: 'speaking-read-aloud', text: 'One two three.' }
const repeated = scoring.scoreReadAloud({ item: reading, recordingSeconds: 2, recognizedTranscript: 'one one one one one one' })
assert.ok(repeated.every((d) => d.score <= d.maxScore))
const aligned = alignWords('Students borrow 13 books.', 'student borrow thirteen extra')
assert.deepEqual(aligned.words.map((w) => w.status), ['weak', 'good', 'good', 'missed'])
assert.deepEqual(aligned.extras, [])
assert.equal(aligned.words[3].heard, 'extra')
const perfect = scoring.scoreReadAloud({ item: reading, recordingSeconds: 2, recognizedTranscript: 'one two three' })
assert.equal(perfect[1].score, 5)
assert.equal(isAssessed(perfect[1]), true)
assert.equal(isAssessed(scoring.scoreReadAloud({ item: reading, recordingSeconds: 2, recognizedTranscript: null })[1]), false)
const importItem = { taskType: 'speaking-read-aloud', text: 'Read this sentence aloud.' }
const source = { sourceType: 'original', sourceTitle: 'Team bank', rightsBasis: 'Written by our team.' }
assert.match(parseImportJson(JSON.stringify([importItem]), true).errors[0], /provenance/)
assert.match(parseImportJson(JSON.stringify([{ ...importItem, provenance: source }]), false).errors[0], /勾选/)
const imported = parseImportJson(JSON.stringify([{ ...importItem, provenance: { ...source, commercialUseAllowed: false } }]), true)
assert.equal(imported.errors.length, 0)
assert.equal(imported.items[0].provenance.commercialUseAllowed, true)
const templated = applyProvenanceTemplate(JSON.stringify([importItem, { ...importItem, provenance: { ...source, sourceTitle: 'Kept' } }]), source)
assert.equal(templated.filled, 1)
assert.equal(JSON.parse(templated.text)[1].provenance.sourceTitle, 'Kept')
assert.equal(parseImportJson(templated.text, true).items.length, 2)
assert.equal(itemSourceLabel(reading, false), '原创')
assert.equal(itemSourceLabel(reading, true), '来源未登记')
assert.equal(itemSourceLabel({ ...reading, provenance: { ...source, sourceType: 'public-domain' } }, true), '公共领域')
const placeholder = { id: 'content', label: 'Content', score: 2.5, maxScore: 5, isHeuristic: true, note: '中性占位分' }
assert.equal(isAssessed(placeholder), false)
assert.match(scoreSummary([placeholder]), /未评估/)
const attempt = { id: 'test', taskType: 'speaking-read-aloud', itemId: 'test-read', createdAt: new Date().toISOString(), durationSeconds: 2, dimensions: [placeholder], summary: '', isEstimate: true }
assert.equal(computeSkillTrends([attempt], ['speaking'])[0].points.length, 0)
const target = computeTargetGaps([attempt], { speaking: 79 }, ['speaking'])[0]
assert.equal(target.currentPct, null)
assert.equal(target.targetScore, 79)
assert.equal('gapPct' in target, false)
console.log('PTE pure-function checks passed: answer defaults, adjacent pairs, duplicate words, word alignment, provenance, unavailable scores and target scales.')
