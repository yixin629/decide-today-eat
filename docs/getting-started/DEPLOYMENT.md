# 部署与持续集成

本文档记录当前仓库可用的 Vercel 和 Cloudflare Workers 部署方式。部署前请先在本地完成：

```bash
npm ci
npm run lint
npm run typecheck
npm run build
```

Cloudflare 还应额外执行：

```bash
npm run cf:build
```

## 环境变量

基础运行需要：

| 变量 | 用途 | 构建时 | 运行时 |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目地址 | 必需 | 通常不需要重复配置 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名客户端密钥 | 必需 | 通常不需要重复配置 |
| `GROQ_API_KEY` | AI 聊天服务端密钥 | 按需 | 按需、必须作为 Secret |
| `CHATANYWHERE_API_KEY` | AI 聊天备用服务端密钥 | 按需 | 按需、必须作为 Secret |

不要把真实值写入 `.env.local.example`、`wrangler.toml`、源码或文档。Supabase `service_role` 密钥也不能放进客户端变量。

## Vercel

1. 在 Vercel 导入 GitHub 仓库 `yixin629/decide-today-eat`。
2. Framework Preset 选择 Next.js，Root Directory 保持仓库根目录。
3. 在 Project Settings > Environment Variables 添加需要的变量。
4. Production Branch 选择 `main`。
5. 保持默认的 Install、Build 和 Output 设置。

本仓库使用 Next.js 服务端 API，不能改成纯静态导出。部署失败时先查看 Vercel 构建日志中的第一条实际错误，而不是只看最后的退出码。

## Cloudflare Workers

仓库使用 `@opennextjs/cloudflare`，目标 Worker 名称由 `wrangler.toml` 的 `name` 定义。当前名称是：

```text
zyxzlyforever0912
```

### Workers Builds 推荐配置

在 Cloudflare Dashboard 进入 Workers & Pages，选择同名 Worker，然后打开 Settings > Build：

| 设置 | 值 |
| --- | --- |
| Git repository | `yixin629/decide-today-eat` |
| Production branch | `main` |
| Root directory | 留空，即仓库根目录 |
| Build command | `npm run cf:build` |
| Deploy command | `npx @opennextjs/cloudflare deploy` |
| Non-production branch deploy command | `npx @opennextjs/cloudflare upload` |

这与 OpenNext 官方的 Workers Builds 两阶段配置一致：Build command 生成 `.open-next/`，Deploy command 只发布已经生成的 Worker，日志也能明确区分构建与上传阶段。

也可以使用单条完整部署命令：

| 设置 | 值 |
| --- | --- |
| Build command | 留空 |
| Deploy command | `npm run deploy` |
| Non-production branch deploy command | `npm run upload` |

`npm run deploy` 和 `npm run upload` 已包含构建步骤。两套配置任选一套，不要把 `npm run cf:build` 与包含构建的完整脚本混在同一次流水线中。

Workers Builds 不会自动采用 `wrangler.toml` 的 `[build]` Custom Build 设置，因此 Dashboard 中的 Build command 必须明确填写。若以后添加了 Cloudflare Dashboard 普通运行时 Variables，可把正式部署命令改为
`npx @opennextjs/cloudflare deploy -- --keep-vars`，避免部署覆盖这些变量。

### Cloudflare 变量

在 Settings > Build > Build variables and secrets 添加：

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

在 Settings > Variables & Secrets 添加运行时 Secret：

```text
GROQ_API_KEY
CHATANYWHERE_API_KEY
```

仅启用一个 AI 服务时，只需配置对应密钥。如果构建过程中的服务端预渲染确实读取某个服务端变量，再把同名值额外添加为 Build secret；Build variables 不会自动成为 Worker 的运行时变量。

### GitHub 检查 0 秒失败

如果 `Cloudflare Workers and Pages / Workers Builds` 在 0 秒左右失败，通常说明还没有进入 npm 安装或项目编译阶段。按下面顺序检查：

1. 打开失败检查的 `Build ID`，读取日志中的第一条红色错误。
2. 在 Settings > Build 确认仓库、`main` 分支和 Root directory。
3. 在 GitHub 的 Installed GitHub Apps 中确认 `Cloudflare Workers and Pages` 可以访问本仓库；必要时在 Cloudflare 的 Settings > Build > Manage 重新连接。
4. 在 Settings > Build 的 API token 区域重新生成或重新选择构建令牌。
5. 确认连接的是 `zyxzlyforever0912` Worker，并检查 `wrangler.toml` 仍位于仓库根目录。
6. 保存设置后触发一个新构建；重试旧构建时也要确认它使用的是最新 Build settings。

如果失败发生在几十秒或数分钟之后，再根据日志判断属于依赖安装、Next.js 构建、OpenNext 转换、Worker 大小或部署权限问题。

## 本地 Cloudflare 验证

```bash
npm run cf:build
npm run preview
```

首次从本机部署前需要登录：

```bash
npx wrangler login
npx wrangler whoami
npm run deploy
```

`npm run deploy` 会修改线上 Worker，只应在确认账号、Worker 名称和环境变量后执行。日常由 Git 集成部署时不需要在本地运行它。

## 配置文件职责

- `wrangler.toml`：Worker 名称、入口、兼容日期、静态资源和 Service Binding。
- `open-next.config.ts`：OpenNext Cloudflare 适配器配置。
- `package.json`：本地预览、构建、上传和部署命令。
- `.env.local.example`：变量名称模板，不包含真实值。

官方参考：

- [Cloudflare Workers Builds 配置](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)
- [Cloudflare Next.js 部署指南](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/)
- [OpenNext Cloudflare 入门](https://opennext.js.org/cloudflare/get-started)
- [OpenNext Cloudflare CLI](https://opennext.js.org/cloudflare/cli)
