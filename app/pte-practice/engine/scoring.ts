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
