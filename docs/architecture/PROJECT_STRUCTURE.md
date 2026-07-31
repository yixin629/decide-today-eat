# 项目结构说明

本文档说明当前仓库的目录职责。运行和部署方法以根目录 [README.md](../../README.md) 为准。

## 顶层结构

```text
.
├── app/                       # Next.js App Router 应用
├── hooks/                     # 通用 React Hooks
├── lib/                       # 服务客户端、功能注册表与工具函数
├── database/                  # Supabase/PostgreSQL 脚本
│   ├── setup/                 # 新环境初始化
│   ├── migrations/            # 增量功能与数据迁移
│   │   └── legacy/            # 仅供旧库追溯的历史迁移
│   ├── fixes/                 # 线上兼容、安全和数据修复
│   │   └── legacy/            # 已归档的旧修复方案
│   └── diagnostics/           # 只读检查
├── docs/                      # 分类文档
│   ├── getting-started/       # 安装和服务配置
│   ├── guides/                # 功能指南
│   ├── architecture/          # 架构与目录说明
│   └── reports/               # 历史开发报告
├── scripts/                   # 本地验证与维护脚本
├── patches/                   # 安全依赖兼容补丁
├── eslint.config.mjs          # ESLint 9 Flat Config
├── AGENTS.md                  # AI 开发协作规则
├── README.md                  # 项目入口
├── .env.local.example         # 环境变量名称模板
├── package.json               # npm 依赖与命令
├── next.config.js             # Next.js 配置
├── open-next.config.ts        # OpenNext Cloudflare 适配配置
├── cloudflare-env.d.ts        # Wrangler 生成的 Worker binding 与运行时类型
├── tailwind.config.ts         # Tailwind CSS 配置
├── tsconfig.json              # TypeScript 配置
└── wrangler.toml              # Cloudflare 配置
```

## 应用结构

`app/` 中每个带 `page.tsx` 的目录对应一个页面路由，例如：

```text
app/
├── page.tsx                   # 首页
├── layout.tsx                 # 根布局与全局 Provider
├── loading.tsx                # 路由切换时的全局加载反馈
├── error.tsx                  # 页面渲染异常兜底
├── not-found.tsx              # 404 页面
├── globals.css                # 全局样式和主题
├── api/chat/route.ts          # AI 聊天服务端接口
├── components/
│   ├── ai-chat/               # AI 聊天浮层、客户端与本地回复
│   ├── avatar/                # 头像选择
│   ├── feedback/              # Toast 等反馈组件
│   ├── home/                  # 首页专用展示组件
│   ├── layout/                # 导航和全局布局组件
│   ├── providers/             # 根级 Provider 与访问守卫
│   └── ui/                    # 跨功能基础 UI
├── photos/
│   ├── page.tsx               # /photos
│   ├── components/            # 相册专用组件
│   ├── lib/                   # 图片压缩等相册专用工具
│   └── types.ts               # 相册数据类型
├── expenses/
│   ├── page.tsx               # /expenses
│   └── components/            # 账本专用统计与空状态
├── dress-up/
│   ├── page.tsx               # /dress-up
│   ├── constants.ts           # 穿搭选项与场景数据
│   └── lib/                   # 穿搭专用工具
├── diary/page.tsx             # /diary
├── gomoku/
│   ├── page.tsx               # /gomoku
│   ├── [id]/page.tsx          # /gomoku/:id
│   └── engine/                # 五子棋规则逻辑
└── mahjong/
    ├── page.tsx               # /mahjong
    ├── [id]/page.tsx          # /mahjong/:id
    ├── components/            # 麻将专用组件
    └── engine/                # 麻将规则逻辑
```

跨页面 UI 按职责放入 `app/components/` 的子目录；只服务某个功能的组件、类型、常量和引擎代码应保留在该功能目录内。

`lib/features.ts` 是首页和导航共用的功能注册表。登录页、动态房间详情和 API 路由不作为独立产品入口登记。

## 公共代码

- `hooks/useAuth.ts`：读取并兼容历史本地登录标识。当前实现不是完整的服务端认证。
- `lib/anniversaries.ts`：解析本地纪念日日期并计算下一次发生时间。
- `lib/auth-session.ts`：统一读写和清理两个历史本地登录键。
- `lib/supabase.ts`：创建前端 Supabase 客户端。
- `lib/features.ts`：统一登记功能名称、路由、分类以及首页和导航的展示方式。

新增无 UI 的逻辑时，单功能代码先放该路由的 `lib/`；确认跨功能复用后再提升到根 `hooks/` 或 `lib/`，避免页面文件继续膨胀。

## 数据与身份边界

- 浏览器页面通过 `lib/supabase.ts` 使用匿名客户端访问 Supabase。
- `app/api/chat/route.ts` 在服务端读取 AI 服务密钥，不把密钥返回客户端。
- `hooks/useAuth.ts` 的当前用户来自浏览器本地存储，只用于界面身份，不是服务端认证。
- 相册使用 `photos` Storage bucket，自定义头像使用 `avatars` bucket。
- 多个历史 SQL 使用公开 RLS；公开部署前需要接入认证并重写策略。

## 数据库脚本

数据库脚本的选择和风险说明见 [database/README.md](../../database/README.md)。

- 初始化新环境：`database/setup/`
- 已有环境增加功能：`database/migrations/`
- 修复历史问题：`database/fixes/`
- 查看当前结构：`database/diagnostics/`
- 只用于旧环境追溯：`database/migrations/legacy/`、`database/fixes/legacy/`

全新数据库从 `database/setup/supabase-schema.sql` 和
`database/setup/planning-records-setup.sql` 开始，再按功能选择独立迁移。历史目录不能用于新环境初始化，也不能把整个 `database/` 当作顺序迁移自动执行。

## 文档结构

文档入口位于 [docs/README.md](../README.md)：

- `getting-started/` 只放当前仍适用的安装和配置步骤。
- `guides/` 放具体功能使用或部署说明。
- `architecture/` 放项目结构和技术设计。
- `reports/` 放开发阶段的历史快照，不作为当前状态的唯一依据。

部署说明统一维护在 [部署与持续集成](../getting-started/DEPLOYMENT.md)，不要把 Cloudflare Dashboard 命令分散复制到历史报告。

## 配置和环境

本地配置从 `.env.local.example` 复制到 `.env.local`。基础变量：

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

服务端 AI Key 只应存在于 `.env.local` 或部署平台的环境变量中，不得提交到仓库。

## 开发命令

```bash
npm ci
npm run dev
npm run lint
npm run typecheck
npm run build
npm run check
npm run cf:build
npm run cf-typegen
npm start
```

`npm run check` 依次运行 lint、类型检查和标准 Next.js 生产构建；
`npm run cf:build` 额外把产物转换为 Cloudflare Worker，二者用途不同。
`npm run cf-typegen` 从 `wrangler.toml` 和无敏感值的 `.env.local.example`
重新生成 `cloudflare-env.d.ts`。

## 添加新功能

1. 在 `app/<route>/page.tsx` 创建页面。
2. 功能专用代码放入 `app/<route>/components`、`lib`、`engine` 或 `types`；确认跨页面复用后再放入 `app/components/`。
3. 如需数据表，在 `database/migrations/` 新建独立、尽量可重复执行的 SQL。
4. 在 `lib/features.ts` 登记入口，由首页和导航共同读取。
5. 更新根 `README.md` 或相应 `docs/guides/` 文档。
6. 运行 lint 和类型检查；涉及路由、配置或生产行为时运行生产构建。
7. 目标包含 Cloudflare Workers 时，再运行 `npm run cf:build`。
