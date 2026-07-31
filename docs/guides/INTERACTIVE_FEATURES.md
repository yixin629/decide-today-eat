# 互动功能与数据库依赖

本指南说明互动页面使用哪些数据表。所有可访问功能的名称、路径和导航分类以 `lib/features.ts` 为准。

## 需要 `supabase-new-features.sql` 的功能

执行 `database/migrations/supabase-new-features.sql` 后可获得：

| 页面 | 路由 | 主要表 |
| --- | --- | --- |
| 功能申请箱 | `/feature-requests` | `feature_requests` |
| 真心话大冒险 | `/truth-or-dare` | `truth_or_dare` |
| 100 件想做的事 | `/bucket-list` | `love_bucket_list` |
| 情话生成器 | `/love-quotes` | `love_quotes` |
| 情侣问答 | `/couple-quiz` | `couple_quiz`、`quiz_results` |
| 石头剪刀布 | `/rock-paper-scissors` | `rps_games` |
| 猜猜我画的 | `/drawing` | `drawings` |

该脚本还包含一部分早期倒计时、日历、时光胶囊和日记表定义；当前代码使用的是 `countdowns`、`schedules`、`time_capsules` 和 `diary_entries`，新项目应先按根 README 完成当前基础初始化。

### 执行注意事项

- 脚本会插入默认真心话、情话和问答数据。
- 虽然建表使用了 `IF NOT EXISTS`，默认数据和固定名称的策略不是完全幂等的。
- 已有数据库执行前应备份，并检查是否已经存在同名策略或默认数据。
- 表策略采用宽松公开访问，只适合当前私人使用模型；公开部署前需要重写 RLS。

## 其他有数据库依赖的互动功能

| 功能 | 路由 | 脚本 |
| --- | --- | --- |
| 情侣聊天室 | `/chat` | `database/migrations/chat-table-safe.sql` |
| 五子棋 | `/gomoku` | 基础 setup 后执行 `database/migrations/gomoku-mahjong-schema.sql` |
| 欢乐麻将 | `/mahjong` | `database/migrations/gomoku-mahjong-schema.sql` |
| 每日签到 | `/check-in` | `database/migrations/check-in-table.sql` + `database/fixes/fix-check-ins-rls.sql` |
| 塔罗牌 | `/tarot` | `database/migrations/tarot-table.sql` |
| 星座运势 | `/horoscope` | `database/migrations/horoscope-table.sql` |

五子棋和麻将的历史表结构存在多个版本。当前基础 setup 的五子棋字段仍不完整，因此
`database/migrations/gomoku-mahjong-schema.sql` 同时负责新库补齐和旧库兼容。不要同时执行
`database/migrations/legacy/gomoku-table-upgrade.sql` 或
`database/migrations/legacy/mahjong-table.sql`。

## 不需要新增数据库表的小游戏

下列页面的主要状态保存在当前浏览器内存或本地存储中，不要求额外执行 SQL：

- `/memory-game`
- `/matching-game`
- `/dress-up`
- `/color-test`
- `/compatibility-test`
- `/catch-heart`
- `/love-survivor`
- `/grass-cutter`
- `/emoji-battle`
- `/board-game`
- `/love-dice`

浏览器本地数据不会自动在设备间同步，清理浏览器数据后也可能丢失。

## 使用要点

### 情侣问答

题目的 `options` 字段是 JSONB 数组，正确答案必须与其中一个规范化选项一致。答题记录保存在 `quiz_results`。

### 聊天

聊天表需要加入 Supabase Realtime publication。推荐使用
`database/migrations/chat-table-safe.sql`，不要同时执行
`database/migrations/legacy/chat-table.sql`。

### 画板

作品目前以 base64 文本写入 `drawings.image_data`。大量或高分辨率图片会迅速增大数据库体积；长期使用更适合迁移到 Storage。

### 多人游戏

当前用户身份来自浏览器本地标识，不是服务端认证。房间归属、余额和玩家身份不能作为防作弊或访问控制依据。

## 新增功能时

1. 在 `app/<route>/page.tsx` 添加页面。
2. 在 `lib/features.ts` 登记名称、分类和展示位置。
3. 如需数据表，在 `database/migrations/` 添加独立、尽量幂等的脚本。
4. 更新 `database/README.md` 和对应指南。
5. 运行 `npm run lint`、`npm run typecheck` 和 `npm run build`。
