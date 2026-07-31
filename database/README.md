# 数据库脚本说明

本目录集中管理 Supabase/PostgreSQL 脚本。项目不会自动执行这些 SQL；在 Supabase SQL Editor 运行前必须备份，并阅读脚本内容。

当前历史脚本存在重叠，尚没有一份可以安全初始化全部功能的单一脚本。不要按文件名排序批量执行，也不要因为文件名包含 `safe` 就默认它与当前字段完全一致。

## 目录分类

| 目录 | 用途 |
| --- | --- |
| `setup/` | 新环境的基础初始化或历史功能包 |
| `migrations/` | 按功能添加表、字段或种子数据 |
| `fixes/` | 修复特定旧结构、策略或约束 |
| `diagnostics/` | 只读检查，不修改数据库 |

## 全新数据库

先执行当前基础结构：

1. `setup/supabase-schema.sql`
2. `setup/complete-database-setup.sql`

这两份脚本只覆盖基础表，不会启用全部页面。随后按下方“功能到脚本映射”选择迁移。

当前基础结构还有三个需要明确补齐的地方：

- 日记页面写入 `weather`、`stickers`，需执行 `migrations/enhance-diary-table.sql`。
- 留言页面写入 `letter_style`、`is_sealed`、`emojis`，需执行 `migrations/enhance-notes-table.sql`。
- 基础五子棋表仍是旧结构；启用当前五子棋或麻将前，需执行
  `fixes/fix-gomoku-mahjong.sql`。虽然它位于 `fixes/`，目前也承担新库兼容步骤。

这是现有脚本的限制，不代表理想的长期初始化流程。后续应把这些当前必需字段合并到唯一、可重复执行的 setup。

## 功能到脚本映射

| 功能或页面 | 表 | 推荐脚本 | 备注 |
| --- | --- | --- | --- |
| 相册 | `photos` | `setup/supabase-schema.sql` | 新库已含 `tag`；旧库缺少时用 `add-photo-tag.sql` |
| 纪念日 | `anniversaries` | `setup/supabase-schema.sql` | 基础功能 |
| 食物选择 | `food_options` | `setup/supabase-schema.sql` | `update-food-options.sql` 会清空现有数据 |
| 甜蜜留言 | `love_notes` | 基础 setup + `enhance-notes-table.sql` | 当前页面会写增强字段 |
| 心愿清单 | `wishlist` | `setup/supabase-schema.sql` | 基础功能 |
| 倒计时 | `countdowns` | `setup/complete-database-setup.sql` | 当前字段为 `type`、`emoji`、`target_date` |
| 共享日程 | `schedules` | `setup/complete-database-setup.sql` | 不使用旧 `shared_calendar` |
| 时光胶囊 | `time_capsules` | `setup/complete-database-setup.sql` | 当前字段为 `sender`、`receiver`、`unlock_date` |
| 恋爱日记 | `diary_entries` | complete setup + `enhance-diary-table.sql` | 不使用旧 `love_diary` |
| 聊天 | `chat_messages` | `migrations/chat-table-safe.sql` | 包含 Realtime publication 检查；不要再执行旧版 |
| 每日签到 | `check_ins` | `migrations/check-in-table.sql` | `security-fixes.sql` 只修历史 RLS |
| 共同账本 | `shared_expenses` | `migrations/expenses-table.sql` | 独立迁移 |
| 音乐播放器 | `songs` | `migrations/music-player-schema.sql` | 独立迁移 |
| 个人资料与提醒 | `user_profiles`、`reminders` | `migrations/profile-tables.sql` | 自定义头像还需 `update-profile-avatar.sql` |
| 五子棋 | `gomoku_games` | 基础 setup + `fixes/fix-gomoku-mahjong.sql` | 当前代码依赖 `game_state`、`players` 等字段 |
| 麻将 | `mahjong_games`、`user_balances` | `fixes/fix-gomoku-mahjong.sql` | 不要再同时执行 `add-mahjong-table.sql` |
| 互动功能包 | 见下表 | `migrations/supabase-new-features.sql` | 会插入默认数据，且不是完全幂等 |
| 塔罗 | `tarot_readings` | `migrations/tarot-table.sql` | 与历史 setup 功能包二选一 |
| 星座 | `horoscope_readings` | `migrations/horoscope-table.sql` | 与历史 setup 功能包二选一 |
| 穿搭记录 | `outfit_records` | `migrations/outfit-records-table.sql` | 与历史 setup 功能包二选一 |
| 心情追踪 | `mood_records` | 暂无干净的独立迁移 | 现有 safe bundle 的 `id` 无默认值，数据库写入会回退本地 |
| 情侣书架 | `novels` | `migrations/supabase-new-tables-safe.sql` | 该 bundle 同时添加遗留字段，执行前必须审查 |

`supabase-new-features.sql` 提供的当前互动表：

| 页面 | 表 |
| --- | --- |
| 真心话大冒险 | `truth_or_dare` |
| 情侣问答 | `couple_quiz`、`quiz_results` |
| 猜猜我画的 | `drawings` |
| 石头剪刀布 | `rps_games` |
| 100 件想做的事 | `love_bucket_list` |
| 情话生成器 | `love_quotes` |
| 功能申请箱 | `feature_requests` |

该脚本还创建旧 `shared_calendar`、`love_diary`，并重复声明部分当前表。默认情侣问答的
`correct_answer` 是占位文字，不属于选项；使用前需要在数据库或页面中改成真实答案。

## 已有数据库

1. 先备份。
2. 用错误日志中的表名/字段名在 `database/` 搜索。
3. 执行 `diagnostics/check-tables.sql` 查看当前核心字段。
4. 只选择与当前缺口对应的迁移或修复。
5. 在一个测试项目验证后再应用到正式数据。

不要重新运行 `setup/supabase-schema.sql`；它的基础建表不是幂等的。

## 脚本目录

### `setup/`

| 脚本 | 内容 |
| --- | --- |
| `supabase-schema.sql` | 相册、纪念日、五子棋旧基础、食物、留言、心愿清单 |
| `complete-database-setup.sql` | 当前倒计时、日程、时光胶囊、日记结构与策略 |
| `NEW_FEATURES_DATABASE_SETUP.sql` | 历史功能包：塔罗、星座、穿搭，并增强日记/留言 |

`NEW_FEATURES_DATABASE_SETUP.sql` 依赖基础表存在。选择该 bundle 后，不要再执行同内容的独立塔罗、星座、穿搭迁移。

### `migrations/`

| 脚本 | 用途或注意事项 |
| --- | --- |
| `add-mahjong-table.sql` | 旧麻将初始化；普通 `CREATE TABLE`，不适合重复执行 |
| `add-more-love-quotes.sql` | 追加情话种子数据；重复执行会重复插入 |
| `add-photo-tag.sql` | 为旧相册补 `tag` 和索引 |
| `chat-table-safe.sql` | 推荐聊天表与 Realtime 配置 |
| `chat-table.sql` | 旧聊天脚本；已有 safe 版本时不要执行 |
| `check-in-table.sql` | 签到表 |
| `enhance-diary-table.sql` | 当前日记所需天气和贴纸字段 |
| `enhance-notes-table.sql` | 当前留言所需样式、封口和 emoji 字段 |
| `expenses-table.sql` | 共同账本 |
| `horoscope-table.sql` | 星座记录 |
| `music-player-schema.sql` | 共享歌曲 |
| `outfit-records-table.sql` | 穿搭记录 |
| `profile-tables.sql` | 个人资料和提醒 |
| `supabase-new-features.sql` | 互动功能包、默认数据和部分遗留表 |
| `supabase-new-tables-safe.sql` | 历史兼容 bundle；包含旧时光胶囊字段 |
| `supabase-new-tables.sql` | 旧版非幂等 bundle，不推荐新项目使用 |
| `tarot-table.sql` | 塔罗记录 |
| `update-food-options.sql` | 清空并重建食物数据，具有破坏性 |
| `update-profile-avatar.sql` | 个人资料增加 `avatar_url` |
| `upgrade-gomoku-table.sql` | 部分五子棋升级；未覆盖当前全部兼容需求 |

### `fixes/`

| 脚本 | 仅在何时使用 |
| --- | --- |
| `fix-gomoku-mahjong.sql` | 当前五子棋字段不兼容，或初始化麻将兼容结构 |
| `security-fixes.sql` | 已有 `check_ins` 缺少 RLS 时 |
| `fix-database.sql` | 旧倒计时/日程/胶囊/日记字段修复；偏向遗留命名 |
| `final-fix-database.sql` | 历史综合修复，不能视为当前完整 schema |

### `diagnostics/`

`check-tables.sql` 当前只检查倒计时、日程、时光胶囊和日记的部分字段。它不会验证全部 31 张业务表、Storage bucket 或所有 Realtime publication。

## 字段版本冲突

时光胶囊历史上有多套命名：

| 版本 | 字段 |
| --- | --- |
| 当前代码与 canonical setup | `sender`、`receiver`、`unlock_date` |
| 旧 safe/new tables | `created_by`、`recipient`、`open_date` |

当前页面只应以第一行为准。不要为了“更安全”在新库上追加旧 safe bundle；它会留下两套并存字段，使后续维护更困难。

其他已知限制：

- 基础五子棋表与当前房间写入字段不一致。
- `mood_records.id` 在现有脚本中没有默认值，而页面插入不提供该值。
- `supabase-new-features.sql` 的部分表和默认数据属于旧实现。
- `photos`、`songs`、`love_notes` 的部分页面使用 Realtime 订阅，但相应初始化脚本没有统一配置 publication。

## 风险与安全

- `update-food-options.sql` 使用 `TRUNCATE ... CASCADE`，执行前必须备份并确认要替换全部食物数据。
- `fixes/` 可能修改约束、字段、RLS、策略和 Realtime 设置。
- `*-safe.sql` 只表示作者尝试兼容重复执行，不代表字段仍符合当前代码。
- 多个历史策略允许匿名公开读写。项目公开部署前必须接入可靠认证并重写 RLS。
- Storage 的 `photos`、`avatars` bucket 及策略需要在 Supabase 控制台单独配置。
- 任何 SQL 都先在测试项目验证；本仓库维护过程不会自动连接或修改线上数据库。
