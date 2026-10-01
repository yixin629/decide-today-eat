# 2024 年开发历史摘要

> [!NOTE]
> 本文合并自 2024-11 的 6 份阶段报告：`COMPLETE_OPTIMIZATION_REPORT.md`、`IMPLEMENTATION_SUMMARY_V2.md`、`NEW_FEATURES_V2.md`、`OPTIMIZATION_PROGRESS.md`、`UI_OPTIMIZATION_PHASE2.md`、`UI_OPTIMIZATION_REPORT.md`。它只作为历史记录，不代表当前功能、数据库顺序或安全状态。当前状态以根目录 `README.md`、`docs/README.md`、`database/README.md` 和实际代码为准。原文可在 git 历史中查看（例如 `git log -- docs/reports/`）。

## 时间线

| 日期 | 里程碑 |
| --- | --- |
| 2024-11-13 | UI/UX 第一阶段：新建 Toast、BackButton、LoadingSkeleton，增强照片查看器，优化首页响应式与移动端导航；当时记录为 6/10 项完成（60%） |
| 2024-11-13 | 同日补充：照片批量上传组件、图片压缩工具（报告标为 v2.1）；AI Chatbot 集成到全局布局；Toast 应用到 login、photos、food、diary、notes |
| 2024-11-13 | UI/UX 第二阶段：wishlist、anniversaries、countdown、bucket-list、schedule 接入 Toast 和 BackButton；记录为 11/21 页面完成、总体 75% |
| 2024-11-14 | V2.0 首批上线 6 个功能（配对游戏、装扮小人、制作情书、颜色测试、塔罗牌、星座运势），导航当时共 30 个功能 |
| 2024-11-14 | V2 全部 15 项完成，功能总数记录为 31 个；新增 3 张表并增强日记、留言两张表 |

## V2 新增功能

### 游戏与互动（6 项）

- 配对游戏 `/matching-game`：8 对情侣主题卡片、翻牌动画、计时与步数、最佳成绩存 localStorage、振动反馈。
- 装扮小人 `/dress-up`：发型、服装、配饰、鞋子 4 类各 6 个选项，支持保存/加载、随机装扮和复制分享，数据存 localStorage。
- 制作情书 `/love-letter`：5 种模板、MadLibs 式选词填空、随机填充与复制，纯前端生成。
- 颜色测试 `/color-test`：8 种颜色、3 道题，给出性格分析、恋爱风格和情侣配对指数，算法生成、无数据库。
- 塔罗牌 `/tarot`：22 张大阿尔卡纳、每日限抽一次、查看最近 10 次历史；表 `tarot_readings`，脚本 `database/migrations/tarot-table.sql`。
- 星座运势 `/horoscope`：12 星座、双人运势、幸运色/数字、契合度；表 `horoscope_readings`，脚本 `database/migrations/horoscope-table.sql`。

### 记录与增强（4 项）

- 穿搭记录 `/outfit-records`：emoji 图标、风格标签、场合与笔记；表 `outfit_records`，脚本 `database/migrations/outfit-records-table.sql`。
- 心情日记增强 `/diary`：15 种心情、10 种天气、48 种贴纸（最多 5 个），保留 Markdown 和草稿自动保存；`diary_entries` 新增 `weather`、`stickers`，脚本 `database/migrations/enhance-diary-table.sql`。
- 留言板增强 `/notes`：4 种信纸样式、密封/拆封状态与动画、24 种表情（最多 5 个）；`love_notes` 新增 `letter_style`、`is_sealed`、`emojis`，脚本 `database/migrations/enhance-notes-table.sql`。
- 主题设置：明亮、夜间、护眼 3 种模式和小/中/大 3 档字号，右下角按钮，设置存 localStorage；当时文件为 `app/components/ThemeSettings.tsx`。

### 全局视觉效果（4 项）

- 首页纪念日倒计时：漂浮爱心背景、数字跳动、海报文案生成按钮。
- 页面加载动画：跳动爱心、渐变加载屏和进度条，约 1.5 秒后消失（当时文件 `app/components/PageLoadingEffect.tsx`）。
- 随机惊喜：10% 概率弹出甜蜜消息，含情人节、520、七夕、圣诞、元旦节日消息（`app/components/layout/RandomSurprise.tsx`）。
- 点击爱心粒子：10% 概率触发漂浮旋转的爱心并自动清理（`app/components/layout/HeartParticles.tsx`）。

当时记录的 SQL 执行顺序为：`tarot-table.sql` → `horoscope-table.sql` → `outfit-records-table.sql` → `enhance-diary-table.sql` → `enhance-notes-table.sql`。`app/globals.css` 同期新增 `float`、`loading-bar`、`bounce-slow`、`spin-slow` 动画和 `.dark-mode`、`.eye-care-mode` 主题类；`app/layout.tsx`、`app/components/layout/Navigation.tsx`、`app/page.tsx` 同步接入新组件、导航项和首页卡片。

## UI/UX 优化

### 设计系统与共享组件

- Toast（`app/components/feedback/Toast.tsx`、`app/components/feedback/ToastProvider.tsx`）：success、error、info、warning 4 种类型，右上角滑入、自动消失并可手动关闭、支持多条堆叠，通过 Context 在 `app/layout.tsx` 全局提供，用来替代 `alert()`。
- BackButton（`app/components/ui/BackButton.tsx`）：带 SVG 箭头和悬停效果，可自定义 `href` 与文字，替代各页面手写的“← 返回首页”链接。
- LoadingSkeleton（`app/components/ui/LoadingSkeleton.tsx`）：提供 Card、PhotoGrid、List、DiaryEntry、Table 五种骨架和通用 `LoadingSkeleton`，带脉冲动画。
- 动画：`app/globals.css` 新增 `animate-slide-in-right`（Toast）和 `animate-pulse-slow`（骨架屏）。
- AI Chatbot（`app/components/ai-chat/AIChatbot.tsx`）：右下角展开/收起，当时使用 HuggingFace 免费 API，失败时降级为预设回复，含消息历史和打字指示器。

### 照片功能

- 查看器（`app/photos/page.tsx`）：←/→ 键切换、ESC 关闭、触摸滑动、左右按钮、计数显示（如 3 / 10）、循环浏览，背景不透明度由 75% 提至 90%。
- 批量上传（`app/photos/components/BatchUploadDialog.tsx`）：拖拽或多选最多 10 张，逐张设置标题和描述，实时预览并显示压缩比例；报告结束时仍记为“待集成到照片页”。
- 图片压缩（`app/photos/lib/image-utils.ts`）：缩放到 1920x1080、质量 80%，失败时回退原图；报告估计可节省 50–70% 存储。

### 页面与布局

- 首页 `app/page.tsx`：外边距、标题、emoji 和描述文字改为响应式，网格改为 `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`。
- 移动端导航 `app/components/layout/Navigation.tsx`：抽屉宽度由 `w-full` 改为 `w-[85vw]`，断点为 `max-w-[280px] sm:max-w-[320px] md:w-80`。
- Toast/BackButton 覆盖：第二阶段结束时 login、photos、food、diary、notes、wishlist、anniversaries、countdown、bucket-list、schedule 已接入；photos 另用 `PhotoGridSkeleton`。time-capsule 只加了 import，6 处 `alert()` 尚未替换。
- 移动端约定：按钮 `active:scale-95`、触摸目标至少 44x44px、文字与间距使用响应式类；游戏页通过 Vibration API 提供振动反馈。

## 当时记录的已知问题与后续计划

以下内容只反映 2024-11 记录时点，不是当前待办，可能已经完成、改变或放弃。

已知问题：

- 照片等页面仍使用 `<img>`，未改用 Next.js `<Image>`。
- 删除操作仍使用 `confirm()`，建议改为确认对话框组件。
- 部分页面缺少加载状态和骨架屏；批量上传尚未集成到照片页。
- 塔罗和星座需要先手动执行 SQL 建表；振动反馈只在支持的设备上生效；localStorage 数据会随清除浏览器缓存丢失。

后续计划：

- 把 Toast/BackButton 推广到剩余页面：time-capsule、couple-quiz、feature-requests、drawing、truth-or-dare、memory-game、gomoku、rock-paper-scissors、love-quotes、profile。
- 把骨架屏推广到 diary、notes、anniversaries、wishlist、schedule、bucket-list、feature-requests。
- 日记每 30 秒自动保存草稿（V2 报告中已记为保留功能）；纪念日提前 1/3/7 天提醒，使用浏览器 Notification API。
- 首页统计面板（照片、日记、在一起天数、留言等）。
- 性能：Next.js Image、图片懒加载、照片墙虚拟滚动、代码分割、路由预加载、SWR 缓存。
- 深色模式（当时计划使用 `next-themes`；V2 中另行实现了 ThemeSettings 主题设置）、PWA 离线访问。
- 照片分类/搜索/幻灯片，日记图片插入与导出，提取公共 CRUD、错误处理和表单校验逻辑。

## 一句总结

2024 年 11 月 13–14 日，项目先建立了 Toast、返回按钮、骨架屏等共享 UI 基础并改善照片和移动端体验，随后在 V2 中一次加入 15 项游戏、记录、主题和动效功能，使功能数从 24 个增长到记录中的 31 个。
