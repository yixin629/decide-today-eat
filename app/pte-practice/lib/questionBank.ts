import type {
  AnswerShortQuestionItem,
  DescribeImageItem,
  FillBlanksDragItem,
  FillBlanksDropdownItem,
  HighlightIncorrectWordsItem,
  HighlightSummaryItem,
  ListeningFillBlanksItem,
  ListeningMcqMultipleItem,
  ListeningMcqSingleItem,
  ListeningSummarizeItem,
  McqMultipleItem,
  McqSingleItem,
  PracticeItem,
  ReadAloudItem,
  RepeatSentenceItem,
  ReorderItem,
  RetellLectureItem,
  SelectMissingWordItem,
  TaskType,
  WriteFromDictationItem,
  WritingItem,
} from '../types'

/**
 * 原创示例题库（非 Pearson 官方真题，非"机经"）。
 *
 * 本文件内容均为参考 PTE 公开题型格式自行编写的练习素材，仅用于演示各任务
 * 类型的交互与打分维度展示。2026-09-30 起每种题型已扩充到约 15-20 题左右
 * （此前每种题型仅 4-8 题），仍远未达到商业级题库的数千题规模，后续可继续
 * 分批扩充。结构约定：本文件只导出按题型分组的纯数据数组，不包含任何 UI
 * 或评分逻辑，因此可以整体替换或扩展为从远端/本地 JSON 加载，而不需要改动
 * 组件代码。
 */

const readingMcqSingle: McqSingleItem[] = [
  {
    id: 'r-mcq-1',
    taskType: 'reading-mcq-single',
    passage:
      'Urban beekeeping has grown in popularity across many cities over the past decade. Advocates argue that rooftop hives help pollinate community gardens and raise public awareness of declining bee populations. Critics, however, point out that untrained hobbyists can inadvertently spread diseases between colonies and that a high density of hives in one area may increase competition for the limited flowers found in cities.',
    question: 'According to the passage, what is the main concern of people who oppose urban beekeeping?',
    options: [
      'Bees may attack pedestrians',
      'Untrained hobbyists may spread disease and increase competition between colonies for resources',
      'Rooftop hives may damage building structures',
      'There are no flowers at all in cities for bees to feed on',
    ],
    correctIndex: 1,
  },
  {
    id: 'r-mcq-2',
    taskType: 'reading-mcq-single',
    passage:
      'While remote work offers flexibility, several studies suggest that employees who work from home exclusively report feeling less connected to their teams than those who follow a hybrid schedule. Companies experimenting with mandatory in-office days say the goal is not to reduce flexibility but to preserve opportunities for spontaneous collaboration that video calls rarely replicate.',
    question: 'What is the main purpose of companies requiring fixed in-office days each week?',
    options: ['To reduce office rental costs', 'To reduce employees\' flexibility', 'To preserve opportunities for spontaneous collaboration that video calls rarely replicate', 'To monitor employees\' working hours'],
    correctIndex: 2,
  },
  {
    id: 'r-mcq-3',
    taskType: 'reading-mcq-single',
    passage:
      'Vertical farming, which grows crops in stacked layers inside climate-controlled buildings, uses far less land and water than traditional agriculture. However, the high upfront cost of lighting and climate systems means that, so far, only high-value crops like leafy greens and herbs have proven commercially viable at scale.',
    question: 'Which crops are currently grown in vertical farms at scale, and why?',
    options: [
      'Staple grains, because they produce the highest yields',
      'High-value leafy greens and herbs, because they can offset the high upfront costs',
      'Any crop, because costs are already low',
      'Only ornamental plants',
    ],
    correctIndex: 1,
  },
  {
    id: 'r-mcq-4',
    taskType: 'reading-mcq-single',
    passage:
      'A recent survey of commuters found that those who read for pleasure during their commute reported lower stress levels than those who spent the same time checking work email. Researchers caution that the study cannot prove reading itself reduces stress, since people who choose to read may already be less anxious to begin with.',
    question: 'What is the researchers\' attitude toward the survey findings?',
    options: [
      'They fully accept that reading reduces stress',
      'They believe checking work email is the real source of stress',
      'They are cautious, noting that explanations other than cause and effect may exist',
      'They believe the way people commute is unrelated to stress',
    ],
    correctIndex: 2,
  },
  {
    id: 'r-mcq-5',
    taskType: 'reading-mcq-single',
    passage:
      'Museums that once discouraged photography now actively encourage visitors to share images on social media, viewing it as free publicity. Some curators worry, though, that visitors who spend their visit taking photos for others to see may engage less deeply with the artwork in front of them.',
    question: 'What are some curators concerned about?',
    options: ['Taking photos may damage the artworks', 'Social media promotion is ineffective', 'Visitors may engage less with the works themselves because they are busy taking photos', 'Museum ticket revenue may fall'],
    correctIndex: 2,
  },
  {
    id: 'r-mcq-6',
    taskType: 'reading-mcq-single',
    passage:
      'Electric scooters have been praised for reducing short-distance car trips in cities, but emergency room data in several cities show a rise in scooter-related injuries, prompting some local governments to introduce speed limits and mandatory helmet rules in designated zones.',
    question: 'What measures have some local governments taken?',
    options: ['Banning electric scooters completely', 'Introducing speed limits and mandatory helmet rules in designated zones', 'Abolishing all traffic rules', 'Allowing only tourists to use scooters'],
    correctIndex: 1,
  },
  {
    id: 'r-mcq-7',
    taskType: 'reading-mcq-single',
    passage:
      'Contrary to the assumption that multitasking boosts productivity, cognitive research indicates that switching rapidly between tasks incurs a measurable "switching cost" in time and accuracy, meaning that people who focus on one task at a time often complete more overall in a given period.',
    question: 'What has cognitive research found?',
    options: ['Multitasking is always more efficient', 'Switching between tasks has costs in time and accuracy', 'The human brain cannot handle any task switching', 'Focusing on a single task is actually slower'],
    correctIndex: 1,
  },
  {
    id: 'r-mcq-8',
    taskType: 'reading-mcq-single',
    passage:
      'A growing number of universities are offering micro-credentials — short, focused courses that certify a specific skill — as a complement to traditional degrees. Employers surveyed were divided: some valued the up-to-date, targeted skills these credentials signal, while others still weighted a full degree more heavily when making hiring decisions.',
    question: 'How do employers view micro-credentials?',
    options: ['They unanimously consider them worthless', 'Opinions are divided: some value the targeted skills, while others still prefer full degrees', 'They unanimously consider them more important than degrees', 'Employers were not surveyed at all'],
    correctIndex: 1,
  },
  {
    id: 'r-mcq-9',
    taskType: 'reading-mcq-single',
    passage:
      'The Apollo program\'s success depended heavily on early, unglamorous unmanned test flights that exposed critical flaws in heat shields and guidance software long before any astronaut boarded a capsule. Historians argue that this willingness to fail cheaply and often, rather than the more celebrated moon landing itself, was the program\'s real engineering achievement.',
    question: 'According to historians, what was the real engineering achievement of the Apollo program?',
    options: ['The images of the moon landing itself', 'The willingness to expose flaws early through cheap, frequent unmanned tests', 'Having the most advanced rocket engines of the time', 'Never experiencing any failures'],
    correctIndex: 1,
  },
  {
    id: 'r-mcq-10',
    taskType: 'reading-mcq-single',
    passage:
      'A common assumption is that older workers are less adaptable to new technology than younger colleagues. Longitudinal workplace data complicates this picture: while younger employees often pick up new software faster initially, older employees tend to close the gap within a few months and report higher long-term retention of the skills learned.',
    question: 'What does the longitudinal workplace data reveal?',
    options: [
      'Older employees are completely unable to learn new technology',
      'Older employees learn quickly at first but soon forget',
      'Younger employees learn faster at first, but older employees catch up within a few months and retain the skills better',
      'There is no data on whether age affects skill learning',
    ],
    correctIndex: 2,
  },
  {
    id: 'r-mcq-11',
    taskType: 'reading-mcq-single',
    passage:
      'Traditional crop rotation, long dismissed by some as an outdated practice ill-suited to industrial farming, is being reconsidered as soil scientists document its role in naturally suppressing pests and replenishing nitrogen, potentially reducing the need for costly synthetic fertilizers.',
    question: 'Why are soil scientists reconsidering traditional crop rotation?',
    options: ['It produces higher yields of a single crop', 'It naturally suppresses pests and replenishes nitrogen, potentially reducing fertilizer use', 'It is faster than industrial farming', 'It requires no human labour at all'],
    correctIndex: 1,
  },
  {
    id: 'r-mcq-12',
    taskType: 'reading-mcq-single',
    passage:
      'Public speaking anxiety is often attributed to fear of judgment, but cognitive behavioral researchers note that a significant portion of the discomfort stems from an exaggerated sense of how much an audience actually notices small mistakes, a phenomenon closely related to what psychologists call the "spotlight effect."',
    question: 'According to cognitive-behavioural researchers, what partly causes public speaking anxiety?',
    options: ['Audiences are generally very harsh', 'People overestimate how much the audience notices their small mistakes, known as the "spotlight effect"', 'Speakers naturally lack language ability', 'Anxiety has nothing to do with audience size'],
    correctIndex: 1,
  },
  {
    id: 'r-mcq-13',
    taskType: 'reading-mcq-single',
    passage:
      'Streaming services initially promised to reduce piracy by making legal content more convenient than illegal downloads. However, as the number of competing subscription platforms has grown, some analysts note that fragmented content libraries may be reviving the very inconvenience that once drove consumers toward piracy.',
    question: 'What are some analysts concerned about?',
    options: ['There are too few streaming platforms', 'The growing number of subscription platforms fragments content, which may bring back inconvenience and encourage piracy', 'All viewers have completely abandoned legal platforms', 'Piracy has disappeared completely'],
    correctIndex: 1,
  },
  {
    id: 'r-mcq-14',
    taskType: 'reading-mcq-single',
    passage:
      'Excavations at a Bronze Age settlement revealed grain silos far larger than the local population could have needed, leading archaeologists to propose that the community functioned as a regional trading hub rather than a purely self-sufficient village.',
    question: 'What hypothesis have archaeologists proposed based on this?',
    options: ['The settlement\'s population was far larger than expected', 'The settlement may have been a regional trading hub rather than a self-sufficient village', 'The size of the granaries was simply a construction error', 'The settlement never stored grain'],
    correctIndex: 1,
  },
  {
    id: 'r-mcq-15',
    taskType: 'reading-mcq-single',
    passage:
      'Noise-cancelling headphones work by generating a sound wave that is the inverse of ambient noise, effectively cancelling it out before it reaches the ear. This technique is most effective against low, constant frequencies like engine hum, but far less effective against sudden, unpredictable sounds such as a dog barking.',
    question: 'Which type of sound are noise-cancelling headphones less effective against?',
    options: ['Low, constant engine noise', 'Sudden, unpredictable sounds such as a dog barking', 'They are equally effective against all types of sound', 'They do not reduce noise at all'],
    correctIndex: 1,
  },
  {
    id: 'r-mcq-16',
    taskType: 'reading-mcq-single',
    passage:
      'Many nutrition guidelines have shifted away from labeling individual foods as simply "good" or "bad," instead emphasizing overall dietary patterns. This shift followed research suggesting that focusing on single nutrients or foods often leads people to compensate elsewhere in ways that cancel out any benefit.',
    question: 'Why have nutrition guidelines shifted to emphasise overall eating patterns?',
    options: ['Individual foods no longer matter at all', 'Focusing too much on single nutrients or foods can lead to compensating behaviour that cancels out the benefits', 'It makes marketing easier for food companies', 'Overall patterns are cheaper than individual foods'],
    correctIndex: 1,
  },
  {
    id: 'r-mcq-17',
    taskType: 'reading-mcq-single',
    passage:
      'Second-language acquisition research increasingly emphasizes comprehensible input — exposure to language slightly above a learner\'s current level — over rote grammar drills. Advocates argue this mirrors how children acquire their first language, though critics note that adult learners may still benefit from some explicit grammar instruction.',
    question: 'What reservation do critics have about the "comprehensible input" theory?',
    options: ['Children need no language input at all', 'Adult learners may still need some explicit grammar instruction', 'The theory has been completely disproven', 'Grammar practice is useless for everyone'],
    correctIndex: 1,
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
  {
    id: 'r-reorder-2',
    taskType: 'reading-reorder',
    paragraphs: [
      'This has led some manufacturers to design packaging that dissolves harmlessly in water within weeks.',
      'Traditional plastic packaging can take hundreds of years to break down in landfills or oceans.',
      'Consumer demand for sustainable alternatives has grown sharply over the past five years.',
      'Even so, dissolvable packaging currently costs more to produce, limiting its use to premium products for now.',
    ],
    correctOrder: [1, 2, 0, 3],
  },
  {
    id: 'r-reorder-3',
    taskType: 'reading-reorder',
    paragraphs: [
      'Consequently, several airlines now offer optional short workshops on breathing techniques before long-haul flights.',
      'Fear of flying affects a significant minority of air travelers, ranging from mild unease to a full clinical phobia.',
      'Many affected passengers say the fear is less about the flight itself and more about a loss of control.',
      'Early trial results suggest the workshops modestly reduce self-reported anxiety, though more rigorous study is needed.',
    ],
    correctOrder: [1, 2, 0, 3],
  },
  {
    id: 'r-reorder-4',
    taskType: 'reading-reorder',
    paragraphs: [
      'One proposed solution is to require new buildings to include reflective roofing materials.',
      'Cities are, on average, several degrees warmer than surrounding rural areas, a phenomenon known as the urban heat island effect.',
      'Dark asphalt and concrete surfaces absorb and radiate heat, while a lack of vegetation reduces natural cooling.',
      'Studies of pilot neighborhoods that adopted reflective roofing report a small but measurable drop in peak summer temperatures.',
    ],
    correctOrder: [1, 2, 0, 3],
  },
  {
    id: 'r-reorder-5',
    taskType: 'reading-reorder',
    paragraphs: [
      'In response, several employers began experimenting with a four-day work week at full pay.',
      'Many companies report that overall employee burnout increased noticeably following the shift to widespread remote work.',
      'Surveys attributed part of this burnout to the blurring of boundaries between work and personal time.',
      'Early adopters of the shorter week report mixed but generally positive effects on both productivity and reported wellbeing.',
    ],
    correctOrder: [1, 2, 0, 3],
  },
  {
    id: 'r-reorder-6',
    taskType: 'reading-reorder',
    paragraphs: [
      'To address this, several hospitals have introduced dedicated interpreter services available around the clock.',
      'Language barriers between patients and medical staff have been linked to higher rates of misdiagnosis and medication errors.',
      'Without a shared language, subtle but clinically important details are often lost during consultations.',
      'Early data suggests that hospitals using these services see fewer repeat visits caused by miscommunication.',
    ],
    correctOrder: [1, 2, 0, 3],
  },
  {
    id: 'r-reorder-7',
    taskType: 'reading-reorder',
    paragraphs: [
      'As a result, some record labels have begun releasing albums exclusively on vinyl before making them available digitally.',
      'Vinyl record sales have risen for over a decade even as streaming dominates how most people listen to music.',
      'Collectors and younger listeners alike cite the physical ritual and tactile packaging as part of vinyl\'s appeal.',
      'Whether this trend will continue to grow or has already reached its natural ceiling remains a matter of debate among industry analysts.',
    ],
    correctOrder: [1, 2, 0, 3],
  },
  {
    id: 'r-reorder-8',
    taskType: 'reading-reorder',
    paragraphs: [
      'This discrepancy prompted researchers to examine whether sample selection, rather than diet itself, explained the conflicting results.',
      'Nutrition studies on the health effects of a single food item frequently produce contradictory findings from one year to the next.',
      'Participants who volunteer for such studies often differ systematically from the general population in income, education, and existing health habits.',
      'Subsequent studies that controlled more carefully for these factors found far smaller effects than the original headlines suggested.',
    ],
    correctOrder: [1, 2, 0, 3],
  },
  {
    id: 'r-reorder-9',
    taskType: 'reading-reorder',
    paragraphs: [
      'In response, several airlines began experimenting with dynamic boarding groups assigned only minutes before departure.',
      'Boarding a full passenger aircraft efficiently has remained a surprisingly difficult logistical problem for decades.',
      'Fixed boarding-group systems often lead to bottlenecks in the aisle as passengers all try to store luggage at once.',
      'Early trials of the dynamic system report modest reductions in average boarding time, though results vary by aircraft size.',
    ],
    correctOrder: [1, 2, 0, 3],
  },
  {
    id: 'r-reorder-10',
    taskType: 'reading-reorder',
    paragraphs: [
      'Consequently, conservationists have begun releasing captive-bred individuals into carefully selected, predator-free habitats.',
      'Several amphibian species have suffered dramatic population declines linked to a fast-spreading fungal disease.',
      'The fungus disrupts the skin function amphibians rely on for breathing and water regulation, often proving fatal.',
      'Early monitoring of the released populations shows encouraging survival rates, though long-term success is not yet guaranteed.',
    ],
    correctOrder: [1, 2, 0, 3],
  },
  {
    id: 'r-reorder-11',
    taskType: 'reading-reorder',
    paragraphs: [
      'To reduce this risk, financial regulators in several countries now require lenders to verify income more rigorously before approving loans.',
      'In the years leading up to the global financial crisis, many mortgage lenders approved loans with minimal verification of a borrower\'s actual income.',
      'This practice contributed to a sharp rise in loans that borrowers were ultimately unable to repay.',
      'Critics argue the stricter rules, while safer, have also made it harder for some creditworthy first-time buyers to qualify.',
    ],
    correctOrder: [1, 2, 0, 3],
  },
  {
    id: 'r-reorder-12',
    taskType: 'reading-reorder',
    paragraphs: [
      'This led some theaters to introduce dynamic pricing, charging more for popular showtimes and less for weekday matinees.',
      'Cinema attendance has fluctuated considerably since the widespread adoption of home streaming services.',
      'Industry data shows that ticket prices had remained largely flat for years despite rising operating costs.',
      'Early results suggest dynamic pricing has modestly improved attendance during previously under-booked time slots.',
    ],
    correctOrder: [1, 2, 0, 3],
  },
  {
    id: 'r-reorder-13',
    taskType: 'reading-reorder',
    paragraphs: [
      'To address this shortfall, several universities have partnered directly with local manufacturers to design apprenticeship-style courses.',
      'Employers in advanced manufacturing frequently report difficulty finding technicians with the specific skills their machinery requires.',
      'Traditional engineering degrees, while rigorous, often do not cover the exact equipment used on a specific factory floor.',
      'Graduates of the new partnership programs report faster hiring and higher starting wages than peers from conventional programs.',
    ],
    correctOrder: [1, 2, 0, 3],
  },
  {
    id: 'r-reorder-14',
    taskType: 'reading-reorder',
    paragraphs: [
      'As a result, several national parks now use timed-entry ticketing to spread visitor arrivals more evenly throughout the day.',
      'Some of the world\'s most popular national parks have struggled with overcrowding during peak tourist seasons.',
      'Overcrowding has been linked to trail erosion, wildlife disturbance, and a diminished experience for visitors themselves.',
      'Visitor surveys since the introduction of timed entry report higher satisfaction despite the added step of advance booking.',
    ],
    correctOrder: [1, 2, 0, 3],
  },
  {
    id: 'r-reorder-15',
    taskType: 'reading-reorder',
    paragraphs: [
      'In response, some cities have begun offering free transit passes during declared air-quality emergencies.',
      'Air pollution in several major cities spikes sharply during specific weather conditions that trap emissions close to the ground.',
      'During these episodes, hospitals typically report a measurable rise in respiratory-related emergency visits.',
      'Preliminary data suggests the free-transit measure modestly reduces car use during the affected days, though the effect fades once passes expire.',
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
  {
    id: 'r-fillblank-2',
    taskType: 'reading-fill-blanks-drag',
    textSegments: [
      'Sleep researchers now believe that memory ',
      ' occurs largely during deep sleep, when the brain replays and strengthens ',
      ' formed earlier in the day. Chronic sleep ',
      ' has therefore been linked to measurable declines in learning ability.',
    ],
    blankCount: 3,
    wordBank: ['consolidation', 'connections', 'deprivation', 'expansion', 'daylight'],
    correctAnswers: ['consolidation', 'connections', 'deprivation'],
  },
  {
    id: 'r-fillblank-3',
    taskType: 'reading-fill-blanks-drag',
    textSegments: [
      'Microplastics, tiny fragments smaller than five millimetres, have been found in ',
      ' locations from mountain snow to deep-sea sediment. Scientists are still working to understand the long-term ',
      ' effects of ',
      ' exposure on marine organisms.',
    ],
    blankCount: 3,
    wordBank: ['remote', 'health', 'chronic', 'nearby', 'seasonal'],
    correctAnswers: ['remote', 'health', 'chronic'],
  },
  {
    id: 'r-fillblank-4',
    taskType: 'reading-fill-blanks-drag',
    textSegments: [
      'Behavioral economists argue that people are not purely ',
      ' decision-makers; instead, small changes in how a choice is ',
      ' can significantly shift what people choose, an effect known as the ',
      ' effect.',
    ],
    blankCount: 3,
    wordBank: ['rational', 'framed', 'framing', 'emotional', 'random'],
    correctAnswers: ['rational', 'framed', 'framing'],
  },
  {
    id: 'r-fillblank-5',
    taskType: 'reading-fill-blanks-drag',
    textSegments: [
      'Glacial retreat has accelerated in many mountain ranges, threatening the ',
      ' supply of water for downstream communities that depend on ',
      ' meltwater during the dry ',
      '.',
    ],
    blankCount: 3,
    wordBank: ['seasonal', 'reliable', 'season', 'unstable', 'annual'],
    correctAnswers: ['reliable', 'seasonal', 'season'],
  },
  {
    id: 'r-fillblank-6',
    taskType: 'reading-fill-blanks-drag',
    textSegments: [
      'Volcanic soil is prized by farmers for its ',
      ' mineral content, which can make surrounding regions remarkably ',
      ' for agriculture despite the ',
      ' risk posed by future eruptions.',
    ],
    blankCount: 3,
    wordBank: ['rich', 'fertile', 'ongoing', 'poor', 'temporary'],
    correctAnswers: ['rich', 'fertile', 'ongoing'],
  },
  {
    id: 'r-fillblank-7',
    taskType: 'reading-fill-blanks-drag',
    textSegments: [
      'Urban planners increasingly favor mixed-use ',
      ' that combine housing, shops, and offices within walking ',
      ', arguing this reduces the daily reliance on ',
      ' transport.',
    ],
    blankCount: 3,
    wordBank: ['zoning', 'distance', 'private', 'height', 'public'],
    correctAnswers: ['zoning', 'distance', 'private'],
  },
  {
    id: 'r-fillblank-8',
    taskType: 'reading-fill-blanks-drag',
    textSegments: [
      'Ancient trade routes did more than move goods; they also ',
      ' the spread of ideas, languages, and religious ',
      ' across vast distances, leaving a ',
      ' influence still visible today.',
    ],
    blankCount: 3,
    wordBank: ['facilitated', 'practices', 'cultural', 'blocked', 'temporary'],
    correctAnswers: ['facilitated', 'practices', 'cultural'],
  },
  {
    id: 'r-fillblank-9',
    taskType: 'reading-fill-blanks-drag',
    textSegments: [
      'Wearable fitness trackers can ',
      ' heart rate and sleep patterns continuously, giving users ',
      ' feedback that was once only available through expensive ',
      ' equipment.',
    ],
    blankCount: 3,
    wordBank: ['monitor', 'immediate', 'clinical', 'ignore', 'outdated'],
    correctAnswers: ['monitor', 'immediate', 'clinical'],
  },
  {
    id: 'r-fillblank-10',
    taskType: 'reading-fill-blanks-drag',
    textSegments: [
      'Because deep-sea organisms live under extreme pressure and near-total darkness, many have evolved highly ',
      ' adaptations, including bioluminescence used to ',
      ' prey or communicate with ',
      ' of the same species.',
    ],
    blankCount: 3,
    wordBank: ['specialized', 'attract', 'members', 'generic', 'repel'],
    correctAnswers: ['specialized', 'attract', 'members'],
  },
  {
    id: 'r-fillblank-11',
    taskType: 'reading-fill-blanks-drag',
    textSegments: [
      'Central banks raise interest rates primarily to ',
      ' inflation, even though doing so risks ',
      ' economic growth and increasing the cost of ',
      ' for households and businesses alike.',
    ],
    blankCount: 3,
    wordBank: ['curb', 'slowing', 'borrowing', 'boosting', 'ignoring'],
    correctAnswers: ['curb', 'slowing', 'borrowing'],
  },
  {
    id: 'r-fillblank-12',
    taskType: 'reading-fill-blanks-drag',
    textSegments: [
      'Restorative justice programs aim to ',
      ' victims and offenders in a supervised dialogue, focusing on ',
      ' rather than punishment as the primary measure of ',
      '.',
    ],
    blankCount: 3,
    wordBank: ['bring together', 'accountability', 'success', 'separate', 'revenge'],
    correctAnswers: ['bring together', 'accountability', 'success'],
  },
  {
    id: 'r-fillblank-13',
    taskType: 'reading-fill-blanks-drag',
    textSegments: [
      'Traditional apprenticeships allowed skills to be passed down through direct ',
      ' rather than formal classroom instruction, a model that some vocational programs are now ',
      ' in response to persistent ',
      ' shortages.',
    ],
    blankCount: 3,
    wordBank: ['observation', 'reviving', 'skills', 'abandoning', 'funding'],
    correctAnswers: ['observation', 'reviving', 'skills'],
  },
  {
    id: 'r-fillblank-14',
    taskType: 'reading-fill-blanks-drag',
    textSegments: [
      'Migratory shorebirds rely on a small number of ',
      ' wetland sites to rest and refuel; the loss of even one such site can ',
      ' disrupt migration routes spanning thousands of ',
      '.',
    ],
    blankCount: 3,
    wordBank: ['critical', 'severely', 'kilometres', 'minor', 'briefly'],
    correctAnswers: ['critical', 'severely', 'kilometres'],
  },
  {
    id: 'r-fillblank-15',
    taskType: 'reading-fill-blanks-drag',
    textSegments: [
      'Historians studying propaganda posters note that their ',
      ' impact often depended less on factual accuracy than on ',
      ' imagery designed to provoke an immediate emotional ',
      '.',
    ],
    blankCount: 3,
    wordBank: ['persuasive', 'striking', 'response', 'neutral', 'delayed'],
    correctAnswers: ['persuasive', 'striking', 'response'],
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
  {
    id: 'l-fillblank-2',
    taskType: 'listening-fill-blanks-typed',
    transcript:
      'This morning I want to explain why compound interest is often called the eighth wonder of the financial world. Even a modest rate of return, left untouched for several decades, can grow into a surprisingly large sum through the power of compounding.',
    textSegments: [
      'This morning I want to explain why compound interest is often called the eighth ',
      ' of the financial world. Even a modest rate of return, left ',
      ' for several decades, can grow into a surprisingly large sum through the power of compounding.',
    ],
    correctAnswers: ['wonder', 'untouched'],
  },
  {
    id: 'l-fillblank-3',
    taskType: 'listening-fill-blanks-typed',
    transcript:
      'One of the most surprising findings in soil science is how much biodiversity exists underground. A single teaspoon of healthy soil can contain billions of microorganisms, many of which remain completely unclassified by researchers.',
    textSegments: [
      'One of the most surprising findings in soil science is how much ',
      ' exists underground. A single teaspoon of healthy soil can contain billions of microorganisms, many of which remain completely ',
      ' by researchers.',
    ],
    correctAnswers: ['biodiversity', 'unclassified'],
  },
  {
    id: 'l-fillblank-4',
    taskType: 'listening-fill-blanks-typed',
    transcript:
      'Let\'s turn now to the history of the printing press. Before movable type, every manuscript had to be copied by hand, a process so slow that books remained a luxury reserved almost exclusively for the wealthy and the clergy.',
    textSegments: [
      'Before movable type, every manuscript had to be copied by hand, a process so slow that books remained a ',
      ' reserved almost exclusively for the wealthy and the ',
      '.',
    ],
    correctAnswers: ['luxury', 'clergy'],
  },
  {
    id: 'l-fillblank-5',
    taskType: 'listening-fill-blanks-typed',
    transcript:
      'Today we\'ll discuss why coral bleaching happens. When water temperatures rise even slightly above normal, corals expel the colorful algae living in their tissues, leaving behind a stark white skeleton that is far more vulnerable to disease.',
    textSegments: [
      'When water temperatures rise even slightly above normal, corals ',
      ' the colorful algae living in their tissues, leaving behind a stark white skeleton that is far more ',
      ' to disease.',
    ],
    correctAnswers: ['expel', 'vulnerable'],
  },
  {
    id: 'l-fillblank-6',
    taskType: 'listening-fill-blanks-typed',
    transcript:
      'Let\'s turn to the economics of vending machines. Operators must carefully balance the price of each item against foot traffic, since a machine placed in a low-traffic corridor rarely generates enough turnover to justify the cost of restocking it.',
    textSegments: [
      'Operators must carefully balance the price of each item against foot ',
      ', since a machine placed in a low-traffic corridor rarely generates enough turnover to justify the cost of ',
      ' it.',
    ],
    correctAnswers: ['traffic', 'restocking'],
  },
  {
    id: 'l-fillblank-7',
    taskType: 'listening-fill-blanks-typed',
    transcript:
      'Today we examine why some bridges hum in strong wind. Certain wind speeds can excite a bridge deck at its natural resonant frequency, causing oscillations that engineers must dampen using specially designed tuned mass dampers.',
    textSegments: [
      'Certain wind speeds can excite a bridge deck at its natural resonant ',
      ', causing oscillations that engineers must dampen using specially designed tuned mass ',
      '.',
    ],
    correctAnswers: ['frequency', 'dampers'],
  },
  {
    id: 'l-fillblank-8',
    taskType: 'listening-fill-blanks-typed',
    transcript:
      'This lecture covers the domestication of the cat. Unlike dogs, cats were never selectively bred for obedience, and geneticists note that the modern house cat remains genetically very close to its wild ancestor.',
    textSegments: [
      'Unlike dogs, cats were never selectively bred for ',
      ', and geneticists note that the modern house cat remains genetically very close to its wild ',
      '.',
    ],
    correctAnswers: ['obedience', 'ancestor'],
  },
  {
    id: 'l-fillblank-9',
    taskType: 'listening-fill-blanks-typed',
    transcript:
      'Let\'s discuss why some fruit ripens faster near other fruit. Ripening fruit releases a gas called ethylene, which can trigger nearby produce to ripen more quickly, a fact food retailers now use deliberately to manage inventory.',
    textSegments: [
      'Ripening fruit releases a gas called ',
      ', which can trigger nearby produce to ripen more quickly, a fact food retailers now use deliberately to manage ',
      '.',
    ],
    correctAnswers: ['ethylene', 'inventory'],
  },
  {
    id: 'l-fillblank-10',
    taskType: 'listening-fill-blanks-typed',
    transcript:
      'Today\'s topic is the history of paper money. Early paper currency in medieval China was initially met with suspicion, since merchants were accustomed to trusting only coins made of precious metal with intrinsic value.',
    textSegments: [
      'Early paper currency in medieval China was initially met with ',
      ', since merchants were accustomed to trusting only coins made of precious metal with intrinsic ',
      '.',
    ],
    correctAnswers: ['suspicion', 'value'],
  },
  {
    id: 'l-fillblank-11',
    taskType: 'listening-fill-blanks-typed',
    transcript:
      'Let\'s look at why cast iron pans last for generations. A well-seasoned cast iron surface develops a natural, slightly rough layer of polymerized oil that becomes increasingly non-stick the more the pan is used.',
    textSegments: [
      'A well-seasoned cast iron surface develops a natural, slightly rough layer of polymerized oil that becomes increasingly ',
      ' the more the pan is ',
      '.',
    ],
    correctAnswers: ['non-stick', 'used'],
  },
  {
    id: 'l-fillblank-12',
    taskType: 'listening-fill-blanks-typed',
    transcript:
      'This morning\'s lecture concerns the psychology of procrastination. Contrary to popular belief, procrastination is rarely about poor time management; researchers instead link it to difficulty regulating negative emotions associated with a task.',
    textSegments: [
      'Contrary to popular belief, procrastination is rarely about poor time ',
      '; researchers instead link it to difficulty regulating negative ',
      ' associated with a task.',
    ],
    correctAnswers: ['management', 'emotions'],
  },
  {
    id: 'l-fillblank-13',
    taskType: 'listening-fill-blanks-typed',
    transcript:
      'Today we\'ll explore why some deserts are cold rather than hot. A desert is technically defined by low precipitation rather than temperature, which is why certain high-altitude or high-latitude regions qualify as deserts despite freezing conditions.',
    textSegments: [
      'A desert is technically defined by low ',
      ' rather than temperature, which is why certain high-altitude or high-latitude regions qualify as deserts despite freezing ',
      '.',
    ],
    correctAnswers: ['precipitation', 'conditions'],
  },
  {
    id: 'l-fillblank-14',
    taskType: 'listening-fill-blanks-typed',
    transcript:
      'This lecture examines the rise of citizen science projects. Volunteers with no formal training now contribute meaningfully to astronomy and ecology research by classifying images online, dramatically increasing the volume of data researchers can process.',
    textSegments: [
      'Volunteers with no formal training now contribute meaningfully to astronomy and ecology research by ',
      ' images online, dramatically increasing the volume of data researchers can ',
      '.',
    ],
    correctAnswers: ['classifying', 'process'],
  },
  {
    id: 'l-fillblank-15',
    taskType: 'listening-fill-blanks-typed',
    transcript:
      'Let\'s talk about why shipping containers standardized global trade. Before a uniform container size was adopted, loading and unloading cargo ships required enormous manual labor, making international shipping slow and comparatively expensive.',
    textSegments: [
      'Before a uniform container size was adopted, loading and unloading cargo ships required enormous manual ',
      ', making international shipping slow and comparatively ',
      '.',
    ],
    correctAnswers: ['labor', 'expensive'],
  },
]

const listeningHighlightSummary: HighlightSummaryItem[] = [
  {
    id: 'l-summary-1',
    taskType: 'listening-highlight-summary',
    transcript:
      'A growing number of city governments are converting unused parking lots into small public parks. Supporters say this improves air quality and gives residents in dense neighborhoods more green space, while some local business owners worry about losing customer parking during the transition.',
    question: 'Which of the following best summarizes the recording?',
    options: [
      'City governments are turning unused parking lots into small parks, a move welcomed by some residents but raising concerns among businesses about lost parking',
      'All businesses strongly oppose any kind of urban greening project',
      'The government has cancelled the parking lot conversion project entirely',
      'The recording mainly discusses how to raise parking fees',
    ],
    correctIndex: 0,
  },
  {
    id: 'l-summary-2',
    taskType: 'listening-highlight-summary',
    transcript:
      'Researchers studying octopus behavior have found that these animals appear to dream, based on changes in skin color and texture observed during certain sleep phases, though scientists caution that this does not prove octopuses experience dreams the way humans do.',
    question: 'Which of the following best summarizes the recording?',
    options: [
      'Skin changes in sleeping octopuses suggest a possible dream-like state, although scientists remain cautious',
      'Scientists have proven that octopuses dream exactly as humans do',
      'Octopuses never change skin colour while asleep',
      'The study has nothing to do with octopus sleep',
    ],
    correctIndex: 0,
  },
  {
    id: 'l-summary-3',
    taskType: 'listening-highlight-summary',
    transcript:
      'A new study tracking commuting patterns found that cyclists in cities with dedicated bike lanes reported significantly higher satisfaction and lower stress than those riding on shared roads, prompting several city councils to expand their cycling infrastructure budgets.',
    question: 'Which of the following best summarizes the recording?',
    options: [
      'Dedicated bike lanes increase cyclist satisfaction and reduce stress, leading several cities to expand cycling budgets',
      'Cycling to work significantly increases riders\' stress',
      'The study found that cities do not need bike lanes at all',
      'The study is mainly about the satisfaction of car drivers',
    ],
    correctIndex: 0,
  },
  {
    id: 'l-summary-4',
    taskType: 'listening-highlight-summary',
    transcript:
      'Historians have long debated the exact causes of the decline of a major ancient trading city, but recent tree-ring and sediment analysis now points to a multi-decade drought as a major contributing factor, alongside existing political instability.',
    question: 'Which of the following best summarizes the recording?',
    options: [
      'New tree-ring and sediment analysis suggests that prolonged drought and political unrest together caused the decline of the ancient trading city',
      'Historians have completely ruled out climate as a factor',
      'War was the only cause of the city\'s decline',
      'The recording mainly discusses how to rebuild the ancient city',
    ],
    correctIndex: 0,
  },
  {
    id: 'l-summary-5',
    taskType: 'listening-highlight-summary',
    transcript:
      'While many assume that multitasking helps people get more done, a series of laboratory experiments found that participants who focused on one task at a time consistently completed more work with fewer errors than those who switched between several tasks.',
    question: 'Which of the following best summarizes the recording?',
    options: [
      'The experiment found that people who focused on one task completed more work with fewer errors than multitaskers',
      'Multitasking has been proven to always be more efficient',
      'The recording has nothing to do with productivity',
      'The results are unusable because the sample was too small',
    ],
    correctIndex: 0,
  },
  {
    id: 'l-summary-6',
    taskType: 'listening-highlight-summary',
    transcript:
      'A long-term study of night-shift workers found significantly higher rates of metabolic disorders compared with daytime workers, even after controlling for diet and exercise, leading researchers to focus on circadian rhythm disruption as a likely cause.',
    question: 'Which of the following best summarizes the recording?',
    options: [
      'The study found markedly higher rates of metabolic disorders among night-shift workers, which researchers link to disrupted circadian rhythms',
      'Diet is the only cause of metabolic disorders in night-shift workers',
      'There is no difference in health between day-shift and night-shift workers',
      'The study is mainly about the pay of night-shift workers',
    ],
    correctIndex: 0,
  },
  {
    id: 'l-summary-7',
    taskType: 'listening-highlight-summary',
    transcript:
      'City archives digitized over the past decade have made it far easier for amateur historians to trace family lineages online, though archivists note that many older handwritten records remain difficult for automated text-recognition software to read accurately.',
    question: 'Which of the following best summarizes the recording?',
    options: [
      'Digitised city archives make it easier for amateur historians to trace family history, but handwritten records are still hard for recognition software to read accurately',
      'All historical archives can now be read automatically and no longer need manual checking',
      'The digitisation project has stopped completely with no progress',
      'The recording mainly discusses how to repair damaged paper documents',
    ],
    correctIndex: 0,
  },
  {
    id: 'l-summary-8',
    taskType: 'listening-highlight-summary',
    transcript:
      'A survey of small business owners found that those who adopted basic cloud accounting software reported saving several hours per week on bookkeeping, though many said the initial learning curve was steeper than expected and required outside help to get started.',
    question: 'Which of the following best summarizes the recording?',
    options: [
      'Small business owners using cloud accounting software save bookkeeping time each week, but many report a steep learning curve at first and need outside help',
      'Cloud accounting software is of no help to small businesses',
      'All small business owners mastered cloud accounting software easily without any difficulty',
      'The recording mainly discusses tax issues for small businesses',
    ],
    correctIndex: 0,
  },
  {
    id: 'l-summary-9',
    taskType: 'listening-highlight-summary',
    transcript:
      'Ecologists reintroducing beavers to river systems have observed a cascade of benefits, including the creation of new wetland habitat and reduced downstream flooding, though a small number of landowners have reported localized damage to trees and irrigation channels.',
    question: 'Which of the following best summarizes the recording?',
    options: [
      'Reintroducing beavers has brought benefits such as more wetland habitat and less downstream flooding, although a few landowners reported local damage',
      'Reintroducing beavers has had no ecological impact at all',
      'All landowners strongly oppose the beaver reintroduction plan',
      'The recording mainly discusses how to hunt beavers'
    ],
    correctIndex: 0,
  },
  {
    id: 'l-summary-10',
    taskType: 'listening-highlight-summary',
    transcript:
      'Researchers comparing translation quality found that professional human translators still outperform machine translation on texts requiring cultural nuance or humor, while machine translation now performs comparably well on straightforward technical documentation.',
    question: 'Which of the following best summarizes the recording?',
    options: [
      'Human translators still outperform machine translation on texts requiring cultural nuance or humour, while machine translation now performs comparably on technical documents',
      'Machine translation has completely surpassed human translation for all types of text',
      'Human translation has been completely phased out',
      'The recording mainly discusses salaries in the translation industry',
    ],
    correctIndex: 0,
  },
  {
    id: 'l-summary-11',
    taskType: 'listening-highlight-summary',
    transcript:
      'A field experiment testing different classroom seating arrangements found that students in semicircular layouts participated in discussion more frequently than those in traditional rows, though test scores showed no significant difference between the two groups.',
    question: 'Which of the following best summarizes the recording?',
    options: [
      'Students seated in a semicircle participated more in class, but there was no significant difference in exam results between the two groups',
      'Seating arrangements have no effect on either participation or exam results',
      'Students seated in traditional rows participated significantly more',
      'The recording mainly discusses how to design classroom lighting',
    ],
    correctIndex: 0,
  },
  {
    id: 'l-summary-12',
    taskType: 'listening-highlight-summary',
    transcript:
      'A review of home energy audits found that simple measures like sealing air leaks and adding insulation typically deliver a faster financial payback than installing new heating systems, even though the latter tends to receive more attention in advertising.',
    question: 'Which of the following best summarizes the recording?',
    options: [
      'Simple measures such as sealing drafts and adding insulation usually pay for themselves faster than replacing heating systems, even though the latter gets more attention in advertising',
      'Replacing the heating system is always the most cost-effective option',
      'Home energy audits have no effect on payback time',
      'The recording mainly discusses how to choose a heating system brand',
    ],
    correctIndex: 0,
  },
  {
    id: 'l-summary-13',
    taskType: 'listening-highlight-summary',
    transcript:
      'A study of hospital scheduling found that reducing the length of overnight shifts for junior doctors, without reducing total hours worked, was associated with fewer reported medical errors, prompting several hospitals to redesign their rotation systems.',
    question: 'Which of the following best summarizes the recording?',
    options: [
      'Shorter night shifts for junior doctors, with the same total hours, are linked to fewer medical errors, prompting several hospitals to redesign their rosters',
      'Longer night shifts significantly reduce medical errors',
      'Hospital rosters have nothing to do with medical errors',
      'The recording mainly discusses doctors\' pay structure',
    ],
    correctIndex: 0,
  },
  {
    id: 'l-summary-14',
    taskType: 'listening-highlight-summary',
    transcript:
      'Linguists studying endangered languages note that community-led documentation projects, which train local speakers to record and archive their own language, tend to produce richer and more culturally accurate records than projects led entirely by outside academics.',
    question: 'Which of the following best summarizes the recording?',
    options: [
      'Community-led projects that train local speakers to record their own language tend to be richer and more culturally grounded than projects run entirely by outside academics',
      'Projects run by outside academics are always of higher quality',
      'Documenting endangered languages is no longer necessary',
      'The recording mainly discusses how to apply for government funding for endangered languages',
    ],
    correctIndex: 0,
  },
  {
    id: 'l-summary-15',
    taskType: 'listening-highlight-summary',
    transcript:
      'A comparison of public bike-share programs found that systems allowing riders to leave bikes at any location, rather than at fixed docking stations, saw higher usage rates but also higher rates of bikes left in inconvenient or unsafe places.',
    question: 'Which of the following best summarizes the recording?',
    options: [
      'Dockless bike-share systems are used more, but bikes are more often left in inconvenient or unsafe places',
      'Docked bike-share systems are always used more',
      'Bike-share programs have been shown to have no demand at all',
      'The recording mainly discusses bike-share pricing strategies',
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
  {
    id: 's-ra-3',
    taskType: 'speaking-read-aloud',
    text: 'Archaeologists recently uncovered a series of well-preserved tools that suggest early humans in the region were capable of far more complex craftsmanship than previously believed.',
  },
  {
    id: 's-ra-4',
    taskType: 'speaking-read-aloud',
    text: 'Despite widespread automation in manufacturing, many companies report that skilled technicians remain in short supply, particularly those able to maintain and repair increasingly complex robotic equipment.',
  },
  {
    id: 's-ra-5',
    taskType: 'speaking-read-aloud',
    text: 'Coastal cities around the world are investing in flood barriers and improved drainage systems as rising sea levels make extreme weather events more costly and more frequent.',
  },
  {
    id: 's-ra-6',
    taskType: 'speaking-read-aloud',
    text: 'A balanced diet, regular physical activity, and sufficient sleep remain the three factors most consistently linked to long-term health across large-scale population studies.',
  },
  {
    id: 's-ra-7',
    taskType: 'speaking-read-aloud',
    text: 'Historians studying trade networks in the ancient world have found evidence of goods travelling thousands of kilometres long before any single empire controlled the entire route.',
  },
  {
    id: 's-ra-8',
    taskType: 'speaking-read-aloud',
    text: 'Urban planners are increasingly designing neighborhoods around pedestrians and cyclists rather than cars, hoping to reduce both traffic congestion and carbon emissions.',
  },
  {
    id: 's-ra-9',
    taskType: 'speaking-read-aloud',
    text: 'Financial analysts caution that short-term market fluctuations rarely reflect the underlying health of an economy and should not drive long-term investment decisions.',
  },
  {
    id: 's-ra-10',
    taskType: 'speaking-read-aloud',
    text: 'Wildlife photographers often spend days waiting in a single location, relying on patience and a deep understanding of animal behavior to capture a single memorable image.',
  },
  {
    id: 's-ra-11',
    taskType: 'speaking-read-aloud',
    text: 'Language teachers increasingly encourage students to practice speaking from the very first lesson, arguing that early mistakes are a necessary part of building genuine fluency.',
  },
  {
    id: 's-ra-12',
    taskType: 'speaking-read-aloud',
    text: 'Advances in materials science have led to lighter, stronger alloys that are now used extensively in aircraft manufacturing to improve fuel efficiency.',
  },
  {
    id: 's-ra-13',
    taskType: 'speaking-read-aloud',
    text: 'Psychologists studying motivation have found that intrinsic rewards, such as personal satisfaction, often sustain effort longer than external incentives like money or praise.',
  },
  {
    id: 's-ra-14',
    taskType: 'speaking-read-aloud',
    text: 'Community theatre groups continue to thrive in many small towns, offering residents an accessible way to engage with the performing arts close to home.',
  },
  {
    id: 's-ra-15',
    taskType: 'speaking-read-aloud',
    text: 'Marine engineers designing offshore wind turbines must account for extreme weather, corrosive salt water, and the enormous mechanical stress of constant motion.',
  },
]

const writingSummarizeText: WritingItem[] = [
  {
    id: 'w-swt-1',
    taskType: 'writing-summarize-text',
    prompt: 'Read the passage below and summarize it in one sentence of no more than 75 words.',
    sourceText:
      'Telemedicine usage surged during the pandemic and has remained far above pre-pandemic levels even as in-person visits resumed. Patients cite convenience and reduced travel time as the main benefits, while doctors note that certain conditions still require a physical examination. Health insurers are now debating whether to permanently reimburse virtual visits at the same rate as in-person ones, a decision that could shape the future of primary care.',
    minWords: 5,
    maxWords: 75,
  },
  {
    id: 'w-swt-2',
    taskType: 'writing-summarize-text',
    prompt: 'Read the passage below and summarize it in one sentence of no more than 75 words.',
    sourceText:
      'As cities grow denser, urban planners are increasingly turning to "15-minute neighborhoods," where residents can reach work, schools, shops, and healthcare within a short walk or bike ride. Proponents argue this reduces car dependency and strengthens local community ties, while skeptics note that retrofitting existing suburbs to meet this standard would require enormous investment and time.',
    minWords: 5,
    maxWords: 75,
  },
  {
    id: 'w-swt-3',
    taskType: 'writing-summarize-text',
    prompt: 'Read the passage below and summarize it in one sentence of no more than 75 words.',
    sourceText:
      'A long-term study following thousands of adults found that those who maintained close friendships into old age reported significantly higher life satisfaction than those who did not, even after accounting for differences in income and physical health. The researchers suggest that social connection may be as important to wellbeing as more commonly cited factors like diet and exercise.',
    minWords: 5,
    maxWords: 75,
  },
  {
    id: 'w-swt-4',
    taskType: 'writing-summarize-text',
    prompt: 'Read the passage below and summarize it in one sentence of no more than 75 words.',
    sourceText:
      'Battery technology has struggled to keep pace with the rapid growth of electric vehicles, prompting several governments to fund research into alternative chemistries such as solid-state batteries. These promise faster charging and longer range, but manufacturers caution that mass production at a competitive cost is still likely several years away.',
    minWords: 5,
    maxWords: 75,
  },
  {
    id: 'w-swt-5',
    taskType: 'writing-summarize-text',
    prompt: 'Read the passage below and summarize it in one sentence of no more than 75 words.',
    sourceText:
      'Language learning apps have made studying a second language more accessible than ever, but linguists point out that app-based practice alone rarely produces true fluency. Real conversational competence, they argue, still depends heavily on sustained interaction with native speakers, something most apps only partially simulate.',
    minWords: 5,
    maxWords: 75,
  },
  {
    id: 'w-swt-6',
    taskType: 'writing-summarize-text',
    prompt: 'Read the passage below and summarize it in one sentence of no more than 75 words.',
    sourceText:
      'Archaeologists excavating a Bronze Age site recently uncovered evidence of long-distance trade in amber and tin, materials not naturally found within hundreds of kilometres of the settlement. The find challenges earlier assumptions that communities of this period were largely isolated, suggesting instead the existence of extensive, organized trade networks far earlier than previously believed.',
    minWords: 5,
    maxWords: 75,
  },
  {
    id: 'w-swt-7',
    taskType: 'writing-summarize-text',
    prompt: 'Read the passage below and summarize it in one sentence of no more than 75 words.',
    sourceText:
      'A growing body of research suggests that regular exposure to green spaces, even brief walks in a city park, measurably reduces cortisol levels and self-reported stress. City planners citing this evidence have begun prioritizing small, accessible pocket parks over a single large park located far from most residents, aiming to maximize the number of people who benefit regularly.',
    minWords: 5,
    maxWords: 75,
  },
  {
    id: 'w-swt-8',
    taskType: 'writing-summarize-text',
    prompt: 'Read the passage below and summarize it in one sentence of no more than 75 words.',
    sourceText:
      'Online reviews have become a dominant factor in consumer purchasing decisions, yet studies show a significant share of reviews are either fabricated or paid for. Several countries are now considering regulations that would require platforms to verify that a reviewer actually purchased the product, though enforcement across international platforms remains a significant practical challenge.',
    minWords: 5,
    maxWords: 75,
  },
  {
    id: 'w-swt-9',
    taskType: 'writing-summarize-text',
    prompt: 'Read the passage below and summarize it in one sentence of no more than 75 words.',
    sourceText:
      'Researchers tracking the spread of an invasive insect species found that its expansion closely followed major highway corridors rather than spreading evenly outward, suggesting that vehicles, rather than natural dispersal, are the primary means by which the species is establishing new populations. This finding has prompted several transport agencies to consider inspection checkpoints along the busiest routes.',
    minWords: 5,
    maxWords: 75,
  },
  {
    id: 'w-swt-10',
    taskType: 'writing-summarize-text',
    prompt: 'Read the passage below and summarize it in one sentence of no more than 75 words.',
    sourceText:
      'A decade-long study of household recycling habits found that clear, simple labeling on bins had a far greater effect on correct sorting than public awareness campaigns or financial penalties for contamination. Researchers concluded that reducing the everyday friction of a behavior often changes habits more effectively than trying to persuade people through information alone.',
    minWords: 5,
    maxWords: 75,
  },
  {
    id: 'w-swt-11',
    taskType: 'writing-summarize-text',
    prompt: 'Read the passage below and summarize it in one sentence of no more than 75 words.',
    sourceText:
      'Economists studying the gig economy note that while flexible, on-demand work arrangements appeal to many workers seeking autonomy, the same workers often lack access to benefits such as paid leave or employer-sponsored retirement savings that are standard in traditional employment, raising longer-term questions about financial security for this growing segment of the workforce.',
    minWords: 5,
    maxWords: 75,
  },
  {
    id: 'w-swt-12',
    taskType: 'writing-summarize-text',
    prompt: 'Read the passage below and summarize it in one sentence of no more than 75 words.',
    sourceText:
      'A survey of hospital patients found that those who received a brief, clear explanation of their treatment plan from a nurse reported significantly less anxiety before surgery than patients who received the same information in writing alone, suggesting that the format and personal delivery of medical information can matter as much as its content.',
    minWords: 5,
    maxWords: 75,
  },
  {
    id: 'w-swt-13',
    taskType: 'writing-summarize-text',
    prompt: 'Read the passage below and summarize it in one sentence of no more than 75 words.',
    sourceText:
      'Climate scientists modeling future rainfall patterns warn that some regions currently reliant on predictable seasonal rains may face both longer droughts and more intense flooding within the same decade, complicating agricultural planning far more than a simple overall decrease or increase in total rainfall would.',
    minWords: 5,
    maxWords: 75,
  },
  {
    id: 'w-swt-14',
    taskType: 'writing-summarize-text',
    prompt: 'Read the passage below and summarize it in one sentence of no more than 75 words.',
    sourceText:
      'A study comparing children who attended museums regularly with those who did not found modestly higher scores in observational and descriptive vocabulary tasks among the museum-going group, though the researchers caution that families who visit museums frequently may differ from other families in ways the study could not fully account for.',
    minWords: 5,
    maxWords: 75,
  },
  {
    id: 'w-swt-15',
    taskType: 'writing-summarize-text',
    prompt: 'Read the passage below and summarize it in one sentence of no more than 75 words.',
    sourceText:
      'Manufacturers of household appliances are increasingly designing products to be repaired rather than replaced, partly in response to new regulations requiring spare parts to remain available for a decade after a product\'s release, a shift consumer advocates hope will reduce electronic waste and give buyers better long-term value.',
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
  {
    id: 'w-essay-2',
    taskType: 'writing-essay',
    prompt:
      'Some argue that remote work has permanently changed how companies should be organized, while others believe most employees will eventually return to full-time office work. Discuss both views and give your own opinion.',
    minWords: 200,
    maxWords: 300,
  },
  {
    id: 'w-essay-3',
    taskType: 'writing-essay',
    prompt:
      'Many governments are investing heavily in artificial intelligence research. Some see this as essential for future economic growth, while others worry about job losses and loss of human oversight. Discuss both views and give your own opinion.',
    minWords: 200,
    maxWords: 300,
  },
  {
    id: 'w-essay-4',
    taskType: 'writing-essay',
    prompt:
      'Some people think social media has made society more connected, while others believe it has made people more isolated and anxious. Discuss both views and give your own opinion.',
    minWords: 200,
    maxWords: 300,
  },
  {
    id: 'w-essay-5',
    taskType: 'writing-essay',
    prompt:
      'Some believe that standardized testing is the fairest way to evaluate students, while others argue it fails to capture a student\'s true abilities. Discuss both views and give your own opinion.',
    minWords: 200,
    maxWords: 300,
  },
  {
    id: 'w-essay-6',
    taskType: 'writing-essay',
    prompt:
      'Some people think governments should invest primarily in public transportation, while others believe money is better spent improving roads for private vehicles. Discuss both views and give your own opinion.',
    minWords: 200,
    maxWords: 300,
  },
  {
    id: 'w-essay-7',
    taskType: 'writing-essay',
    prompt:
      'Some argue that historical monuments connected to a troubled past should be removed from public spaces, while others believe they should remain as a reminder of history. Discuss both views and give your own opinion.',
    minWords: 200,
    maxWords: 300,
  },
  {
    id: 'w-essay-8',
    taskType: 'writing-essay',
    prompt:
      'Some people believe that children should begin learning a foreign language as early as possible, while others think it is better to focus first on their native language. Discuss both views and give your own opinion.',
    minWords: 200,
    maxWords: 300,
  },
  {
    id: 'w-essay-9',
    taskType: 'writing-essay',
    prompt:
      'Some believe that space exploration is a worthwhile use of public funds, while others argue that the money would be better spent addressing problems on Earth. Discuss both views and give your own opinion.',
    minWords: 200,
    maxWords: 300,
  },
  {
    id: 'w-essay-10',
    taskType: 'writing-essay',
    prompt:
      'Some people think employees should be required to disconnect from work communications outside office hours, while others believe this reduces flexibility and harms productivity. Discuss both views and give your own opinion.',
    minWords: 200,
    maxWords: 300,
  },
  {
    id: 'w-essay-11',
    taskType: 'writing-essay',
    prompt:
      'Some argue that tourism brings essential economic benefits to local communities, while others believe it damages the environment and erodes local culture. Discuss both views and give your own opinion.',
    minWords: 200,
    maxWords: 300,
  },
  {
    id: 'w-essay-12',
    taskType: 'writing-essay',
    prompt:
      'Some people believe zoos play an important role in conservation and education, while others think keeping wild animals in captivity is unethical. Discuss both views and give your own opinion.',
    minWords: 200,
    maxWords: 300,
  },
  {
    id: 'w-essay-13',
    taskType: 'writing-essay',
    prompt:
      'Some believe that grades and exams are necessary to motivate students, while others argue they create unnecessary pressure and discourage genuine learning. Discuss both views and give your own opinion.',
    minWords: 200,
    maxWords: 300,
  },
  {
    id: 'w-essay-14',
    taskType: 'writing-essay',
    prompt:
      'Some people think large corporations should be primarily responsible for reducing carbon emissions, while others believe individual consumers bear the greater responsibility. Discuss both views and give your own opinion.',
    minWords: 200,
    maxWords: 300,
  },
  {
    id: 'w-essay-15',
    taskType: 'writing-essay',
    prompt:
      'Some argue that traditional print newspapers remain essential for reliable journalism, while others believe online news sources have made them unnecessary. Discuss both views and give your own opinion.',
    minWords: 200,
    maxWords: 300,
  },
]

const readingMcqMultiple: McqMultipleItem[] = [
  {
    id: 'r-mcqm-1',
    taskType: 'reading-mcq-multiple',
    passage:
      'City councils weighing whether to install more public drinking fountains cite several benefits: reduced plastic bottle waste, free access to water for low-income residents, and lower rates of dehydration-related emergency visits during heat waves. Some councils also note that fountains require ongoing maintenance and water-quality testing, which strains already limited budgets.',
    question: 'According to the passage, what are the reasons for installing more public drinking fountains? Select all that apply.',
    options: ['Less plastic bottle waste', 'Free access to water for low-income residents', 'Fewer dehydration-related emergency visits during heat waves', 'No maintenance costs at all'],
    correctIndexes: [0, 1, 2],
  },
  {
    id: 'r-mcqm-2',
    taskType: 'reading-mcq-multiple',
    passage:
      'Proponents of a four-day work week argue it can reduce burnout, lower commuting-related emissions, and, in several pilot studies, maintain or even improve productivity. Skeptics counter that it may not suit every industry, particularly those requiring round-the-clock coverage such as healthcare.',
    question: 'According to the passage, what are the arguments for a four-day work week? Select all that apply.',
    options: ['Reduced burnout', 'Lower commuting-related emissions', 'Maintained or improved productivity in several pilot studies', 'Suitable for every industry without exception'],
    correctIndexes: [0, 1, 2],
  },
  {
    id: 'r-mcqm-3',
    taskType: 'reading-mcq-multiple',
    passage:
      'Advocates for community gardens point to improved access to fresh produce, opportunities for neighbors to interact, and modest reductions in local food-transport emissions. Critics note that gardens can fail without a committed group of volunteers to maintain them long-term.',
    question: 'According to the passage, what are the benefits of community gardens? Select all that apply.',
    options: ['Better access to fresh produce', 'Opportunities for neighbours to interact', 'Modest reductions in local food-transport emissions', 'No need for volunteers to maintain them'],
    correctIndexes: [0, 1, 2],
  },
  {
    id: 'r-mcqm-4',
    taskType: 'reading-mcq-multiple',
    passage:
      'Digital note-taking apps offer searchable text, easy sharing, and automatic backup, which many students find convenient. Handwriting researchers, however, note that writing by hand has been linked to better recall of material in several studies, likely due to the slower, more deliberate encoding process it requires.',
    question: 'According to the passage, what are the advantages of digital note-taking apps? Select all that apply.',
    options: ['Searchable text', 'Easy sharing', 'Automatic backups', 'Proven to support memory better than handwriting'],
    correctIndexes: [0, 1, 2],
  },
  {
    id: 'r-mcqm-5',
    taskType: 'reading-mcq-multiple',
    passage:
      'Supporters of congestion pricing in city centers argue it reduces traffic jams, cuts air pollution, and can fund public transit improvements with the revenue collected. Opponents worry it disproportionately affects lower-income drivers who cannot easily switch to other forms of transport.',
    question: 'According to the passage, what are the arguments for congestion pricing? Select all that apply.',
    options: ['Less traffic congestion', 'Lower air pollution', 'Revenue that can be used to improve public transport', 'Exactly the same impact on all income groups'],
    correctIndexes: [0, 1, 2],
  },
  {
    id: 'r-mcqm-6',
    taskType: 'reading-mcq-multiple',
    passage:
      'Advocates for open-plan offices argue they encourage spontaneous collaboration and reduce construction costs compared with individual offices. However, a growing body of research links open-plan layouts to higher noise levels and, somewhat counterintuitively, fewer face-to-face conversations as employees retreat to messaging apps to avoid being overheard.',
    question: 'According to the passage, what problems do open-plan offices have? Select all that apply.',
    options: ['Higher noise levels', 'Less face-to-face interaction', 'Lower construction costs', 'No effect on how employees communicate'],
    correctIndexes: [0, 1],
  },
  {
    id: 'r-mcqm-7',
    taskType: 'reading-mcq-multiple',
    passage:
      'Proponents of urban composting programs highlight reduced landfill methane emissions, nutrient-rich soil for community gardens, and lower municipal waste-hauling costs. Skeptics note that poorly managed compost bins can attract pests and produce unpleasant odors in dense residential areas.',
    question: 'According to the passage, what benefits do supporters of urban composting programs mention? Select all that apply.',
    options: ['Less methane from landfills', 'Nutrient-rich soil for community gardens', 'Lower municipal waste collection costs', 'No unpleasant odours at all'],
    correctIndexes: [0, 1, 2],
  },
  {
    id: 'r-mcqm-8',
    taskType: 'reading-mcq-multiple',
    passage:
      'Studies of bilingual children report cognitive advantages including improved task-switching ability and better performance on tests requiring the suppression of irrelevant information. Researchers stress, however, that these advantages are modest and should not be mistaken for a general boost in overall intelligence.',
    question: 'According to the passage, what cognitive advantages have researchers found in bilingual children? Select all that apply.',
    options: ['Better task-switching ability', 'Better at ignoring irrelevant information', 'Significantly higher overall intelligence than monolingual children', 'These advantages are modest and do not reflect higher overall intelligence'],
    correctIndexes: [0, 1],
  },
  {
    id: 'r-mcqm-9',
    taskType: 'reading-mcq-multiple',
    passage:
      'Supporters of carbon capture technology point to its potential to allow existing power plants to keep operating while cutting emissions, and to create a new industry around underground storage. Critics counter that the technology remains expensive at scale and may delay investment in renewable alternatives.',
    question: 'According to the passage, what arguments do supporters of carbon capture make? Select all that apply.',
    options: ['It lets existing power plants keep running while cutting emissions', 'It creates new industries around underground storage', 'It is currently cheap to use at large scale', 'It has no effect at all on investment in renewable energy'],
    correctIndexes: [0, 1],
  },
  {
    id: 'r-mcqm-10',
    taskType: 'reading-mcq-multiple',
    passage:
      'Proponents of school uniforms argue they reduce visible economic disparity among students, simplify morning routines for families, and, according to some surveys, modestly reduce bullying related to clothing choices. Opponents argue uniforms suppress individual expression without solid evidence of academic benefit.',
    question: 'According to the passage, what arguments do supporters of school uniforms make? Select all that apply.',
    options: ['They reduce visible economic differences between students', 'They simplify families\' morning routines', 'Some surveys show a modest reduction in clothing-related bullying', 'They have been proven to significantly improve academic results'],
    correctIndexes: [0, 1, 2],
  },
  {
    id: 'r-mcqm-11',
    taskType: 'reading-mcq-multiple',
    passage:
      'Wildlife corridors connecting fragmented habitats have been shown to increase genetic diversity within isolated animal populations and reduce roadkill by guiding animals away from highways. Building them, however, often requires costly land acquisition and years of negotiation with multiple landowners.',
    question: 'According to the passage, what benefits do wildlife corridors bring? Select all that apply.',
    options: ['Greater genetic diversity in isolated populations', 'Fewer animals killed on roads because they are guided away from traffic', 'Almost no construction cost', 'No need to negotiate with any landowners'],
    correctIndexes: [0, 1],
  },
  {
    id: 'r-mcqm-12',
    taskType: 'reading-mcq-multiple',
    passage:
      'Defenders of open-source software argue it allows for greater transparency, faster identification of security vulnerabilities through community review, and freedom from vendor lock-in. Detractors note that ongoing maintenance can suffer without a company\'s financial backing, and support can be less predictable than commercial software.',
    question: 'According to the passage, what advantages do supporters of open-source software mention? Select all that apply.',
    options: ['Greater transparency', 'Faster discovery of security flaws through community review', 'Freedom from lock-in to a single vendor', 'Maintenance and support that are always more reliable than commercial software'],
    correctIndexes: [0, 1, 2],
  },
  {
    id: 'r-mcqm-13',
    taskType: 'reading-mcq-multiple',
    passage:
      'Researchers evaluating meditation apps found modest improvements in self-reported stress and sleep quality among regular users, alongside increased daily mindfulness practice. They caution the apps are not a substitute for treatment of clinical anxiety or depression.',
    question: 'According to the passage, what changes did regular users of meditation apps report? Select all that apply.',
    options: ['Improvements in self-reported stress', 'Better sleep quality', 'More daily mindfulness practice', 'A complete replacement for clinical treatment of anxiety disorders'],
    correctIndexes: [0, 1, 2],
  },
  {
    id: 'r-mcqm-14',
    taskType: 'reading-mcq-multiple',
    passage:
      'Proponents of nuclear power point to its low operational carbon emissions and ability to provide constant baseload electricity regardless of weather. Opponents raise concerns about long-term radioactive waste storage and the high upfront capital cost of building new plants.',
    question: 'According to the passage, what concerns do opponents of nuclear power raise? Select all that apply.',
    options: ['Long-term storage of radioactive waste', 'High upfront capital costs of new plants', 'Very high operational carbon emissions', 'Inability to provide stable baseload power'],
    correctIndexes: [0, 1],
  },
  {
    id: 'r-mcqm-15',
    taskType: 'reading-mcq-multiple',
    passage:
      'Supporters of telehealth expansion cite improved access for patients in rural areas, reduced travel time and cost, and the ability to monitor chronic conditions remotely between visits. Some physicians note that certain diagnoses still require hands-on examination that video consultations cannot replace.',
    question: 'According to the passage, what arguments do supporters of telehealth make? Select all that apply.',
    options: ['Better access to care for patients in rural areas', 'Less travel time and cost for patients', 'Remote monitoring of chronic conditions between visits', 'A complete replacement for all diagnoses that require a physical examination'],
    correctIndexes: [0, 1, 2],
  },
]

const readingFillBlanksDropdown: FillBlanksDropdownItem[] = [
  {
    id: 'r-dropdown-1',
    taskType: 'reading-fill-blanks-dropdown',
    textSegments: [
      'The discovery of antibiotics ',
      ' modern medicine, dramatically reducing deaths from infections that were once ',
      ' fatal, though overuse has since led to growing concerns about drug ',
      '.',
    ],
    blankOptions: [
      ['transformed', 'ignored', 'delayed'],
      ['routinely', 'rarely', 'accidentally'],
      ['resistance', 'shortage', 'discovery'],
    ],
    correctAnswers: ['transformed', 'routinely', 'resistance'],
  },
  {
    id: 'r-dropdown-2',
    taskType: 'reading-fill-blanks-dropdown',
    textSegments: [
      'Satellite imagery allows scientists to ',
      ' deforestation in near real time, helping ',
      ' agencies respond ',
      ' to illegal logging.',
    ],
    blankOptions: [
      ['monitor', 'ignore', 'cause'],
      ['environmental', 'financial', 'unrelated'],
      ['quickly', 'slowly', 'never'],
    ],
    correctAnswers: ['monitor', 'environmental', 'quickly'],
  },
  {
    id: 'r-dropdown-3',
    taskType: 'reading-fill-blanks-dropdown',
    textSegments: [
      'Many economists argue that investing in early childhood education produces one of the highest ',
      ' on investment of any public policy, since the benefits ',
      ' over a person\'s entire working ',
      '.',
    ],
    blankOptions: [
      ['returns', 'losses', 'delays'],
      ['compound', 'disappear', 'reverse'],
      ['lifetime', 'weekend', 'holiday'],
    ],
    correctAnswers: ['returns', 'compound', 'lifetime'],
  },
  {
    id: 'r-dropdown-4',
    taskType: 'reading-fill-blanks-dropdown',
    textSegments: [
      'Noise pollution in cities has been ',
      ' to elevated stress hormones and disrupted sleep, prompting some municipalities to ',
      ' stricter limits on construction ',
      '.',
    ],
    blankOptions: [
      ['linked', 'unrelated', 'opposed'],
      ['introduce', 'abandon', 'ignore'],
      ['noise', 'colors', 'traffic lights'],
    ],
    correctAnswers: ['linked', 'introduce', 'noise'],
  },
  {
    id: 'r-dropdown-5',
    taskType: 'reading-fill-blanks-dropdown',
    textSegments: [
      'Because coral polyps are extremely ',
      ' to temperature change, even a rise of one or two degrees can trigger a ',
      ' event that leaves reefs ',
      ' to disease.',
    ],
    blankOptions: [
      ['sensitive', 'immune', 'indifferent'],
      ['bleaching', 'cooling', 'celebration'],
      ['vulnerable', 'immune', 'unrelated'],
    ],
    correctAnswers: ['sensitive', 'bleaching', 'vulnerable'],
  },
  {
    id: 'r-dropdown-6',
    taskType: 'reading-fill-blanks-dropdown',
    textSegments: [
      'The invention of the printing press ',
      ' the cost of producing a book, making written knowledge accessible to a far ',
      ' audience than the wealthy elite who had previously ',
      ' access to manuscripts.',
    ],
    blankOptions: [
      ['reduced', 'increased', 'ignored'],
      ['wider', 'narrower', 'identical'],
      ['monopolized', 'shared', 'destroyed'],
    ],
    correctAnswers: ['reduced', 'wider', 'monopolized'],
  },
  {
    id: 'r-dropdown-7',
    taskType: 'reading-fill-blanks-dropdown',
    textSegments: [
      'Because bees ',
      ' a large share of global food crops, a sustained decline in their population could ',
      ' significant disruption to agricultural ',
      '.',
    ],
    blankOptions: [
      ['pollinate', 'ignore', 'consume'],
      ['cause', 'prevent', 'reverse'],
      ['supply chains', 'weather', 'furniture'],
    ],
    correctAnswers: ['pollinate', 'cause', 'supply chains'],
  },
  {
    id: 'r-dropdown-8',
    taskType: 'reading-fill-blanks-dropdown',
    textSegments: [
      'Behavioral scientists have found that people are more likely to ',
      ' a habit when it is tied to an existing routine, a principle now widely ',
      ' in the design of health and fitness ',
      '.',
    ],
    blankOptions: [
      ['maintain', 'forget', 'avoid'],
      ['applied', 'rejected', 'ignored'],
      ['apps', 'accidents', 'surveys'],
    ],
    correctAnswers: ['maintain', 'applied', 'apps'],
  },
  {
    id: 'r-dropdown-9',
    taskType: 'reading-fill-blanks-dropdown',
    textSegments: [
      'Because tectonic plates move only a few centimetres a year, the resulting geological changes are typically ',
      ' over human timescales but can become ',
      ' when they trigger a sudden earthquake or ',
      ' eruption.',
    ],
    blankOptions: [
      ['imperceptible', 'obvious', 'reversed'],
      ['catastrophic', 'irrelevant', 'invisible'],
      ['volcanic', 'quiet', 'financial'],
    ],
    correctAnswers: ['imperceptible', 'catastrophic', 'volcanic'],
  },
  {
    id: 'r-dropdown-10',
    taskType: 'reading-fill-blanks-dropdown',
    textSegments: [
      'Supply chain analysts note that a single disruption at a major port can ',
      ' through an entire global network, ',
      ' shortages of unrelated goods thousands of kilometres ',
      '.',
    ],
    blankOptions: [
      ['ripple', 'disappear', 'improve'],
      ['causing', 'preventing', 'ignoring'],
      ['away', 'nearby', 'underground'],
    ],
    correctAnswers: ['ripple', 'causing', 'away'],
  },
  {
    id: 'r-dropdown-11',
    taskType: 'reading-fill-blanks-dropdown',
    textSegments: [
      'Archivists preserving old film reels must carefully control humidity and temperature, since even minor fluctuations can ',
      ' the chemical decay process and permanently ',
      ' footage considered historically ',
      '.',
    ],
    blankOptions: [
      ['accelerate', 'halt', 'reverse'],
      ['damage', 'restore', 'protect'],
      ['valuable', 'worthless', 'recent'],
    ],
    correctAnswers: ['accelerate', 'damage', 'valuable'],
  },
  {
    id: 'r-dropdown-12',
    taskType: 'reading-fill-blanks-dropdown',
    textSegments: [
      'Because peer review relies on unpaid volunteer experts, journals have struggled to ',
      ' reviewers quickly enough, causing publication delays that some scientists argue ',
      ' the pace of important ',
      '.',
    ],
    blankOptions: [
      ['recruit', 'reject', 'ignore'],
      ['slow', 'accelerate', 'ignore'],
      ['discoveries', 'buildings', 'holidays'],
    ],
    correctAnswers: ['recruit', 'slow', 'discoveries'],
  },
  {
    id: 'r-dropdown-13',
    taskType: 'reading-fill-blanks-dropdown',
    textSegments: [
      'Urban rivers once used primarily as sewage channels are now being ',
      ' as public amenities, with several cities investing heavily in cleanup efforts to make the water ',
      ' enough for recreational ',
      '.',
    ],
    blankOptions: [
      ['reimagined', 'ignored', 'polluted'],
      ['clean', 'dirty', 'warm'],
      ['swimming', 'drilling', 'mining'],
    ],
    correctAnswers: ['reimagined', 'clean', 'swimming'],
  },
  {
    id: 'r-dropdown-14',
    taskType: 'reading-fill-blanks-dropdown',
    textSegments: [
      'Because most smartphone batteries degrade fastest when kept at ',
      ' charge for long periods, manufacturers now recommend keeping the battery between roughly twenty and eighty percent to ',
      ' its usable ',
      '.',
    ],
    blankOptions: [
      ['full', 'medium', 'zero'],
      ['extend', 'shorten', 'ignore'],
      ['lifespan', 'color', 'weight'],
    ],
    correctAnswers: ['full', 'extend', 'lifespan'],
  },
  {
    id: 'r-dropdown-15',
    taskType: 'reading-fill-blanks-dropdown',
    textSegments: [
      'Because migratory whales rely on acoustic signals to communicate across vast distances, rising ocean noise from shipping traffic may ',
      ' their ability to locate mates and could ultimately ',
      ' breeding success across affected ',
      '.',
    ],
    blankOptions: [
      ['impair', 'improve', 'ignore'],
      ['reduce', 'increase', 'guarantee'],
      ['populations', 'ships', 'harbors'],
    ],
    correctAnswers: ['impair', 'reduce', 'populations'],
  },
]

const listeningMcqSingle: ListeningMcqSingleItem[] = [
  {
    id: 'l-mcqs-1',
    taskType: 'listening-mcq-single',
    transcript:
      'Today I want to talk about why honey never spoils. Its low moisture content and naturally acidic pH create an environment where bacteria simply cannot survive, which is why archaeologists have found edible honey in tombs thousands of years old.',
    question: 'According to the lecture, why does honey not spoil?',
    options: ['Because it has a low sugar content', 'Because its low moisture content and acidity prevent bacteria from surviving', 'Because it is always stored in sealed containers', 'Because bees add preservatives to it'],
    correctIndex: 1,
  },
  {
    id: 'l-mcqs-2',
    taskType: 'listening-mcq-single',
    transcript:
      'Let\'s discuss why the sky appears blue during the day. Sunlight contains all colors, but shorter blue wavelengths are scattered far more by the gases in our atmosphere than longer wavelengths like red, so blue light reaches our eyes from all directions.',
    question: 'According to the lecture, why does the sky look blue?',
    options: ['Because the atmosphere contains a blue gas', 'Because blue light has a shorter wavelength and is scattered more easily by the atmosphere', 'Because the sun emits only blue light', 'Because the human eye can only see blue light'],
    correctIndex: 1,
  },
  {
    id: 'l-mcqs-3',
    taskType: 'listening-mcq-single',
    transcript:
      'This morning\'s topic is why we yawn when we see someone else yawn. One leading theory suggests contagious yawning is linked to empathy, since studies show it occurs more frequently between people who are emotionally close.',
    question: 'According to the lecture, what is contagious yawning associated with?',
    options: ['The temperature of the room', 'Empathy, as it is more common between people who are emotionally close', 'The age of the person yawning', 'The time of day'],
    correctIndex: 1,
  },
  {
    id: 'l-mcqs-4',
    taskType: 'listening-mcq-single',
    transcript:
      'Now, why do onions make us cry? When you cut an onion, it releases a volatile compound that reacts with the moisture in your eyes to form a mild sulfuric acid, triggering your tear glands as a protective response.',
    question: 'According to the lecture, why does cutting onions make people cry?',
    options: ['A gas released by the onion reacts with moisture in the eyes to form an irritant', 'Onions contain capsaicin', 'It is only a psychological effect', 'The smell of onions is too strong'],
    correctIndex: 0,
  },
  {
    id: 'l-mcqs-5',
    taskType: 'listening-mcq-single',
    transcript:
      'Let\'s look at why bamboo grows so fast. Unlike trees, bamboo doesn\'t need to build new cells to grow taller each day; the segments of the stem are all fully formed at the base and simply extend rapidly by expanding cells that are already there.',
    question: 'According to the lecture, why does bamboo grow so quickly?',
    options: ['It constantly produces new cells', 'Its stem segments are already formed at the base and lengthen quickly as existing cells expand', 'It needs almost no sunlight', 'Its roots are especially shallow'],
    correctIndex: 1,
  },
  {
    id: 'l-mcqs-6',
    taskType: 'listening-mcq-single',
    transcript:
      'Let\'s consider why airplane windows are rounded rather than square. Early jet aircraft with square windows suffered catastrophic structural failures because sharp corners concentrate stress; rounded windows distribute that stress far more evenly across the fuselage.',
    question: 'According to the lecture, why do aircraft windows have rounded corners?',
    options: ['Rounded windows are cheaper', 'Rounded corners spread stress on the fuselage more evenly instead of concentrating it at sharp corners', 'Rounded windows give a better view', 'It is simply an aesthetic design choice'],
    correctIndex: 1,
  },
  {
    id: 'l-mcqs-7',
    taskType: 'listening-mcq-single',
    transcript:
      'This morning I want to explain why we get goosebumps when cold. The reaction is a leftover from our evolutionary ancestors, whose body hair would stand up to trap a layer of warm air, even though modern humans lack enough hair for the response to be useful.',
    question: 'According to the lecture, why do humans get goosebumps?',
    options: ['It is a completely new evolutionary adaptation', 'It is a reflex inherited from our ancestors that raised body hair for warmth, but modern humans have too little hair for it to work', 'It is purely psychological and unrelated to the body', 'It only happens in extremely cold weather'],
    correctIndex: 1,
  },
  {
    id: 'l-mcqs-8',
    taskType: 'listening-mcq-single',
    transcript:
      'Today\'s topic is why bread goes stale even in a sealed bag. Staling is not primarily about moisture loss; it is mainly caused by starch molecules gradually recrystallizing into a firmer structure, a process that can actually be slowed by freezing rather than refrigerating the bread.',
    question: 'According to the lecture, what is the main reason bread goes stale?',
    options: ['All of its moisture evaporates', 'Starch molecules gradually recrystallise into a harder structure', 'Refrigeration effectively stops bread from going stale', 'Bread only goes stale in summer'],
    correctIndex: 1,
  },
  {
    id: 'l-mcqs-9',
    taskType: 'listening-mcq-single',
    transcript:
      'Let\'s discuss why some coins have ridged edges. The ridges, known as reeding, were originally introduced to prevent people from shaving off small amounts of precious metal from the edge of a gold or silver coin without it being noticeable.',
    question: 'According to the lecture, why were coins originally given ridged edges?',
    options: ['To make coins easier to stack', 'To stop people from secretly shaving metal off the edges of precious-metal coins', 'To make coins look more attractive', 'To make coins easier to produce'],
    correctIndex: 1,
  },
  {
    id: 'l-mcqs-10',
    taskType: 'listening-mcq-single',
    transcript:
      'This lecture covers why some spiders build webs each night rather than repairing old ones. Fresh silk is stickier and more effective at catching prey, and rebuilding also lets the spider recycle the protein from the previous web by eating it first.',
    question: 'According to the lecture, why do spiders rebuild their webs every night?',
    options: ['The old web can no longer be repaired', 'Fresh silk is stickier and more effective, and rebuilding lets the spider recycle protein from the old web', 'It is a purely instinctive behaviour with no practical function', 'Rebuilding takes less time than repairing the old web'],
    correctIndex: 1,
  },
  {
    id: 'l-mcqs-11',
    taskType: 'listening-mcq-single',
    transcript:
      'Now, why does helium make your voice sound higher? Sound travels faster through helium than through normal air because helium molecules are lighter, which raises the resonant frequencies in your vocal tract without actually changing your vocal cords.',
    question: 'According to the lecture, why does your voice sound higher after inhaling helium?',
    options: ['Helium changes the way the vocal cords vibrate', 'Sound travels faster in helium, raising the resonant frequencies of the vocal tract while the vocal cords stay the same', 'Helium temporarily paralyses the vocal cords', 'It is only a psychological illusion'],
    correctIndex: 1,
  },
  {
    id: 'l-mcqs-12',
    taskType: 'listening-mcq-single',
    transcript:
      'Let\'s look at why some countries drive on the left while others drive on the right. Historians trace the left-hand tradition to mounted travelers who kept their sword hand free on the right side to greet or defend against oncoming riders, a custom that persisted long after swords disappeared.',
    question: 'According to the lecture, what is the historical origin of driving on the left?',
    options: ['It was introduced by modern traffic laws', 'Horse riders kept their right hand, their sword hand, free to deal with oncoming riders', 'It relates to the design of carriages rather than riders', 'The tradition has no historical basis'],
    correctIndex: 1,
  },
  {
    id: 'l-mcqs-13',
    taskType: 'listening-mcq-single',
    transcript:
      'Today we\'ll examine why cats often knead soft surfaces with their paws. The behavior is believed to originate in kittenhood, when kneading against a mother cat stimulated milk flow, and many adult cats retain the instinct as a sign of comfort and contentment.',
    question: 'According to the lecture, where does kneading behaviour in cats come from?',
    options: ['It is an aggressive behaviour', 'It comes from kittens stimulating their mother\'s milk flow and is kept into adulthood as a sign of comfort', 'It is how cats mark their territory', 'It only happens in injured cats'],
    correctIndex: 1,
  },
  {
    id: 'l-mcqs-14',
    taskType: 'listening-mcq-single',
    transcript:
      'Let\'s discuss why old photographs often appear sepia-toned rather than black and white. Early photographic prints faded quickly, so a chemical toning process using sulfur compounds was applied to convert the silver in the image into a more stable compound, which also happened to produce a brownish hue.',
    question: 'According to the lecture, why do old photographs have a sepia tone?',
    options: ['Cameras at the time could only capture brown tones', 'A chemical toning process used to make the silver in the image more stable also produced the sepia colour', 'Photographers deliberately chose it as an artistic effect', 'It is the result of photographs fading naturally over time'],
    correctIndex: 1,
  },
  {
    id: 'l-mcqs-15',
    taskType: 'listening-mcq-single',
    transcript:
      'This morning\'s topic is why deja vu occurs. One leading neurological theory suggests it results from a brief misfire in the brain\'s memory-processing circuits, causing a new experience to be mistakenly tagged as familiar even though it has never actually occurred before.',
    question: 'According to the lecture, how does a leading neurological theory explain déjà vu?',
    options: ['It is evidence of supernatural phenomena', 'The brain\'s memory circuits briefly misfire and wrongly tag a new experience as a familiar memory', 'It only happens to people who lack sleep', 'It is caused by a physical defect in the eyes'],
    correctIndex: 1,
  },
]

const listeningMcqMultiple: ListeningMcqMultipleItem[] = [
  {
    id: 'l-mcqm-1',
    taskType: 'listening-mcq-multiple',
    transcript:
      'Researchers studying urban trees found several benefits beyond aesthetics: they lower summer street temperatures by providing shade, reduce stormwater runoff by absorbing rainfall, and can modestly reduce noise from nearby traffic.',
    question: 'According to the lecture, what benefits do urban trees bring? Select all that apply.',
    options: ['Lower street temperatures in summer', 'Less stormwater runoff', 'Reduced traffic noise', 'Complete elimination of air pollution'],
    correctIndexes: [0, 1, 2],
  },
  {
    id: 'l-mcqm-2',
    taskType: 'listening-mcq-multiple',
    transcript:
      'A study on workplace lighting found that employees exposed to more natural daylight reported better sleep quality, fewer headaches, and slightly higher self-reported productivity compared with those working under fluorescent lighting alone.',
    question: 'According to the lecture, what changes did employees with more natural light report? Select all that apply.',
    options: ['Better sleep', 'Fewer headaches', 'Slightly higher self-rated productivity', 'Significantly better eyesight'],
    correctIndexes: [0, 1, 2],
  },
  {
    id: 'l-mcqm-3',
    taskType: 'listening-mcq-multiple',
    transcript:
      'Marine biologists tracking whale migration have found that the animals rely on a combination of ocean currents, water temperature gradients, and possibly the Earth\'s magnetic field to navigate thousands of kilometers each year.',
    question: 'According to the lecture, what might whales rely on to navigate during migration? Select all that apply.',
    options: ['Ocean currents', 'Water temperature gradients', 'The Earth\'s magnetic field', 'Sounds made by ships'],
    correctIndexes: [0, 1, 2],
  },
  {
    id: 'l-mcqm-4',
    taskType: 'listening-mcq-multiple',
    transcript:
      'A survey of remote workers identified the top challenges as difficulty separating work from personal life, feelings of isolation from colleagues, and, for some, a lack of suitable home office equipment.',
    question: 'According to the lecture, what challenges do remote workers face? Select all that apply.',
    options: ['Blurred boundaries between work and home life', 'A sense of isolation from colleagues', 'A lack of suitable home office equipment', 'Long commutes'],
    correctIndexes: [0, 1, 2],
  },
  {
    id: 'l-mcqm-5',
    taskType: 'listening-mcq-multiple',
    transcript:
      'Nutrition researchers note that fermented foods can support gut health by introducing beneficial bacteria, may improve the digestibility of certain nutrients, and in some studies have been linked to modest improvements in mood.',
    question: 'According to the lecture, what benefits might fermented foods offer? Select all that apply.',
    options: ['Introducing beneficial bacteria', 'Making some nutrients easier to digest', 'A link to modest improvements in mood', 'Completely replacing all medication'],
    correctIndexes: [0, 1, 2],
  },
  {
    id: 'l-mcqm-6',
    taskType: 'listening-mcq-multiple',
    transcript:
      'A study of public libraries found that visitors who used quiet study rooms reported higher concentration, that circulation of physical books remained surprisingly stable despite e-book availability, and that community programs for children drove a large share of overall foot traffic.',
    question: 'According to the lecture, what did the research find about libraries? Select all that apply.',
    options: ['Users of quiet study rooms reported better concentration', 'Physical book loans have stayed stable despite e-books', 'Children\'s community events brought in many visitors', 'Children\'s events have been cancelled at every library'],
    correctIndexes: [0, 1, 2],
  },
  {
    id: 'l-mcqm-7',
    taskType: 'listening-mcq-multiple',
    transcript:
      'Researchers studying online learning platforms found that students who set specific weekly goals were more likely to complete a course, that video lectures under ten minutes had higher completion rates, and that peer discussion forums modestly improved retention of the material.',
    question: 'According to the lecture, what patterns did the research find in online learning? Select all that apply.',
    options: ['Students who set specific weekly goals were more likely to finish the course', 'Video lectures under ten minutes had higher completion rates', 'Peer discussion forums modestly improved knowledge retention', 'Video length has no relationship with completion rates'],
    correctIndexes: [0, 1, 2],
  },
  {
    id: 'l-mcqm-8',
    taskType: 'listening-mcq-multiple',
    transcript:
      'A review of urban farming initiatives found that rooftop farms reduced building cooling costs in summer, that community members reported a stronger sense of local identity, and that produce yields, while smaller than rural farms, were often sold at a premium due to freshness.',
    question: 'According to the lecture, what results has urban farming produced? Select all that apply.',
    options: ['Lower building cooling costs in summer', 'A stronger sense of local identity among residents', 'Small harvests that often sell at higher prices because they are fresh', 'Harvests that already exceed those of traditional rural farms'],
    correctIndexes: [0, 1, 2],
  },
  {
    id: 'l-mcqm-9',
    taskType: 'listening-mcq-multiple',
    transcript:
      'A survey of long-distance runners found that most who followed a structured tapering period before a race reported better performance, that hydration strategy varied enormously between individuals, and that pre-race anxiety, contrary to expectation, did not correlate strongly with final finish time.',
    question: 'According to the lecture, what did the survey of long-distance runners find? Select all that apply.',
    options: ['Runners who tapered their training before races performed better', 'Hydration strategies varied widely between runners', 'Pre-race anxiety was not strongly linked to final results', 'All runners used exactly the same hydration strategy'],
    correctIndexes: [0, 1, 2],
  },
  {
    id: 'l-mcqm-10',
    taskType: 'listening-mcq-multiple',
    transcript:
      'A study on customer service call centers found that shorter hold-music loops reduced caller frustration, that agents given more autonomy to resolve issues without escalation reported higher job satisfaction, and that call volume peaked predictably at the start of each business day.',
    question: 'According to the lecture, what did the call centre study find? Select all that apply.',
    options: ['Shorter hold-music loops reduced caller frustration', 'Agents with more autonomy reported higher job satisfaction', 'Call volume peaks predictably at the start of each working day', 'Call volume stays perfectly even throughout the day'],
    correctIndexes: [0, 1, 2],
  },
  {
    id: 'l-mcqm-11',
    taskType: 'listening-mcq-multiple',
    transcript:
      'Botanists studying carnivorous plants found that most species evolved in nutrient-poor soils, that their trapping mechanisms are highly specialized to specific types of prey, and that digestion of captured insects can take anywhere from several hours to over a week depending on the species.',
    question: 'According to the lecture, what did the research on carnivorous plants find? Select all that apply.',
    options: ['Most species evolved in nutrient-poor soils', 'Their trapping mechanisms are highly specialised for particular prey', 'The time needed to digest trapped insects varies by species', 'All carnivorous plants digest at exactly the same speed'],
    correctIndexes: [0, 1, 2],
  },
  {
    id: 'l-mcqm-12',
    taskType: 'listening-mcq-multiple',
    transcript:
      'An analysis of household energy use found that appliances left on standby account for a meaningful share of monthly electricity bills, that smart thermostats reduced heating costs modestly, and that peak electricity pricing encouraged some households to shift laundry to off-peak hours.',
    question: 'According to the lecture, what did the analysis of household energy use find? Select all that apply.',
    options: ['Appliances on standby make up a considerable share of monthly electricity bills', 'Smart thermostats modestly reduced heating costs', 'Time-of-use pricing led some households to move laundry to off-peak hours', 'Appliances on standby have no effect on electricity bills'],
    correctIndexes: [0, 1, 2],
  },
  {
    id: 'l-mcqm-13',
    taskType: 'listening-mcq-multiple',
    transcript:
      'A study of professional orchestras found that blind auditions, where a screen hides the performer from the judges, increased the proportion of women advancing to later rounds, that seating arrangements affected how musicians perceived ensemble timing, and that rehearsal frequency correlated with performance consistency.',
    question: 'According to the lecture, what did the study of professional orchestras find? Select all that apply.',
    options: ['Blind auditions increased the proportion of women advancing to later rounds', 'Seating arrangements affect how musicians perceive the overall tempo', 'Rehearsal frequency is linked to consistent performances', 'Blind auditions had no effect on advancement rates'],
    correctIndexes: [0, 1, 2],
  },
  {
    id: 'l-mcqm-14',
    taskType: 'listening-mcq-multiple',
    transcript:
      'Researchers examining traffic accident data found that intersections with dedicated left-turn signals had fewer collisions, that lower posted speed limits near schools correlated with fewer pedestrian injuries, and that roundabouts generally produced less severe crashes than traditional four-way intersections.',
    question: 'According to the lecture, what did the study of traffic accident data find? Select all that apply.',
    options: ['Intersections with dedicated left-turn signals had fewer collisions', 'Lower speed limits near schools were linked to fewer pedestrian injuries', 'Crashes at roundabouts were usually less severe than at traditional four-way intersections', 'Speed limits have no effect on pedestrian safety'],
    correctIndexes: [0, 1, 2],
  },
  {
    id: 'l-mcqm-15',
    taskType: 'listening-mcq-multiple',
    transcript:
      'A review of workplace mentorship programs found that mentees reported faster skill development, that mentors themselves often reported renewed engagement with their own work, and that programs with structured, regular check-ins were more effective than informal, occasional pairings.',
    question: 'According to the lecture, what did the review of workplace mentoring programs find? Select all that apply.',
    options: ['Mentees developed skills faster', 'Mentors often felt more engaged with their own work', 'Programs with structured, regular check-ins were more effective than informal, occasional pairings', 'Informal pairings were always more effective than structured programs'],
    correctIndexes: [0, 1, 2],
  },
]

const listeningSummarizeSpokenText: ListeningSummarizeItem[] = [
  {
    id: 'l-sst-1',
    taskType: 'listening-summarize-spoken-text',
    transcript:
      'Today\'s lecture examines the rise of urban vertical gardens, which use exterior building walls to grow plants. Proponents highlight improved insulation, reduced urban heat, and added greenery in space-constrained cities. Engineers caution that structural load and irrigation systems must be carefully designed, since a poorly maintained vertical garden can damage the building\'s facade over time.',
    minWords: 50,
    maxWords: 70,
  },
  {
    id: 'l-sst-2',
    taskType: 'listening-summarize-spoken-text',
    transcript:
      'This lecture looks at why some companies are shifting to a four-day work week. Early trials report steady or improved output alongside better employee wellbeing, though the approach appears to suit knowledge-based roles more easily than shift-based industries like manufacturing or healthcare, where continuous coverage is essential.',
    minWords: 50,
    maxWords: 70,
  },
  {
    id: 'l-sst-3',
    taskType: 'listening-summarize-spoken-text',
    transcript:
      'We\'ll discuss the growing use of drones in agriculture. Farmers use them to monitor crop health, apply fertilizer with precision, and detect irrigation problems earlier than ground inspection allows. The main barriers to wider adoption remain the upfront cost of the equipment and the training required to operate it effectively.',
    minWords: 50,
    maxWords: 70,
  },
  {
    id: 'l-sst-4',
    taskType: 'listening-summarize-spoken-text',
    transcript:
      'Today\'s topic is the debate over standardized testing in schools. Supporters argue it provides an objective, comparable measure of student achievement across different schools and regions. Critics counter that it narrows curricula toward test preparation and may fail to capture creativity, critical thinking, or other harder-to-measure skills.',
    minWords: 50,
    maxWords: 70,
  },
  {
    id: 'l-sst-5',
    taskType: 'listening-summarize-spoken-text',
    transcript:
      'This lecture covers recent efforts to restore wetlands that were drained decades ago for agriculture. Restored wetlands have been shown to filter pollutants from water, provide habitat for migratory birds, and reduce flood risk downstream, though restoration projects can take many years to reach full ecological function.',
    minWords: 50,
    maxWords: 70,
  },
  {
    id: 'l-sst-6',
    taskType: 'listening-summarize-spoken-text',
    transcript:
      'Today\'s lecture concerns the growing interest in edible insects as a protein source. Advocates point to insects\' low land and water requirements compared with cattle farming, alongside comparable protein content. However, widespread adoption in many Western markets faces a significant cultural barrier, as consumer disgust remains the single largest obstacle researchers have identified.',
    minWords: 50,
    maxWords: 70,
  },
  {
    id: 'l-sst-7',
    taskType: 'listening-summarize-spoken-text',
    transcript:
      'This lecture examines why some ancient cities were abandoned rather than rebuilt after disasters. Archaeological evidence increasingly points to a combination of factors — soil exhaustion, shifting trade routes, and prolonged drought — rather than any single catastrophic event, challenging the popular assumption that a single dramatic collapse explains most historical abandonments.',
    minWords: 50,
    maxWords: 70,
  },
  {
    id: 'l-sst-8',
    taskType: 'listening-summarize-spoken-text',
    transcript:
      'Today we\'ll discuss the psychology behind why people persist with sunk-cost investments. Even when continuing is clearly the worse option financially, individuals frequently keep investing time or money into a failing project simply because of what has already been spent, a bias that behavioral economists argue affects both personal finance and corporate decision-making.',
    minWords: 50,
    maxWords: 70,
  },
  {
    id: 'l-sst-9',
    taskType: 'listening-summarize-spoken-text',
    transcript:
      'This lecture covers recent efforts to breed drought-resistant crop varieties through selective breeding rather than genetic modification. Researchers have identified wild relatives of staple crops that survive extreme conditions and are cross-breeding these traits into commercial varieties, a slower process than genetic engineering but one that avoids the regulatory hurdles many countries impose on modified crops.',
    minWords: 50,
    maxWords: 70,
  },
  {
    id: 'l-sst-10',
    taskType: 'listening-summarize-spoken-text',
    transcript:
      'Today\'s topic is the debate over open-plan university dormitories versus traditional individual rooms. Supporters of shared living spaces cite stronger social bonds and lower construction costs, while critics point to increased noise, reduced privacy, and, in some surveys, higher reported stress among students who need quiet space to study.',
    minWords: 50,
    maxWords: 70,
  },
  {
    id: 'l-sst-11',
    taskType: 'listening-summarize-spoken-text',
    transcript:
      'This lecture discusses why coral reef restoration projects increasingly rely on "coral gardening," where fragments are grown in underwater nurseries before being transplanted onto damaged reefs. Early results show promising survival rates for transplanted fragments, although scientists caution that restoration cannot outpace ongoing damage unless ocean warming itself is addressed.',
    minWords: 50,
    maxWords: 70,
  },
  {
    id: 'l-sst-12',
    taskType: 'listening-summarize-spoken-text',
    transcript:
      'Today\'s lecture examines why some companies are experimenting with a shorter probationary period for new hires. Traditional lengthy trial periods, originally intended to protect employers, are increasingly seen as discouraging strong candidates who receive competing offers with faster confirmation, prompting some firms to shorten the process to remain competitive in tight labor markets.',
    minWords: 50,
    maxWords: 70,
  },
  {
    id: 'l-sst-13',
    taskType: 'listening-summarize-spoken-text',
    transcript:
      'This lecture covers the resurgence of interest in traditional herbal medicine among pharmaceutical researchers. Rather than dismissing folk remedies, scientists are systematically screening plant compounds used in traditional practice for pharmacological activity, a process that has already led to several promising drug candidates now undergoing clinical trials.',
    minWords: 50,
    maxWords: 70,
  },
  {
    id: 'l-sst-14',
    taskType: 'listening-summarize-spoken-text',
    transcript:
      'Today we\'ll discuss why some cities are removing highways that once cut through their downtown cores. Studies of cities that replaced elevated highways with boulevards or parks found that surrounding property values rose and local traffic congestion, contrary to fears, did not worsen significantly as some drivers shifted to public transit or alternative routes.',
    minWords: 50,
    maxWords: 70,
  },
  {
    id: 'l-sst-15',
    taskType: 'listening-summarize-spoken-text',
    transcript:
      'This lecture examines the growing use of artificial intelligence in translating rare and endangered languages. While machine translation still struggles with limited training data for these languages, researchers are pairing AI tools with community linguists to accelerate documentation, a partnership that has already produced usable translation aids for several previously under-resourced languages.',
    minWords: 50,
    maxWords: 70,
  },
]

const listeningSelectMissingWord: SelectMissingWordItem[] = [
  {
    id: 'l-missing-1',
    taskType: 'listening-select-missing-word',
    fullTranscript:
      'After weeks of drought, the farmers were relieved when the forecast finally predicted heavy rain.',
    displayedTranscript: 'After weeks of drought, the farmers were relieved when the forecast finally predicted ____.',
    options: ['heavy rain', 'a sunny week', 'strong winds', 'a full moon'],
    correctIndex: 0,
  },
  {
    id: 'l-missing-2',
    taskType: 'listening-select-missing-word',
    fullTranscript: 'Despite the rising cost of raw materials, the company managed to keep its prices stable.',
    displayedTranscript: 'Despite the rising cost of raw materials, the company managed to keep its prices ____.',
    options: ['stable', 'doubled', 'confidential', 'irrelevant'],
    correctIndex: 0,
  },
  {
    id: 'l-missing-3',
    taskType: 'listening-select-missing-word',
    fullTranscript: 'The museum\'s new wing was designed specifically to house the growing photography collection.',
    displayedTranscript: 'The museum\'s new wing was designed specifically to house the growing photography ____.',
    options: ['collection', 'cafeteria', 'parking lot', 'staff'],
    correctIndex: 0,
  },
  {
    id: 'l-missing-4',
    taskType: 'listening-select-missing-word',
    fullTranscript: 'Because the bridge was closed for repairs, commuters had to find an alternative route.',
    displayedTranscript: 'Because the bridge was closed for repairs, commuters had to find an alternative ____.',
    options: ['route', 'hobby', 'language', 'salary'],
    correctIndex: 0,
  },
  {
    id: 'l-missing-5',
    taskType: 'listening-select-missing-word',
    fullTranscript: 'The research team published their findings only after the results had been independently verified.',
    displayedTranscript: 'The research team published their findings only after the results had been independently ____.',
    options: ['verified', 'forgotten', 'sold', 'translated'],
    correctIndex: 0,
  },
  {
    id: 'l-missing-6',
    taskType: 'listening-select-missing-word',
    fullTranscript: 'The city council postponed the vote after several residents requested more time to review the proposal.',
    displayedTranscript: 'The city council postponed the vote after several residents requested more time to ____.',
    options: ['review the proposal', 'buy new furniture', 'watch a film', 'learn a language'],
    correctIndex: 0,
  },
  {
    id: 'l-missing-7',
    taskType: 'listening-select-missing-word',
    fullTranscript: 'The factory upgraded its machinery in order to reduce energy consumption.',
    displayedTranscript: 'The factory upgraded its machinery in order to ____.',
    options: ['reduce energy consumption', 'hire more staff', 'relocate overseas', 'increase ticket prices'],
    correctIndex: 0,
  },
  {
    id: 'l-missing-8',
    taskType: 'listening-select-missing-word',
    fullTranscript: 'Despite early setbacks, the research team eventually published their results in a respected journal.',
    displayedTranscript: 'Despite early setbacks, the research team eventually published their results in a respected ____.',
    options: ['journal', 'restaurant', 'stadium', 'workshop'],
    correctIndex: 0,
  },
  {
    id: 'l-missing-9',
    taskType: 'listening-select-missing-word',
    fullTranscript: 'The orchestra rehearsed for weeks before the opening night performance.',
    displayedTranscript: 'The orchestra rehearsed for weeks before the opening night ____.',
    options: ['performance', 'election', 'harvest', 'renovation'],
    correctIndex: 0,
  },
  {
    id: 'l-missing-10',
    taskType: 'listening-select-missing-word',
    fullTranscript: 'The airline apologized to passengers after the flight was delayed by several hours.',
    displayedTranscript: 'The airline apologized to passengers after the flight was delayed by several ____.',
    options: ['hours', 'countries', 'employees', 'languages'],
    correctIndex: 0,
  },
  {
    id: 'l-missing-11',
    taskType: 'listening-select-missing-word',
    fullTranscript: 'The university announced a new scholarship for students studying environmental science.',
    displayedTranscript: 'The university announced a new scholarship for students studying ____.',
    options: ['environmental science', 'ancient pottery', 'professional cooking', 'competitive sports'],
    correctIndex: 0,
  },
  {
    id: 'l-missing-12',
    taskType: 'listening-select-missing-word',
    fullTranscript: 'The chef explained that fresh, locally sourced ingredients make the biggest difference in flavor.',
    displayedTranscript: 'The chef explained that fresh, locally sourced ingredients make the biggest difference in ____.',
    options: ['flavor', 'weather', 'traffic', 'budget'],
    correctIndex: 0,
  },
  {
    id: 'l-missing-13',
    taskType: 'listening-select-missing-word',
    fullTranscript: 'The engineers tested the bridge design under extreme wind conditions before construction began.',
    displayedTranscript: 'The engineers tested the bridge design under extreme wind conditions before ____.',
    options: ['construction began', 'the ceremony ended', 'the museum opened', 'the interview started'],
    correctIndex: 0,
  },
  {
    id: 'l-missing-14',
    taskType: 'listening-select-missing-word',
    fullTranscript: 'Volunteers cleaned up the coastline after the storm left debris scattered along the beach.',
    displayedTranscript: 'Volunteers cleaned up the coastline after the storm left debris scattered along the ____.',
    options: ['beach', 'highway', 'library', 'hospital'],
    correctIndex: 0,
  },
  {
    id: 'l-missing-15',
    taskType: 'listening-select-missing-word',
    fullTranscript: 'The company reported record profits despite ongoing supply chain challenges.',
    displayedTranscript: 'The company reported record profits despite ongoing supply chain ____.',
    options: ['challenges', 'holidays', 'awards', 'festivals'],
    correctIndex: 0,
  },
]

const listeningHighlightIncorrectWords: HighlightIncorrectWordsItem[] = [
  {
    id: 'l-highlight-1',
    taskType: 'listening-highlight-incorrect-words',
    audioTranscript: 'The library will extend its opening hours during the final week of exams to support students.',
    displayedWords: ['The', 'library', 'will', 'reduce', 'its', 'closing', 'hours', 'during', 'the', 'final', 'week', 'of', 'exams', 'to', 'support', 'students.'],
    incorrectWordIndexes: [3, 5],
  },
  {
    id: 'l-highlight-2',
    taskType: 'listening-highlight-incorrect-words',
    audioTranscript: 'Scientists discovered that the ancient river had shifted its course several times over the centuries.',
    displayedWords: ['Scientists', 'discovered', 'that', 'the', 'modern', 'river', 'had', 'shifted', 'its', 'course', 'several', 'times', 'over', 'the', 'decades.'],
    incorrectWordIndexes: [4, 14],
  },
  {
    id: 'l-highlight-3',
    taskType: 'listening-highlight-incorrect-words',
    audioTranscript: 'The company announced that it would open two new factories next spring to meet rising demand.',
    displayedWords: ['The', 'company', 'announced', 'that', 'it', 'would', 'close', 'two', 'old', 'factories', 'next', 'spring', 'to', 'meet', 'rising', 'demand.'],
    incorrectWordIndexes: [6, 8],
  },
  {
    id: 'l-highlight-4',
    taskType: 'listening-highlight-incorrect-words',
    audioTranscript: 'Volunteers spent the weekend planting trees along the riverbank to prevent soil erosion.',
    displayedWords: ['Volunteers', 'spent', 'the', 'morning', 'planting', 'flowers', 'along', 'the', 'riverbank', 'to', 'prevent', 'soil', 'erosion.'],
    incorrectWordIndexes: [3, 5],
  },
  {
    id: 'l-highlight-5',
    taskType: 'listening-highlight-incorrect-words',
    audioTranscript: 'The airline confirmed that all delayed flights would resume service by early evening.',
    displayedWords: ['The', 'airline', 'confirmed', 'that', 'all', 'cancelled', 'flights', 'would', 'resume', 'service', 'by', 'late', 'evening.'],
    incorrectWordIndexes: [5, 11],
  },
  {
    id: 'l-highlight-6',
    taskType: 'listening-highlight-incorrect-words',
    audioTranscript: 'Farmers reported that the new irrigation system reduced water usage significantly during the summer months.',
    displayedWords: ['Farmers', 'reported', 'that', 'the', 'new', 'drainage', 'system', 'increased', 'water', 'usage', 'significantly', 'during', 'the', 'summer', 'months.'],
    incorrectWordIndexes: [5, 7],
  },
  {
    id: 'l-highlight-7',
    taskType: 'listening-highlight-incorrect-words',
    audioTranscript: 'The government announced plans to build three new hospitals over the next five years.',
    displayedWords: ['The', 'government', 'announced', 'plans', 'to', 'build', 'two', 'new', 'schools', 'over', 'the', 'next', 'five', 'years.'],
    incorrectWordIndexes: [6, 8],
  },
  {
    id: 'l-highlight-8',
    taskType: 'listening-highlight-incorrect-words',
    audioTranscript: 'The chef added a pinch of salt before serving the soup to the guests.',
    displayedWords: ['The', 'chef', 'added', 'a', 'pinch', 'of', 'sugar', 'before', 'serving', 'the', 'salad', 'to', 'the', 'guests.'],
    incorrectWordIndexes: [6, 10],
  },
  {
    id: 'l-highlight-9',
    taskType: 'listening-highlight-incorrect-words',
    audioTranscript: 'The satellite will monitor changes in sea ice thickness across the Arctic region.',
    displayedWords: ['The', 'satellite', 'will', 'monitor', 'patterns', 'in', 'sea', 'ice', 'thickness', 'across', 'the', 'Antarctic', 'region.'],
    incorrectWordIndexes: [4, 11],
  },
  {
    id: 'l-highlight-10',
    taskType: 'listening-highlight-incorrect-words',
    audioTranscript: 'The company plans to launch its new product in early autumn next year.',
    displayedWords: ['The', 'company', 'plans', 'to', 'launch', 'its', 'new', 'service', 'in', 'early', 'spring', 'next', 'year.'],
    incorrectWordIndexes: [7, 10],
  },
  {
    id: 'l-highlight-11',
    taskType: 'listening-highlight-incorrect-words',
    audioTranscript: 'Doctors recommend at least seven hours of sleep for healthy adults each night.',
    displayedWords: ['Doctors', 'recommend', 'at', 'least', 'five', 'hours', 'of', 'sleep', 'for', 'young', 'adults', 'each', 'night.'],
    incorrectWordIndexes: [4, 9],
  },
  {
    id: 'l-highlight-12',
    taskType: 'listening-highlight-incorrect-words',
    audioTranscript: 'The museum\'s new exhibit features artifacts recovered from a shipwreck near the coast.',
    displayedWords: ['The', 'museum\'s', 'new', 'exhibit', 'features', 'paintings', 'recovered', 'from', 'a', 'cave', 'near', 'the', 'coast.'],
    incorrectWordIndexes: [5, 9],
  },
  {
    id: 'l-highlight-13',
    taskType: 'listening-highlight-incorrect-words',
    audioTranscript: 'The team spent months developing an app that helps users track their spending habits.',
    displayedWords: ['The', 'team', 'spent', 'months', 'developing', 'an', 'website', 'that', 'helps', 'users', 'track', 'their', 'sleeping', 'habits.'],
    incorrectWordIndexes: [6, 12],
  },
  {
    id: 'l-highlight-14',
    taskType: 'listening-highlight-incorrect-words',
    audioTranscript: 'The village relies on a single well for most of its drinking water supply.',
    displayedWords: ['The', 'village', 'relies', 'on', 'a', 'single', 'river', 'for', 'most', 'of', 'its', 'irrigation', 'water', 'supply.'],
    incorrectWordIndexes: [6, 11],
  },
  {
    id: 'l-highlight-15',
    taskType: 'listening-highlight-incorrect-words',
    audioTranscript: 'The professor explained that the experiment needed to be repeated under controlled conditions.',
    displayedWords: ['The', 'professor', 'explained', 'that', 'the', 'experiment', 'needed', 'to', 'be', 'cancelled', 'under', 'random', 'conditions.'],
    incorrectWordIndexes: [9, 11],
  },
]

const listeningWriteFromDictation: WriteFromDictationItem[] = [
  { id: 'l-dictation-1', taskType: 'listening-write-from-dictation', sentence: 'The committee will review the proposal next week.' },
  { id: 'l-dictation-2', taskType: 'listening-write-from-dictation', sentence: 'Heavy traffic delayed the morning delivery by an hour.' },
  { id: 'l-dictation-3', taskType: 'listening-write-from-dictation', sentence: 'Researchers published their findings in a leading journal.' },
  { id: 'l-dictation-4', taskType: 'listening-write-from-dictation', sentence: 'The museum extended its hours for the summer exhibition.' },
  { id: 'l-dictation-5', taskType: 'listening-write-from-dictation', sentence: 'Local farmers reported a stronger harvest than last year.' },
  { id: 'l-dictation-6', taskType: 'listening-write-from-dictation', sentence: 'The airport announced new security measures starting Monday.' },
  { id: 'l-dictation-7', taskType: 'listening-write-from-dictation', sentence: 'The city plans to plant trees along every major street.' },
  { id: 'l-dictation-8', taskType: 'listening-write-from-dictation', sentence: 'Engineers tested the bridge before it opened to traffic.' },
  { id: 'l-dictation-9', taskType: 'listening-write-from-dictation', sentence: 'The company hired twenty new employees this quarter.' },
  { id: 'l-dictation-10', taskType: 'listening-write-from-dictation', sentence: 'Scientists observed the comet through a powerful telescope.' },
  { id: 'l-dictation-11', taskType: 'listening-write-from-dictation', sentence: 'The teacher praised the students for their creative solutions.' },
  { id: 'l-dictation-12', taskType: 'listening-write-from-dictation', sentence: 'Volunteers distributed food packages after the flood.' },
  { id: 'l-dictation-13', taskType: 'listening-write-from-dictation', sentence: 'The factory reduced emissions by installing new filters.' },
  { id: 'l-dictation-14', taskType: 'listening-write-from-dictation', sentence: 'The orchestra performed a new piece for the first time.' },
  { id: 'l-dictation-15', taskType: 'listening-write-from-dictation', sentence: 'The bank updated its policy on international transfers.' },
]

const speakingRepeatSentence: RepeatSentenceItem[] = [
  { id: 's-rs-1', taskType: 'speaking-repeat-sentence', text: 'The lecture has been rescheduled to next Tuesday afternoon.' },
  { id: 's-rs-2', taskType: 'speaking-repeat-sentence', text: 'Please remember to submit your assignment before the deadline.' },
  { id: 's-rs-3', taskType: 'speaking-repeat-sentence', text: 'The library closes early on public holidays.' },
  { id: 's-rs-4', taskType: 'speaking-repeat-sentence', text: 'Researchers are studying how climate change affects coastal cities.' },
  { id: 's-rs-5', taskType: 'speaking-repeat-sentence', text: 'The new policy will take effect at the beginning of next month.' },
  { id: 's-rs-6', taskType: 'speaking-repeat-sentence', text: 'Most students found the workshop both practical and engaging.' },
  { id: 's-rs-7', taskType: 'speaking-repeat-sentence', text: 'The conference has attracted researchers from more than thirty countries.' },
  { id: 's-rs-8', taskType: 'speaking-repeat-sentence', text: 'Construction on the new bridge is expected to finish by autumn.' },
  { id: 's-rs-9', taskType: 'speaking-repeat-sentence', text: 'The committee will announce its final decision on Friday afternoon.' },
  { id: 's-rs-10', taskType: 'speaking-repeat-sentence', text: 'Farmers in the region reported an unusually dry growing season.' },
  { id: 's-rs-11', taskType: 'speaking-repeat-sentence', text: 'The airline introduced a new boarding process to save time.' },
  { id: 's-rs-12', taskType: 'speaking-repeat-sentence', text: 'Volunteers helped clean the beach after the storm passed.' },
  { id: 's-rs-13', taskType: 'speaking-repeat-sentence', text: 'The hospital expanded its emergency department last year.' },
  { id: 's-rs-14', taskType: 'speaking-repeat-sentence', text: 'The museum will host a special exhibit next spring.' },
  { id: 's-rs-15', taskType: 'speaking-repeat-sentence', text: 'The company plans to open three new offices overseas.' },
]

const speakingDescribeImage: DescribeImageItem[] = [
  {
    id: 's-di-1',
    taskType: 'speaking-describe-image',
    chart: { type: 'bar', title: 'Commuting by transport mode in a city', categories: ['Walking', 'Cycling', 'Bus', 'Car'], values: [15, 20, 35, 30], unit: '%' },
    referenceDescription:
      'The bar chart shows commuting methods in a city. Bus is the most common at 35 percent, followed by car at 30 percent, bicycle at 20 percent, and walking at 15 percent.',
    prepSeconds: 25,
  },
  {
    id: 's-di-2',
    taskType: 'speaking-describe-image',
    chart: { type: 'line', title: 'Product sales over five years (10,000 units)', categories: ['2021', '2022', '2023', '2024', '2025'], values: [12, 18, 22, 30, 45] },
    referenceDescription:
      'The line chart shows steady growth in product sales from 12 units in 2021 to 45 units in 2025, with the sharpest increase occurring between 2024 and 2025.',
    prepSeconds: 25,
  },
  {
    id: 's-di-3',
    taskType: 'speaking-describe-image',
    chart: { type: 'bar', title: 'University students\' weekly extracurricular time (hours)', categories: ['Sports', 'Clubs', 'Part-time work', 'Leisure'], values: [4, 3, 6, 8], unit: 'h' },
    referenceDescription:
      'The bar chart shows university students spend the most time on entertainment at 8 hours per week, followed by part-time work at 6 hours, sports at 4 hours, and clubs at 3 hours.',
    prepSeconds: 25,
  },
  {
    id: 's-di-4',
    taskType: 'speaking-describe-image',
    chart: { type: 'line', title: 'Average annual temperature in a region (°C)', categories: ['2000', '2010', '2020', '2024'], values: [14, 14.5, 15.3, 16 ] },
    referenceDescription:
      'The line chart shows a gradual rise in average annual temperature from 14 degrees in 2000 to 16 degrees in 2024, indicating a consistent warming trend.',
    prepSeconds: 25,
  },
  {
    id: 's-di-5',
    taskType: 'speaking-describe-image',
    chart: { type: 'bar', title: 'Quarterly revenue of a company (USD millions)', categories: ['Q1', 'Q2', 'Q3', 'Q4'], values: [8, 11, 9, 15], unit: 'M' },
    referenceDescription:
      'The bar chart shows quarterly revenue for a company. Revenue peaked in the fourth quarter at 15 million dollars, dipped slightly in the third quarter to 9 million, and started at 8 million in the first quarter.',
    prepSeconds: 25,
  },
  {
    id: 's-di-6',
    taskType: 'speaking-describe-image',
    chart: { type: 'line', title: 'Internet penetration in a country (%)', categories: ['2005', '2010', '2015', '2020', '2025'], values: [10, 28, 50, 72, 88], unit: '%' },
    referenceDescription:
      'The line chart shows internet penetration rising sharply from 10 percent in 2005 to 88 percent in 2025, with the fastest growth occurring between 2010 and 2020.',
    prepSeconds: 25,
  },
  {
    id: 's-di-7',
    taskType: 'speaking-describe-image',
    chart: { type: 'bar', title: 'Weekly reading time by age group (hours)', categories: ['18-25', '26-40', '41-60', '60+'], values: [3, 4, 6, 9], unit: 'h' },
    referenceDescription:
      'The bar chart shows weekly reading hours by age group, increasing steadily from 3 hours among 18 to 25 year olds to 9 hours among those over 60.',
    prepSeconds: 25,
  },
  {
    id: 's-di-8',
    taskType: 'speaking-describe-image',
    chart: { type: 'line', title: 'Water level of a lake (metres)', categories: ['2000', '2008', '2016', '2024'], values: [12.5, 11.8, 10.2, 8.6], unit: 'm' },
    referenceDescription:
      'The line chart shows a steady decline in the lake\'s water level, falling from 12.5 metres in 2000 to 8.6 metres in 2024, suggesting an ongoing drying trend.',
    prepSeconds: 25,
  },
  {
    id: 's-di-9',
    taskType: 'speaking-describe-image',
    chart: { type: 'bar', title: 'Household energy use by source', categories: ['Heating', 'Hot water', 'Appliances', 'Lighting'], values: [40, 25, 25, 10], unit: '%' },
    referenceDescription:
      'The bar chart shows household energy consumption by source. Heating accounts for the largest share at 40 percent, followed by hot water and appliances tied at 25 percent each, and lighting at 10 percent.',
    prepSeconds: 25,
  },
  {
    id: 's-di-10',
    taskType: 'speaking-describe-image',
    chart: { type: 'line', title: 'Global market share of a smartphone brand (%)', categories: ['2019', '2021', '2023', '2025'], values: [18, 15, 12, 9], unit: '%' },
    referenceDescription:
      'The line chart shows a steady decline in the brand\'s global market share, dropping from 18 percent in 2019 to 9 percent in 2025.',
    prepSeconds: 25,
  },
  {
    id: 's-di-11',
    taskType: 'speaking-describe-image',
    chart: { type: 'bar', title: 'Average annual commuting carbon emissions by transport mode (kg)', categories: ['Walking', 'Bus', 'Car', 'Plane'], values: [0, 120, 800, 2000], unit: 'kg' },
    referenceDescription:
      'The bar chart compares average annual commuting carbon emissions by transport mode, ranging from near zero for walking to 2000 kilograms for frequent flying, with cars producing significantly more than buses.',
    prepSeconds: 25,
  },
  {
    id: 's-di-12',
    taskType: 'speaking-describe-image',
    chart: { type: 'line', title: 'Annual outpatient visits at a hospital (10,000 visits)', categories: ['2018', '2020', '2022', '2024'], values: [45, 38, 52, 61], unit: '' },
    referenceDescription:
      'The line chart shows outpatient visits at a hospital, dipping in 2020 to 38 units, then recovering and rising steadily to 61 units by 2024.',
    prepSeconds: 25,
  },
  {
    id: 's-di-13',
    taskType: 'speaking-describe-image',
    chart: { type: 'bar', title: 'Choice of major among first-year university students', categories: ['Engineering', 'Business', 'Humanities', 'Medicine'], values: [30, 28, 18, 24], unit: '%' },
    referenceDescription:
      'The bar chart shows the proportion of first-year university students choosing different majors, with engineering slightly ahead at 30 percent, followed closely by business at 28 percent, medicine at 24 percent, and humanities at 18 percent.',
    prepSeconds: 25,
  },
  {
    id: 's-di-14',
    taskType: 'speaking-describe-image',
    chart: { type: 'line', title: 'Forest cover in a region (%)', categories: ['1990', '2000', '2010', '2020'], values: [65, 58, 50, 47], unit: '%' },
    referenceDescription:
      'The line chart shows forest cover in a region declining from 65 percent in 1990 to 47 percent in 2020, with the steepest drop occurring in the 1990s.',
    prepSeconds: 25,
  },
  {
    id: 's-di-15',
    taskType: 'speaking-describe-image',
    chart: { type: 'bar', title: 'Daily smartphone use by age group (hours)', categories: ['13-18', '19-30', '31-50', '50+'], values: [5, 4.5, 3, 1.5], unit: 'h' },
    referenceDescription:
      'The bar chart shows average daily smartphone usage by age group, highest among 13 to 18 year olds at 5 hours and lowest among those over 50 at 1.5 hours.',
    prepSeconds: 25,
  },
]

const speakingRetellLecture: RetellLectureItem[] = [
  {
    id: 's-retell-1',
    taskType: 'speaking-retell-lecture',
    transcript:
      'Today I want to talk about the history of the compass. Long before it was used for navigation, ancient Chinese scholars used lodestone to build divination boards. It wasn\'t until sailors realized the stone always pointed toward magnetic north that the compass became an essential tool for long ocean voyages, eventually enabling the age of global exploration.',
    prepSeconds: 10,
  },
  {
    id: 's-retell-2',
    taskType: 'speaking-retell-lecture',
    transcript:
      'Let\'s discuss why some trees drop their leaves in autumn. As daylight hours shorten and temperatures fall, deciduous trees stop producing chlorophyll, revealing the yellow and orange pigments that were there all along. Eventually the trees seal off the connection to each leaf, allowing them to fall and conserving the tree\'s energy for winter.',
    prepSeconds: 10,
  },
  {
    id: 's-retell-3',
    taskType: 'speaking-retell-lecture',
    transcript:
      'This lecture covers the invention of refrigeration. Before mechanical refrigeration, people relied on ice harvested from frozen lakes and stored in insulated ice houses through summer. The development of compressor-based refrigeration in the late nineteenth century transformed food storage, allowing fresh produce and meat to be shipped much further than before.',
    prepSeconds: 10,
  },
  {
    id: 's-retell-4',
    taskType: 'speaking-retell-lecture',
    transcript:
      'Today\'s topic is the domestication of rice. Archaeological evidence suggests rice was first cultivated in the Yangtze River basin thousands of years ago. Over generations, farmers selectively grew plants with larger seeds and less tendency to shatter, eventually producing the rice varieties that became a staple food across much of Asia.',
    prepSeconds: 10,
  },
  {
    id: 's-retell-5',
    taskType: 'speaking-retell-lecture',
    transcript:
      'This lecture examines why honeybee colonies sometimes collapse suddenly. Researchers point to a combination of pesticide exposure, habitat loss, and a parasitic mite that weakens bees\' immune systems, making colonies more vulnerable to disease. No single cause fully explains the phenomenon, which is why beekeepers now use an integrated approach to colony management.',
    prepSeconds: 10,
  },
  {
    id: 's-retell-6',
    taskType: 'speaking-retell-lecture',
    transcript:
      'Let\'s talk about the origins of the modern Olympic Games. Revived in the late nineteenth century after being inspired by the ancient Greek games, the modern Olympics were initially intended to promote international friendship and physical education, though they have since grown into a massive global commercial and media event.',
    prepSeconds: 10,
  },
  {
    id: 's-retell-7',
    taskType: 'speaking-retell-lecture',
    transcript:
      'Today\'s topic is the invention of the elevator safety brake. Before this device, elevators were considered too dangerous for tall buildings because a snapped cable meant a fatal fall. Once a reliable safety brake was demonstrated publicly, architects felt confident building far taller structures, directly enabling the skyscraper era.',
    prepSeconds: 10,
  },
  {
    id: 's-retell-8',
    taskType: 'speaking-retell-lecture',
    transcript:
      'This lecture covers the history of quarantine practices. The concept originated in medieval port cities, where incoming ships were required to wait offshore for a set period before docking, based on the observation that isolating potentially infected travelers reduced the spread of plague, a principle still used in modern public health today.',
    prepSeconds: 10,
  },
  {
    id: 's-retell-9',
    taskType: 'speaking-retell-lecture',
    transcript:
      'Let\'s discuss why the Amazon rainforest produces so much of its own rainfall. Moisture released by the trees themselves forms clouds that travel inland, effectively recycling rainfall across the basin. Scientists warn that large-scale deforestation could disrupt this cycle, potentially triggering a shift toward a drier, savanna-like ecosystem.',
    prepSeconds: 10,
  },
  {
    id: 's-retell-10',
    taskType: 'speaking-retell-lecture',
    transcript:
      'Today\'s lecture is about the economics of secondhand clothing markets. Rising awareness of the environmental cost of fast fashion has driven strong growth in resale platforms, with some analysts predicting the secondhand market could eventually rival traditional retail in size, though quality control and shipping logistics remain persistent challenges.',
    prepSeconds: 10,
  },
  {
    id: 's-retell-11',
    taskType: 'speaking-retell-lecture',
    transcript:
      'This lecture explores why some ancient scripts remain undeciphered. Without a bilingual text linking the unknown script to a known language, similar to what the Rosetta Stone provided for Egyptian hieroglyphs, researchers often lack the essential reference point needed to crack the code, even when large quantities of writing survive.',
    prepSeconds: 10,
  },
  {
    id: 's-retell-12',
    taskType: 'speaking-retell-lecture',
    transcript:
      'Let\'s look at how lighthouses were gradually replaced by modern navigation technology. GPS and electronic charts now provide sailors with far more precise positioning than a lighthouse beam ever could, leading many countries to automate or decommission lighthouses, even as some are preserved for historical and tourist value.',
    prepSeconds: 10,
  },
  {
    id: 's-retell-13',
    taskType: 'speaking-retell-lecture',
    transcript:
      'Today\'s topic is the discovery of penicillin. A researcher noticed that mold accidentally contaminating a bacterial culture had killed the surrounding bacteria, a chance observation that, after years of further development by other scientists, led to the first mass-produced antibiotic and transformed the treatment of bacterial infections.',
    prepSeconds: 10,
  },
  {
    id: 's-retell-14',
    taskType: 'speaking-retell-lecture',
    transcript:
      'This lecture covers the rise of container shipping and its effect on global manufacturing. Standardized containers dramatically cut the cost and time of moving goods internationally, making it economically viable for companies to manufacture components in one country and assemble finished products in another, a shift that reshaped global supply chains.',
    prepSeconds: 10,
  },
  {
    id: 's-retell-15',
    taskType: 'speaking-retell-lecture',
    transcript:
      'Let\'s discuss the psychology behind why people are drawn to nostalgia. Researchers have found that recalling positive memories from the past can boost mood and even reduce feelings of loneliness, suggesting nostalgia serves a genuine psychological function rather than simply being an idle longing for an idealized past.',
    prepSeconds: 10,
  },
]

const speakingAnswerShortQuestion: AnswerShortQuestionItem[] = [
  { id: 's-asq-1', taskType: 'speaking-answer-short-question', question: 'What do we call a doctor who treats animals?', acceptableAnswers: ['a vet', 'vet', 'veterinarian', 'a veterinarian'] },
  { id: 's-asq-2', taskType: 'speaking-answer-short-question', question: 'What is the opposite of "hot"?', acceptableAnswers: ['cold'] },
  { id: 's-asq-3', taskType: 'speaking-answer-short-question', question: 'How many days are there in a week?', acceptableAnswers: ['seven', '7', 'seven days'] },
  { id: 's-asq-4', taskType: 'speaking-answer-short-question', question: 'What do you call a place where books are borrowed?', acceptableAnswers: ['a library', 'library'] },
  { id: 's-asq-5', taskType: 'speaking-answer-short-question', question: 'What season comes after winter?', acceptableAnswers: ['spring'] },
  { id: 's-asq-6', taskType: 'speaking-answer-short-question', question: 'What instrument is used to measure temperature?', acceptableAnswers: ['a thermometer', 'thermometer'] },
  { id: 's-asq-7', taskType: 'speaking-answer-short-question', question: 'What do you call a baby dog?', acceptableAnswers: ['a puppy', 'puppy'] },
  { id: 's-asq-8', taskType: 'speaking-answer-short-question', question: 'What is the opposite of "difficult"?', acceptableAnswers: ['easy', 'simple'] },
  { id: 's-asq-9', taskType: 'speaking-answer-short-question', question: 'How many months are there in a year?', acceptableAnswers: ['twelve', '12', 'twelve months'] },
  { id: 's-asq-10', taskType: 'speaking-answer-short-question', question: 'What do you call the study of living organisms?', acceptableAnswers: ['biology'] },
  { id: 's-asq-11', taskType: 'speaking-answer-short-question', question: 'What do we call a person who teaches students?', acceptableAnswers: ['a teacher', 'teacher'] },
  { id: 's-asq-12', taskType: 'speaking-answer-short-question', question: 'What is the capital city of France?', acceptableAnswers: ['paris'] },
  { id: 's-asq-13', taskType: 'speaking-answer-short-question', question: 'What do you call a shop that sells bread?', acceptableAnswers: ['a bakery', 'bakery'] },
  { id: 's-asq-14', taskType: 'speaking-answer-short-question', question: 'What is the opposite of "empty"?', acceptableAnswers: ['full'] },
  { id: 's-asq-15', taskType: 'speaking-answer-short-question', question: 'What instrument is used to measure atmospheric pressure?', acceptableAnswers: ['a barometer', 'barometer'] },
]

export const QUESTION_BANK: Record<TaskType, PracticeItem[]> = {
  'reading-mcq-single': readingMcqSingle,
  'reading-mcq-multiple': readingMcqMultiple,
  'reading-reorder': readingReorder,
  'reading-fill-blanks-drag': readingFillBlanksDrag,
  'reading-fill-blanks-dropdown': readingFillBlanksDropdown,
  'listening-fill-blanks-typed': listeningFillBlanksTyped,
  'listening-highlight-summary': listeningHighlightSummary,
  'listening-mcq-single': listeningMcqSingle,
  'listening-mcq-multiple': listeningMcqMultiple,
  'listening-summarize-spoken-text': listeningSummarizeSpokenText,
  'listening-select-missing-word': listeningSelectMissingWord,
  'listening-highlight-incorrect-words': listeningHighlightIncorrectWords,
  'listening-write-from-dictation': listeningWriteFromDictation,
  'speaking-read-aloud': speakingReadAloud,
  'speaking-repeat-sentence': speakingRepeatSentence,
  'speaking-describe-image': speakingDescribeImage,
  'speaking-retell-lecture': speakingRetellLecture,
  'speaking-answer-short-question': speakingAnswerShortQuestion,
  'writing-summarize-text': writingSummarizeText,
  'writing-essay': writingEssay,
}

export function getItemsForTaskType(taskType: TaskType): PracticeItem[] {
  return QUESTION_BANK[taskType] ?? []
}

export function getItemById(taskType: TaskType, itemId: string): PracticeItem | undefined {
  return getItemsForTaskType(taskType).find((item) => item.id === itemId)
}
