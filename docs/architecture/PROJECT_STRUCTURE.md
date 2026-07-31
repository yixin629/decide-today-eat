# 项目结构说明

本文档说明当前仓库的目录职责。运行和部署方法以根目录 [README.md](../../README.md) 为准。

## 顶层结构

```text
.
├── app/                       # Next.js App Router 应用
├── hooks/                     # 通用 React Hooks
├── lib/                       # 服务客户端与工具函数
├── database/                  # Supabase/PostgreSQL 脚本
│   ├── setup/                 # 新环境初始化
│   ├── migrations/            # 增量功能与数据迁移
│   ├── fixes/                 # 历史问题与安全修复
│   └── diagnostics/           # 只读检查
├── docs/                      # 分类文档
│   ├── getting-started/       # 安装和服务配置
│   ├── guides/                # 功能指南
│   ├── architecture/          # 架构与目录说明
│   └── reports/               # 历史开发报告
├── scripts/                   # 部署辅助脚本
├── patches/                   # 安全依赖兼容补丁
├── eslint.config.mjs          # ESLint 9 Flat Config
├── AGENTS.md                  # AI 开发协作规则
├── README.md                  # 项目入口
├── package.json               # npm 依赖与命令
├── next.config.js             # Next.js 配置
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
├── globals.css                # 全局样式和主题
├── api/chat/route.ts          # AI 聊天服务端接口
├── components/                # 跨页面共享组件
├── photos/page.tsx            # /photos
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

跨页面 UI 放在 `app/components/`；只服务某个复杂功能的组件和引擎代码应保留在该功能目录内。

## 公共代码

- `hooks/useAuth.ts`：读取并兼容历史本地登录标识。当前实现不是完整的服务端认证。
- `lib/supabase.ts`：创建前端 Supabase 客户端。
- `lib/imageUtils.ts`：图片处理工具。

新增无 UI 的通用逻辑时优先放入 `hooks/` 或 `lib/`，避免页面文件继续膨胀。

## 数据库脚本

数据库脚本的选择和风险说明见 [database/README.md](../../database/README.md)。

- 初始化新环境：`database/setup/`
- 已有环境增加功能：`database/migrations/`
- 修复历史问题：`database/fixes/`
- 查看当前结构：`database/diagnostics/`

数据库中存在基础功能表、生活记录表、互动功能表和游戏状态表。由于脚本来自多个开发阶段，部分建表内容存在重叠；维护时应按目标数据库现状选择脚本，不能把整个目录当作顺序迁移自动执行。

## 文档结构

文档入口位于 [docs/README.md](../README.md)：

- `getting-started/` 只放当前仍适用的安装和配置步骤。
- `guides/` 放具体功能使用或部署说明。
- `architecture/` 放项目结构和技术设计。
- `reports/` 放开发阶段的历史快照，不作为当前状态的唯一依据。

## 配置和环境

本地配置从 `.env.local.example` 复制到 `.env.local`。基础变量：

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

服务端 AI Key 只应存在于 `.env.local` 或部署平台的环境变量中，不得提交到仓库。

## 开发命令

```bash
npm install
npm run dev
npm run lint
npm run typecheck
npm run build
npm start
```

## 添加新功能

1. 在 `app/<route>/page.tsx` 创建页面。
2. 把可复用 UI 提取到 `app/components/`。
3. 如需数据表，在 `database/migrations/` 新建独立、尽量可重复执行的 SQL。
4. 将入口加入首页或导航组件。
5. 更新根 `README.md` 或相应 `docs/guides/` 文档。
6. 运行 lint 和类型检查；涉及路由、配置或生产行为时再运行生产构建。
