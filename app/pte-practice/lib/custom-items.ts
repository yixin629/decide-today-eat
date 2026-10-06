import { QUESTION_SOURCE_TYPES, TASK_TYPES, type DescribeImageChart, type PracticeItem, type QuestionProvenance, type QuestionSourceType, type TaskType } from '../types'

/**
 * 自定义题目：表单字段定义、"轻量标记文本 -> PracticeItem" 转换和统一校验。
 * 表单录入与 JSON 批量导入最终都走 validateCustomItem，保证写入云端的
 * payload 与内置题库结构一致，练习、评分和模考无需区分题目来源。
 */

export type FieldKind = 'text' | 'textarea' | 'number' | 'chart-type'

export interface FieldDef {
  key: string
  label: string
  kind: FieldKind
  placeholder?: string
  help?: string
  defaultValue?: string
  optional?: boolean
}

export type FieldValues = Record<string, string>

const MAX_TEXT = 6000
const MAX_SHORT = 600
const MAX_PAYLOAD_CHARS = 20000

const OPTIONS_HELP = '每行一个选项，在正确选项前加 *（例如 *The correct answer）。'
const HCS_QUESTION = 'Which of the following best summarizes the recording?'
const SWT_PROMPT = 'Read the passage below and summarize it in one sentence of no more than 75 words.'

const passage: FieldDef = { key: 'passage', label: '阅读文章', kind: 'textarea', placeholder: 'Paste the reading passage here…' }
const transcript: FieldDef = { key: 'transcript', label: '录音文字稿（用于朗读）', kind: 'textarea', placeholder: 'The lecture transcript that will be read aloud…' }
const question: FieldDef = { key: 'question', label: '题干', kind: 'text', placeholder: 'What is the main idea of the passage?' }
const singleOptions: FieldDef = { key: 'options', label: '选项（单选）', kind: 'textarea', help: OPTIONS_HELP + '只能标记一个。', placeholder: 'Option A\n*Option B\nOption C\nOption D' }
const multipleOptions: FieldDef = { key: 'options', label: '选项（多选）', kind: 'textarea', help: OPTIONS_HELP + '可以标记多个。', placeholder: '*Option A\n*Option B\nOption C\nOption D' }

export const CUSTOM_FIELDS: Record<TaskType, FieldDef[]> = {
  'reading-mcq-single': [passage, question, singleOptions],
  'reading-mcq-multiple': [passage, question, multipleOptions],
  'reading-reorder': [{ key: 'paragraphs', label: '段落（按正确顺序，每行一段）', kind: 'textarea', help: '保存时会自动打乱显示顺序，至少 3 段。', placeholder: 'First sentence…\nSecond sentence…\nThird sentence…' }],
  'reading-fill-blanks-drag': [
    { key: 'text', label: '带空格的文章', kind: 'textarea', help: '用 {答案} 标出每个空格，例如 Coral reefs are the {rainforests} of the sea.', placeholder: 'Coral reefs are often described as the {rainforests} of the sea…' },
    { key: 'distractors', label: '干扰词（可选）', kind: 'text', optional: true, help: '用英文逗号分隔，会和正确答案一起放进词库。', placeholder: 'shallow, declining' },
  ],
  'reading-fill-blanks-dropdown': [
    { key: 'text', label: '带下拉空格的文章', kind: 'textarea', help: '用 {正确词|干扰词|干扰词} 标出每个空格，第一个是正确答案，显示时会打乱。', placeholder: 'The discovery of antibiotics {transformed|ignored|delayed} modern medicine…' },
  ],
  'listening-fill-blanks-typed': [
    { key: 'text', label: '录音文字稿（标出空格）', kind: 'textarea', help: '用 {答案} 标出需要听写的词；朗读时会读出完整句子。', placeholder: 'Birds navigate using the Earth\'s {magnetic} field…' },
  ],
  'listening-highlight-summary': [transcript, { ...question, defaultValue: HCS_QUESTION }, { ...singleOptions, label: '摘要选项（单选）' }],
  'listening-mcq-single': [transcript, question, singleOptions],
  'listening-mcq-multiple': [transcript, question, multipleOptions],
  'listening-summarize-spoken-text': [
    transcript,
    { key: 'minWords', label: '最少词数', kind: 'number', defaultValue: '50' },
    { key: 'maxWords', label: '最多词数', kind: 'number', defaultValue: '70' },
  ],
  'listening-select-missing-word': [
    { key: 'text', label: '录音文字稿（标出结尾缺失部分）', kind: 'textarea', help: '把最后被"哔"掉的词写成 {missing words}，必须放在结尾。', placeholder: 'After weeks of drought, the farmers were relieved when the forecast finally predicted {heavy rain}.' },
    { ...singleOptions, help: OPTIONS_HELP + '正确选项应与 {} 中的内容一致。' },
  ],
  'listening-highlight-incorrect-words': [
    { key: 'text', label: '屏幕文字稿（标出错误词）', kind: 'textarea', help: '把显示错误的词写成 {显示的词|实际读的词}，例如 The library will {reduce|extend} its hours.', placeholder: 'The library will {reduce|extend} its {closing|opening} hours during exams.' },
  ],
  'listening-write-from-dictation': [{ key: 'sentence', label: '听写句子', kind: 'text', placeholder: 'The library will extend its opening hours during exams.' }],
  'speaking-read-aloud': [{ key: 'text', label: '朗读文本', kind: 'textarea', placeholder: 'Text to read aloud…' }],
  'speaking-repeat-sentence': [{ key: 'text', label: '复述句子', kind: 'text', placeholder: 'Please submit your assignment before Friday.' }],
  'speaking-describe-image': [
    { key: 'chartType', label: '图表类型', kind: 'chart-type', defaultValue: 'bar' },
    { key: 'title', label: '图表标题', kind: 'text', placeholder: 'Commuting by transport mode in a city' },
    { key: 'data', label: '数据（每行"类别: 数值"）', kind: 'textarea', help: '至少 2 行，例如 Bus: 35', placeholder: 'Walking: 15\nCycling: 20\nBus: 35\nCar: 30' },
    { key: 'unit', label: '单位（可选）', kind: 'text', optional: true, placeholder: '%' },
    { key: 'referenceDescription', label: '参考描述（用于内容估分）', kind: 'textarea', placeholder: 'The bar chart shows…' },
    { key: 'prepSeconds', label: '准备时间（秒）', kind: 'number', defaultValue: '25' },
  ],
  'speaking-retell-lecture': [transcript, { key: 'prepSeconds', label: '准备时间（秒）', kind: 'number', defaultValue: '10' }],
  'speaking-answer-short-question': [
    { key: 'question', label: '问题', kind: 'text', placeholder: 'What do you call a person who designs buildings?' },
    { key: 'acceptableAnswers', label: '可接受答案（每行一个）', kind: 'textarea', placeholder: 'architect\nan architect' },
  ],
  'speaking-summarize-group-discussion': [
    { key: 'topic', label: '讨论主题', kind: 'text', placeholder: 'Should universities replace lectures with online videos?' },
    { key: 'discussion', label: '讨论台词（每行"发言人: 内容"）', kind: 'textarea', help: '按顺序每行一段，至少 3 段、2 位发言人（真实考试为 3 位）。', placeholder: 'Maya: I think recorded lectures give students more flexibility...\nDaniel: But we lose the chance to ask questions...\nPriya: Maybe a blended model could work...' },
    { key: 'keyPoints', label: '参考要点（每行一条）', kind: 'textarea', help: '覆盖每位发言人的观点和讨论结论，用于内容估分和作答后对照。', placeholder: 'Maya: recorded lectures offer flexibility\nDaniel: live lectures allow questions\nThe group leans towards a blended model' },
    { key: 'prepSeconds', label: '准备时间（秒）', kind: 'number', defaultValue: '10' },
  ],
  'speaking-respond-to-situation': [
    { key: 'situation', label: '情境描述（约 60 词以内）', kind: 'textarea', placeholder: 'You borrowed a laptop from your classmate, but it stopped working while you were using it. Explain what happened and suggest what you will do.' },
    { key: 'keyPoints', label: '回应要点（每行一条）', kind: 'textarea', placeholder: 'Apologise to the classmate\nExplain what happened\nOffer to pay for the repair' },
    { key: 'sampleResponse', label: '参考回答', kind: 'textarea', placeholder: 'Hi Sam, I am really sorry...' },
    { key: 'prepSeconds', label: '准备时间（秒）', kind: 'number', defaultValue: '10' },
  ],
  'writing-summarize-text': [
    { key: 'prompt', label: '题目要求', kind: 'text', defaultValue: SWT_PROMPT },
    { key: 'sourceText', label: '原文', kind: 'textarea', placeholder: 'Passage to summarize…' },
    { key: 'minWords', label: '最少词数', kind: 'number', defaultValue: '5' },
    { key: 'maxWords', label: '最多词数', kind: 'number', defaultValue: '75' },
  ],
  'writing-essay': [
    { key: 'prompt', label: '作文题目', kind: 'textarea', placeholder: 'Some people believe that… Discuss both views and give your own opinion.' },
    { key: 'minWords', label: '最少词数', kind: 'number', defaultValue: '200' },
    { key: 'maxWords', label: '最多词数', kind: 'number', defaultValue: '300' },
  ],
}

export function defaultValues(taskType: TaskType): FieldValues {
  return Object.fromEntries(CUSTOM_FIELDS[taskType].map((field) => [field.key, field.defaultValue ?? '']))
}

export function newCustomItemId() {
  return `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

export function isCustomItemId(id: string) {
  return id.startsWith('custom-')
}

// ---------- 标记文本解析 ----------

function lines(value: string) {
  return value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
}

function parseOptions(value: string) {
  const parsed = lines(value).map((line) => ({ text: line.replace(/^\*\s*/, ''), correct: line.startsWith('*') }))
  return { options: parsed.map((option) => option.text), correct: parsed.flatMap((option, index) => (option.correct ? [index] : [])) }
}

/** 按 {...} 切分文本，返回空格之间的文本片段和每个空格的原始内容。 */
function parseBlanks(value: string) {
  const segments: string[] = []
  const blanks: string[] = []
  let rest = value.trim()
  for (let match = rest.match(/\{([^{}]+)\}/); match && match.index !== undefined; match = rest.match(/\{([^{}]+)\}/)) {
    segments.push(rest.slice(0, match.index))
    blanks.push(match[1].trim())
    rest = rest.slice(match.index + match[0].length)
  }
  segments.push(rest)
  return { segments, blanks }
}

function shuffle<T>(values: T[]): T[] {
  const copy = [...values]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function toInt(value: string | undefined) {
  const number = Number((value ?? '').trim())
  return Number.isInteger(number) ? number : NaN
}

/** 把表单值转换成待校验的题目对象（不含 id）。结构问题留给 validateCustomItem 统一报错。 */
export function buildFromFields(taskType: TaskType, values: FieldValues): Record<string, unknown> {
  const v = (key: string) => (values[key] ?? '').trim()
  switch (taskType) {
    case 'reading-mcq-single':
    case 'reading-mcq-multiple': {
      const { options, correct } = parseOptions(v('options'))
      return taskType === 'reading-mcq-single'
        ? { taskType, passage: v('passage'), question: v('question'), options, correctIndex: correct.length === 1 ? correct[0] : -1 }
        : { taskType, passage: v('passage'), question: v('question'), options, correctIndexes: correct }
    }
    case 'listening-highlight-summary':
    case 'listening-mcq-single':
    case 'listening-mcq-multiple': {
      const { options, correct } = parseOptions(v('options'))
      return taskType === 'listening-mcq-multiple'
        ? { taskType, transcript: v('transcript'), question: v('question'), options, correctIndexes: correct }
        : { taskType, transcript: v('transcript'), question: v('question'), options, correctIndex: correct.length === 1 ? correct[0] : -1 }
    }
    case 'reading-reorder': {
      const ordered = lines(v('paragraphs'))
      let order = ordered.map((_, index) => index)
      for (let tries = 0; tries < 5 && order.every((value, index) => value === index) && ordered.length > 1; tries += 1) order = shuffle(order)
      // paragraphs 为显示顺序；correctOrder[k] 表示正确顺序第 k 段在显示数组中的下标。
      return { taskType, paragraphs: order.map((index) => ordered[index]), correctOrder: ordered.map((_, index) => order.indexOf(index)) }
    }
    case 'reading-fill-blanks-drag': {
      const { segments, blanks } = parseBlanks(v('text'))
      const distractors = v('distractors').split(/[,，]/).map((word) => word.trim()).filter(Boolean)
      return { taskType, textSegments: segments, blankCount: blanks.length, wordBank: shuffle([...new Set([...blanks, ...distractors])]), correctAnswers: blanks }
    }
    case 'reading-fill-blanks-dropdown': {
      const { segments, blanks } = parseBlanks(v('text'))
      const choices = blanks.map((blank) => blank.split('|').map((word) => word.trim()).filter(Boolean))
      return { taskType, textSegments: segments, blankOptions: choices.map((choice) => shuffle(choice)), correctAnswers: choices.map((choice) => choice[0] ?? '') }
    }
    case 'listening-fill-blanks-typed': {
      const { segments, blanks } = parseBlanks(v('text'))
      return { taskType, transcript: v('text').replace(/\{([^{}]+)\}/g, '$1'), textSegments: segments, correctAnswers: blanks }
    }
    case 'listening-summarize-spoken-text':
      return { taskType, transcript: v('transcript'), minWords: toInt(v('minWords')), maxWords: toInt(v('maxWords')) }
    case 'listening-select-missing-word': {
      const text = v('text')
      const match = text.match(/\{([^{}]+)\}([.!?。]?)\s*$/)
      const { options, correct } = parseOptions(v('options'))
      return {
        taskType,
        fullTranscript: match ? text.replace(/\{([^{}]+)\}/, '$1') : '',
        displayedTranscript: match ? text.replace(/\{[^{}]+\}/, '____') : '',
        options,
        correctIndex: correct.length === 1 ? correct[0] : -1,
      }
    }
    case 'listening-highlight-incorrect-words': {
      const tokens = v('text').split(/\s+/).filter(Boolean)
      const displayed: string[] = []
      const spoken: string[] = []
      const incorrect: number[] = []
      tokens.forEach((token, index) => {
        const match = token.match(/^(.*)\{([^{}|]+)\|([^{}|]+)\}(.*)$/)
        if (!match) { displayed.push(token); spoken.push(token); return }
        displayed.push(`${match[1]}${match[2]}${match[4]}`)
        spoken.push(`${match[1]}${match[3]}${match[4]}`)
        incorrect.push(index)
      })
      return { taskType, audioTranscript: spoken.join(' '), displayedWords: displayed, incorrectWordIndexes: incorrect }
    }
    case 'listening-write-from-dictation':
      return { taskType, sentence: v('sentence') }
    case 'speaking-read-aloud':
    case 'speaking-repeat-sentence':
      return { taskType, text: v('text') }
    case 'speaking-describe-image': {
      const rows = lines(v('data')).map((line) => {
        const index = line.lastIndexOf(':') >= 0 ? line.lastIndexOf(':') : line.lastIndexOf('：')
        return index < 0 ? { label: line, value: NaN } : { label: line.slice(0, index).trim(), value: Number(line.slice(index + 1).trim()) }
      })
      const chart: Record<string, unknown> = { type: v('chartType') || 'bar', title: v('title'), categories: rows.map((row) => row.label), values: rows.map((row) => row.value) }
      if (v('unit')) chart.unit = v('unit')
      return { taskType, chart, referenceDescription: v('referenceDescription'), prepSeconds: toInt(v('prepSeconds')) }
    }
    case 'speaking-retell-lecture':
      return { taskType, transcript: v('transcript'), prepSeconds: toInt(v('prepSeconds')) }
    case 'speaking-answer-short-question':
      return { taskType, question: v('question'), acceptableAnswers: lines(v('acceptableAnswers')) }
    case 'speaking-summarize-group-discussion': {
      const turns = lines(v('discussion')).map((line) => {
        const index = line.search(/[:：]/)
        return index > 0 ? { speaker: line.slice(0, index).trim(), text: line.slice(index + 1).trim() } : { speaker: '', text: line }
      })
      return { taskType, topic: v('topic'), turns, keyPoints: lines(v('keyPoints')), prepSeconds: toInt(v('prepSeconds')) }
    }
    case 'speaking-respond-to-situation':
      return { taskType, situation: v('situation'), keyPoints: lines(v('keyPoints')), sampleResponse: v('sampleResponse'), prepSeconds: toInt(v('prepSeconds')) }
    case 'writing-summarize-text':
      return { taskType, prompt: v('prompt'), sourceText: v('sourceText'), minWords: toInt(v('minWords')), maxWords: toInt(v('maxWords')) }
    case 'writing-essay':
      return { taskType, prompt: v('prompt'), minWords: toInt(v('minWords')), maxWords: toInt(v('maxWords')) }
  }
}

// ---------- 统一校验 ----------

type Raw = Record<string, unknown>

class Checker {
  errors: string[] = []
  constructor(private raw: Raw) {}

  text(key: string, label: string, max = MAX_TEXT): string {
    const value = this.raw[key]
    if (typeof value !== 'string' || !value.trim()) { this.errors.push(`${label}不能为空`); return '' }
    if (value.length > max) this.errors.push(`${label}过长（最多 ${max} 字符）`)
    return value.trim()
  }

  textList(key: string, label: string, min: number, max: number, itemMax = MAX_SHORT): string[] {
    const value = this.raw[key]
    if (!Array.isArray(value) || !value.every((entry) => typeof entry === 'string')) { this.errors.push(`${label}格式不正确`); return [] }
    const list = value.map((entry: string) => entry.trim())
    if (list.length < min || list.length > max) this.errors.push(`${label}需要 ${min}-${max} 项（当前 ${list.length} 项）`)
    if (list.some((entry) => !entry)) this.errors.push(`${label}中有空白项`)
    if (list.some((entry) => entry.length > itemMax)) this.errors.push(`${label}中有内容过长（每项最多 ${itemMax} 字符）`)
    return list
  }

  /** 空格之间的文本片段：允许空字符串（空格位于开头/结尾时），但必须全为字符串。 */
  segments(key: string, blankCount: number, hint: string): string[] {
    const value = this.raw[key]
    const list = Array.isArray(value) && value.every((entry) => typeof entry === 'string') ? (value as string[]) : []
    if (!blankCount || list.length !== blankCount + 1) this.errors.push(hint)
    if (list.join('').length > MAX_TEXT) this.errors.push(`文章过长（最多 ${MAX_TEXT} 字符）`)
    return list
  }

  index(key: string, label: string, length: number): number {
    const value = this.raw[key]
    if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value >= length) { this.errors.push(`${label}：请标记且只标记一个正确选项`); return 0 }
    return value
  }

  indexes(key: string, label: string, length: number, min = 1): number[] {
    const value = this.raw[key]
    if (!Array.isArray(value) || !value.every((n) => typeof n === 'number' && Number.isInteger(n) && n >= 0 && n < length) || new Set(value).size !== value.length) {
      this.errors.push(`${label}格式不正确`)
      return []
    }
    if (value.length < min) this.errors.push(`${label}：至少需要 ${min} 个`)
    return value as number[]
  }

  int(key: string, label: string, min: number, max: number): number {
    const value = this.raw[key]
    if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max) { this.errors.push(`${label}需要是 ${min}-${max} 的整数`); return min }
    return value
  }

  wordRange(): { minWords: number; maxWords: number } {
    const minWords = this.int('minWords', '最少词数', 1, 1000)
    const maxWords = this.int('maxWords', '最多词数', 1, 1000)
    if (minWords > maxWords) this.errors.push('最少词数不能大于最多词数')
    return { minWords, maxWords }
  }
}

type NewItemContent = PracticeItem extends infer T ? (T extends PracticeItem ? Omit<T, 'id' | 'provenance'> : never) : never
type NewItem = NewItemContent & { provenance: QuestionProvenance }

function validateProvenance(raw: unknown): { provenance: QuestionProvenance | null; errors: string[] } {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { provenance: null, errors: ['缺少题目来源与授权信息 provenance'] }
  const data = raw as Raw
  const errors: string[] = []
  const sourceType = data.sourceType
  const sourceTitle = typeof data.sourceTitle === 'string' ? data.sourceTitle.trim() : ''
  const sourceUrl = typeof data.sourceUrl === 'string' ? data.sourceUrl.trim() : ''
  const rightsBasis = typeof data.rightsBasis === 'string' ? data.rightsBasis.trim() : ''
  if (typeof sourceType !== 'string' || !(QUESTION_SOURCE_TYPES as readonly string[]).includes(sourceType)) errors.push('provenance.sourceType 必须是 original、licensed、public-domain 或 user-provided')
  if (!sourceTitle || sourceTitle.length > 200) errors.push('provenance.sourceTitle 需要填写且不超过 200 字符')
  if (!rightsBasis || rightsBasis.length > 1000) errors.push('provenance.rightsBasis 需要说明授权依据且不超过 1000 字符')
  if (data.commercialUseAllowed !== true) errors.push('必须确认 provenance.commercialUseAllowed 为 true')
  if (sourceUrl) {
    try {
      const url = new URL(sourceUrl)
      if (url.protocol !== 'https:') errors.push('provenance.sourceUrl 必须使用 HTTPS')
    } catch { errors.push('provenance.sourceUrl 不是有效网址') }
  }
  if (errors.length) return { provenance: null, errors }
  return {
    provenance: {
      sourceType: sourceType as QuestionSourceType,
      sourceTitle,
      ...(sourceUrl ? { sourceUrl } : {}),
      rightsBasis,
      commercialUseAllowed: true,
      attestedAt: new Date().toISOString(),
    },
    errors: [],
  }
}

export function validateCustomItem(raw: unknown): { item: NewItem | null; errors: string[] } {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { item: null, errors: ['题目必须是一个 JSON 对象'] }
  const data = raw as Raw
  const taskType = data.taskType
  if (typeof taskType !== 'string' || !(TASK_TYPES as readonly string[]).includes(taskType)) return { item: null, errors: ['taskType 不是支持的题型'] }
  const c = new Checker(data)
  const content = buildValidated(taskType as TaskType, c, data)
  const { provenance, errors: provenanceErrors } = validateProvenance(data.provenance)
  c.errors.push(...provenanceErrors)
  const item = provenance ? { ...content, provenance } as NewItem : null
  if (!c.errors.length && item && JSON.stringify(item).length > MAX_PAYLOAD_CHARS) c.errors.push(`题目内容过长（整体最多 ${MAX_PAYLOAD_CHARS} 字符）`)
  return c.errors.length ? { item: null, errors: c.errors } : { item, errors: [] }
}

function buildValidated(taskType: TaskType, c: Checker, data: Raw): NewItemContent {
  switch (taskType) {
    case 'reading-mcq-single': {
      const options = c.textList('options', '选项', 2, 8)
      return { taskType, passage: c.text('passage', '阅读文章'), question: c.text('question', '题干', MAX_SHORT), options, correctIndex: c.index('correctIndex', '选项', options.length) }
    }
    case 'reading-mcq-multiple': {
      const options = c.textList('options', '选项', 3, 8)
      return { taskType, passage: c.text('passage', '阅读文章'), question: c.text('question', '题干', MAX_SHORT), options, correctIndexes: c.indexes('correctIndexes', '正确选项', options.length) }
    }
    case 'listening-highlight-summary':
    case 'listening-mcq-single': {
      const options = c.textList('options', '选项', 2, 8)
      return { taskType, transcript: c.text('transcript', '录音文字稿'), question: c.text('question', '题干', MAX_SHORT), options, correctIndex: c.index('correctIndex', '选项', options.length) }
    }
    case 'listening-mcq-multiple': {
      const options = c.textList('options', '选项', 3, 8)
      return { taskType, transcript: c.text('transcript', '录音文字稿'), question: c.text('question', '题干', MAX_SHORT), options, correctIndexes: c.indexes('correctIndexes', '正确选项', options.length) }
    }
    case 'reading-reorder': {
      const paragraphs = c.textList('paragraphs', '段落', 3, 8, 1500)
      const correctOrder = c.indexes('correctOrder', '正确顺序', paragraphs.length)
      if (correctOrder.length !== paragraphs.length) c.errors.push('正确顺序必须覆盖全部段落')
      return { taskType, paragraphs, correctOrder }
    }
    case 'reading-fill-blanks-drag': {
      const correctAnswers = c.textList('correctAnswers', '空格答案', 1, 10, 60)
      const textSegments = c.segments('textSegments', correctAnswers.length, '请用 {答案} 标出至少一个空格')
      const wordBank = c.textList('wordBank', '词库', 1, 20, 60)
      if (correctAnswers.some((answer) => !wordBank.includes(answer))) c.errors.push('词库必须包含所有正确答案')
      return { taskType, textSegments, blankCount: correctAnswers.length, wordBank, correctAnswers }
    }
    case 'reading-fill-blanks-dropdown': {
      const correctAnswers = c.textList('correctAnswers', '空格答案', 1, 10, 60)
      const textSegments = c.segments('textSegments', correctAnswers.length, '请用 {正确词|干扰词} 标出至少一个空格')
      const blankOptions = Array.isArray(data.blankOptions) ? (data.blankOptions as unknown[]) : []
      const options = blankOptions.map((choice) => (Array.isArray(choice) ? choice.filter((w): w is string => typeof w === 'string' && !!w.trim()).map((w) => w.trim()) : []))
      if (options.length !== correctAnswers.length || options.some((choice) => choice.length < 2 || choice.length > 6)) c.errors.push('每个下拉空格需要 2-6 个选项（用 | 分隔）')
      if (correctAnswers.some((answer, index) => !options[index]?.includes(answer))) c.errors.push('每个空格的选项必须包含正确答案')
      return { taskType, textSegments, blankOptions: options, correctAnswers }
    }
    case 'listening-fill-blanks-typed': {
      const correctAnswers = c.textList('correctAnswers', '空格答案', 1, 10, 60)
      const textSegments = c.segments('textSegments', correctAnswers.length, '请用 {答案} 标出至少一个空格')
      return { taskType, transcript: c.text('transcript', '录音文字稿'), textSegments, correctAnswers }
    }
    case 'listening-summarize-spoken-text':
      return { taskType, transcript: c.text('transcript', '录音文字稿'), ...c.wordRange() }
    case 'listening-select-missing-word': {
      const options = c.textList('options', '选项', 2, 8)
      const displayedTranscript = c.text('displayedTranscript', '文字稿（结尾需用 {缺失内容} 标记）')
      if (displayedTranscript && !displayedTranscript.includes('____')) c.errors.push('文字稿中缺少 ____ 空缺位置')
      return { taskType, fullTranscript: c.text('fullTranscript', '完整文字稿'), displayedTranscript, options, correctIndex: c.index('correctIndex', '选项', options.length) }
    }
    case 'listening-highlight-incorrect-words': {
      const displayedWords = c.textList('displayedWords', '屏幕文字稿单词', 3, 200, 60)
      const incorrectWordIndexes = c.indexes('incorrectWordIndexes', '错误词（用 {显示词|实际词} 标记）', displayedWords.length)
      return { taskType, audioTranscript: c.text('audioTranscript', '实际朗读文字稿'), displayedWords, incorrectWordIndexes }
    }
    case 'listening-write-from-dictation':
      return { taskType, sentence: c.text('sentence', '听写句子', MAX_SHORT) }
    case 'speaking-read-aloud':
      return { taskType, text: c.text('text', '朗读文本') }
    case 'speaking-repeat-sentence':
      return { taskType, text: c.text('text', '复述句子', MAX_SHORT) }
    case 'speaking-describe-image': {
      const chartRaw = data.chart && typeof data.chart === 'object' ? (data.chart as Raw) : {}
      const cc = new Checker(chartRaw)
      const type = chartRaw.type === 'line' ? 'line' : chartRaw.type === 'bar' ? 'bar' : null
      if (!type) c.errors.push('图表类型只能是柱状图或折线图')
      const categories = cc.textList('categories', '图表类别', 2, 12, 40)
      const values = Array.isArray(chartRaw.values) ? (chartRaw.values as unknown[]) : []
      if (values.length !== categories.length || !values.every((n) => typeof n === 'number' && Number.isFinite(n))) c.errors.push('每行数据都需要"类别: 数值"格式，数值必须是数字')
      const chart: DescribeImageChart = { type: type ?? 'bar', title: cc.text('title', '图表标题', 120), categories, values: values as number[] }
      if (typeof chartRaw.unit === 'string' && chartRaw.unit.trim()) chart.unit = chartRaw.unit.trim().slice(0, 12)
      c.errors.push(...cc.errors)
      return { taskType, chart, referenceDescription: c.text('referenceDescription', '参考描述'), prepSeconds: c.int('prepSeconds', '准备时间', 0, 120) }
    }
    case 'speaking-retell-lecture':
      return { taskType, transcript: c.text('transcript', '录音文字稿'), prepSeconds: c.int('prepSeconds', '准备时间', 0, 120) }
    case 'speaking-answer-short-question':
      return { taskType, question: c.text('question', '问题', MAX_SHORT), acceptableAnswers: c.textList('acceptableAnswers', '可接受答案', 1, 10, 80) }
    case 'speaking-summarize-group-discussion': {
      const rawTurns = Array.isArray(data.turns) ? (data.turns as unknown[]) : []
      const turns = rawTurns.map((turn) => {
        const value = turn && typeof turn === 'object' ? (turn as Raw) : {}
        return { speaker: typeof value.speaker === 'string' ? value.speaker.trim() : '', text: typeof value.text === 'string' ? value.text.trim() : '' }
      })
      if (turns.length < 3 || turns.length > 20) c.errors.push(`讨论需要 3-20 段台词（当前 ${turns.length} 段）`)
      if (turns.some((turn) => !turn.speaker || !turn.text)) c.errors.push('每段台词都需要"发言人: 内容"格式')
      if (turns.some((turn) => turn.speaker.length > 40 || turn.text.length > 1500)) c.errors.push('发言人名称最多 40 字符、每段台词最多 1500 字符')
      if (new Set(turns.map((turn) => turn.speaker)).size < 2) c.errors.push('讨论至少需要 2 位发言人')
      return { taskType, topic: c.text('topic', '讨论主题', 200), turns, keyPoints: c.textList('keyPoints', '参考要点', 2, 10, 300), prepSeconds: c.int('prepSeconds', '准备时间', 0, 60) }
    }
    case 'speaking-respond-to-situation':
      return { taskType, situation: c.text('situation', '情境描述', 800), keyPoints: c.textList('keyPoints', '回应要点', 1, 8, 300), sampleResponse: c.text('sampleResponse', '参考回答', 1500), prepSeconds: c.int('prepSeconds', '准备时间', 0, 60) }
    case 'writing-summarize-text':
      return { taskType, prompt: c.text('prompt', '题目要求', MAX_SHORT), sourceText: c.text('sourceText', '原文'), ...c.wordRange() }
    case 'writing-essay':
      return { taskType, prompt: c.text('prompt', '作文题目', 1500), ...c.wordRange() }
  }
}

function parseList(text: string): { list: unknown[]; error: string | null } {
  let parsed: unknown
  try { parsed = JSON.parse(text) } catch { return { list: [], error: '不是有效的 JSON' } }
  return { list: Array.isArray(parsed) ? parsed : [parsed], error: null }
}

/**
 * 解析 JSON 批量导入：支持单个对象或数组，忽略其中的 id 字段。
 * 每道题必须自带 provenance（sourceType / sourceTitle / rightsBasis，可选 sourceUrl）；
 * 商用授权确认由上传者在页面上勾选（attested），不从文件中读取，避免确认被文件内容代替。
 */
export function parseImportJson(text: string, attested: boolean): { items: NewItem[]; errors: string[] } {
  const { list, error } = parseList(text)
  if (error) return { items: [], errors: [error] }
  if (!attested) return { items: [], errors: ['请先勾选商用授权确认，再校验或导入'] }
  if (!list.length) return { items: [], errors: ['JSON 中没有题目'] }
  if (list.length > 50) return { items: [], errors: ['一次最多导入 50 道题'] }
  const items: NewItem[] = []
  const errors: string[] = []
  list.forEach((entry, index) => {
    const own = entry && typeof entry === 'object' && !Array.isArray(entry) ? (entry as Raw).provenance : undefined
    if (!own || typeof own !== 'object' || Array.isArray(own)) {
      errors.push(`第 ${index + 1} 题：缺少 provenance 来源信息（可用"写入来源模板"补上）`)
      return
    }
    const { item, errors: itemErrors } = validateCustomItem({ ...(entry as Raw), provenance: { ...(own as Raw), commercialUseAllowed: true } })
    if (item) items.push(item)
    else errors.push(`第 ${index + 1} 题：${itemErrors.join('；')}`)
  })
  return { items, errors }
}

/** 把来源模板写入缺少 provenance 的题目，返回格式化后的 JSON；已有 provenance 的题目保持不变。 */
export function applyProvenanceTemplate(text: string, template: Omit<QuestionProvenance, 'commercialUseAllowed' | 'attestedAt'>): { text: string; filled: number; error: string | null } {
  const { list, error } = parseList(text)
  if (error) return { text, filled: 0, error }
  let filled = 0
  const next = list.map((entry) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return entry
    const provenance = (entry as Raw).provenance
    const hasCompleteProvenance = provenance && typeof provenance === 'object' && !Array.isArray(provenance)
      && typeof (provenance as Raw).sourceTitle === 'string' && !!((provenance as Raw).sourceTitle as string).trim()
      && typeof (provenance as Raw).rightsBasis === 'string' && !!((provenance as Raw).rightsBasis as string).trim()
    if (hasCompleteProvenance) return entry
    filled += 1
    return { ...(entry as Raw), provenance: template }
  })
  return { text: JSON.stringify(next, null, 2), filled, error: null }
}

export type { NewItem as NewPracticeItem }
