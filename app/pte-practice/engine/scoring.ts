import { getTaskTypeMeta } from '../lib/taskTypes'
import type {
  AnswerPayload,
  FillBlanksDragItem,
  HighlightSummaryItem,
  ListeningFillBlanksItem,
  McqSingleItem,
  PracticeItem,
  ReadAloudItem,
  ReorderItem,
  ScoreDimensionResult,
  TaskType,
  WritingItem,
} from '../types'

/**
 * 打分引擎。
 *
 * 重要声明：以下所有函数产出的都是"练习估分"，用于给出即时反馈和展示官方
 * 公开的评分维度结构，不是 Pearson 官方评分算法的复现，也没有经过官方认证。
 * 客观题（阅读单选/重排/填空、听力填空/选概要）可以做到精确对错判定；
 * 主观题（口语朗读、写作）只能给出启发式或自评占位分数，UI 必须清晰标注。
 */

function normalizeWord(word: string) {
  return word.trim().toLowerCase().replace(/[.,!?;:"']/g, '')
}

export function scoreMcqSingle(item: McqSingleItem, selectedIndex: number | null): ScoreDimensionResult[] {
  const meta = getTaskTypeMeta(item.taskType)
  const correct = selectedIndex === item.correctIndex
  return [
    {
      id: 'content',
      label: meta.scoringDimensions[0].label,
      score: correct ? 1 : 0,
      maxScore: 1,
      isHeuristic: false,
      note: correct ? '答案正确。' : `答案错误，正确选项为第 ${item.correctIndex + 1} 项。`,
    },
  ]
}

export function scoreReorder(item: ReorderItem, order: number[]): ScoreDimensionResult[] {
  const meta = getTaskTypeMeta(item.taskType)
  const total = item.correctOrder.length
  const correctPositions = order.filter((paragraphIndex, position) => paragraphIndex === item.correctOrder[position]).length
  const ratio = total > 0 ? correctPositions / total : 0
  return [
    {
      id: 'content',
      label: meta.scoringDimensions[0].label,
      score: Math.round(ratio * 100) / 100,
      maxScore: 1,
      isHeuristic: false,
      note: `${correctPositions}/${total} 个段落位置正确（按整体顺序匹配比例计分，官方按相邻段落对计分，结果仅供参考）。`,
    },
  ]
}

export function scoreFillBlanksDrag(item: FillBlanksDragItem, answers: string[]): ScoreDimensionResult[] {
  const meta = getTaskTypeMeta(item.taskType)
  const total = item.correctAnswers.length
  const correctCount = item.correctAnswers.filter((answer, index) => normalizeWord(answers[index] ?? '') === normalizeWord(answer)).length
  const ratio = total > 0 ? correctCount / total : 0
  return [
    {
      id: 'content',
      label: meta.scoringDimensions[0].label,
      score: Math.round(ratio * 100) / 100,
      maxScore: 1,
      isHeuristic: false,
      note: `${correctCount}/${total} 个空格正确。`,
    },
  ]
}

export function scoreListeningFillBlanks(item: ListeningFillBlanksItem, answers: string[]): ScoreDimensionResult[] {
  const meta = getTaskTypeMeta(item.taskType)
  const total = item.correctAnswers.length
  const contentCorrect = item.correctAnswers.filter(
    (answer, index) => normalizeWord(answers[index] ?? '') === normalizeWord(answer)
  ).length
  const spellingCorrect = item.correctAnswers.filter((answer, index) => (answers[index] ?? '').trim() === answer).length
  const contentRatio = total > 0 ? contentCorrect / total : 0
  const spellingRatio = total > 0 ? spellingCorrect / total : 0
  return [
    {
      id: 'content',
      label: meta.scoringDimensions[0].label,
      score: Math.round(contentRatio * 100) / 100,
      maxScore: 1,
      isHeuristic: false,
      note: `${contentCorrect}/${total} 个空格内容匹配（忽略大小写与标点）。`,
    },
    {
      id: 'spelling',
      label: meta.scoringDimensions[1].label,
      score: Math.round(spellingRatio * 100) / 100,
      maxScore: 1,
      isHeuristic: false,
      note: `${spellingCorrect}/${total} 个空格完全拼写正确（区分大小写）。`,
    },
  ]
}

export function scoreHighlightSummary(item: HighlightSummaryItem, selectedIndex: number | null): ScoreDimensionResult[] {
  const meta = getTaskTypeMeta(item.taskType)
  const correct = selectedIndex === item.correctIndex
  return [
    {
      id: 'content',
      label: meta.scoringDimensions[0].label,
      score: correct ? 1 : 0,
      maxScore: 1,
      isHeuristic: false,
      note: correct ? '答案正确。' : `答案错误，正确选项为第 ${item.correctIndex + 1} 项。`,
    },
  ]
}

export interface ReadAloudHeuristicInput {
  item: ReadAloudItem
  recordingSeconds: number
  recognizedTranscript: string | null
}

/**
 * 口语朗读的启发式估分。没有真实的发音/流利度识别引擎，因此：
 * - Content：若浏览器提供了语音识别转写文本，按与原文的词汇重合率粗略估算；
 *   否则给出中性占位分并注明"未采集转写文本，无法估算"。
 * - Pronunciation：始终标注为无法通过启发式判断，给出占位分与说明。
 * - Oral Fluency：按录音时长与原文期望语速（约 2.2 词/秒的常见朗读语速）
 *   的接近程度粗略估算，仅反映"是否读完/是否明显过快过慢"，不代表真实流利度。
 */
export function scoreReadAloud({ item, recordingSeconds, recognizedTranscript }: ReadAloudHeuristicInput): ScoreDimensionResult[] {
  const meta = getTaskTypeMeta(item.taskType)
  const wordCount = item.text.trim().split(/\s+/).filter(Boolean).length
  const expectedSeconds = wordCount / 2.2
  const timingRatio = expectedSeconds > 0 ? Math.min(recordingSeconds, expectedSeconds) / Math.max(recordingSeconds, expectedSeconds, 0.01) : 0
  const fluencyScore = recordingSeconds > 0 ? Math.round(timingRatio * 5) : 0

  let contentScore = 2.5
  let contentNote = '当前浏览器未采集到语音转写文本，无法估算内容匹配度，此处为中性占位分。'
  if (recognizedTranscript) {
    const originalWords = new Set(item.text.split(/\s+/).map(normalizeWord).filter(Boolean))
    const recognizedWords = recognizedTranscript.split(/\s+/).map(normalizeWord).filter(Boolean)
    const matched = recognizedWords.filter((word) => originalWords.has(word)).length
    const ratio = originalWords.size > 0 ? matched / originalWords.size : 0
    contentScore = Math.round(ratio * 5)
    contentNote = `基于浏览器语音识别转写文本与原文的粗略词汇重合率估算（重合 ${matched}/${originalWords.size} 个词），非官方发音或语义评分。`
  }

  return [
    {
      id: 'content',
      label: meta.scoringDimensions[0].label,
      score: contentScore,
      maxScore: 5,
      isHeuristic: true,
      note: contentNote,
    },
    {
      id: 'pronunciation',
      label: meta.scoringDimensions[1].label,
      score: 2.5,
      maxScore: 5,
      isHeuristic: true,
      note: '本练习没有音素级发音识别能力，无法给出真实发音评分，此处为占位分，请自行回放录音并对照原文自评。',
    },
    {
      id: 'fluency',
      label: meta.scoringDimensions[2].label,
      score: fluencyScore,
      maxScore: 5,
      isHeuristic: true,
      note: `录音时长 ${recordingSeconds.toFixed(1)} 秒，参考语速下预期约 ${expectedSeconds.toFixed(1)} 秒，按时长接近程度粗略估算，仅供参考。`,
    },
  ]
}

export function countWords(text: string): number {
  return text.trim().length === 0 ? 0 : text.trim().split(/\s+/).filter(Boolean).length
}

export interface WritingHeuristicInput {
  item: WritingItem
  text: string
  secondsUsed: number
  timeLimitSeconds: number
}

/**
 * 写作任务的启发式评估。
 * - Form：可客观核对（字数是否在范围内，SWT 是否为单句）。
 * - Content / Grammar / Vocabulary（Essay 另加 Structure）：没有可靠的自动
 *   语义/语法评分能力，给出基于字数与用时的自评清单式占位分，并在 note 中
 *   提示用户自行对照官方评分维度描述自查，不代表真实评分。
 */
export function scoreWriting({ item, text, secondsUsed, timeLimitSeconds }: WritingHeuristicInput): ScoreDimensionResult[] {
  const meta = getTaskTypeMeta(item.taskType)
  const wordCount = countWords(text)
  const withinRange = wordCount >= item.minWords && wordCount <= item.maxWords
  const isSingleSentence = item.taskType !== 'writing-summarize-text' || (text.trim().match(/[.!?]/g) ?? []).length <= 1
  const usedTooLong = secondsUsed > timeLimitSeconds

  const results: ScoreDimensionResult[] = []
  for (const dimension of meta.scoringDimensions) {
    if (dimension.id === 'form') {
      const formOk = withinRange && isSingleSentence && !usedTooLong
      results.push({
        id: 'form',
        label: dimension.label,
        score: formOk ? dimension.maxScore : 0,
        maxScore: dimension.maxScore,
        isHeuristic: false,
        note: `字数 ${wordCount}（要求 ${item.minWords}-${item.maxWords}）${
          item.taskType === 'writing-summarize-text' ? '，且应为单句' : ''
        }，用时 ${Math.round(secondsUsed)} 秒（限时 ${Math.round(timeLimitSeconds)} 秒）。${formOk ? '符合形式要求。' : '不完全符合形式要求，请检查字数、句子数或用时。'}`,
      })
    } else {
      results.push({
        id: dimension.id,
        label: dimension.label,
        score: Math.round(dimension.maxScore * 0.5 * 10) / 10,
        maxScore: dimension.maxScore,
        isHeuristic: true,
        note: '本练习没有可靠的自动语义/语法评分能力，此处为中性占位分，请对照官方评分维度自行检查内容覆盖、语法准确性与词汇多样性。',
      })
    }
  }
  return results
}

// ---------------------------------------------------------------------------
// 基于自托管开源评分服务（见仓库根目录 pte-scoring-service/）的可选真实信号。
//
// 服务未配置（PTE_SCORING_SERVICE_URL 为空）或请求失败/超时时，下面的
// scoreReadAloudAsync / scoreWritingAsync 会静默回退到上面已有的
// scoreReadAloud / scoreWriting 启发式函数 —— 那两个函数保持完全不变，
// 继续作为离线/服务不可用时的默认路径。
//
// 即使评分服务可用，这里给出的也只是"基于开源模型/工具的估算"，不是 Pearson
// 官方评分算法，也未经官方认证，因此这里返回的 isHeuristic 恒为 true，
// note 会明确写"基于开源评分服务的估算，仍非 Pearson 官方评分"，与纯本地
// 估算的措辞（"本地估算（评分服务未配置/不可用）"）区分开。
// ---------------------------------------------------------------------------

interface ReadAloudServiceResponse {
  transcript?: string
  contentScore?: number
  pronunciationScore?: number
  fluencyScore?: number
  details?: unknown
}

interface WritingServiceResponse {
  grammarIssues?: unknown[]
  spellingIssues?: unknown[]
  grammarScore?: number
  spellingScore?: number
  vocabularyDiversity?: number
  contentKeywordCoverage?: number
}

async function fetchJsonWithTimeout(input: RequestInfo, init: RequestInit, timeoutMs = 20000): Promise<Response | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(input, { ...init, signal: controller.signal })
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/** 简单的类符比（Type-Token Ratio），用作词汇多样性的本地兜底计算。 */
function typeTokenRatio(text: string): number {
  const words = text.toLowerCase().split(/\s+/).map(normalizeWord).filter(Boolean)
  if (words.length === 0) return 0
  const unique = new Set(words)
  return unique.size / words.length
}

/** 与源文本/题目的关键词覆盖率，用作 Content 维度的本地兜底计算。 */
function keywordCoverage(sourceText: string, answerText: string): number {
  const sourceWords = new Set(sourceText.split(/\s+/).map(normalizeWord).filter((word) => word.length > 3))
  if (sourceWords.size === 0) return 0
  const answerWords = new Set(answerText.split(/\s+/).map(normalizeWord).filter(Boolean))
  let matched = 0
  sourceWords.forEach((word) => {
    if (answerWords.has(word)) matched += 1
  })
  return matched / sourceWords.size
}

/**
 * Read Aloud 的异步打分：优先调用自托管评分服务（OpenPronounce 发音评分 +
 * faster-whisper 转写 + 与原文的内容覆盖率），服务不可用时回退到
 * scoreReadAloud() 的启发式逻辑（完全不变）。
 */
export async function scoreReadAloudAsync(input: ReadAloudHeuristicInput & { audioBlob?: Blob | null }): Promise<ScoreDimensionResult[]> {
  const { item, audioBlob } = input
  const meta = getTaskTypeMeta(item.taskType)

  if (!audioBlob || audioBlob.size === 0) {
    return scoreReadAloud(input)
  }

  const formData = new FormData()
  formData.set('promptText', item.text)
  formData.set('audio', audioBlob, 'recording.webm')

  const res = await fetchJsonWithTimeout('/api/pte-scoring/read-aloud', { method: 'POST', body: formData })
  if (!res || !res.ok) {
    return scoreReadAloud(input)
  }

  let data: ReadAloudServiceResponse
  try {
    data = (await res.json()) as ReadAloudServiceResponse
  } catch {
    return scoreReadAloud(input)
  }

  const content = typeof data.contentScore === 'number' ? clamp(data.contentScore, 0, 5) : null
  const pronunciation = typeof data.pronunciationScore === 'number' ? clamp(data.pronunciationScore, 0, 5) : null
  const fluency = typeof data.fluencyScore === 'number' ? clamp(data.fluencyScore, 0, 5) : null

  if (content === null && pronunciation === null && fluency === null) {
    return scoreReadAloud(input)
  }

  const fallback = scoreReadAloud(input)
  const serviceNote = (detail: string) => `基于开源评分服务的估算（${detail}），仍非 Pearson 官方评分。`

  return [
    {
      id: 'content',
      label: meta.scoringDimensions[0].label,
      score: content ?? fallback[0].score,
      maxScore: 5,
      isHeuristic: true,
      note:
        content !== null
          ? serviceNote(`faster-whisper 转写文本与原文的内容覆盖率${data.transcript ? `，转写结果："${data.transcript.slice(0, 200)}"` : ''}`)
          : fallback[0].note,
    },
    {
      id: 'pronunciation',
      label: meta.scoringDimensions[1].label,
      score: pronunciation ?? fallback[1].score,
      maxScore: 5,
      isHeuristic: true,
      note: pronunciation !== null ? serviceNote('OpenPronounce 音素级发音比对') : fallback[1].note,
    },
    {
      id: 'fluency',
      label: meta.scoringDimensions[2].label,
      score: fluency ?? fallback[2].score,
      maxScore: 5,
      isHeuristic: true,
      note: fluency !== null ? serviceNote('转写结果的停顿/语速信号') : fallback[2].note,
    },
  ]
}

/**
 * Writing（SWT / Essay）的异步打分：Form 维度保持原有的客观规则判定；
 * Grammar/Spelling 优先使用 LanguageTool 的检查结果；Vocabulary 用本地
 * 类符比兜底（该指标本地即可算准，不依赖外部服务）；Content 用本地关键词
 * 覆盖率兜底。服务不可用时整体回退到 scoreWriting() 的启发式逻辑。
 */
export async function scoreWritingAsync(input: WritingHeuristicInput): Promise<ScoreDimensionResult[]> {
  const { item, text } = input
  const fallback = scoreWriting(input)

  const res = await fetchJsonWithTimeout('/api/pte-scoring/writing', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ promptText: item.prompt, sourceText: item.sourceText, text }),
  })
  if (!res || !res.ok) return fallback

  let data: WritingServiceResponse
  try {
    data = (await res.json()) as WritingServiceResponse
  } catch {
    return fallback
  }

  const vocabularyRatio = typeof data.vocabularyDiversity === 'number' ? clamp(data.vocabularyDiversity, 0, 1) : typeTokenRatio(text)
  const contentRatio =
    typeof data.contentKeywordCoverage === 'number' ? clamp(data.contentKeywordCoverage, 0, 1) : keywordCoverage(item.sourceText ?? item.prompt, text)
  const grammarIssueCount = Array.isArray(data.grammarIssues) ? data.grammarIssues.length : null
  const spellingIssueCount = Array.isArray(data.spellingIssues) ? data.spellingIssues.length : null

  const serviceNote = (detail: string) => `基于开源评分服务的估算（${detail}），仍非 Pearson 官方评分。`

  return fallback.map((dimension) => {
    if (dimension.id === 'form') return dimension // 客观判定，保持不变
    if (dimension.id === 'grammar') {
      // 网关的 grammarScore 是 0-1 的比例（LanguageTool 问题密度换算），
      // 这里按维度的官方小分制上限缩放。
      const grammarScore =
        typeof data.grammarScore === 'number'
          ? clamp(data.grammarScore, 0, 1) * dimension.maxScore
          : grammarIssueCount !== null
            ? clamp(dimension.maxScore * (1 - Math.min(grammarIssueCount, 10) / 10), 0, dimension.maxScore)
            : null
      if (grammarScore === null) return dimension
      return {
        ...dimension,
        score: Math.round(grammarScore * 10) / 10,
        note: serviceNote(`LanguageTool 检测到 ${grammarIssueCount ?? '未知数量'} 处语法问题`),
      }
    }
    if (dimension.id === 'vocabulary') {
      return {
        ...dimension,
        score: Math.round(vocabularyRatio * dimension.maxScore * 10) / 10,
        note: serviceNote(`词汇类符比（Type-Token Ratio）约 ${(vocabularyRatio * 100).toFixed(0)}%，本地计算，非外部服务依赖`),
      }
    }
    if (dimension.id === 'content') {
      return {
        ...dimension,
        score: Math.round(contentRatio * dimension.maxScore * 10) / 10,
        note: serviceNote(
          `与${item.sourceText ? '原文' : '题目'}的关键词覆盖率约 ${(contentRatio * 100).toFixed(0)}%，本地计算，不代表真实语义评分`
        ),
      }
    }
    if (dimension.id === 'structure' && spellingIssueCount !== null) {
      // Essay 的 structure 维度暂无独立信号，保留启发式占位分，但附加拼写问题数量供参考。
      return {
        ...dimension,
        note: `${dimension.note}（附加信息：LanguageTool 检测到 ${spellingIssueCount} 处拼写问题，供参考，未计入本维度分数）`,
      }
    }
    return dimension
  })
}

/**
 * 统一的打分入口：根据任务类型将题目与作答分发给对应的打分函数。
 * 这是唯一需要知道"每种题型如何打分"的地方，UI 组件只需要收集作答并调用它。
 */
export function scoreAttempt(taskType: TaskType, item: PracticeItem, answer: AnswerPayload, timeLimitSeconds: number): ScoreDimensionResult[] {
  switch (taskType) {
    case 'reading-mcq-single':
      if (item.taskType !== 'reading-mcq-single' || answer.taskType !== 'reading-mcq-single') throw new Error('题目与作答类型不匹配')
      return scoreMcqSingle(item, answer.selectedIndex)
    case 'reading-reorder':
      if (item.taskType !== 'reading-reorder' || answer.taskType !== 'reading-reorder') throw new Error('题目与作答类型不匹配')
      return scoreReorder(item, answer.order)
    case 'reading-fill-blanks-drag':
      if (item.taskType !== 'reading-fill-blanks-drag' || answer.taskType !== 'reading-fill-blanks-drag') throw new Error('题目与作答类型不匹配')
      return scoreFillBlanksDrag(item, answer.answers)
    case 'listening-fill-blanks-typed':
      if (item.taskType !== 'listening-fill-blanks-typed' || answer.taskType !== 'listening-fill-blanks-typed') throw new Error('题目与作答类型不匹配')
      return scoreListeningFillBlanks(item, answer.answers)
    case 'listening-highlight-summary':
      if (item.taskType !== 'listening-highlight-summary' || answer.taskType !== 'listening-highlight-summary') throw new Error('题目与作答类型不匹配')
      return scoreHighlightSummary(item, answer.selectedIndex)
    case 'speaking-read-aloud':
      if (item.taskType !== 'speaking-read-aloud' || answer.taskType !== 'speaking-read-aloud') throw new Error('题目与作答类型不匹配')
      return scoreReadAloud({ item, recordingSeconds: answer.recordingSeconds, recognizedTranscript: answer.recognizedTranscript })
    case 'writing-summarize-text':
    case 'writing-essay':
      if (
        (item.taskType !== 'writing-summarize-text' && item.taskType !== 'writing-essay') ||
        (answer.taskType !== 'writing-summarize-text' && answer.taskType !== 'writing-essay')
      )
        throw new Error('题目与作答类型不匹配')
      return scoreWriting({ item, text: answer.text, secondsUsed: answer.secondsUsed, timeLimitSeconds })
    default: {
      const exhaustiveCheck: never = taskType
      throw new Error(`未知的 PTE 任务类型: ${String(exhaustiveCheck)}`)
    }
  }
}

/**
 * scoreAttempt 的异步版本：客观题型（阅读/听力）与同步版本完全一致，直接
 * 复用；口语朗读与写作改为调用 scoreReadAloudAsync / scoreWritingAsync，
 * 因此会发起一次网络请求（若评分服务已配置），调用方应展示加载态。
 * 评分服务未配置或调用失败时，两个 Async 函数会各自静默回退到原有的
 * 本地启发式实现，本函数不需要额外处理降级逻辑。
 */
export async function scoreAttemptAsync(
  taskType: TaskType,
  item: PracticeItem,
  answer: AnswerPayload,
  timeLimitSeconds: number
): Promise<ScoreDimensionResult[]> {
  switch (taskType) {
    case 'speaking-read-aloud':
      if (item.taskType !== 'speaking-read-aloud' || answer.taskType !== 'speaking-read-aloud') throw new Error('题目与作答类型不匹配')
      return scoreReadAloudAsync({
        item,
        recordingSeconds: answer.recordingSeconds,
        recognizedTranscript: answer.recognizedTranscript,
        audioBlob: answer.audioBlob ?? null,
      })
    case 'writing-summarize-text':
    case 'writing-essay':
      if (
        (item.taskType !== 'writing-summarize-text' && item.taskType !== 'writing-essay') ||
        (answer.taskType !== 'writing-summarize-text' && answer.taskType !== 'writing-essay')
      )
        throw new Error('题目与作答类型不匹配')
      return scoreWritingAsync({ item, text: answer.text, secondsUsed: answer.secondsUsed, timeLimitSeconds })
    default:
      return scoreAttempt(taskType, item, answer, timeLimitSeconds)
  }
}
