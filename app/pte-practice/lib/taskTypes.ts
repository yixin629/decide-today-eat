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
  'reading-mcq-multiple': {
    id: 'reading-mcq-multiple',
    skill: 'reading',
    label: '多选题（Multiple Choice, Choose Multiple Answers）',
    shortLabel: '阅读多选',
    description: '阅读一段文字，从选项中选出全部正确答案（正确答案数量不提前告知）。',
    timeLimitSeconds: 120,
    scoringDimensions: [{ id: 'content', label: '内容正确性 Content', maxScore: 1, isHeuristic: false }],
    officialNote:
      '官方公开说明的计分方式为：每选中一个正确选项 +1 分，每选中一个错误选项 -1 分，得分不低于 0，满分为正确选项总数；本练习按该规则精确计算，但未经官方认证。',
  },
  'reading-fill-blanks-dropdown': {
    id: 'reading-fill-blanks-dropdown',
    skill: 'reading',
    label: '下拉选择填空（Reading & Writing: Fill in the Blanks）',
    shortLabel: '阅读下拉填空',
    description: '每个空格各自对应一个下拉选项列表（而非共享词库），选出最合适的词填入空格。',
    timeLimitSeconds: 120,
    scoringDimensions: [{ id: 'content', label: '内容正确性 Content', maxScore: 1, isHeuristic: false }],
    officialNote: '官方按每空正确与否计分，本练习按正确空格占比精确计分，客观判定。',
  },
  'listening-mcq-single': {
    id: 'listening-mcq-single',
    skill: 'listening',
    label: '单选题（Multiple Choice, Choose Single Answer）',
    shortLabel: '听力单选',
    description: '听录音（或阅读文字稿）后从选项中选出唯一正确答案。',
    timeLimitSeconds: 90,
    scoringDimensions: [{ id: 'content', label: '内容正确性 Content', maxScore: 1, isHeuristic: false }],
    officialNote: '官方按客观正误计分，本练习采用相同的对错判定方式。',
  },
  'listening-mcq-multiple': {
    id: 'listening-mcq-multiple',
    skill: 'listening',
    label: '多选题（Multiple Choice, Choose Multiple Answers）',
    shortLabel: '听力多选',
    description: '听录音（或阅读文字稿）后从选项中选出全部正确答案。',
    timeLimitSeconds: 120,
    scoringDimensions: [{ id: 'content', label: '内容正确性 Content', maxScore: 1, isHeuristic: false }],
    officialNote:
      '官方公开说明的计分方式与阅读多选题一致（正确 +1、错误 -1，下限为 0），本练习按该规则精确计算，未经官方认证。',
  },
  'listening-summarize-spoken-text': {
    id: 'listening-summarize-spoken-text',
    skill: 'listening',
    label: '总结听力要点（Summarize Spoken Text）',
    shortLabel: '听力总结写作',
    description: '听一段讲座（或阅读文字稿），用 50-70 词写一段总结。',
    timeLimitSeconds: 600,
    scoringDimensions: [
      { id: 'content', label: '内容 Content', maxScore: 2, isHeuristic: true },
      { id: 'form', label: '形式 Form', maxScore: 1, isHeuristic: false },
      { id: 'grammar', label: '语法 Grammar', maxScore: 2, isHeuristic: true },
      { id: 'vocabulary', label: '词汇 Vocabulary', maxScore: 2, isHeuristic: true },
      { id: 'spelling', label: '拼写 Spelling', maxScore: 2, isHeuristic: true },
    ],
    officialNote:
      '官方由 AI+人工评分内容、形式、语法、词汇、拼写等维度，本练习仅能自动核对字数是否在 50-70 词范围内（Form），其余维度为自评清单式占位分，不代表真实评分。',
  },
  'listening-select-missing-word': {
    id: 'listening-select-missing-word',
    skill: 'listening',
    label: '选缺失词（Select Missing Word）',
    shortLabel: '听力选缺词',
    description: '录音在结尾处被截断，从选项中选出能补全句子/录音的词或短语。',
    timeLimitSeconds: 90,
    scoringDimensions: [{ id: 'content', label: '内容正确性 Content', maxScore: 1, isHeuristic: false }],
    officialNote: '官方按客观正误计分，本练习采用相同的对错判定方式。',
  },
  'listening-highlight-incorrect-words': {
    id: 'listening-highlight-incorrect-words',
    skill: 'listening',
    label: '找出不符词（Highlight Incorrect Words）',
    shortLabel: '听力找错词',
    description: '播放录音的同时屏幕显示一份文字稿，其中部分单词与实际读音不符，点击选出这些单词。',
    timeLimitSeconds: 120,
    scoringDimensions: [{ id: 'content', label: '内容正确性 Content', maxScore: 1, isHeuristic: false }],
    officialNote:
      '官方按识别出的不符词数量计分。本练习按"正确识别数减去误选数、下限为 0，满分为不符词总数"的规则精确计算，未经官方认证。',
  },
  'listening-write-from-dictation': {
    id: 'listening-write-from-dictation',
    skill: 'listening',
    label: '听写（Write from Dictation）',
    shortLabel: '听力听写',
    description: '听一句较短的录音（或阅读文字稿），准确输入听到的内容。',
    timeLimitSeconds: 60,
    scoringDimensions: [{ id: 'content', label: '每个正确拼写且位置正确的单词 Content', maxScore: 1, isHeuristic: false }],
    officialNote: '官方按每个位置正确、拼写正确的单词计 1 分，本练习采用相同的逐词精确匹配规则。',
  },
  'speaking-repeat-sentence': {
    id: 'speaking-repeat-sentence',
    skill: 'speaking',
    label: '复述句子（Repeat Sentence）',
    shortLabel: '口语复述',
    description: '听一句较短的录音（或阅读文字稿），尽可能准确地复述出来并录音。',
    timeLimitSeconds: 15,
    prepSeconds: 3,
    scoringDimensions: [
      { id: 'content', label: '内容 Content', maxScore: 3, isHeuristic: true },
      { id: 'pronunciation', label: '发音 Pronunciation', maxScore: 3, isHeuristic: true },
      { id: 'fluency', label: '口语流利度 Oral Fluency', maxScore: 3, isHeuristic: true },
    ],
    officialNote:
      '官方按 0-3 分的小分制对内容、发音、流利度分别评分。本练习没有真实语音评分引擎，Content 维度在评分服务可用时使用转写文本与原句的覆盖率估算，服务不可用时回退为浏览器语音识别的粗略匹配或占位分；Pronunciation/Fluency 均为启发式或占位分，不代表真实评分。',
  },
  'speaking-describe-image': {
    id: 'speaking-describe-image',
    skill: 'speaking',
    label: '看图说话（Describe Image）',
    shortLabel: '口语看图说话',
    description: '准备后描述屏幕上出现的图表（柱状图/折线图等），约 40 秒。',
    timeLimitSeconds: 40,
    prepSeconds: 25,
    scoringDimensions: [
      { id: 'content', label: '内容 Content', maxScore: 5, isHeuristic: true },
      { id: 'pronunciation', label: '发音 Pronunciation', maxScore: 5, isHeuristic: true },
      { id: 'fluency', label: '口语流利度 Oral Fluency', maxScore: 5, isHeuristic: true },
    ],
    officialNote:
      '图表为本项目使用 SVG 原创绘制的柱状/折线图（非官方真题图片）。Content 维度在评分服务可用时按转写文本与本练习预设的参考描述关键词覆盖率估算，服务不可用时为占位分；Pronunciation/Fluency 均为启发式或占位分，不代表真实评分。',
  },
  'speaking-retell-lecture': {
    id: 'speaking-retell-lecture',
    skill: 'speaking',
    label: '复述讲座（Retell Lecture）',
    shortLabel: '口语复述讲座',
    description: '听一段较长的讲座（或阅读文字稿），准备后口头复述其要点，约 40 秒。',
    timeLimitSeconds: 40,
    prepSeconds: 10,
    scoringDimensions: [
      { id: 'content', label: '内容 Content', maxScore: 5, isHeuristic: true },
      { id: 'pronunciation', label: '发音 Pronunciation', maxScore: 5, isHeuristic: true },
      { id: 'fluency', label: '口语流利度 Oral Fluency', maxScore: 5, isHeuristic: true },
    ],
    officialNote:
      'Content 维度在评分服务可用时按转写文本与讲座原文的关键词覆盖率估算，服务不可用时为占位分；Pronunciation/Fluency 均为启发式或占位分，不代表真实评分。',
  },
  'speaking-answer-short-question': {
    id: 'speaking-answer-short-question',
    skill: 'speaking',
    label: '简答题（Answer Short Question）',
    shortLabel: '口语简答',
    description: '听一个简短问题（或阅读文字稿），用一到三个词口头作答。',
    timeLimitSeconds: 10,
    prepSeconds: 3,
    scoringDimensions: [{ id: 'content', label: '内容 Content', maxScore: 1, isHeuristic: true }],
    officialNote:
      '官方只考察内容维度的对错。本练习在浏览器提供语音识别转写文本时，会将转写结果与预设的可接受答案列表做精确文本匹配（忽略大小写与标点），可视为客观判定；但由于依赖浏览器语音识别的可用性与准确性，且无法保证转写本身可靠，因此该维度仍标记为启发式，未采集到转写文本时给出占位分。',
  },
  'speaking-summarize-group-discussion': {
    id: 'speaking-summarize-group-discussion',
    skill: 'speaking',
    label: '小组讨论总结（Summarize Group Discussion）',
    shortLabel: '口语讨论总结',
    description: '听三人约 3 分钟的学术讨论，准备 10 秒后用最多 2 分钟口头总结每位发言人的观点和讨论结论。',
    timeLimitSeconds: 120,
    prepSeconds: 10,
    scoringDimensions: [
      { id: 'content', label: '内容 Content', maxScore: 6, isHeuristic: true },
      { id: 'pronunciation', label: '发音 Pronunciation', maxScore: 5, isHeuristic: true },
      { id: 'fluency', label: '口语流利度 Oral Fluency', maxScore: 5, isHeuristic: true },
    ],
    officialNote:
      '2025 年 8 月新增题型，官方按 Content（0–6）、Oral Fluency（0–5）、Pronunciation（0–5）评分，需要覆盖三位发言人的观点。内置练习讨论约 1 分钟，短于真实考试的约 3 分钟。本练习按转写文本对参考要点的覆盖率估算内容、按语速估算流利度；自由表达无法逐词比对发音，发音维度不评估。',
  },
  'speaking-respond-to-situation': {
    id: 'speaking-respond-to-situation',
    skill: 'speaking',
    label: '情景回应（Respond to a Situation）',
    shortLabel: '口语情景回应',
    description: '阅读并听一段不超过 60 词的日常情境，准备 10 秒后用最多 40 秒做出得体的口头回应。',
    timeLimitSeconds: 40,
    prepSeconds: 10,
    scoringDimensions: [
      { id: 'content', label: '内容 Content', maxScore: 6, isHeuristic: true },
      { id: 'pronunciation', label: '发音 Pronunciation', maxScore: 5, isHeuristic: true },
      { id: 'fluency', label: '口语流利度 Oral Fluency', maxScore: 5, isHeuristic: true },
    ],
    officialNote:
      '2025 年 8 月新增题型，官方按 Content（0–6）、Oral Fluency（0–5）、Pronunciation（0–5）评分，内容看回应是否切题、完整且语气得体。本练习按转写文本对参考要点的覆盖率估算内容、按语速估算流利度；语气是否得体需对照参考回答自评，发音维度不评估。',
  },
}

export function getTaskTypeMeta(taskType: string): TaskTypeMeta {
  const meta = TASK_TYPE_META[taskType]
  if (!meta) throw new Error(`未知的 PTE 任务类型: ${taskType}`)
  return meta
}
