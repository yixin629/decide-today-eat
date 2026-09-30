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

-- ---------------------------------------------------------------------------
-- 追加迁移：新增 12 种官方 PTE Academic 题型（2026-09-24）。
--
-- 影响范围：仅扩大 task_type 的 CHECK 约束取值范围（原 8 种 -> 现 20 种），
-- 新增对应种子数据。不修改、不删除任何已有行。
--
-- 为什么不能直接改 CREATE TABLE 语句：本文件顶部的 CREATE TABLE ... IF NOT
-- EXISTS 只在表不存在时执行一次；如果这台数据库已经执行过旧版本的本文件
-- （表已存在，约束还是旧的 8 种），单纯修改上面 CREATE TABLE 里的 CHECK 列表
-- 不会对已存在的表产生任何效果，旧约束会继续拒绝新题型的 INSERT。因此这里
-- 用 DROP CONSTRAINT IF EXISTS + ADD CONSTRAINT 显式重建约束，对全新数据库
-- 和已执行过旧版本的数据库都是幂等、安全的：全新数据库会先建出仅含旧 8 种
-- 的约束，再被这里立即替换为含 20 种的约束；已存在的数据库会直接把约束从
-- 旧版本替换为新版本，不影响已有数据行（新增题型的取值范围只会变宽，不会
-- 让任何已有行变得不合法）。
--
-- 对已经执行过本文件旧版本的数据库：只需重新执行整个文件（CREATE TABLE /
-- INDEX / 策略 / 旧种子数据均为 IF NOT EXISTS 或 ON CONFLICT DO NOTHING，
-- 重复执行是安全的），即可解锁下方 12 种新题型并写入其种子数据。

ALTER TABLE pte_practice_items DROP CONSTRAINT IF EXISTS pte_practice_items_task_type_check;

ALTER TABLE pte_practice_items ADD CONSTRAINT pte_practice_items_task_type_check CHECK (task_type IN (
  'reading-mcq-single',
  'reading-mcq-multiple',
  'reading-reorder',
  'reading-fill-blanks-drag',
  'reading-fill-blanks-dropdown',
  'listening-fill-blanks-typed',
  'listening-highlight-summary',
  'listening-mcq-single',
  'listening-mcq-multiple',
  'listening-summarize-spoken-text',
  'listening-select-missing-word',
  'listening-highlight-incorrect-words',
  'listening-write-from-dictation',
  'speaking-read-aloud',
  'speaking-repeat-sentence',
  'speaking-describe-image',
  'speaking-retell-lecture',
  'speaking-answer-short-question',
  'writing-summarize-text',
  'writing-essay'
));

-- 种子数据：与 app/pte-practice/lib/questionBank.ts 中新增的原创示例题一一对应。

INSERT INTO pte_practice_items (id, task_type, payload) VALUES
('r-mcqm-1', 'reading-mcq-multiple', '{"passage":"City councils weighing whether to install more public drinking fountains cite several benefits: reduced plastic bottle waste, free access to water for low-income residents, and lower rates of dehydration-related emergency visits during heat waves. Some councils also note that fountains require ongoing maintenance and water-quality testing, which strains already limited budgets.","question":"根据文章，支持增设饮水台的理由有哪些？（选出所有正确答案）","options":["减少塑料瓶垃圾","为低收入居民提供免费饮水","降低热浪期间脱水就诊率","完全不需要维护成本"],"correctIndexes":[0,1,2]}'::jsonb),
('r-mcqm-2', 'reading-mcq-multiple', '{"passage":"Proponents of a four-day work week argue it can reduce burnout, lower commuting-related emissions, and, in several pilot studies, maintain or even improve productivity. Skeptics counter that it may not suit every industry, particularly those requiring round-the-clock coverage such as healthcare.","question":"根据文章，支持四天工作制的理由有哪些？（选出所有正确答案）","options":["降低职业倦怠","减少通勤相关排放","在部分试点中维持或提升生产力","适用于所有行业，没有例外"],"correctIndexes":[0,1,2]}'::jsonb),
('r-mcqm-3', 'reading-mcq-multiple', '{"passage":"Advocates for community gardens point to improved access to fresh produce, opportunities for neighbors to interact, and modest reductions in local food-transport emissions. Critics note that gardens can fail without a committed group of volunteers to maintain them long-term.","question":"根据文章，社区花园的好处包括哪些？（选出所有正确答案）","options":["改善新鲜农产品的获取","为邻里提供交流机会","略微降低本地食物运输排放","完全不需要志愿者维护"],"correctIndexes":[0,1,2]}'::jsonb),
('r-mcqm-4', 'reading-mcq-multiple', '{"passage":"Digital note-taking apps offer searchable text, easy sharing, and automatic backup, which many students find convenient. Handwriting researchers, however, note that writing by hand has been linked to better recall of material in several studies, likely due to the slower, more deliberate encoding process it requires.","question":"根据文章，数字笔记应用的优势包括哪些？（选出所有正确答案）","options":["可搜索的文本","便于分享","自动备份","已被证明比手写记忆效果更好"],"correctIndexes":[0,1,2]}'::jsonb),
('r-mcqm-5', 'reading-mcq-multiple', '{"passage":"Supporters of congestion pricing in city centers argue it reduces traffic jams, cuts air pollution, and can fund public transit improvements with the revenue collected. Opponents worry it disproportionately affects lower-income drivers who cannot easily switch to other forms of transport.","question":"根据文章，支持拥堵收费的理由有哪些？（选出所有正确答案）","options":["减少交通拥堵","降低空气污染","收入可用于改善公共交通","对所有收入群体的影响完全相同"],"correctIndexes":[0,1,2]}'::jsonb),

('r-dropdown-1', 'reading-fill-blanks-dropdown', '{"textSegments":["The discovery of antibiotics "," modern medicine, dramatically reducing deaths from infections that were once "," fatal, though overuse has since led to growing concerns about drug ","."],"blankOptions":[["transformed","ignored","delayed"],["routinely","rarely","accidentally"],["resistance","shortage","discovery"]],"correctAnswers":["transformed","routinely","resistance"]}'::jsonb),
('r-dropdown-2', 'reading-fill-blanks-dropdown', '{"textSegments":["Satellite imagery allows scientists to "," deforestation in near real time, helping "," agencies respond "," to illegal logging."],"blankOptions":[["monitor","ignore","cause"],["environmental","financial","unrelated"],["quickly","slowly","never"]],"correctAnswers":["monitor","environmental","quickly"]}'::jsonb),
('r-dropdown-3', 'reading-fill-blanks-dropdown', '{"textSegments":["Many economists argue that investing in early childhood education produces one of the highest "," on investment of any public policy, since the benefits "," over a person''s entire working ","."],"blankOptions":[["returns","losses","delays"],["compound","disappear","reverse"],["lifetime","weekend","holiday"]],"correctAnswers":["returns","compound","lifetime"]}'::jsonb),
('r-dropdown-4', 'reading-fill-blanks-dropdown', '{"textSegments":["Noise pollution in cities has been "," to elevated stress hormones and disrupted sleep, prompting some municipalities to "," stricter limits on construction ","."],"blankOptions":[["linked","unrelated","opposed"],["introduce","abandon","ignore"],["noise","colors","traffic lights"]],"correctAnswers":["linked","introduce","noise"]}'::jsonb),
('r-dropdown-5', 'reading-fill-blanks-dropdown', '{"textSegments":["Because coral polyps are extremely "," to temperature change, even a rise of one or two degrees can trigger a "," event that leaves reefs "," to disease."],"blankOptions":[["sensitive","immune","indifferent"],["bleaching","cooling","celebration"],["vulnerable","immune","unrelated"]],"correctAnswers":["sensitive","bleaching","vulnerable"]}'::jsonb),

('l-mcqs-1', 'listening-mcq-single', '{"transcript":"Today I want to talk about why honey never spoils. Its low moisture content and naturally acidic pH create an environment where bacteria simply cannot survive, which is why archaeologists have found edible honey in tombs thousands of years old.","question":"根据讲座，蜂蜜为什么不会变质？","options":["因为它含糖量低","因为其低水分含量和酸性环境使细菌无法存活","因为它总是被密封保存","因为蜜蜂会添加防腐剂"],"correctIndex":1}'::jsonb),
('l-mcqs-2', 'listening-mcq-single', '{"transcript":"Let''s discuss why the sky appears blue during the day. Sunlight contains all colors, but shorter blue wavelengths are scattered far more by the gases in our atmosphere than longer wavelengths like red, so blue light reaches our eyes from all directions.","question":"根据讲座，天空为什么呈现蓝色？","options":["因为大气中含有蓝色气体","因为蓝光波长较短，更容易被大气散射","因为太阳只发出蓝光","因为人眼只能看到蓝光"],"correctIndex":1}'::jsonb),
('l-mcqs-3', 'listening-mcq-single', '{"transcript":"This morning''s topic is why we yawn when we see someone else yawn. One leading theory suggests contagious yawning is linked to empathy, since studies show it occurs more frequently between people who are emotionally close.","question":"根据讲座，\"传染性打哈欠\"与什么因素有关？","options":["房间的温度","同理心，在情感亲近的人之间更常见","打哈欠的人的年龄","当天的时间"],"correctIndex":1}'::jsonb),
('l-mcqs-4', 'listening-mcq-single', '{"transcript":"Now, why do onions make us cry? When you cut an onion, it releases a volatile compound that reacts with the moisture in your eyes to form a mild sulfuric acid, triggering your tear glands as a protective response.","question":"根据讲座，切洋葱为什么会让人流泪？","options":["洋葱释放的气体与眼睛水分反应生成刺激性物质","洋葱含有辣椒素","这只是一种心理暗示效应","洋葱的气味太浓烈"],"correctIndex":0}'::jsonb),
('l-mcqs-5', 'listening-mcq-single', '{"transcript":"Let''s look at why bamboo grows so fast. Unlike trees, bamboo doesn''t need to build new cells to grow taller each day; the segments of the stem are all fully formed at the base and simply extend rapidly by expanding cells that are already there.","question":"根据讲座，竹子生长快的原因是什么？","options":["它不断长出新细胞","茎的分段已在基部形成，通过已有细胞的扩张快速伸长","它几乎不需要阳光","它的根系特别浅"],"correctIndex":1}'::jsonb),

('l-mcqm-1', 'listening-mcq-multiple', '{"transcript":"Researchers studying urban trees found several benefits beyond aesthetics: they lower summer street temperatures by providing shade, reduce stormwater runoff by absorbing rainfall, and can modestly reduce noise from nearby traffic.","question":"根据讲座，城市树木带来的好处有哪些？（选出所有正确答案）","options":["降低夏季街道气温","减少雨水径流","降低交通噪音","完全消除空气污染"],"correctIndexes":[0,1,2]}'::jsonb),
('l-mcqm-2', 'listening-mcq-multiple', '{"transcript":"A study on workplace lighting found that employees exposed to more natural daylight reported better sleep quality, fewer headaches, and slightly higher self-reported productivity compared with those working under fluorescent lighting alone.","question":"根据讲座，接触更多自然光的员工报告了哪些变化？（选出所有正确答案）","options":["睡眠质量更好","头痛更少","自评生产力略高","视力显著改善"],"correctIndexes":[0,1,2]}'::jsonb),
('l-mcqm-3', 'listening-mcq-multiple', '{"transcript":"Marine biologists tracking whale migration have found that the animals rely on a combination of ocean currents, water temperature gradients, and possibly the Earth''s magnetic field to navigate thousands of kilometers each year.","question":"根据讲座，鲸鱼迁徙可能依赖哪些导航方式？（选出所有正确答案）","options":["洋流","水温梯度","地球磁场","船只发出的声音"],"correctIndexes":[0,1,2]}'::jsonb),
('l-mcqm-4', 'listening-mcq-multiple', '{"transcript":"A survey of remote workers identified the top challenges as difficulty separating work from personal life, feelings of isolation from colleagues, and, for some, a lack of suitable home office equipment.","question":"根据讲座，远程办公者面临的挑战有哪些？（选出所有正确答案）","options":["工作与生活边界模糊","与同事的孤立感","缺乏合适的居家办公设备","通勤时间过长"],"correctIndexes":[0,1,2]}'::jsonb),
('l-mcqm-5', 'listening-mcq-multiple', '{"transcript":"Nutrition researchers note that fermented foods can support gut health by introducing beneficial bacteria, may improve the digestibility of certain nutrients, and in some studies have been linked to modest improvements in mood.","question":"根据讲座，发酵食品可能带来哪些益处？（选出所有正确答案）","options":["引入有益菌群","提高部分营养素的可消化性","与情绪的适度改善有关","完全替代所有药物治疗"],"correctIndexes":[0,1,2]}'::jsonb),

('l-sst-1', 'listening-summarize-spoken-text', '{"transcript":"Today''s lecture examines the rise of urban vertical gardens, which use exterior building walls to grow plants. Proponents highlight improved insulation, reduced urban heat, and added greenery in space-constrained cities. Engineers caution that structural load and irrigation systems must be carefully designed, since a poorly maintained vertical garden can damage the building''s facade over time.","minWords":50,"maxWords":70}'::jsonb),
('l-sst-2', 'listening-summarize-spoken-text', '{"transcript":"This lecture looks at why some companies are shifting to a four-day work week. Early trials report steady or improved output alongside better employee wellbeing, though the approach appears to suit knowledge-based roles more easily than shift-based industries like manufacturing or healthcare, where continuous coverage is essential.","minWords":50,"maxWords":70}'::jsonb),
('l-sst-3', 'listening-summarize-spoken-text', '{"transcript":"We''ll discuss the growing use of drones in agriculture. Farmers use them to monitor crop health, apply fertilizer with precision, and detect irrigation problems earlier than ground inspection allows. The main barriers to wider adoption remain the upfront cost of the equipment and the training required to operate it effectively.","minWords":50,"maxWords":70}'::jsonb),
('l-sst-4', 'listening-summarize-spoken-text', '{"transcript":"Today''s topic is the debate over standardized testing in schools. Supporters argue it provides an objective, comparable measure of student achievement across different schools and regions. Critics counter that it narrows curricula toward test preparation and may fail to capture creativity, critical thinking, or other harder-to-measure skills.","minWords":50,"maxWords":70}'::jsonb),
('l-sst-5', 'listening-summarize-spoken-text', '{"transcript":"This lecture covers recent efforts to restore wetlands that were drained decades ago for agriculture. Restored wetlands have been shown to filter pollutants from water, provide habitat for migratory birds, and reduce flood risk downstream, though restoration projects can take many years to reach full ecological function.","minWords":50,"maxWords":70}'::jsonb),

('l-missing-1', 'listening-select-missing-word', '{"fullTranscript":"After weeks of drought, the farmers were relieved when the forecast finally predicted heavy rain.","displayedTranscript":"After weeks of drought, the farmers were relieved when the forecast finally predicted ____.","options":["heavy rain","a sunny week","strong winds","a full moon"],"correctIndex":0}'::jsonb),
('l-missing-2', 'listening-select-missing-word', '{"fullTranscript":"Despite the rising cost of raw materials, the company managed to keep its prices stable.","displayedTranscript":"Despite the rising cost of raw materials, the company managed to keep its prices ____.","options":["stable","doubled","confidential","irrelevant"],"correctIndex":0}'::jsonb),
('l-missing-3', 'listening-select-missing-word', '{"fullTranscript":"The museum''s new wing was designed specifically to house the growing photography collection.","displayedTranscript":"The museum''s new wing was designed specifically to house the growing photography ____.","options":["collection","cafeteria","parking lot","staff"],"correctIndex":0}'::jsonb),
('l-missing-4', 'listening-select-missing-word', '{"fullTranscript":"Because the bridge was closed for repairs, commuters had to find an alternative route.","displayedTranscript":"Because the bridge was closed for repairs, commuters had to find an alternative ____.","options":["route","hobby","language","salary"],"correctIndex":0}'::jsonb),
('l-missing-5', 'listening-select-missing-word', '{"fullTranscript":"The research team published their findings only after the results had been independently verified.","displayedTranscript":"The research team published their findings only after the results had been independently ____.","options":["verified","forgotten","sold","translated"],"correctIndex":0}'::jsonb),

('l-highlight-1', 'listening-highlight-incorrect-words', '{"audioTranscript":"The library will extend its opening hours during the final week of exams to support students.","displayedWords":["The","library","will","reduce","its","closing","hours","during","the","final","week","of","exams","to","support","students."],"incorrectWordIndexes":[3,5]}'::jsonb),
('l-highlight-2', 'listening-highlight-incorrect-words', '{"audioTranscript":"Scientists discovered that the ancient river had shifted its course several times over the centuries.","displayedWords":["Scientists","discovered","that","the","modern","river","had","shifted","its","course","several","times","over","the","decades."],"incorrectWordIndexes":[4,14]}'::jsonb),
('l-highlight-3', 'listening-highlight-incorrect-words', '{"audioTranscript":"The company announced that it would open two new factories next spring to meet rising demand.","displayedWords":["The","company","announced","that","it","would","close","two","old","factories","next","spring","to","meet","rising","demand."],"incorrectWordIndexes":[6,8]}'::jsonb),
('l-highlight-4', 'listening-highlight-incorrect-words', '{"audioTranscript":"Volunteers spent the weekend planting trees along the riverbank to prevent soil erosion.","displayedWords":["Volunteers","spent","the","morning","planting","flowers","along","the","riverbank","to","prevent","soil","erosion."],"incorrectWordIndexes":[3,5]}'::jsonb),
('l-highlight-5', 'listening-highlight-incorrect-words', '{"audioTranscript":"The airline confirmed that all delayed flights would resume service by early evening.","displayedWords":["The","airline","confirmed","that","all","cancelled","flights","would","resume","service","by","late","evening."],"incorrectWordIndexes":[5,11]}'::jsonb),

('l-dictation-1', 'listening-write-from-dictation', '{"sentence":"The committee will review the proposal next week."}'::jsonb),
('l-dictation-2', 'listening-write-from-dictation', '{"sentence":"Heavy traffic delayed the morning delivery by an hour."}'::jsonb),
('l-dictation-3', 'listening-write-from-dictation', '{"sentence":"Researchers published their findings in a leading journal."}'::jsonb),
('l-dictation-4', 'listening-write-from-dictation', '{"sentence":"The museum extended its hours for the summer exhibition."}'::jsonb),
('l-dictation-5', 'listening-write-from-dictation', '{"sentence":"Local farmers reported a stronger harvest than last year."}'::jsonb),
('l-dictation-6', 'listening-write-from-dictation', '{"sentence":"The airport announced new security measures starting Monday."}'::jsonb),

('s-rs-1', 'speaking-repeat-sentence', '{"text":"The lecture has been rescheduled to next Tuesday afternoon."}'::jsonb),
('s-rs-2', 'speaking-repeat-sentence', '{"text":"Please remember to submit your assignment before the deadline."}'::jsonb),
('s-rs-3', 'speaking-repeat-sentence', '{"text":"The library closes early on public holidays."}'::jsonb),
('s-rs-4', 'speaking-repeat-sentence', '{"text":"Researchers are studying how climate change affects coastal cities."}'::jsonb),
('s-rs-5', 'speaking-repeat-sentence', '{"text":"The new policy will take effect at the beginning of next month."}'::jsonb),
('s-rs-6', 'speaking-repeat-sentence', '{"text":"Most students found the workshop both practical and engaging."}'::jsonb),

('s-di-1', 'speaking-describe-image', '{"chart":{"type":"bar","title":"某城市各交通方式通勤占比","categories":["步行","自行车","公交","私家车"],"values":[15,20,35,30],"unit":"%"},"referenceDescription":"The bar chart shows commuting methods in a city. Bus is the most common at 35 percent, followed by car at 30 percent, bicycle at 20 percent, and walking at 15 percent.","prepSeconds":25}'::jsonb),
('s-di-2', 'speaking-describe-image', '{"chart":{"type":"line","title":"某产品五年销量趋势（万件）","categories":["2021","2022","2023","2024","2025"],"values":[12,18,22,30,45]},"referenceDescription":"The line chart shows steady growth in product sales from 12 units in 2021 to 45 units in 2025, with the sharpest increase occurring between 2024 and 2025.","prepSeconds":25}'::jsonb),
('s-di-3', 'speaking-describe-image', '{"chart":{"type":"bar","title":"大学生课外活动时间分配（小时/周）","categories":["运动","社团","兼职","娱乐"],"values":[4,3,6,8],"unit":"小时"},"referenceDescription":"The bar chart shows university students spend the most time on entertainment at 8 hours per week, followed by part-time work at 6 hours, sports at 4 hours, and clubs at 3 hours.","prepSeconds":25}'::jsonb),
('s-di-4', 'speaking-describe-image', '{"chart":{"type":"line","title":"某地区年平均气温变化（摄氏度）","categories":["2000","2010","2020","2024"],"values":[14,14.5,15.3,16]},"referenceDescription":"The line chart shows a gradual rise in average annual temperature from 14 degrees in 2000 to 16 degrees in 2024, indicating a consistent warming trend.","prepSeconds":25}'::jsonb),

('s-retell-1', 'speaking-retell-lecture', '{"transcript":"Today I want to talk about the history of the compass. Long before it was used for navigation, ancient Chinese scholars used lodestone to build divination boards. It wasn''t until sailors realized the stone always pointed toward magnetic north that the compass became an essential tool for long ocean voyages, eventually enabling the age of global exploration.","prepSeconds":10}'::jsonb),
('s-retell-2', 'speaking-retell-lecture', '{"transcript":"Let''s discuss why some trees drop their leaves in autumn. As daylight hours shorten and temperatures fall, deciduous trees stop producing chlorophyll, revealing the yellow and orange pigments that were there all along. Eventually the trees seal off the connection to each leaf, allowing them to fall and conserving the tree''s energy for winter.","prepSeconds":10}'::jsonb),
('s-retell-3', 'speaking-retell-lecture', '{"transcript":"This lecture covers the invention of refrigeration. Before mechanical refrigeration, people relied on ice harvested from frozen lakes and stored in insulated ice houses through summer. The development of compressor-based refrigeration in the late nineteenth century transformed food storage, allowing fresh produce and meat to be shipped much further than before.","prepSeconds":10}'::jsonb),
('s-retell-4', 'speaking-retell-lecture', '{"transcript":"Today''s topic is the domestication of rice. Archaeological evidence suggests rice was first cultivated in the Yangtze River basin thousands of years ago. Over generations, farmers selectively grew plants with larger seeds and less tendency to shatter, eventually producing the rice varieties that became a staple food across much of Asia.","prepSeconds":10}'::jsonb),

('s-asq-1', 'speaking-answer-short-question', '{"question":"What do we call a doctor who treats animals?","acceptableAnswers":["a vet","vet","veterinarian","a veterinarian"]}'::jsonb),
('s-asq-2', 'speaking-answer-short-question', '{"question":"What is the opposite of \"hot\"?","acceptableAnswers":["cold"]}'::jsonb),
('s-asq-3', 'speaking-answer-short-question', '{"question":"How many days are there in a week?","acceptableAnswers":["seven","7","seven days"]}'::jsonb),
('s-asq-4', 'speaking-answer-short-question', '{"question":"What do you call a place where books are borrowed?","acceptableAnswers":["a library","library"]}'::jsonb),
('s-asq-5', 'speaking-answer-short-question', '{"question":"What season comes after winter?","acceptableAnswers":["spring"]}'::jsonb),
('s-asq-6', 'speaking-answer-short-question', '{"question":"What instrument is used to measure temperature?","acceptableAnswers":["a thermometer","thermometer"]}'::jsonb)
ON CONFLICT (id) DO NOTHING;
