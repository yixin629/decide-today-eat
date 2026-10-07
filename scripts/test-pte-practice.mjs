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
const { applyProvenanceTemplate, parseImportJson, validateCustomItem } = loadModule('../app/pte-practice/lib/custom-items.ts')
const { keyPointCoverage } = loadModule('../app/pte-practice/engine/keyPoints.ts')
const { QUESTION_BANK } = loadModule('../app/pte-practice/lib/questionBank.ts')
const { pickVoices } = loadModule('../app/pte-practice/lib/voices.ts')
const { itemSourceLabel } = loadModule('../app/pte-practice/lib/study.ts')
const { completeStarredReview, removeStarredReview } = loadModule('../app/pte-plan/lib/review-book.ts')
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

const reviewRow = { id: 'old-rs', category: 'planned', questionId: 's-rs-12', starred: true, score: '', attempts: '', note: '' }
const emptyRow = { id: 'today-rs', category: 'planned', questionId: '', starred: false, score: '', attempts: '', note: '' }
const plan = { version: 1, id: 'plan-1', name: 'Fixture', createdAt: '2026-10-01T00:00:00Z', updatedAt: '2026-10-01T00:00:00Z', config: {}, days: [
  { date: '2026-10-06', dayNumber: 1, phase: '', focus: '', plannedMinutes: 10, hiddenTaskIds: [], summary: {}, tasks: [{ id: 'rs', shortLabel: 'RS', rows: [reviewRow] }] },
  { date: '2026-10-07', dayNumber: 2, phase: '', focus: '', plannedMinutes: 10, hiddenTaskIds: [], summary: {}, tasks: [{ id: 'rs', shortLabel: 'RS', rows: [emptyRow] }] },
] }
const completed = completeStarredReview(plan, { dayIndex: 0, taskId: 'rs', rowId: 'old-rs' }, '2026-10-07', '2026-10-07T12:00:00Z')
assert.equal(completed.error, null)
assert.equal(completed.copiedToToday, true)
assert.equal(completed.plan.days[0].tasks[0].rows[0].starred, true)
assert.equal(completed.plan.days[1].tasks[0].rows[0].questionId, 's-rs-12')
const duplicate = completeStarredReview({ ...plan, days: [plan.days[0], { ...plan.days[1], tasks: [{ ...plan.days[1].tasks[0], rows: [{ ...emptyRow, questionId: 's-rs-12' }] }] }] }, { dayIndex: 0, taskId: 'rs', rowId: 'old-rs' }, '2026-10-07')
assert.equal(duplicate.alreadyInToday, true)
assert.equal(duplicate.plan.days[1].tasks[0].rows.length, 1)
const outsidePlan = completeStarredReview(plan, { dayIndex: 0, taskId: 'rs', rowId: 'old-rs' }, '2026-10-08')
assert.ok(outsidePlan.error)
assert.equal(outsidePlan.plan.days[0].tasks[0].rows[0].starred, true)
const unstarred = removeStarredReview(plan, { dayIndex: 0, taskId: 'rs', rowId: 'old-rs' }, '2026-10-07T13:00:00Z')
assert.equal(unstarred.days[0].tasks[0].rows[0].starred, false)
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
const repairedTemplate = applyProvenanceTemplate(JSON.stringify([{ ...importItem, provenance: { sourceType: 'original', sourceTitle: '', rightsBasis: '' } }]), source)
assert.equal(repairedTemplate.filled, 1)
assert.equal(JSON.parse(repairedTemplate.text)[0].provenance.sourceTitle, 'Team bank')
assert.equal(itemSourceLabel(reading, false), '原创')
assert.equal(itemSourceLabel(reading, true), '来源未登记')
assert.equal(itemSourceLabel({ ...reading, provenance: { ...source, sourceType: 'public-domain' } }, true), '公共领域')
const coverage = keyPointCoverage(['Recorded lectures offer flexibility', 'Live sessions allow questions'], 'She said recorded lectures are flexible')
assert.deepEqual(coverage.points.map((p) => p.covered), [true, false])
for (const task of TASK_TYPES) assert.ok(QUESTION_BANK[task].length > 0, `${task} has built-in items`)
for (const item of Object.values(QUESTION_BANK).flat()) {
  const result = validateCustomItem({ ...item, provenance: { ...source, commercialUseAllowed: true } })
  assert.deepEqual(result.errors, [], `${item.id} passes upload validation`)
}
const voicePool = [['A', 'en-US'], ['B', 'en-US'], ['C', 'en-GB'], ['D', 'en-AU']].map(([name, lang]) => ({ name, lang, voiceURI: name }))
assert.equal(new Set(pickVoices(voicePool, { accent: 'random' }, 's-sgd-1', 3).map((v) => v.lang)).size, 3, 'random accent gives each speaker a different accent')
assert.equal(new Set(pickVoices(voicePool, { accent: 'en-US' }, 's-sgd-1', 2).map((v) => v.name)).size, 2, 'fixed accent rotates voices within that accent')
assert.deepEqual(pickVoices([], { accent: 'random' }, 'x', 3), [null, null, null])
const sgd = QUESTION_BANK['speaking-summarize-group-discussion'][0]
const sgdFull = scoring.scoreAttempt(sgd.taskType, sgd, { taskType: sgd.taskType, recordingSeconds: 90, recognizedTranscript: sgd.keyPoints.join(' '), audioBlob: null }, 120)
assert.equal(sgdFull[0].score, 6)
assert.equal(isAssessed(sgdFull[1]), false, 'free-speech pronunciation stays unassessed')
const rts = QUESTION_BANK['speaking-respond-to-situation'][0]
const rtsSilent = scoring.scoreAttempt(rts.taskType, rts, { taskType: rts.taskType, recordingSeconds: 0, recognizedTranscript: null, audioBlob: null }, 40)
assert.equal(isAssessed(rtsSilent[0]), false)
assert.equal(rtsSilent[2].score, 0)
const placeholder = { id: 'content', label: 'Content', score: 2.5, maxScore: 5, isHeuristic: true, note: '中性占位分' }
assert.equal(isAssessed(placeholder), false)
assert.match(scoreSummary([placeholder]), /未评估/)
const attempt = { id: 'test', taskType: 'speaking-read-aloud', itemId: 'test-read', createdAt: new Date().toISOString(), durationSeconds: 2, dimensions: [placeholder], summary: '', isEstimate: true }
assert.equal(computeSkillTrends([attempt], ['speaking'])[0].points.length, 0)
const target = computeTargetGaps([attempt], { speaking: 79 }, ['speaking'])[0]
assert.equal(target.currentPct, null)
assert.equal(target.targetScore, 79)
assert.equal('gapPct' in target, false)
console.log('PTE pure-function checks passed: answer defaults, adjacent pairs, duplicate words, word alignment, provenance, SGD/RTS scoring, built-in item validation, unavailable scores and target scales.')
