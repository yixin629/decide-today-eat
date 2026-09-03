# 数据库脚本说明

本目录集中管理 Supabase/PostgreSQL 脚本。项目不会自动执行这些 SQL；任何脚本都应先在测试项目验证，并在修改正式数据库前完成备份。

不要按文件名排序批量执行脚本，也不要把 `legacy/` 中的文件用于默认初始化。文件名包含 `safe`、`compatibility` 或 `fix` 不代表它适合当前数据库结构。

## 目录职责

| 目录                 | 用途                                     |
| -------------------- | ---------------------------------------- |
| `setup/`             | 全新数据库的基础初始化                   |
| `migrations/`        | 当前功能的独立建表、字段或数据迁移       |
| `migrations/legacy/` | 已被替代或字段过时的历史迁移，只用于追溯 |
| `fixes/`             | 针对明确历史缺口的定向修复               |
| `fixes/legacy/`      | 已被替代的历史综合修复，只用于追溯       |
| `diagnostics/`       | 只读检查，不修改结构或数据               |

## 全新数据库

先执行当前基础结构：

1. `setup/supabase-schema.sql`
2. `setup/planning-records-setup.sql`
3. `migrations/enhance-diary-table.sql`
4. `migrations/enhance-notes-table.sql`

随后只为需要启用的功能执行“功能到脚本映射”中的独立迁移。

注意：

- 两份 setup 只覆盖基础、计划与记录类表，不会创建全部功能表。
- `migrations/gomoku-mahjong-schema.sql` 依赖第一步创建的 `gomoku_games`。
- 当前仍没有一份适合所有功能的一键初始化脚本。
- `migrations/supabase-new-features.sql` 是尚未拆分完的互动功能包，执行前必须阅读下方限制。

## 功能到脚本映射

| 功能或页面     | 表                               | 当前脚本                                                        | 备注                                                                                                                              |
| -------------- | -------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 相册           | `photos`                         | `setup/supabase-schema.sql`                                     | 新库已含 `tag`；旧库缺少时执行 `migrations/add-photo-tag.sql`                                                                     |
| 纪念日         | `anniversaries`                  | `setup/supabase-schema.sql`                                     | 基础功能                                                                                                                          |
| 食物选择       | `food_options`                   | `setup/supabase-schema.sql`                                     | 可选替换数据见 `migrations/replace-food-options-seed.sql`                                                                         |
| 甜蜜留言       | `love_notes`                     | 基础 setup + `migrations/enhance-notes-table.sql`               | 当前页面会写增强字段                                                                                                              |
| 心愿清单       | `wishlist`                       | `setup/supabase-schema.sql`                                     | 基础功能                                                                                                                          |
| 倒计时         | `countdowns`                     | `setup/planning-records-setup.sql`                              | 当前字段为 `type`、`emoji`、`target_date`                                                                                         |
| 共享日程       | `schedules`                      | `setup/planning-records-setup.sql`                              | 当前表不是旧 `shared_calendar`                                                                                                    |
| 时光胶囊       | `time_capsules`                  | `setup/planning-records-setup.sql`                              | 当前字段为 `sender`、`receiver`、`unlock_date`                                                                                    |
| 恋爱日记       | `diary_entries`                  | planning setup + `migrations/enhance-diary-table.sql`           | 当前表不是旧 `love_diary`                                                                                                         |
| 聊天           | `chat_messages`                  | `migrations/chat-table-safe.sql`                                | 包含 Realtime publication 配置                                                                                                    |
| 每日签到       | `check_ins`                      | `migrations/check-in-table.sql` + `fixes/fix-check-ins-rls.sql` | 后者启用当前宽松 RLS，并固定共享函数的 `search_path`                                                                              |
| 共同账本       | `shared_expenses`                | `migrations/expenses-table.sql`                                 | 独立迁移                                                                                                                          |
| 音乐播放器     | `songs`                          | `migrations/music-player-schema.sql`                            | 独立迁移                                                                                                                          |
| 个人资料与提醒 | `user_profiles`、`reminders`     | `migrations/profile-tables.sql`                                 | 自定义头像再执行 `migrations/update-profile-avatar.sql`；已有同名资料导致 `PGRST116` 时执行 `fixes/deduplicate-user-profiles.sql` |
| 五子棋         | `gomoku_games`                   | 基础 setup + `migrations/gomoku-mahjong-schema.sql`             | 添加当前 JSONB 状态字段、Realtime 和兼容约束                                                                                      |
| 麻将           | `mahjong_games`、`user_balances` | `migrations/gomoku-mahjong-schema.sql`                          | 同时插入两个默认用户余额，使用前应审查                                                                                            |
| 心情追踪       | `mood_records`                   | `migrations/mood-records-table.sql`                             | 兼容旧 `TEXT id`，新插入默认生成 UUID 字符串                                                                                      |
| 情侣书架       | `novels`                         | `migrations/novels-table.sql`                                   | 独立、可重复执行的当前表迁移                                                                                                      |
| 塔罗           | `tarot_readings`                 | `migrations/tarot-table.sql`                                    | 独立迁移                                                                                                                          |
| 星座           | `horoscope_readings`             | `migrations/horoscope-table.sql`                                | 独立迁移                                                                                                                          |
| 穿搭记录       | `outfit_records`                 | `migrations/outfit-records-table.sql`                           | 独立迁移                                                                                                                          |
| PTE 备考计划   | `pte_plans`                      | `migrations/pte-plans-table.sql`                                | 按网站登录身份保存多个计划与逐题记录                                                                                              |
| 互动功能包     | 见下表                           | `migrations/supabase-new-features.sql`                          | 包含默认数据和遗留表，不能默认重复执行                                                                                            |

`migrations/supabase-new-features.sql` 当前提供这些页面需要的表：

| 页面           | 当前表                        |
| -------------- | ----------------------------- |
| 真心话大冒险   | `truth_or_dare`               |
| 情侣问答       | `couple_quiz`、`quiz_results` |
| 猜猜我画的     | `drawings`                    |
| 石头剪刀布     | `rps_games`                   |
| 100 件想做的事 | `love_bucket_list`            |
| 情话生成器     | `love_quotes`                 |
| 功能申请箱     | `feature_requests`            |

该 bundle 还会声明当前流程不使用的 `shared_calendar`、`love_diary`，并重复声明 `countdowns`、`time_capsules`。它的默认情侣问答 `correct_answer` 是占位文字，不属于选项；默认数据和固定策略名也使脚本不完全幂等。

## 当前脚本索引

### `setup/`

| 脚本                         | 内容                                             |
| ---------------------------- | ------------------------------------------------ |
| `supabase-schema.sql`        | 相册、纪念日、五子棋旧基础、食物、留言和心愿清单 |
| `planning-records-setup.sql` | 当前倒计时、日程、时光胶囊和日记结构             |

`supabase-schema.sql` 的基础建表不是完全幂等的，不要在已有数据库上整体重跑。

### `migrations/`

| 脚本                            | 内容或注意事项                                   |
| ------------------------------- | ------------------------------------------------ |
| `add-more-love-quotes.sql`      | 追加情话种子；重复执行会重复插入                 |
| `add-photo-tag.sql`             | 为旧 `photos` 补 `tag` 和索引                    |
| `chat-table-safe.sql`           | 当前聊天表、索引、宽松 RLS 和 Realtime           |
| `check-in-table.sql`            | 签到表和索引                                     |
| `enhance-diary-table.sql`       | 日记天气与贴纸字段                               |
| `enhance-notes-table.sql`       | 留言样式、封口与 emoji 字段                      |
| `expenses-table.sql`            | 共同账本                                         |
| `gomoku-mahjong-schema.sql`     | 五子棋兼容字段、麻将、余额、宽松 RLS 和 Realtime |
| `horoscope-table.sql`           | 星座记录                                         |
| `mood-records-table.sql`        | 心情记录；兼容 `TEXT` 或 `UUID` 类型的已有 `id`  |
| `music-player-schema.sql`       | 共享歌曲                                         |
| `novels-table.sql`              | 情侣书架                                         |
| `outfit-records-table.sql`      | 穿搭记录                                         |
| `profile-tables.sql`            | 个人资料和提醒；新库会为规范化姓名建立唯一索引   |
| `pte-plans-table.sql`           | PTE 多计划、配置和逐题记录的 JSONB 云端存储      |
| `replace-food-options-seed.sql` | 破坏性清空并重建食物种子                         |
| `supabase-new-features.sql`     | 尚未拆分完的互动功能、默认数据和遗留表           |
| `tarot-table.sql`               | 塔罗记录                                         |
| `update-profile-avatar.sql`     | 个人资料增加 `avatar_url`                        |

### `fixes/`

| 脚本                            | 仅在何时使用                                                                                                                       |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `deduplicate-user-profiles.sql` | `user_profiles.name` 已有重复行导致单行查询失败；会先建立启用 RLS 且撤销客户端权限的备份表，再合并重复资料并添加规范化姓名唯一索引 |
| `fix-check-ins-rls.sql`         | `check_ins` 已存在但缺少 RLS，或需修复 `update_updated_at_column` 的 `search_path`                                                 |

### `diagnostics/`

`check-planning-tables.sql` 只读列出 `countdowns`、`schedules`、`time_capsules` 和 `diary_entries` 的字段。它不会检查所有业务表、Storage bucket、RLS 策略或 Realtime publication。

## Legacy 脚本

`migrations/legacy/` 与 `fixes/legacy/` 只为解释历史数据库来源和处理极少数定向恢复场景保留：

- 不用于全新数据库。
- 不按目录顺序执行。
- 不与对应的当前脚本同时执行。
- 不因历史文件名中出现 `safe` 或 `fix` 就默认执行。
- 若必须使用，应先备份，并逐段核对当前列名、约束、策略和种子数据。

| Legacy 脚本                                                  | 状态与当前替代                                                  |
| ------------------------------------------------------------ | --------------------------------------------------------------- |
| `migrations/legacy/chat-table.sql`                           | 旧聊天脚本；使用 `migrations/chat-table-safe.sql`               |
| `migrations/legacy/gomoku-table-upgrade.sql`                 | 仅做部分五子棋升级；使用 `migrations/gomoku-mahjong-schema.sql` |
| `migrations/legacy/mahjong-table.sql`                        | 旧麻将初始化；使用 `migrations/gomoku-mahjong-schema.sql`       |
| `migrations/legacy/new-features-database-setup.sql`          | 旧功能 bundle；分别使用塔罗、星座、穿搭、日记和留言迁移         |
| `migrations/legacy/planning-tables-bundle.sql`               | 非幂等旧计划表 bundle；使用 `setup/planning-records-setup.sql`  |
| `migrations/legacy/planning-tables-compatibility-bundle.sql` | 混合旧字段的兼容 bundle；小说和心情改用独立迁移                 |
| `fixes/legacy/planning-tables-compatibility-fix.sql`         | 旧计划表综合修复，偏向遗留字段                                  |
| `fixes/legacy/planning-tables-combined-fix.sql`              | 旧计划表综合策略与字段修复，不代表当前 schema                   |

## 已有数据库

1. 先备份目标数据库。
2. 根据错误中的表名或字段名搜索 `database/`。
3. 计划与记录类表可先执行 `diagnostics/check-planning-tables.sql`。
4. 只执行与实际缺口对应的当前迁移或定向修复。
5. 在测试项目验证数据、RLS、Realtime 和页面行为后再应用到正式项目。

不要为了补一个字段而重新执行全部 setup，也不要用 legacy bundle 猜测当前缺口。

## 字段版本冲突

时光胶囊历史上有两套主要命名：

| 版本                   | 字段                                   |
| ---------------------- | -------------------------------------- |
| 当前代码与 setup       | `sender`、`receiver`、`unlock_date`    |
| Legacy planning bundle | `created_by`、`recipient`、`open_date` |

当前页面只应以第一行为准。Legacy bundle 还可能留下旧 `shared_calendar`、`love_diary` 或与当前类型不同的 `countdowns`。

`mood_records` 的历史 `id` 是无默认值的 `TEXT`。当前 `migrations/mood-records-table.sql` 保留已有列类型，并为 `TEXT` 设置 `gen_random_uuid()::TEXT`、为已有 `UUID` 设置 `gen_random_uuid()`，因此页面可以继续省略 `id` 插入。

## 路径变更

| 旧路径                                    | 当前路径                                                     |
| ----------------------------------------- | ------------------------------------------------------------ |
| `setup/complete-database-setup.sql`       | `setup/planning-records-setup.sql`                           |
| `diagnostics/check-tables.sql`            | `diagnostics/check-planning-tables.sql`                      |
| `fixes/security-fixes.sql`                | `fixes/fix-check-ins-rls.sql`                                |
| `migrations/update-food-options.sql`      | `migrations/replace-food-options-seed.sql`                   |
| `fixes/fix-gomoku-mahjong.sql`            | `migrations/gomoku-mahjong-schema.sql`                       |
| `setup/NEW_FEATURES_DATABASE_SETUP.sql`   | `migrations/legacy/new-features-database-setup.sql`          |
| `migrations/add-mahjong-table.sql`        | `migrations/legacy/mahjong-table.sql`                        |
| `migrations/chat-table.sql`               | `migrations/legacy/chat-table.sql`                           |
| `migrations/supabase-new-tables.sql`      | `migrations/legacy/planning-tables-bundle.sql`               |
| `migrations/supabase-new-tables-safe.sql` | `migrations/legacy/planning-tables-compatibility-bundle.sql` |
| `migrations/upgrade-gomoku-table.sql`     | `migrations/legacy/gomoku-table-upgrade.sql`                 |
| `fixes/fix-database.sql`                  | `fixes/legacy/planning-tables-compatibility-fix.sql`         |
| `fixes/final-fix-database.sql`            | `fixes/legacy/planning-tables-combined-fix.sql`              |

## 风险与安全

- `migrations/replace-food-options-seed.sql` 使用 `TRUNCATE ... CASCADE`，会替换全部食物数据。
- `fixes/deduplicate-user-profiles.sql` 会删除重复个人资料行；执行前必须备份，并先审查脚本创建的恢复表名称与合并规则。
- `migrations/gomoku-mahjong-schema.sql` 会放宽旧五子棋列约束、配置 Realtime，并为两个固定用户插入默认余额。
- `migrations/supabase-new-features.sql` 和 `add-more-love-quotes.sql` 的种子不是完全幂等的。
- 多个当前和历史脚本创建允许匿名公开读写的宽松 RLS；这不等同于适合公开生产环境。
- `photos`、`songs`、`love_notes` 的页面会使用 Realtime，但对应脚本尚未统一加入 publication。
- `photos`、`avatars` Storage bucket 及其策略需要在 Supabase 控制台单独配置。
- `pte_plans` 沿用网站自定义的 `zyx` / `zly` 前端身份；在迁移到 Supabase Auth 前，RLS 无法提供基于 `auth.uid()` 的强用户隔离。
- 任何 SQL 都先在测试项目验证；仓库维护过程不会自动连接或修改线上数据库。
