# 快速启动指南

本指南用于在本地运行当前项目。完整项目说明见根目录 [README.md](../../README.md)。

## 1. 准备环境

- Node.js 20.9 或更高版本
- npm
- 一个 Supabase 项目

在仓库根目录安装锁定版本的依赖：

```bash
npm ci
```

`postinstall` 会自动应用 `patches/` 中的兼容补丁。如果安装阶段提示补丁失败，不要忽略，应先确认依赖版本和补丁是否仍匹配。

## 2. 创建本地环境文件

Windows PowerShell：

```powershell
Copy-Item .env.local.example .env.local
```

macOS 或 Linux：

```bash
cp .env.local.example .env.local
```

至少填写：

```env
NEXT_PUBLIC_SUPABASE_URL=你的项目地址
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的匿名客户端密钥
```

AI 助手需要时，再填写 `GROQ_API_KEY` 或 `CHATANYWHERE_API_KEY`。不要提交 `.env.local`。

## 3. 初始化 Supabase

全新数据库先在 Supabase SQL Editor 依次执行：

1. `database/setup/supabase-schema.sql`
2. `database/setup/planning-records-setup.sql`
3. `database/migrations/enhance-diary-table.sql`
4. `database/migrations/enhance-notes-table.sql`

然后根据启用的功能执行独立迁移。两份 setup 脚本只覆盖基础、计划和记录类表；聊天、个人资料、签到、共同账本、音乐和全部互动游戏仍需按 [数据库脚本说明](../../database/README.md) 选择当前迁移。

不要对已有数据库无差别执行全部 SQL。先备份，再核对表和字段。

## 4. 配置 Storage

需要上传照片时，创建 `photos` bucket；需要上传自定义头像时，创建 `avatars` bucket。当前代码通过公开 URL 展示这些文件，因此 bucket 和策略必须与实际认证方案匹配。

详细步骤和安全说明见 [Supabase 配置指南](./SUPABASE_SETUP.md)。

## 5. 启动

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)。

同一局域网内需要从手机访问时：

```bash
npm run dev -- --hostname 0.0.0.0
```

再通过 `http://电脑局域网IP:3000` 打开。只在可信网络中使用这种方式。

## 6. 提交前检查

```bash
npm run check
```

该命令会依次运行 lint、类型检查和标准生产构建。

如果目标是 Cloudflare Workers，再运行：

```bash
npm run cf:build
```

## 常见问题

### 缺少表或字段

如果浏览器控制台出现 `relation does not exist` 或 `column does not exist`，不要反复执行所有 SQL。根据错误中的表名或字段名，在 [数据库脚本说明](../../database/README.md) 查找对应迁移。

### RLS 或 Storage 拒绝访问

确认目标表已启用正确的 RLS 策略，Storage bucket 也有与当前身份匹配的读、写或删除策略。当前浏览器本地身份不是 Supabase Auth，不能满足基于 `auth.uid()` 的生产策略。

### 端口被占用

```bash
npm run dev -- -p 3001
```

### TypeScript 或生产构建失败

先分别运行：

```bash
npm run typecheck
npm run build
```

修复输出中的第一条实际错误。`npm run build` 不是“重新生成类型”的替代命令。

## 部署

Vercel 和 Cloudflare Workers 的准确配置见 [部署与持续集成](./DEPLOYMENT.md)。不要使用旧的一键部署链接或示例仓库地址。
