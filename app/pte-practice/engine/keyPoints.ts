import { normalizeToken } from './wordAlignment'

/**
 * 自由表达类口语题（Summarize Group Discussion / Respond to a Situation）的要点覆盖估算：
 * 把每条参考要点拆成实义词，看转写文本里出现了多少。只做关键词层面的粗略判断，
 * 无法理解同义改写，结果仅供练习参考。
 */

const STOPWORDS = new Set([
  'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'any', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'has', 'his', 'how',
  'its', 'may', 'new', 'now', 'see', 'two', 'who', 'did', 'get', 'let', 'say', 'she', 'too', 'use', 'that', 'with', 'have', 'this',
  'will', 'your', 'from', 'they', 'them', 'than', 'then', 'been', 'were', 'what', 'when', 'which', 'would', 'there', 'their', 'about',
  'could', 'should', 'into', 'more', 'most', 'some', 'such', 'only', 'also', 'very', 'just', 'like', 'make', 'because', 'while', 'where',
  'these', 'those', 'being', 'does', 'each', 'other', 'over', 'both', 'it', 'is', 'to', 'of', 'in', 'on', 'at', 'as', 'be', 'by', 'or',
  'an', 'a', 'we', 'he', 'i', 'so', 'if', 'do', 'up', 'no', 'my', 'me', 'us', 'speaker', 'thinks', 'says', 'said', 'argues', 'feels',
])

export function contentWords(text: string): string[] {
  return [...new Set(text.split(/[\s/–—-]+/).map(normalizeToken).filter((word) => word.length > 2 && !STOPWORDS.has(word)))]
}

// 粗略词干匹配：完全相同，或前 5 个字母相同（覆盖 recycle/recycling、cost/costs 等变形）。
function sameStem(a: string, b: string) {
  if (a === b) return true
  const stem = Math.min(5, a.length, b.length)
  return stem >= 4 && a.slice(0, stem) === b.slice(0, stem)
}

export interface KeyPointCoverage {
  points: { text: string; covered: boolean }[]
  coveredCount: number
}

export function keyPointCoverage(keyPoints: string[], transcript: string): KeyPointCoverage {
  const spoken = contentWords(transcript)
  const points = keyPoints.map((text) => {
    const words = contentWords(text)
    if (!words.length) return { text, covered: false }
    const hits = words.filter((word) => spoken.some((said) => sameStem(word, said))).length
    return { text, covered: hits / words.length >= 0.5 }
  })
  return { points, coveredCount: points.filter((point) => point.covered).length }
}
