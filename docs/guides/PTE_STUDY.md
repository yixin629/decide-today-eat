# PTE 备考与练习指南

网站有两个 PTE 相关页面：`/pte-plan`（备考计划）和 `/pte-practice`（练习平台），数据都按 `zyx` / `zly` 前端身份分开保存。

所有题目均为原创练习素材，不是 Pearson 官方真题；页面上的分数只是练习估分，不代表官方评分。

## 数据库准备

在 Supabase SQL Editor 执行（彼此独立，顺序不限）：

| 脚本 | 用途 |
| --- | --- |
| `database/migrations/pte-plans-table.sql` | 备考计划云端保存（`pte_plans`） |
| `database/migrations/pte-templates-table.sql` | 个人练习模板（`pte_templates`） |
| `database/migrations/pte-practice-items-table.sql` | 云端题库与 302 道种子题（`pte_practice_items`） |
| `database/migrations/pte-practice-attempts-table.sql` | 练习记录与"练习集锦"（`pte_practice_attempts`，Realtime） |
| `database/migrations/pte-practice-comments-table.sql` | 题目留言和"在哪里/哪天考过"（`pte_practice_comments`，Realtime） |
| `database/migrations/pte-practice-custom-items.sql` | 开启"上传题目"；会放宽 `pte_practice_items` 的写入策略，见下方安全说明 |

已经执行过旧版题库种子的数据库，如果题干或选项仍是中文，再执行一次 `database/fixes/pte-practice-items-english-text.sql`。可以用下面的查询确认，结果为 0 即已完成：

```sql
SELECT count(*) FROM pte_practice_items WHERE payload::text ~ '[一-鿿]';
```

各脚本的风险和重复执行说明见 [database/README.md](../../database/README.md)。

## 备考计划 `/pte-plan`

- 按目标分数和考试日期生成逐日练习计划，可以保存多个方案。
- 每天按题型列出练习量，可记录完成情况并查看当日学习总结。
- 模板库提供内置模板，也可以保存个人模板（`pte_templates`）。
- 未执行 `pte-plans-table.sql` 时计划无法保存到云端。

## 练习平台 `/pte-practice`

左侧导航包含：

| 入口 | 说明 |
| --- | --- |
| 学习工作台 | 今日目标、继续上次练习、各题型进度 |
| 专项题库 | 按题型、练习状态和关键词筛选当前支持的 20 种题型；尚未包含 SGD 与 RTS |
| 精听跟读 | 用浏览器语音合成逐句播放听力和口语素材，可调口音、音色、语速和循环方式 |
| 模拟考试 | 按考试板块连续作答，结束后汇总估分 |
| 错题复习 / 我的收藏 | 客观题最近一次未全对的题目，以及收藏的题目 |
| 练习记录 / 学习分析 | 历史反馈、技能趋势、薄弱题型和备考目标；练习百分比不换算为官方成绩或目标差距 |
| 练习集锦 | 两个人的最新练习和留言（Realtime） |
| 上传题目 | 通过表单或 JSON 把自己的题目加入共享题库 |

题库、精听和上传页面都用"技能 → 题型"两级按钮选择题型，按钮上显示题目数量。

听力音频使用浏览器语音合成。点击播放器上的设置按钮可以选择口音（每题随机、美式、英式、澳式、印度等，只显示当前浏览器提供的口音）、具体音色和语速；默认"每题随机"，更接近真实考试的多口音环境。Edge 的 Natural 音色和 Chrome 的 Google 音色通常更自然。

做题时可在"自由练习"和"限时练习"间切换；提交后会显示估分、作答对照和参考答案，可以"再练一次"。

录音题提交时会先停止录音并等待音频生成。精听支持暂停/继续、单句或整段循环、连续播放与隐藏文字稿；音频由浏览器合成，不是官方录音。模考为精简连续练习，离开后无法恢复进度，但已提交的作答会进入练习记录。

### 题库来源

题库优先读取云端 `pte_practice_items`，并与 `app/pte-practice/lib/questionBank.ts` 中的内置题按 `taskType:id` 合并，同 id 以云端为准。云端不可用时自动使用内置题，练习不受影响。

### 上传题目

需要先执行 `pte-practice-custom-items.sql` 并登录。上传的题目两个人都能看到，在题库中标记为"自定义题目"，id 以 `custom-` 开头。题目内容应使用英文。

表单录入使用以下简单标记：

| 题型 | 写法 |
| --- | --- |
| 单选 / 多选 / 听力摘要 | 每行一个选项，正确选项前加 `*` |
| 段落排序 | 按正确顺序每行一段，保存时自动打乱 |
| 阅读拖拽填空 / 听力填空 | 用 `{答案}` 标出空格；拖拽题可额外填写干扰词 |
| 阅读下拉填空 | `{正确词\|干扰词\|干扰词}`，第一个为正确答案 |
| Select Missing Word | 在文字稿结尾写 `{缺失内容}` |
| Highlight Incorrect Words | 把显示错误的词写成 `{显示的词\|实际读的词}` |
| Describe Image | 每行一条"类别: 数值" |

JSON 批量导入一次最多 50 题，格式与内置题库一致（可以在页面上"填入示例"后修改）。表单和 JSON 都在保存前用 `app/pte-practice/lib/custom-items.ts` 统一校验。

### 评分

- 参考 [Pearson Score Guide](https://www.pearsonpte.com/content/dam/ELL/pte/pearsonpte/pdfs/pte-academic-pdfs/PTE-Academic-Test-Taker-Score-Guide.pdf)。段落排序按正确相邻段落对计分。其他本地规则与服务估分不构成完整官方算法复现。
- 缺乏可靠信号的占位维度显示为“未评估”，不参与趋势和模考汇总；客观结果与启发式估算分别展示，不判断官方分数是否达标。

- 客观题（选择、排序、填空、听写等）按答案精确判分。
- Read Aloud 和 Repeat Sentence 提交后会按语音识别结果逐词标注：绿色清晰一致、黄色读音接近但不准（如单复数、相近词）、红色漏读或读错，点击单词可听标准发音；内容和发音分据此估算（`app/pte-practice/engine/wordAlignment.ts`）。需要浏览器支持实时语音转写（Chrome / Edge），否则只能回放录音自评。这不是音素级发音评测。
- 其他口语题和写作默认使用本地启发式估分。配置可选的自托管评分服务后，Read Aloud 发音和写作语法会改用开源模型估算，部署方式见 [pte-scoring-service/README.md](../../pte-scoring-service/README.md)。
- 评分服务通过服务端环境变量 `PTE_SCORING_SERVICE_URL`、`PTE_SCORING_SERVICE_TOKEN` 接入，只在 `app/api/pte-scoring/*/route.ts` 中读取，见 [部署与持续集成](../getting-started/DEPLOYMENT.md)。

### 本机数据

- 收藏、本题笔记、每日目标和最近练习保存在浏览器 `localStorage`，按身份区分，不会同步到另一台设备。
- 口音、音色和语速偏好（`pte-audio-v1`）也保存在本机，做题和精听共用。
- 云端练习记录不可用时，练习记录会暂存在本机（`pte-practice-attempts-v1`）。

## 身份与安全

- 计划、模板、练习记录、留言和自定义题目都沿用 `zyx` / `zly` 前端身份，RLS 无法验证调用者真实身份。
- 执行 `pte-practice-custom-items.sql` 后，任何持有匿名 key 的人都能以这两个身份上传或删除 `custom-` 开头的题目；内置题目不能被前端修改或删除。
- 公开部署前需要接入可靠认证并收紧相关策略。

## 常见问题

| 现象 | 处理 |
| --- | --- |
| 页面提示"云端题库暂时不可用" | 检查 Supabase 环境变量，或确认已执行 `pte-practice-items-table.sql`；期间会使用内置题 |
| 上传时提示"云端还未开启题目上传" | 执行 `pte-practice-custom-items.sql` |
| 题干或选项仍是中文 | 执行 `fixes/pte-practice-items-english-text.sql` |
| 录音按钮无效或提示不支持 | 录音需要 HTTPS 或 localhost，并允许麦克风权限 |
| 听力没有声音 | 依赖浏览器语音合成，可在精听跟读中切换英语音色或换用 Chrome / Edge |
