import type { ScoreDimensionResult } from '../types'

// Older saved attempts contain neutral placeholder scores. Never present these as measured results.
export function isAssessed(dimension: ScoreDimensionResult): boolean {
  return dimension.maxScore > 0 && Number.isFinite(dimension.score) && !dimension.note.includes('占位')
}

export function scoreSummary(dimensions: ScoreDimensionResult[]): string {
  return dimensions.map((dimension) => `${dimension.label} ${isAssessed(dimension) ? `${dimension.score}/${dimension.maxScore}` : '未评估'}`).join('，')
}
