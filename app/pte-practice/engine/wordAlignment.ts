/**
 * Read Aloud / Repeat Sentence 的逐词比对：把语音识别转写与原文按词对齐，
 * 标出每个原文单词的朗读情况。
 *
 * - good：识别结果与原文一致
 * - weak：识别成了相近的词（如 student/students、thirteen/thirty），通常意味着发音不够清晰
 * - missed：没有读、或识别成了完全不同的词
 *
 * 这依赖浏览器/评分服务的语音识别结果，属于练习估算，不是音素级发音评测：
 * 识别器会自动纠正轻微的口音，也可能漏掉弱读的 a、the 等虚词。
 */

export type WordStatus = 'good' | 'weak' | 'missed'

export interface AlignedWord {
  /** 原文中的显示形式（保留标点和大小写） */
  text: string
  status: WordStatus
  /** weak / missed 时识别到的词；missed 且为漏读时为 undefined */
  heard?: string
}

export interface WordAlignment {
  words: AlignedWord[]
  /** 原文中没有、但被读出来的多余词 */
  extras: string[]
  counts: Record<WordStatus, number>
}

const NUMBER_WORDS: Record<string, string> = {
  '0': 'zero', '1': 'one', '2': 'two', '3': 'three', '4': 'four', '5': 'five', '6': 'six', '7': 'seven', '8': 'eight', '9': 'nine',
  '10': 'ten', '11': 'eleven', '12': 'twelve', '13': 'thirteen', '14': 'fourteen', '15': 'fifteen', '16': 'sixteen', '17': 'seventeen',
  '18': 'eighteen', '19': 'nineteen', '20': 'twenty', '30': 'thirty', '40': 'forty', '50': 'fifty', '100': 'hundred',
}

export function normalizeToken(word: string) {
  const cleaned = word.toLowerCase().replace(/[’']/g, "'").replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, '').replace(/'s$/, 's')
  return NUMBER_WORDS[cleaned] ?? cleaned
}

function editDistance(a: string, b: string) {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i += 1) {
    let previous = row[0]
    row[0] = i
    for (let j = 1; j <= b.length; j += 1) {
      const current = row[j]
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1))
      previous = current
    }
  }
  return row[b.length]
}

/** 拼写相近或只差词尾（单复数、时态）视为"读音接近但不准确"。 */
export function isSimilar(a: string, b: string) {
  if (!a || !b) return false
  const shorter = a.length <= b.length ? a : b
  const longer = a.length <= b.length ? b : a
  if (shorter.length >= 3 && longer.startsWith(shorter) && longer.length - shorter.length <= 3) return true
  return 1 - editDistance(a, b) / Math.max(a.length, b.length) >= 0.6
}

const COST_SIMILAR = 0.4

export function alignWords(reference: string, transcript: string): WordAlignment {
  const refDisplay = reference.split(/\s+/).filter((word) => normalizeToken(word))
  const ref = refDisplay.map(normalizeToken)
  const hyp = transcript.split(/\s+/).map(normalizeToken).filter(Boolean)
  const n = ref.length
  const m = hyp.length

  // 标准编辑距离 DP，替换代价按相似度区分，便于把"读得像"与"读错"分开。
  const cost: number[][] = Array.from({ length: n + 1 }, (_, i) => Array.from({ length: m + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)))
  for (let i = 1; i <= n; i += 1) {
    for (let j = 1; j <= m; j += 1) {
      const sub = ref[i - 1] === hyp[j - 1] ? 0 : isSimilar(ref[i - 1], hyp[j - 1]) ? COST_SIMILAR : 1
      cost[i][j] = Math.min(cost[i - 1][j - 1] + sub, cost[i - 1][j] + 1, cost[i][j - 1] + 1)
    }
  }

  const words: AlignedWord[] = []
  const extras: string[] = []
  let i = n
  let j = m
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0) {
      const same = ref[i - 1] === hyp[j - 1]
      const similar = !same && isSimilar(ref[i - 1], hyp[j - 1])
      const sub = same ? 0 : similar ? COST_SIMILAR : 1
      if (cost[i][j] === cost[i - 1][j - 1] + sub) {
        words.push(same ? { text: refDisplay[i - 1], status: 'good' } : { text: refDisplay[i - 1], status: similar ? 'weak' : 'missed', heard: hyp[j - 1] })
        i -= 1
        j -= 1
        continue
      }
    }
    if (i > 0 && cost[i][j] === cost[i - 1][j] + 1) {
      words.push({ text: refDisplay[i - 1], status: 'missed' })
      i -= 1
    } else {
      extras.push(hyp[j - 1])
      j -= 1
    }
  }
  words.reverse()
  extras.reverse()

  const counts: Record<WordStatus, number> = { good: 0, weak: 0, missed: 0 }
  for (const word of words) counts[word.status] += 1
  return { words, extras, counts }
}

/** 由逐词结果估算 0-max 的内容分与发音分。 */
export function scoresFromAlignment(alignment: WordAlignment, max: number) {
  const total = alignment.words.length || 1
  const { good, weak } = alignment.counts
  const round = (value: number) => Math.round(Math.max(0, Math.min(1, value)) * max * 10) / 10
  return {
    content: round((good + weak - alignment.extras.length * 0.5) / total),
    pronunciation: round((good + weak * 0.5) / total),
  }
}
