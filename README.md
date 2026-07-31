# 我们的小世界

一个使用 Next.js、TypeScript、Tailwind CSS 和 Supabase 开发的情侣专属网站，用于共同记录生活、管理计划、分享照片和进行双人互动。

## 主要功能

- 生活记录：照片、日记、留言、心情、纪念日、签到、穿搭和共同账本
- 共同计划：日程、倒计时、心愿清单、愿望清单和时光胶囊
- 双人互动：聊天、情书、甜言蜜语、情侣测试、真心话大冒险
- 游戏娱乐：五子棋、麻将、你画我猜、记忆翻牌、石头剪刀布等
- 个性体验：个人资料、主题设置、音乐播放器、塔罗和星座
- AI 助手：通过服务端 API 调用已配置的模型服务

完整页面位于 `app/`，当前功能路由可直接从该目录查看。

## 技术栈

| 类别 | 技术 |
| --- | --- |
| Web 框架 | Next.js 16（App Router、Turbopack） |
| 开发语言 | TypeScript、React 19 |
| 样式 | Tailwind CSS |
| 数据与存储 | Supabase（PostgreSQL、Storage） |
| 日期处理 | date-fns |
| Markdown | react-markdown、remark-gfm |

## 快速开始

### 1. 安装依赖

请先安装 Node.js 20.9 或更高版本。

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.local.example` 为 `.env.local`，至少填写：

```env
NEXT_PUBLIC_SUPABASE_URL=你的项目地址
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的匿名访问密钥
```

如需 AI 聊天功能，再按 `.env.local.example` 配置相应服务的 API Key。不要提交 `.env.local` 或任何真实密钥。

### 3. 初始化数据库

在 Supabase Dashboard 的 SQL Editor 中执行：

1. `database/setup/supabase-schema.sql`
2. `database/setup/complete-database-setup.sql`
3. 根据启用的功能，选择执行 `database/migrations/` 中的补充脚本

已有数据库不要直接重复执行所有脚本。请先阅读 [数据库脚本说明](./database/README.md)，确认迁移顺序和风险。

### 4. 配置图片存储

需要照片上传时，在 Supabase Storage 创建公开的 `photos` bucket，或根据实际认证方案配置对应访问策略。头像功能还可能需要 `avatars` bucket。

### 5. 启动项目

```bash
npm run dev
```

浏览器访问 [http://localhost:3000](http://localhost:3000)。

## 常用命令

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
npm start
```

## 项目结构

```text
.
├── app/                    # 页面、组件、API 路由与游戏逻辑
├── hooks/                  # React Hooks
├── lib/                    # Supabase 客户端与通用工具
├── database/
│   ├── setup/              # 新环境初始化脚本
│   ├── migrations/         # 增量功能和数据变更
│   ├── fixes/              # 兼容性、安全与历史修复
│   └── diagnostics/        # 数据库检查脚本
├── docs/
│   ├── getting-started/    # 安装与配置
│   ├── guides/             # 功能使用指南
│   ├── architecture/       # 项目结构说明
│   └── reports/            # 历史实现与优化报告
├── scripts/                # 部署辅助脚本
├── patches/                # 第三方依赖兼容补丁
├── eslint.config.mjs       # ESLint Flat Config
├── AGENTS.md               # AI/自动化开发协作规范
└── README.md               # 项目入口文档
```

更多说明见 [文档索引](./docs/README.md) 和 [项目结构说明](./docs/architecture/PROJECT_STRUCTURE.md)。

## 数据库维护约定

- 新功能建表或加字段放入 `database/migrations/`。
- 全新环境的一次性初始化脚本放入 `database/setup/`。
- 修复历史数据、权限或兼容性问题放入 `database/fixes/`。
- 只读排查脚本放入 `database/diagnostics/`。
- SQL 文件名使用小写 kebab-case；已有历史文件暂时保留原名。
- 任何会清空数据、删除对象或放宽安全策略的脚本，都必须在文件顶部明确标注。

## 部署

推荐将仓库连接到 Vercel，并在部署平台配置与本地相同的环境变量。仓库也支持通过 OpenNext 部署到 Cloudflare Workers：

- Windows：`scripts/deploy.bat`
- Linux/macOS：`scripts/deploy.sh`
- Cloudflare Worker 配置：`wrangler.toml`
- OpenNext 配置：`open-next.config.ts`

Cloudflare Workers Builds 的构建设置应为：

```text
Build command: npm run cf:build
Deploy command: npx opennextjs-cloudflare deploy
```

`wrangler.toml` 也配置了 OpenNext 自定义构建，因此 Cloudflare 保留默认的
`npx wrangler deploy` 部署命令时仍能生成正确的 Worker；使用上面的专用命令可以减少重复构建。

在 Cloudflare 项目的 Build Variables and secrets 中配置
`NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_ANON_KEY`，并按需配置聊天功能使用的
`GROQ_API_KEY`、`CHATANYWHERE_API_KEY`。
不要把这些值直接写入 `wrangler.toml`。Cloudflare Git 集成会在监听分支每次收到提交时自动构建；
如不需要自动部署，应在 Cloudflare 的 Settings > Build 中断开 Git 仓库。

执行部署脚本前请先阅读脚本内容，确认其中的分支、构建和目标平台符合当前环境。

## 依赖安全

- 使用 `npm audit` 检查完整依赖树。
- `package.json` 中的 `overrides` 用于将上游间接依赖固定到已修复版本。
- `patches/` 中的补丁由 `postinstall` 自动应用，用于兼容安全版依赖的导出变化。
- 调整 Next.js、ESLint、PostCSS、Sharp、minimatch 或 brace-expansion 时，必须重新运行安装、lint、类型检查、构建和安全审计。

## 安全说明

本项目最初面向私人使用，部分数据库脚本采用宽松的公开访问策略，前端登录状态也主要保存在浏览器本地。若要公开部署或供更多用户使用，应优先完成：

- 接入 Supabase Auth 或其他可靠认证方案
- 按用户和资源重新设计 RLS 策略
- 将敏感调用限制在服务端
- 审查 Storage bucket 的公开权限
- 定期备份数据库并轮换泄露的密钥

## 文档维护

- `README.md` 只保留当前项目概览、启动方式和关键约定。
- 操作指南放入 `docs/getting-started/` 或 `docs/guides/`。
- 阶段性总结和已完成报告放入 `docs/reports/`，仅作为历史记录。
- 目录或脚本路径变化时，同步更新 `README.md`、`AGENTS.md` 和相关文档链接。

## License

个人学习与私人使用项目。若计划公开分发，请补充明确的开源许可证。
