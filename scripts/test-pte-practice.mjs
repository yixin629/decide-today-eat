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
const reorder = { id: 'test-order', taskType: 'reading-reorder', paragraphs: ['A', 'B', 'C', 'D'], correctOrder: [0, 1, 2, 3] }
assert.equal(scoring.scoreReorder(reorder, [2, 3, 0, 1])[0].score, 2)
assert.equal(scoring.scoreReorder(reorder, [0, 1, 2, 3])[0].score, 3)
assert.equal(scoring.scoreReorder(reorder, [0, 1, 0, 1])[0].score, 0)
assert.deepEqual(emptyAnswerFor('reading-reorder', reorder).order, [0, 1, 2, 3])
for (const task of TASK_TYPES) assert.equal(emptyAnswerFor(task).taskType, task)

const reading = { id: 'test-read', taskType: 'speaking-read-aloud', text: 'One two three.' }
const repeated = scoring.scoreReadAloud({ item: reading, recordingSeconds: 2, recognizedTranscript: 'one one one one one one' })
assert.ok(repeated.every((d) => d.score <= d.maxScore))
const placeholder = { id: 'content', label: 'Content', score: 2.5, maxScore: 5, isHeuristic: true, note: '中性占位分' }
assert.equal(isAssessed(placeholder), false)
assert.match(scoreSummary([placeholder]), /未评估/)
const attempt = { id: 'test', taskType: 'speaking-read-aloud', itemId: 'test-read', createdAt: new Date().toISOString(), durationSeconds: 2, dimensions: [placeholder], summary: '', isEstimate: true }
assert.equal(computeSkillTrends([attempt], ['speaking'])[0].points.length, 0)
const target = computeTargetGaps([attempt], { speaking: 79 }, ['speaking'])[0]
assert.equal(target.currentPct, null)
assert.equal(target.targetScore, 79)
assert.equal('gapPct' in target, false)
console.log('PTE pure-function checks passed: answer defaults, adjacent pairs, duplicate words, unavailable scores and target scales.')
