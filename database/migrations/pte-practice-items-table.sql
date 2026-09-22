-- PTE 练习题库云端存储
--
-- 影响范围：仅新增 pte_practice_items 表及其索引、RLS 策略与种子数据，
-- 不修改、不删除任何已有表、字段或数据（无 DROP / TRUNCATE / 无条件 DELETE）。
-- 可安全重复执行：CREATE TABLE / INDEX 均带 IF NOT EXISTS，策略创建前先判断
-- 是否已存在，种子数据使用 INSERT ... ON CONFLICT DO NOTHING。
--
-- 背景：app/pte-practice/lib/questionBank.ts 中原有的手写原创练习题（非
-- Pearson 官方真题）迁移为可在不改代码的情况下管理/扩展的数据表。前端读取
-- 逻辑（app/pte-practice/lib/item-repository.ts）优先从本表读取，若表为空或
-- 请求失败，会回退到 questionBank.ts 中的原始数组，因此本迁移不会破坏离线
-- 可用性。
--
-- 本表内容属于练习题面数据，不含用户隐私，且当前站点使用固定的 zyx / zly
-- 前端身份而非 Supabase Auth（没有 auth.uid() 可用于校验调用者）。因此：
--   - SELECT 对匿名/已登录角色全部开放（练习内容本身不敏感）。
--   - 不开放 INSERT/UPDATE/DELETE 给 anon/authenticated 角色，题库的新增或
--     修改通过本迁移文件的种子数据或后续新迁移完成，避免任何访客篡改题库。

CREATE TABLE IF NOT EXISTS pte_practice_items (
  id TEXT PRIMARY KEY,
  task_type TEXT NOT NULL CHECK (task_type IN (
    'reading-mcq-single',
    'reading-reorder',
    'reading-fill-blanks-drag',
    'listening-fill-blanks-typed',
    'listening-highlight-summary',
    'speaking-read-aloud',
    'writing-summarize-text',
    'writing-essay'
  )),
  payload JSONB NOT NULL CHECK (jsonb_typeof(payload) = 'object'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS pte_practice_items_task_type_idx
  ON pte_practice_items(task_type);

ALTER TABLE pte_practice_items ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'pte_practice_items'
      AND policyname = 'PTE practice items are readable by anyone'
  ) THEN
    CREATE POLICY "PTE practice items are readable by anyone"
      ON pte_practice_items FOR SELECT
      USING (true);
  END IF;
END
$$;

GRANT SELECT ON pte_practice_items TO anon, authenticated;

-- 种子数据：与 app/pte-practice/lib/questionBank.ts 中现有原创示例题一一对应，
-- payload 字段结构与对应的 PracticeItem TypeScript 类型保持一致（不含 id/
-- taskType，这两者已拆分为独立列）。

INSERT INTO pte_practice_items (id, task_type, payload) VALUES
('r-mcq-1', 'reading-mcq-single', '{"passage":"Urban beekeeping has grown in popularity across many cities over the past decade. Advocates argue that rooftop hives help pollinate community gardens and raise public awareness of declining bee populations. Critics, however, point out that untrained hobbyists can inadvertently spread diseases between colonies and that a high density of hives in one area may increase competition for the limited flowers found in cities.","question":"根据文章，反对城市养蜂的人主要担心什么？","options":["蜜蜂会袭击行人","缺乏经验的养蜂者可能传播疾病并造成蜂群间的资源竞争","屋顶蜂箱会损坏建筑结构","城市里完全没有花可供采蜜"],"correctIndex":1}'::jsonb),
('r-mcq-2', 'reading-mcq-single', '{"passage":"While remote work offers flexibility, several studies suggest that employees who work from home exclusively report feeling less connected to their teams than those who follow a hybrid schedule. Companies experimenting with mandatory in-office days say the goal is not to reduce flexibility but to preserve opportunities for spontaneous collaboration that video calls rarely replicate.","question":"公司要求每周固定进办公室的主要目的是什么？","options":["降低办公室租金","减少员工的工作灵活性","保留视频会议难以replicate的自发协作机会","监督员工的工作时长"],"correctIndex":2}'::jsonb),
('r-mcq-3', 'reading-mcq-single', '{"passage":"Vertical farming, which grows crops in stacked layers inside climate-controlled buildings, uses far less land and water than traditional agriculture. However, the high upfront cost of lighting and climate systems means that, so far, only high-value crops like leafy greens and herbs have proven commercially viable at scale.","question":"目前垂直农业主要种植哪类作物？为什么？","options":["主粮作物，因为产量最高","高价值的叶菜和香草，因为能抵消较高的前期成本","任何作物都可以，成本已经很低","只能种植观赏植物"],"correctIndex":1}'::jsonb),
('r-mcq-4', 'reading-mcq-single', '{"passage":"A recent survey of commuters found that those who read for pleasure during their commute reported lower stress levels than those who spent the same time checking work email. Researchers caution that the study cannot prove reading itself reduces stress, since people who choose to read may already be less anxious to begin with.","question":"研究人员对这项调查结果持什么态度？","options":["完全认同阅读能降低压力","认为查看工作邮件才是压力来源","谨慎，指出可能存在因果关系之外的解释","认为通勤方式与压力无关"],"correctIndex":2}'::jsonb),
('r-mcq-5', 'reading-mcq-single', '{"passage":"Museums that once discouraged photography now actively encourage visitors to share images on social media, viewing it as free publicity. Some curators worry, though, that visitors who spend their visit taking photos for others to see may engage less deeply with the artwork in front of them.","question":"一些策展人的担忧是什么？","options":["拍照会损坏艺术品","社交媒体宣传效果不好","游客可能因忙于拍照而减少对作品本身的投入","博物馆门票收入会下降"],"correctIndex":2}'::jsonb),
('r-mcq-6', 'reading-mcq-single', '{"passage":"Electric scooters have been praised for reducing short-distance car trips in cities, but emergency room data in several cities show a rise in scooter-related injuries, prompting some local governments to introduce speed limits and mandatory helmet rules in designated zones.","question":"一些地方政府采取了什么措施？","options":["全面禁止电动滑板车","在特定区域设置限速和强制头盔规定","取消所有交通规则","只允许游客使用滑板车"],"correctIndex":1}'::jsonb),
('r-mcq-7', 'reading-mcq-single', '{"passage":"Contrary to the assumption that multitasking boosts productivity, cognitive research indicates that switching rapidly between tasks incurs a measurable \"switching cost\" in time and accuracy, meaning that people who focus on one task at a time often complete more overall in a given period.","question":"认知研究发现了什么？","options":["多任务处理总是更高效","任务切换会产生时间和准确率上的代价","人类大脑无法处理任何切换","专注单一任务反而更慢"],"correctIndex":1}'::jsonb),
('r-mcq-8', 'reading-mcq-single', '{"passage":"A growing number of universities are offering micro-credentials — short, focused courses that certify a specific skill — as a complement to traditional degrees. Employers surveyed were divided: some valued the up-to-date, targeted skills these credentials signal, while others still weighted a full degree more heavily when making hiring decisions.","question":"雇主对\"微证书\"的态度如何？","options":["一致认为毫无价值","意见不一，有人看重其针对性技能，有人仍更看重完整学位","一致认为比学位更重要","完全没有被调查到"],"correctIndex":1}'::jsonb),

('r-reorder-1', 'reading-reorder', '{"paragraphs":["As a result, several museums have begun offering audio tours narrated entirely by artificial intelligence, tailored to a visitor''s stated interests.","Museums have traditionally relied on printed guides and human docents to help visitors interpret exhibits.","However, staffing a docent for every gallery is costly, and printed guides cannot adapt to an individual visitor''s pace or curiosity.","Early feedback suggests that while visitors appreciate the personalization, many still miss the spontaneous storytelling that a human guide can provide."],"correctOrder":[1,2,0,3]}'::jsonb),
('r-reorder-2', 'reading-reorder', '{"paragraphs":["This has led some manufacturers to design packaging that dissolves harmlessly in water within weeks.","Traditional plastic packaging can take hundreds of years to break down in landfills or oceans.","Consumer demand for sustainable alternatives has grown sharply over the past five years.","Even so, dissolvable packaging currently costs more to produce, limiting its use to premium products for now."],"correctOrder":[1,2,0,3]}'::jsonb),
('r-reorder-3', 'reading-reorder', '{"paragraphs":["Consequently, several airlines now offer optional short workshops on breathing techniques before long-haul flights.","Fear of flying affects a significant minority of air travelers, ranging from mild unease to a full clinical phobia.","Many affected passengers say the fear is less about the flight itself and more about a loss of control.","Early trial results suggest the workshops modestly reduce self-reported anxiety, though more rigorous study is needed."],"correctOrder":[1,2,0,3]}'::jsonb),
('r-reorder-4', 'reading-reorder', '{"paragraphs":["One proposed solution is to require new buildings to include reflective roofing materials.","Cities are, on average, several degrees warmer than surrounding rural areas, a phenomenon known as the urban heat island effect.","Dark asphalt and concrete surfaces absorb and radiate heat, while a lack of vegetation reduces natural cooling.","Studies of pilot neighborhoods that adopted reflective roofing report a small but measurable drop in peak summer temperatures."],"correctOrder":[1,2,0,3]}'::jsonb),
('r-reorder-5', 'reading-reorder', '{"paragraphs":["In response, several employers began experimenting with a four-day work week at full pay.","Many companies report that overall employee burnout increased noticeably following the shift to widespread remote work.","Surveys attributed part of this burnout to the blurring of boundaries between work and personal time.","Early adopters of the shorter week report mixed but generally positive effects on both productivity and reported wellbeing."],"correctOrder":[1,2,0,3]}'::jsonb),

('r-fillblank-1', 'reading-fill-blanks-drag', '{"textSegments":["Coral reefs are often described as the "," of the sea because they support an extraordinarily "," range of marine life. Rising ocean temperatures, however, are causing coral "," events to occur more frequently than in the past."],"blankCount":3,"wordBank":["rainforests","diverse","bleaching","shallow","declining"],"correctAnswers":["rainforests","diverse","bleaching"]}'::jsonb),
('r-fillblank-2', 'reading-fill-blanks-drag', '{"textSegments":["Sleep researchers now believe that memory "," occurs largely during deep sleep, when the brain replays and strengthens "," formed earlier in the day. Chronic sleep "," has therefore been linked to measurable declines in learning ability."],"blankCount":3,"wordBank":["consolidation","connections","deprivation","expansion","daylight"],"correctAnswers":["consolidation","connections","deprivation"]}'::jsonb),
('r-fillblank-3', 'reading-fill-blanks-drag', '{"textSegments":["Microplastics, tiny fragments smaller than five millimetres, have been found in "," locations from mountain snow to deep-sea sediment. Scientists are still working to understand the long-term "," effects of "," exposure on marine organisms."],"blankCount":3,"wordBank":["remote","health","chronic","nearby","seasonal"],"correctAnswers":["remote","health","chronic"]}'::jsonb),
('r-fillblank-4', 'reading-fill-blanks-drag', '{"textSegments":["Behavioral economists argue that people are not purely "," decision-makers; instead, small changes in how a choice is "," can significantly shift what people choose, an effect known as the "," effect."],"blankCount":3,"wordBank":["rational","framed","framing","emotional","random"],"correctAnswers":["rational","framed","framing"]}'::jsonb),
('r-fillblank-5', 'reading-fill-blanks-drag', '{"textSegments":["Glacial retreat has accelerated in many mountain ranges, threatening the "," supply of water for downstream communities that depend on "," meltwater during the dry ","."],"blankCount":3,"wordBank":["seasonal","reliable","season","unstable","annual"],"correctAnswers":["reliable","seasonal","season"]}'::jsonb),

('l-fillblank-1', 'listening-fill-blanks-typed', '{"transcript":"Good morning everyone. Today''s lecture will focus on how migratory birds navigate across continents using a combination of the sun, the stars, and the Earth''s magnetic field. Researchers believe this ability is partly inherited and partly learned during the bird''s first migration.","textSegments":["Today''s lecture will focus on how migratory birds navigate across continents using a combination of the sun, the stars, and the Earth''s "," field. Researchers believe this ability is partly inherited and partly learned during the bird''s first ","."],"correctAnswers":["magnetic","migration"]}'::jsonb),
('l-fillblank-2', 'listening-fill-blanks-typed', '{"transcript":"This morning I want to explain why compound interest is often called the eighth wonder of the financial world. Even a modest rate of return, left untouched for several decades, can grow into a surprisingly large sum through the power of compounding.","textSegments":["This morning I want to explain why compound interest is often called the eighth "," of the financial world. Even a modest rate of return, left "," for several decades, can grow into a surprisingly large sum through the power of compounding."],"correctAnswers":["wonder","untouched"]}'::jsonb),
('l-fillblank-3', 'listening-fill-blanks-typed', '{"transcript":"One of the most surprising findings in soil science is how much biodiversity exists underground. A single teaspoon of healthy soil can contain billions of microorganisms, many of which remain completely unclassified by researchers.","textSegments":["One of the most surprising findings in soil science is how much "," exists underground. A single teaspoon of healthy soil can contain billions of microorganisms, many of which remain completely "," by researchers."],"correctAnswers":["biodiversity","unclassified"]}'::jsonb),
('l-fillblank-4', 'listening-fill-blanks-typed', '{"transcript":"Let''s turn now to the history of the printing press. Before movable type, every manuscript had to be copied by hand, a process so slow that books remained a luxury reserved almost exclusively for the wealthy and the clergy.","textSegments":["Before movable type, every manuscript had to be copied by hand, a process so slow that books remained a "," reserved almost exclusively for the wealthy and the ","."],"correctAnswers":["luxury","clergy"]}'::jsonb),
('l-fillblank-5', 'listening-fill-blanks-typed', '{"transcript":"Today we''ll discuss why coral bleaching happens. When water temperatures rise even slightly above normal, corals expel the colorful algae living in their tissues, leaving behind a stark white skeleton that is far more vulnerable to disease.","textSegments":["When water temperatures rise even slightly above normal, corals "," the colorful algae living in their tissues, leaving behind a stark white skeleton that is far more "," to disease."],"correctAnswers":["expel","vulnerable"]}'::jsonb),

('l-summary-1', 'listening-highlight-summary', '{"transcript":"A growing number of city governments are converting unused parking lots into small public parks. Supporters say this improves air quality and gives residents in dense neighborhoods more green space, while some local business owners worry about losing customer parking during the transition.","question":"以下哪一项最准确地概括了这段录音的内容？","options":["城市政府正在把闲置停车场改造为小型公园，此举获得部分居民支持但也引发商家对停车位减少的担忧","所有商家都强烈反对任何形式的城市绿化项目","停车场改造项目已经被政府完全取消","这段录音主要讨论如何提高停车场的使用费"],"correctIndex":0}'::jsonb),
('l-summary-2', 'listening-highlight-summary', '{"transcript":"Researchers studying octopus behavior have found that these animals appear to dream, based on changes in skin color and texture observed during certain sleep phases, though scientists caution that this does not prove octopuses experience dreams the way humans do.","question":"以下哪一项最准确地概括了这段录音的内容？","options":["章鱼在睡眠中出现的皮肤变化提示可能存在类似做梦的状态，但科学家对此持谨慎态度","科学家已经证实章鱼会做和人类完全相同的梦","章鱼在睡眠中完全不会改变皮肤颜色","这项研究与章鱼的睡眠毫无关系"],"correctIndex":0}'::jsonb),
('l-summary-3', 'listening-highlight-summary', '{"transcript":"A new study tracking commuting patterns found that cyclists in cities with dedicated bike lanes reported significantly higher satisfaction and lower stress than those riding on shared roads, prompting several city councils to expand their cycling infrastructure budgets.","question":"以下哪一项最准确地概括了这段录音的内容？","options":["专用自行车道能提升骑行者的满意度并降低压力，推动多个城市增加相关预算","骑自行车通勤会显著增加骑行者的压力","研究发现城市根本不需要自行车道","这项研究主要关于机动车驾驶员的满意度"],"correctIndex":0}'::jsonb),
('l-summary-4', 'listening-highlight-summary', '{"transcript":"Historians have long debated the exact causes of the decline of a major ancient trading city, but recent tree-ring and sediment analysis now points to a multi-decade drought as a major contributing factor, alongside existing political instability.","question":"以下哪一项最准确地概括了这段录音的内容？","options":["新的年轮和沉积物分析显示，长期干旱与政治动荡共同导致了这座古代贸易城市的衰落","历史学家已经完全排除了气候因素","这座城市的衰落唯一原因是战争","录音主要讨论如何重建这座古城"],"correctIndex":0}'::jsonb),
('l-summary-5', 'listening-highlight-summary', '{"transcript":"While many assume that multitasking helps people get more done, a series of laboratory experiments found that participants who focused on one task at a time consistently completed more work with fewer errors than those who switched between several tasks.","question":"以下哪一项最准确地概括了这段录音的内容？","options":["实验发现专注单一任务的人比多任务处理者完成更多工作且错误更少","多任务处理被证实总是效率更高","这段录音与工作效率无关","实验结果因样本过少而完全无法使用"],"correctIndex":0}'::jsonb),

('s-ra-1', 'speaking-read-aloud', '{"text":"Renewable energy sources such as solar and wind power now account for a growing share of global electricity generation, driven largely by falling technology costs and supportive government policy."}'::jsonb),
('s-ra-2', 'speaking-read-aloud', '{"text":"Public libraries have evolved well beyond lending books, now offering free internet access, community workshops, and quiet study spaces that serve people of every age."}'::jsonb),
('s-ra-3', 'speaking-read-aloud', '{"text":"Archaeologists recently uncovered a series of well-preserved tools that suggest early humans in the region were capable of far more complex craftsmanship than previously believed."}'::jsonb),
('s-ra-4', 'speaking-read-aloud', '{"text":"Despite widespread automation in manufacturing, many companies report that skilled technicians remain in short supply, particularly those able to maintain and repair increasingly complex robotic equipment."}'::jsonb),
('s-ra-5', 'speaking-read-aloud', '{"text":"Coastal cities around the world are investing in flood barriers and improved drainage systems as rising sea levels make extreme weather events more costly and more frequent."}'::jsonb),
('s-ra-6', 'speaking-read-aloud', '{"text":"A balanced diet, regular physical activity, and sufficient sleep remain the three factors most consistently linked to long-term health across large-scale population studies."}'::jsonb),

('w-swt-1', 'writing-summarize-text', '{"prompt":"请用一个句子（不超过 75 词）概括下面这段文字的主旨。","sourceText":"Telemedicine usage surged during the pandemic and has remained far above pre-pandemic levels even as in-person visits resumed. Patients cite convenience and reduced travel time as the main benefits, while doctors note that certain conditions still require a physical examination. Health insurers are now debating whether to permanently reimburse virtual visits at the same rate as in-person ones, a decision that could shape the future of primary care.","minWords":5,"maxWords":75}'::jsonb),
('w-swt-2', 'writing-summarize-text', '{"prompt":"请用一个句子（不超过 75 词）概括下面这段文字的主旨。","sourceText":"As cities grow denser, urban planners are increasingly turning to \"15-minute neighborhoods,\" where residents can reach work, schools, shops, and healthcare within a short walk or bike ride. Proponents argue this reduces car dependency and strengthens local community ties, while skeptics note that retrofitting existing suburbs to meet this standard would require enormous investment and time.","minWords":5,"maxWords":75}'::jsonb),
('w-swt-3', 'writing-summarize-text', '{"prompt":"请用一个句子（不超过 75 词）概括下面这段文字的主旨。","sourceText":"A long-term study following thousands of adults found that those who maintained close friendships into old age reported significantly higher life satisfaction than those who did not, even after accounting for differences in income and physical health. The researchers suggest that social connection may be as important to wellbeing as more commonly cited factors like diet and exercise.","minWords":5,"maxWords":75}'::jsonb),
('w-swt-4', 'writing-summarize-text', '{"prompt":"请用一个句子（不超过 75 词）概括下面这段文字的主旨。","sourceText":"Battery technology has struggled to keep pace with the rapid growth of electric vehicles, prompting several governments to fund research into alternative chemistries such as solid-state batteries. These promise faster charging and longer range, but manufacturers caution that mass production at a competitive cost is still likely several years away.","minWords":5,"maxWords":75}'::jsonb),
('w-swt-5', 'writing-summarize-text', '{"prompt":"请用一个句子（不超过 75 词）概括下面这段文字的主旨。","sourceText":"Language learning apps have made studying a second language more accessible than ever, but linguists point out that app-based practice alone rarely produces true fluency. Real conversational competence, they argue, still depends heavily on sustained interaction with native speakers, something most apps only partially simulate.","minWords":5,"maxWords":75}'::jsonb),

('w-essay-1', 'writing-essay', '{"prompt":"Some people believe that university education should be free for all students, while others think students should pay for at least part of their tuition. Discuss both views and give your own opinion.","minWords":200,"maxWords":300}'::jsonb),
('w-essay-2', 'writing-essay', '{"prompt":"Some argue that remote work has permanently changed how companies should be organized, while others believe most employees will eventually return to full-time office work. Discuss both views and give your own opinion.","minWords":200,"maxWords":300}'::jsonb),
('w-essay-3', 'writing-essay', '{"prompt":"Many governments are investing heavily in artificial intelligence research. Some see this as essential for future economic growth, while others worry about job losses and loss of human oversight. Discuss both views and give your own opinion.","minWords":200,"maxWords":300}'::jsonb),
('w-essay-4', 'writing-essay', '{"prompt":"Some people think social media has made society more connected, while others believe it has made people more isolated and anxious. Discuss both views and give your own opinion.","minWords":200,"maxWords":300}'::jsonb),
('w-essay-5', 'writing-essay', '{"prompt":"Some believe that standardized testing is the fairest way to evaluate students, while others argue it fails to capture a student''s true abilities. Discuss both views and give your own opinion.","minWords":200,"maxWords":300}'::jsonb)
ON CONFLICT (id) DO NOTHING;
