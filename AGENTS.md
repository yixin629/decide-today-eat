# AGENTS.md

本文件是 AI 编码助手和自动化工具在本仓库中的工作规范。开始修改前先阅读本文件，并以根目录 `README.md`、实际代码和当前任务要求为准。

## 项目概况

- 项目：我们的小世界（情侣生活记录与互动网站）
- 框架：Next.js 16 App Router（Turbopack）
- 语言：TypeScript、React 19
- 样式：Tailwind CSS
- 数据：Supabase PostgreSQL 与 Storage
- 包管理：npm

## 目录职责

| 路径 | 职责 |
| --- | --- |
| `app/` | 页面、API 路由、共享组件和功能内逻辑 |
| `app/components/` | 跨页面复用的 UI 组件 |
| `hooks/` | 通用 React Hooks |
| `lib/` | Supabase 客户端和无 UI 工具 |
| `database/setup/` | 全新数据库初始化脚本 |
| `database/migrations/` | 增量表结构、功能和数据迁移 |
| `database/fixes/` | 历史兼容、安全和数据修复 |
| `database/diagnostics/` | 只读数据库检查 |
| `docs/getting-started/` | 安装、环境和服务配置 |
| `docs/guides/` | 面向开发者或使用者的功能指南 |
| `docs/architecture/` | 项目结构和架构说明 |
| `docs/reports/` | 历史实现总结与优化报告 |
| `scripts/` | 部署和维护辅助脚本 |

## 开发流程

1. 先定位相关页面、组件、Hook、数据库脚本和文档。
2. 检查工作区已有改动，不覆盖或回退与当前任务无关的内容。
3. 以最小、聚焦的修改完成需求，避免顺手重构不相关模块。
4. 修改数据读写时，同时核对 Supabase 表名、字段、空值和错误处理。
5. 修改功能行为、目录或配置后，同步更新相关文档。
6. 完成后至少运行与变更相匹配的检查。

## 常用检查

```bash
npm run lint
npm run typecheck
npm run build
```

- 小范围文档或纯路径调整：检查链接、引用和目录即可。
- 页面或组件调整：至少运行 `npm run lint`。
- 类型、路由、配置、依赖或生产行为调整：运行 `npm run lint`、`npm run typecheck` 和 `npm run build`。
- 依赖调整后额外运行 `npm audit`，并确认 `postinstall` 补丁成功应用。
- 如果现有脚本本身失效，应说明是既有问题还是本次变更导致，不要隐瞒或绕过。

## 代码约定

- 使用函数组件、React Hooks 和 TypeScript。
- 页面遵循 App Router 结构：`app/<route>/page.tsx`。
- 仅在需要浏览器 API、状态或 Effect 时添加 `'use client'`。
- 跨页面复用的 UI 放入 `app/components/`；功能专用组件留在对应功能目录。
- 通用逻辑优先放入 `hooks/` 或 `lib/`，避免在多个页面复制实现。
- 保持现有无分号代码风格和项目 Prettier 配置。
- 优先复用现有 `ToastProvider`、`BackButton`、`LoadingSkeleton` 等组件。
- 不在客户端代码中放置服务端密钥。
- 不要删除 `package.json` 中的安全依赖覆盖或 `patches/` 中的兼容补丁；如需调整，必须重新验证 lint、类型、构建和审计。

## Supabase 与数据库规则

- 新建 SQL 前先搜索 `database/`，避免重复表、字段、策略和函数。
- 新项目初始化放入 `database/setup/`。
- 可独立应用的增量变更放入 `database/migrations/`。
- 针对线上历史问题的修复放入 `database/fixes/`。
- 查询表结构或排查数据的只读脚本放入 `database/diagnostics/`。
- 新迁移尽量可重复执行，例如合理使用 `IF EXISTS`、`IF NOT EXISTS`。
- 有破坏性的语句（`DROP`、`TRUNCATE`、无条件 `DELETE`、策略放宽）必须在脚本顶部写明影响和备份要求。
- 修改表结构时，同步检查所有使用该表的页面，并更新 `database/README.md`。
- 不自动执行数据库脚本；除非用户明确授权并提供目标数据库连接。

## 认证与安全边界

- 当前 `hooks/useAuth.ts` 主要从 `localStorage` 读取用户标识，不等同于可靠的服务端认证。
- 部分历史 SQL 使用宽松的公开 RLS 策略，不应默认视为适合公开生产环境。
- `.env.local`、API Key、Supabase service role key 和用户数据不得写入源码、日志或文档。
- 新增服务端接口时要验证输入，并避免把内部错误或密钥返回给客户端。
- 涉及公开部署、认证、RLS 或 Storage 权限的变更，需要在交付说明中明确安全影响。

## 文档规则

- 根目录只保留 `README.md` 与 `AGENTS.md` 两个 Markdown 入口。
- 当前可用的启动和配置说明写入 `README.md`。
- 专题指南按类型放入 `docs/`，并在 `docs/README.md` 添加入口。
- 阶段性报告放入 `docs/reports/`，不要把旧报告当成当前事实。
- 文档中的文件路径必须使用仓库相对路径，并在移动文件后同步修正。
- 新增或移动 SQL 时更新 `database/README.md`。

## 环境变量

以 `.env.local.example` 为字段来源。基础运行需要：

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

AI 聊天功能使用的第三方 Key 仅允许出现在本地或部署平台的环境变量中。新增环境变量时：

1. 在 `.env.local.example` 中添加无敏感值的占位符。
2. 在 `README.md` 或相应指南中说明用途。
3. 明确变量用于客户端还是服务端。

## 变更交付要求

交付说明应包含：

- 修改了什么以及主要文件位置
- 是否新增或需要执行 SQL
- 已运行哪些检查及结果
- 仍存在的限制、风险或需要用户手动完成的步骤

不要声称未实际运行的测试已经通过。
