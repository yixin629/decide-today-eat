import { TASK_TYPES, type AttemptRecord, type ScoreDimensionResult } from '../types'

function object(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function dimension(value: unknown): value is ScoreDimensionResult {
  return object(value) && typeof value.id === 'string' && typeof value.label === 'string'
    && typeof value.score === 'number' && Number.isFinite(value.score)
    && typeof value.maxScore === 'number' && Number.isFinite(value.maxScore) && value.maxScore >= 0
    && typeof value.isHeuristic === 'boolean' && typeof value.note === 'string'
}

function attempt(value: unknown): value is AttemptRecord {
  return object(value) && typeof value.id === 'string' && typeof value.itemId === 'string'
    && TASK_TYPES.some((type) => type === value.taskType)
    && typeof value.createdAt === 'string' && Number.isFinite(Date.parse(value.createdAt))
    && typeof value.durationSeconds === 'number' && Number.isFinite(value.durationSeconds) && value.durationSeconds >= 0
    && Array.isArray(value.dimensions) && value.dimensions.every(dimension)
    && typeof value.summary === 'string' && value.isEstimate === true
    && (value.userId === undefined || typeof value.userId === 'string')
}

export function parseLocalHistory(raw: string | null): { attempts: AttemptRecord[]; error: string | null } {
  if (raw === null) return { attempts: [], error: null }
  try {
    const value: unknown = JSON.parse(raw)
    if (!Array.isArray(value)) throw new Error('Invalid history')
    const attempts = value.filter(attempt)
    return { attempts, error: attempts.length === value.length ? null : '部分本机记录格式异常，原始数据已保留，未被覆盖。' }
  } catch {
    return { attempts: [], error: '本机记录无法读取，原始数据已保留，未被覆盖。' }
  }
}

export function mergeAttemptHistory(cloud: AttemptRecord[], local: AttemptRecord[], userId: string | null) {
  const owns = (record: AttemptRecord) => (record.userId ?? null) === userId
  const cloudRecords = cloud.filter(owns)
  const cloudIds = new Set(cloudRecords.map((record) => record.id))
  const localOnly = local.filter((record) => owns(record) && !cloudIds.has(record.id))
  const unique = new Map([...localOnly, ...cloudRecords].map((record) => [record.id, record]))
  const attempts = [...unique.values()].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).slice(0, 200)
  return { attempts, hasLocal: attempts.some((record) => !cloudIds.has(record.id)) }
}
