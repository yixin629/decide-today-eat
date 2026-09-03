# 我们的小世界

一个使用 Next.js、TypeScript、Tailwind CSS 和 Supabase 开发的情侣专属网站，用于共同记录生活、管理计划、分享照片和进行双人互动。

## 主要功能

- 生活记录：照片、日记、留言、心情、纪念日、签到、穿搭和共同账本
- 共同计划：日程、倒计时、心愿清单、愿望清单、时光胶囊和 PTE 智能备考计划
- 双人互动：聊天、情书、甜言蜜语、情侣测试、真心话大冒险
- 游戏娱乐：五子棋、麻将、你画我猜、记忆翻牌、石头剪刀布等
- 个性体验：个人资料、主题设置、音乐播放器、塔罗和星座
- AI 助手：通过服务端 API 调用已配置的模型服务

首页按“今天、回忆记录、一起计划、甜蜜互动、游戏与创作、我的”分类展示常用功能；
桌面端抽屉与移动端底栏提供完整导航。功能名称、路径和分类统一登记在
`lib/features.ts`，新增页面时应同步更新该注册表。

界面支持浅色、深色和护眼模式，并兼顾键盘操作、减少动态效果偏好与移动端触控。
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
npm ci
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
2. `database/setup/planning-records-setup.sql`
3. `database/migrations/enhance-diary-table.sql`
4. `database/migrations/enhance-notes-table.sql`
5. 根据启用的功能，按 `database/README.md` 的功能映射选择补充迁移

已有数据库不要直接重复执行所有脚本。请先阅读 [数据库脚本说明](./database/README.md)，确认迁移顺序和风险。
如果现有 `photos` 表还没有 `tag` 字段，相册分类功能需要单独执行
`database/migrations/add-photo-tag.sql`；全新数据库的基础脚本已经包含该字段。

两份基础 setup 脚本不会创建全部可选功能表。聊天、个人资料、签到、账本、音乐、互动游戏等功能各有独立迁移，具体以数据库脚本说明为准。

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
npm run check
npm run cf:build
npm run cf-typegen
npm start
```

## 项目结构

```text
.
├── app/                    # Next.js 路由与功能代码
│   ├── components/         # 按 ui、feedback、layout、providers、领域分类的共享组件
│   └── <route>/            # 页面及其专用 components、lib、engine、types
├── hooks/                  # React Hooks
├── lib/                    # Supabase 客户端、功能注册表与通用工具
├── database/
│   ├── setup/              # 新环境初始化脚本
│   ├── migrations/         # 当前增量功能和数据变更
│   │   └── legacy/         # 已被替代的历史迁移
│   ├── fixes/              # 定向兼容性与安全修复
│   │   └── legacy/         # 已被替代的历史综合修复
│   └── diagnostics/        # 数据库检查脚本
├── docs/
│   ├── getting-started/    # 安装与配置
│   ├── guides/             # 功能使用指南
│   ├── architecture/       # 项目结构说明
│   └── reports/            # 历史实现与优化报告
├── scripts/                # 本地项目验证辅助脚本
├── patches/                # 第三方依赖兼容补丁
├── eslint.config.mjs       # ESLint Flat Config
├── cloudflare-env.d.ts     # Wrangler 生成的 Worker 类型
├── AGENTS.md               # AI/自动化开发协作规范
└── README.md               # 项目入口文档
```

更多说明见 [文档索引](./docs/README.md) 和 [项目结构说明](./docs/architecture/PROJECT_STRUCTURE.md)。

## 数据库维护约定

- 新功能建表或加字段放入 `database/migrations/`。
- 全新环境的一次性初始化脚本放入 `database/setup/`。
- 修复历史数据、权限或兼容性问题放入 `database/fixes/`。
- 只读排查脚本放入 `database/diagnostics/`。
- SQL 文件名使用小写 kebab-case；被替代的脚本归入对应 `legacy/`，不用于默认初始化。
- 任何会清空数据、删除对象或放宽安全策略的脚本，都必须在文件顶部明确标注。

## 部署

推荐将仓库连接到 Vercel，并在部署平台配置与本地相同的环境变量。仓库也支持通过 OpenNext 部署到 Cloudflare Workers，完整操作和故障排查见 [部署与持续集成](./docs/getting-started/DEPLOYMENT.md)。

- Cloudflare Worker 配置：`wrangler.toml`
- OpenNext 配置：`open-next.config.ts`
- Cloudflare 本地构建：`npm run cf:build`
- Cloudflare 本地预览：`npm run preview`

Cloudflare Workers Builds 推荐使用 OpenNext 的分阶段命令：

```text
Production branch: main
Root directory: 留空（仓库根目录）
Build command: npm run cf:build
Deploy command: npx @opennextjs/cloudflare deploy
Non-production branch deploy command: npx @opennextjs/cloudflare upload
```

不要在同一流水线中再调用包含构建步骤的 `npm run deploy`，否则会重复构建。仓库不在 `wrangler.toml` 中配置 Custom Build，Dashboard 的 Build command 需要明确填写。

在 Cloudflare 的 Build variables 中配置两个 `NEXT_PUBLIC_SUPABASE_*` 变量；AI Key 应配置为 Worker 运行时 Secret。不要把真实值写入 `wrangler.toml`。

`scripts/verify-project.bat` 和 `scripts/verify-project.sh` 会安装锁定依赖并执行
`npm run check`（lint、类型检查和生产构建），不会把项目发布到 Vercel 或 Cloudflare。

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
