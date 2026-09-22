import type { TaskTypeMeta } from '../types'

/**
 * 任务类型元数据。时间限制参考 Pearson 官方公开的 Score Guide 与考试说明中
 * 记录的时长（如 Read Aloud 准备+录音时间、SWT 10 分钟、Essay 20 分钟等）。
 * 打分维度名称同样取自官方公开的评分维度说明，但具体分值来自本项目的启发式
 * 估算，并非官方算法，UI 中一律标注"练习估分，非官方评分"。
 */
export const TASK_TYPE_META: Record<string, TaskTypeMeta> = {
  'reading-mcq-single': {
    id: 'reading-mcq-single',
    skill: 'reading',
    label: '单选题（Multiple Choice, Choose Single Answer）',
    shortLabel: '阅读单选',
    description: '阅读一段文字，从选项中选出唯一正确答案。',
    timeLimitSeconds: 90,
    scoringDimensions: [{ id: 'content', label: '内容正确性 Content', maxScore: 1, isHeuristic: false }],
    officialNote: '官方按客观正误计分，本练习采用相同的对错判定方式。',
  },
  'reading-reorder': {
    id: 'reading-reorder',
    skill: 'reading',
    label: '段落重排（Re-order Paragraphs）',
    shortLabel: '段落重排',
    description: '将打乱的段落拖拽排列成逻辑通顺的原文顺序。',
    timeLimitSeconds: 120,
    scoringDimensions: [{ id: 'content', label: '顺序正确性 Content', maxScore: 1, isHeuristic: false }],
    officialNote: '官方按相邻段落对的正确衔接数计分，本练习按整体顺序匹配比例估算。',
  },
  'reading-fill-blanks-drag': {
    id: 'reading-fill-blanks-drag',
    skill: 'reading',
    label: '拖拽填空（Reading: Fill in the Blanks）',
    shortLabel: '阅读拖拽填空',
    description: '从词库中拖拽合适的单词填入文章空格。',
    timeLimitSeconds: 120,
    scoringDimensions: [{ id: 'content', label: '内容正确性 Content', maxScore: 1, isHeuristic: false }],
    officialNote: '官方按每空正确与否计分，本练习按正确空格占比计分。',
  },
  'listening-fill-blanks-typed': {
    id: 'listening-fill-blanks-typed',
    skill: 'listening',
    label: '听写填空（Listening: Fill in the Blanks）',
    shortLabel: '听力填空',
    description: '听录音（或阅读文字稿）并输入所缺单词。',
    timeLimitSeconds: 180,
    scoringDimensions: [
      { id: 'content', label: '内容正确性 Content', maxScore: 1, isHeuristic: false },
      { id: 'spelling', label: '拼写 Listening & Spelling', maxScore: 1, isHeuristic: false },
    ],
    officialNote: '官方按每空正确拼写计分，本练习区分"内容匹配"与"拼写完全一致"两个维度。',
  },
  'listening-highlight-summary': {
    id: 'listening-highlight-summary',
    skill: 'listening',
    label: '选择正确概要（Highlight Correct Summary）',
    shortLabel: '听力选概要',
    description: '听录音（或阅读文字稿）后选出最能概括内容的一项。',
    timeLimitSeconds: 150,
    scoringDimensions: [{ id: 'content', label: '内容正确性 Content', maxScore: 1, isHeuristic: false }],
    officialNote: '官方按客观正误计分，本练习采用相同的对错判定方式。',
  },
  'speaking-read-aloud': {
    id: 'speaking-read-aloud',
    skill: 'speaking',
    label: '朗读（Read Aloud）',
    shortLabel: '口语朗读',
    description: '准备后按提示文本大声朗读并录音。',
    timeLimitSeconds: 40,
    prepSeconds: 35,
    scoringDimensions: [
      { id: 'content', label: '内容 Content', maxScore: 5, isHeuristic: true },
      { id: 'pronunciation', label: '发音 Pronunciation', maxScore: 5, isHeuristic: true },
      { id: 'fluency', label: '口语流利度 Oral Fluency', maxScore: 5, isHeuristic: true },
    ],
    officialNote:
      '官方使用语音识别与发音模型评分，本练习没有真实语音评分引擎，仅提供基于录音时长/语速的流利度启发式估计，以及（若浏览器支持语音识别）与原文的粗略文本匹配度，均不代表真实发音或内容准确度。',
  },
  'writing-summarize-text': {
    id: 'writing-summarize-text',
    skill: 'writing',
    label: '概括写作（Summarize Written Text）',
    shortLabel: '概括写作',
    description: '阅读一篇文章，用一句话（一个句子）总结主旨。',
    timeLimitSeconds: 600,
    scoringDimensions: [
      { id: 'content', label: '内容 Content', maxScore: 2, isHeuristic: true },
      { id: 'form', label: '形式 Form', maxScore: 1, isHeuristic: false },
      { id: 'grammar', label: '语法 Grammar', maxScore: 2, isHeuristic: true },
      { id: 'vocabulary', label: '词汇 Vocabulary', maxScore: 2, isHeuristic: true },
    ],
    officialNote: '官方由 AI+人工评分内容、形式、语法、词汇等维度，本练习仅能自动核对字数/单句形式，其余维度为自评清单，不代表真实评分。',
  },
  'writing-essay': {
    id: 'writing-essay',
    skill: 'writing',
    label: '议论文写作（Essay）',
    shortLabel: '议论文',
    description: '针对给定题目撰写一篇 200-300 词的议论文。',
    timeLimitSeconds: 1200,
    scoringDimensions: [
      { id: 'content', label: '内容 Content', maxScore: 3, isHeuristic: true },
      { id: 'form', label: '形式 Form', maxScore: 2, isHeuristic: false },
      { id: 'grammar', label: '语法 Grammar', maxScore: 2, isHeuristic: true },
      { id: 'vocabulary', label: '词汇 Vocabulary', maxScore: 2, isHeuristic: true },
      { id: 'structure', label: '篇章结构 Development, Structure & Coherence', maxScore: 2, isHeuristic: true },
    ],
    officialNote: '官方由 AI+人工评分多个维度，本练习仅能自动核对字数/用时，其余维度为自评清单，不代表真实评分。',
  },
}

export function getTaskTypeMeta(taskType: string): TaskTypeMeta {
  const meta = TASK_TYPE_META[taskType]
  if (!meta) throw new Error(`未知的 PTE 任务类型: ${taskType}`)
  return meta
}
