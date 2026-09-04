export interface PteTemplate {
  id: string
  taskTypes: readonly string[]
  badge: string
  title: string
  subtitle: string
  tips: readonly string[]
  lines: readonly string[]
}

export interface SavedPteTemplate extends PteTemplate {
  createdAt: string
  updatedAt: string
}

export const PTE_TEMPLATE_TASK_TYPES = [
  'DI',
  'SGD',
  'RL',
  'RS',
  'RA',
  'RTS',
  'ASQ',
  'WE',
  'SWT',
  'SST',
  'WFD',
  'FIB',
  'FIBDD',
  'RO',
  'HIW',
] as const

export const PTE_TEMPLATES: readonly PteTemplate[] = [
  {
    id: 'sgd-2',
    taskTypes: ['SGD'],
    badge: 'SGD 2.0',
    title: 'Summarize Group Discussion',
    subtitle: '60–70 秒｜只记前面两轮｜中高分段均适用',
    tips: [
      '先确定主题词',
      '记录每位发言人的立场、原因和补充信息',
      'similar/different 按真实关系选择',
    ],
    lines: [
      'The discussion is about three people talking about [主题词].',
      'According to the recording, the first speaker mentions that [句子1] and [句子2].',
      'Moreover, she/he says that [句子3].',
      'The second speaker shares a similar/different view with the first speaker, saying that [句子1] because [句子2].',
      'She/He then explains that [句子3].',
      'As for the third speaker, her/his opinion is the same as/different from the first/second speaker.',
      'She/He first mentions that [句子1] and [句子2].',
      'At the end of the discussion, he/she explains that [句子3].',
      'Overall, the group discussion is about [核心词].',
    ],
  },
  {
    id: 'di-single-data',
    taskTypes: ['DI'],
    badge: 'DI 数据类',
    title: '单柱 / 单线 / 单饼通用模板',
    subtitle: '先主题，再最大最小值，补充两项数据，最后总结',
    tips: ['类别、年份和数值只说看得清且有把握的信息', '最大值与最小值形成对比', '主题句首尾呼应'],
    lines: [
      'This graph shows information about [主题，如 energy sources / market share].',
      'There are several items in the graph, such as [A], [B] and [C].',
      'The largest number can be found in [类别A] (in [年份/组别]), which is [数值].',
      'In contrast, the smallest value can be seen in [类别B] (in [年份/组别]), which is [数值].',
      'In addition, the value of [类别C] is [数值] (in [年份/组别]), and the value of [类别D] is [数值] (in [年份/组别]).',
      'Overall, this graph shows information about [主题].',
    ],
  },
  {
    id: 'di-double-data',
    taskTypes: ['DI'],
    badge: 'DI 数据类',
    title: '双柱 / 双线 / 双饼通用模板',
    subtitle: '分别概括两个类别的最大值与最小值',
    tips: ['先完成类别 A，再完成类别 B', 'while 用来连接第二组对比', '避免为了塞满模板而读错数值'],
    lines: [
      'This graph shows information about [主题，如 energy sources / market share].',
      'For [类别A], the largest number can be found in [年份/组别], which is [数值].',
      'In contrast, the smallest value can be seen in [年份/组别], which is [数值].',
      'For [类别B], the largest number can be found in [年份/组别], which is [数值], while the smallest value can be seen in [年份/组别], which is [数值].',
      'Overall, this graph shows information about [主题].',
    ],
  },
  {
    id: 'di-process-1',
    taskTypes: ['DI'],
    badge: 'DI 流程图 1.0',
    title: '无文字纯图片流程图',
    subtitle: '按步骤描述动作，最后判断线性或循环',
    tips: ['先数清关键步骤', '每一步只说一个清晰动作', 'linear/cyclical 二选一'],
    lines: [
      'The graph shows information about [主题，如 production / recycling], and there are about [X] key steps.',
      'The first step involves [第一步].',
      'The next step is [第二步].',
      'Then comes the third step, which is [第三步].',
      'Finally, the process ends with [第四步].',
      'Overall, this is a linear/cyclical process with [X] key stages.',
    ],
  },
  {
    id: 'di-process-2',
    taskTypes: ['DI'],
    badge: 'DI 流程图 2.0',
    title: '带文字流程图',
    subtitle: '使用 from A to B 串联图中的文字节点',
    tips: ['优先读节点名称', 'from/to 前后保持顺序正确', '最后一步可直接说终点'],
    lines: [
      'The graph shows information about [主题，如 production / recycling], and there are about [X] key steps.',
      'The first step is from [第一步] to [第二步].',
      'The next is from [第二步] to [第三步].',
      'Then comes the third step, which is from [第三步] to [第四步].',
      'Finally, the process ends with [第五步].',
      'Overall, this is a linear/cyclical process with [X] key steps.',
    ],
  },
  {
    id: 'di-picture-1',
    taskTypes: ['DI'],
    badge: 'DI 纯图片 1.0',
    title: '先总后分，先主后次',
    subtitle: '适合主体明确、细节层级清楚的图片',
    tips: ['第一句直接确定标题或主题', '先核心信息，再补充其他细节', '不要描述无法确认的因果'],
    lines: [
      'This picture shows information about [标题].',
      'According to this picture, there are [核心信息].',
      'Looking into details, we can find that [细节].',
      'Other important features include [其他细节].',
      'Overall, this picture describes [标题].',
    ],
  },
  {
    id: 'di-picture-2',
    taskTypes: ['DI'],
    badge: 'DI 纯图片 2.0',
    title: '按上下左右描述',
    subtitle: '适合元素较散、可以按空间位置组织的图片',
    tips: ['top/bottom 或 left/right 选择一组主线', '每个位置说一个最明显特征', '结尾回到整体主题'],
    lines: [
      'This picture shows information about [标题].',
      'At the top of the picture / On the left side, we can find that [细节].',
      'At the bottom of the picture / On the right side, we can see [细节].',
      'Other important features include [其他细节].',
      'Overall, this picture describes [标题].',
    ],
  },
  {
    id: 'rl-sst-sentence',
    taskTypes: ['RL', 'SST'],
    badge: 'RL / SST',
    title: '完整句子模板',
    subtitle: '高分段一总四分｜中低分段一总三分',
    tips: [
      '若笔记是“动词 + 名词”词组，可把动词改成 V-ing 再放入词组位置',
      'mentions/says/explains/points out that 后接句子',
      'refers to/points out/talks about 后接词组',
      '词组和句子可以根据笔记顺序调整，不必硬套固定位置',
    ],
    lines: [
      'The speaker in the recording is talking about [主题词：词或词组].',
      'According to the recording, the speaker first mentions that [要点1：句子], and then points out that [要点2：句子].',
      'Moreover, he/she explains that [要点3：句子].',
      'Finally, the speaker says that [要点4：句子].',
      'In conclusion, the lecture talks about [重复核心主题].',
      '词组开头示例：The speaker first points out something about [词组1] and [词组2].',
    ],
  },
]

export function templatesForTask(shortLabel: string) {
  return PTE_TEMPLATES.filter((template) => template.taskTypes.includes(shortLabel))
}
