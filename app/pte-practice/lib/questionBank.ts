import type {
  FillBlanksDragItem,
  HighlightSummaryItem,
  ListeningFillBlanksItem,
  McqSingleItem,
  PracticeItem,
  ReadAloudItem,
  ReorderItem,
  TaskType,
  WritingItem,
} from '../types'

/**
 * 原创示例题库（非 Pearson 官方真题，非"机经"）。
 *
 * 本文件内容均为参考 PTE 公开题型格式自行编写的练习素材，仅用于演示各任务
 * 类型的交互与打分维度展示。数量刻意保持精简（MVP 每种题型 2-3 题），
 * 后续应替换为用户自有的、合法授权的题库。
 *
 * 结构约定：本文件只导出按题型分组的纯数据数组，不包含任何 UI 或评分逻辑，
 * 因此可以整体替换或扩展为从远端/本地 JSON 加载，而不需要改动组件代码。
 */

const readingMcqSingle: McqSingleItem[] = [
  {
    id: 'r-mcq-1',
    taskType: 'reading-mcq-single',
    passage:
      'Urban beekeeping has grown in popularity across many cities over the past decade. Advocates argue that rooftop hives help pollinate community gardens and raise public awareness of declining bee populations. Critics, however, point out that untrained hobbyists can inadvertently spread diseases between colonies and that a high density of hives in one area may increase competition for the limited flowers found in cities.',
    question: '根据文章，反对城市养蜂的人主要担心什么？',
    options: [
      '蜜蜂会袭击行人',
      '缺乏经验的养蜂者可能传播疾病并造成蜂群间的资源竞争',
      '屋顶蜂箱会损坏建筑结构',
      '城市里完全没有花可供采蜜',
    ],
    correctIndex: 1,
  },
  {
    id: 'r-mcq-2',
    taskType: 'reading-mcq-single',
    passage:
      'While remote work offers flexibility, several studies suggest that employees who work from home exclusively report feeling less connected to their teams than those who follow a hybrid schedule. Companies experimenting with mandatory in-office days say the goal is not to reduce flexibility but to preserve opportunities for spontaneous collaboration that video calls rarely replicate.',
    question: '公司要求每周固定进办公室的主要目的是什么？',
    options: ['降低办公室租金', '减少员工的工作灵活性', '保留视频会议难以replicate的自发协作机会', '监督员工的工作时长'],
    correctIndex: 2,
  },
]

const readingReorder: ReorderItem[] = [
  {
    id: 'r-reorder-1',
    taskType: 'reading-reorder',
    paragraphs: [
      'As a result, several museums have begun offering audio tours narrated entirely by artificial intelligence, tailored to a visitor\'s stated interests.',
      'Museums have traditionally relied on printed guides and human docents to help visitors interpret exhibits.',
      'However, staffing a docent for every gallery is costly, and printed guides cannot adapt to an individual visitor\'s pace or curiosity.',
      'Early feedback suggests that while visitors appreciate the personalization, many still miss the spontaneous storytelling that a human guide can provide.',
    ],
    correctOrder: [1, 2, 0, 3],
  },
]

const readingFillBlanksDrag: FillBlanksDragItem[] = [
  {
    id: 'r-fillblank-1',
    taskType: 'reading-fill-blanks-drag',
    textSegments: [
      'Coral reefs are often described as the ',
      ' of the sea because they support an extraordinarily ',
      ' range of marine life. Rising ocean temperatures, however, are causing coral ',
      ' events to occur more frequently than in the past.',
    ],
    blankCount: 3,
    wordBank: ['rainforests', 'diverse', 'bleaching', 'shallow', 'declining'],
    correctAnswers: ['rainforests', 'diverse', 'bleaching'],
  },
]

const listeningFillBlanksTyped: ListeningFillBlanksItem[] = [
  {
    id: 'l-fillblank-1',
    taskType: 'listening-fill-blanks-typed',
    transcript:
      'Good morning everyone. Today\'s lecture will focus on how migratory birds navigate across continents using a combination of the sun, the stars, and the Earth\'s magnetic field. Researchers believe this ability is partly inherited and partly learned during the bird\'s first migration.',
    textSegments: [
      'Today\'s lecture will focus on how migratory birds navigate across continents using a combination of the sun, the stars, and the Earth\'s ',
      ' field. Researchers believe this ability is partly inherited and partly learned during the bird\'s first ',
      '.',
    ],
    correctAnswers: ['magnetic', 'migration'],
  },
]

const listeningHighlightSummary: HighlightSummaryItem[] = [
  {
    id: 'l-summary-1',
    taskType: 'listening-highlight-summary',
    transcript:
      'A growing number of city governments are converting unused parking lots into small public parks. Supporters say this improves air quality and gives residents in dense neighborhoods more green space, while some local business owners worry about losing customer parking during the transition.',
    question: '以下哪一项最准确地概括了这段录音的内容？',
    options: [
      '城市政府正在把闲置停车场改造为小型公园，此举获得部分居民支持但也引发商家对停车位减少的担忧',
      '所有商家都强烈反对任何形式的城市绿化项目',
      '停车场改造项目已经被政府完全取消',
      '这段录音主要讨论如何提高停车场的使用费',
    ],
    correctIndex: 0,
  },
]

const speakingReadAloud: ReadAloudItem[] = [
  {
    id: 's-ra-1',
    taskType: 'speaking-read-aloud',
    text: 'Renewable energy sources such as solar and wind power now account for a growing share of global electricity generation, driven largely by falling technology costs and supportive government policy.',
  },
  {
    id: 's-ra-2',
    taskType: 'speaking-read-aloud',
    text: 'Public libraries have evolved well beyond lending books, now offering free internet access, community workshops, and quiet study spaces that serve people of every age.',
  },
]

const writingSummarizeText: WritingItem[] = [
  {
    id: 'w-swt-1',
    taskType: 'writing-summarize-text',
    prompt: '请用一个句子（不超过 75 词）概括下面这段文字的主旨。',
    sourceText:
      'Telemedicine usage surged during the pandemic and has remained far above pre-pandemic levels even as in-person visits resumed. Patients cite convenience and reduced travel time as the main benefits, while doctors note that certain conditions still require a physical examination. Health insurers are now debating whether to permanently reimburse virtual visits at the same rate as in-person ones, a decision that could shape the future of primary care.',
    minWords: 5,
    maxWords: 75,
  },
]

const writingEssay: WritingItem[] = [
  {
    id: 'w-essay-1',
    taskType: 'writing-essay',
    prompt:
      'Some people believe that university education should be free for all students, while others think students should pay for at least part of their tuition. Discuss both views and give your own opinion.',
    minWords: 200,
    maxWords: 300,
  },
]

export const QUESTION_BANK: Record<TaskType, PracticeItem[]> = {
  'reading-mcq-single': readingMcqSingle,
  'reading-reorder': readingReorder,
  'reading-fill-blanks-drag': readingFillBlanksDrag,
  'listening-fill-blanks-typed': listeningFillBlanksTyped,
  'listening-highlight-summary': listeningHighlightSummary,
  'speaking-read-aloud': speakingReadAloud,
  'writing-summarize-text': writingSummarizeText,
  'writing-essay': writingEssay,
}

export function getItemsForTaskType(taskType: TaskType): PracticeItem[] {
  return QUESTION_BANK[taskType] ?? []
}

export function getItemById(taskType: TaskType, itemId: string): PracticeItem | undefined {
  return getItemsForTaskType(taskType).find((item) => item.id === itemId)
}
