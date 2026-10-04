function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function score(value: unknown, max: number): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= max
}

export function parseReadAloudResult(value: unknown) {
  if (!record(value)) return null
  const { transcript, contentScore, pronunciationScore, fluencyScore } = value
  if (transcript !== null && (typeof transcript !== 'string' || transcript.length > 16000)) return null
  if (![contentScore, pronunciationScore, fluencyScore].every((field) => field === null || score(field, 5))) return null
  return { transcript, contentScore, pronunciationScore, fluencyScore }
}

export function parseWritingResult(value: unknown) {
  if (!record(value)) return null
  const { grammarScore, spellingScore, grammarIssues, spellingIssues } = value
  if (!score(grammarScore, 1) || !score(spellingScore, 1)) return null
  if (!Array.isArray(grammarIssues) || !Array.isArray(spellingIssues)) return null
  if (grammarIssues.length > 2000 || spellingIssues.length > 2000) return null
  if (![...grammarIssues, ...spellingIssues].every(record)) return null
  const issue = (entry: Record<string, unknown>) => ({
    message: typeof entry.message === 'string' ? entry.message.slice(0, 1000) : undefined,
    offset: Number.isInteger(entry.offset) && score(entry.offset, 8000) ? entry.offset : undefined,
    length: Number.isInteger(entry.length) && score(entry.length, 8000) ? entry.length : undefined,
    ruleId: typeof entry.ruleId === 'string' ? entry.ruleId.slice(0, 200) : undefined,
  })
  return { grammarScore, spellingScore, grammarIssues: grammarIssues.map(issue), spellingIssues: spellingIssues.map(issue) }
}
