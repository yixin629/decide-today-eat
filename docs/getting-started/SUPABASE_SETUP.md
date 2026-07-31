# Supabase 配置指南

本项目使用 Supabase PostgreSQL 保存业务数据，并使用 Storage 保存照片和自定义头像。

## 1. 创建项目并获取客户端配置

在 [Supabase Dashboard](https://supabase.com/dashboard) 创建项目后，从项目设置中取得：

- Project URL
- 匿名客户端密钥（anon key 或 publishable key，取决于控制台当前命名）

写入本地 `.env.local`：

```env
NEXT_PUBLIC_SUPABASE_URL=https://你的项目.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的匿名客户端密钥
```

这两个 `NEXT_PUBLIC_` 值会进入浏览器代码，不能用 `service_role` 密钥替代。`service_role` 具有高权限，只能保存在受控服务端环境，本项目当前也不需要它。

## 2. 初始化数据库

全新项目在 SQL Editor 中依次执行：

1. `database/setup/supabase-schema.sql`
2. `database/setup/complete-database-setup.sql`

这会创建相册、纪念日、食物、留言、心愿清单、五子棋，以及倒计时、日程、时光胶囊和日记等基础表。

其他页面使用独立迁移，例如：

- 聊天：`database/migrations/chat-table-safe.sql`
- 个人资料与提醒：`database/migrations/profile-tables.sql`
- 签到：`database/migrations/check-in-table.sql`
- 共同账本：`database/migrations/expenses-table.sql`
- 音乐：`database/migrations/music-player-schema.sql`
- 互动功能：`database/migrations/supabase-new-features.sql`

完整映射、重复脚本和风险见 [database/README.md](../../database/README.md)。已有数据库应按缺少的表或字段选择迁移，不要重新执行全部初始化脚本。

## 3. 配置照片 Storage

相册代码使用名为 `photos` 的 bucket：

1. 在 Storage 中创建 `photos` bucket。
2. 当前页面通过 `getPublicUrl` 展示图片，因此要么将 bucket 设为 Public，要么调整代码改用签名 URL。
3. 为当前客户端身份配置 `INSERT`、`SELECT` 和 `DELETE` 策略。
4. 上传、查看和删除各测试一次。

相册删除流程会先删除数据库记录，再尝试清理 Storage 文件。数据库权限和 Storage 权限必须分别配置。

## 4. 配置头像 Storage

自定义头像使用名为 `avatars` 的 bucket：

1. 创建 `avatars` bucket。
2. 根据展示方式配置公开读取或签名 URL。
3. 执行 `database/migrations/update-profile-avatar.sql`，为 `user_profiles` 增加 `avatar_url`。
4. 配置与当前身份匹配的上传和读取策略。

不使用自定义头像上传时，可以只保留 emoji 头像，不需要创建此 bucket。

## 5. Realtime

聊天页面依赖 `chat_messages` 的 Realtime 订阅。推荐执行
`database/migrations/chat-table-safe.sql`，该脚本会在缺少时把表加入 `supabase_realtime` publication。

五子棋和麻将的多人状态也依赖对应表结构与 Realtime 配置。遇到旧表字段不兼容时，先阅读：

- `database/migrations/upgrade-gomoku-table.sql`
- `database/migrations/add-mahjong-table.sql`
- `database/fixes/fix-gomoku-mahjong.sql`

修复脚本只用于对应历史问题，执行前必须备份。

## 6. 验证

启动项目：

```bash
npm run dev
```

至少验证：

- 首页能读取统计和纪念日
- 相册能上传、分页读取和删除
- 日记、日程和时光胶囊能新增与读取
- 已启用的可选功能没有缺表或缺字段错误
- 聊天的新消息能在另一个浏览器窗口出现

也可以在 SQL Editor 执行只读脚本 `database/diagnostics/check-tables.sql` 查看核心表字段。

## 常见问题

### `relation ... does not exist`

对应功能表尚未创建。用错误中的表名在 `database/` 搜索，再按 [数据库脚本说明](../../database/README.md) 选择脚本。

### `column ... does not exist`

数据库来自旧版本，缺少增量字段。例如旧 `photos` 表缺少 `tag` 时，执行
`database/migrations/add-photo-tag.sql`。

### RLS 拒绝请求

RLS 已启用但没有允许当前角色执行该操作的策略。先确认请求使用的是匿名角色还是已认证用户，再设计策略。不要为了消除错误直接在公开生产环境使用 `USING (true)`。

### Storage 上传或删除失败

确认 bucket 名称完全是 `photos` 或 `avatars`，并分别检查 bucket 可见性、对象路径和 Storage policy。数据库表策略不会自动授权 Storage。

### 密钥疑似泄露

立即在 Supabase 控制台轮换相关密钥，更新本地和部署平台变量，并检查 Git 历史与部署日志。仅从当前文件删除密钥不能消除历史泄露。

## 安全边界

当前 `hooks/useAuth.ts` 主要把用户标识保存在 `localStorage`，不是 Supabase Auth，也不是可信的服务端身份。部分历史 SQL 为私人测试采用公开读写策略。因此：

- 私人、受限环境可以按现有策略验证功能。
- 公开部署前必须接入可靠认证，并按用户/资源重写 RLS 与 Storage policy。
- 时光胶囊的收件人和开启时间限制目前主要由客户端执行，不能视为防越权措施。
- 数据库和 Storage 应定期备份，真实密钥不得出现在仓库、截图或日志中。
