# 数据库脚本说明

本目录集中管理 Supabase/PostgreSQL 脚本。请在执行任何脚本前备份数据库，并先阅读脚本顶部的注释。

## 目录分类

| 目录 | 用途 |
| --- | --- |
| `setup/` | 新环境初始化或一组功能的完整初始化 |
| `migrations/` | 为已有数据库添加表、字段、数据或功能 |
| `fixes/` | 修复历史表结构、权限、安全策略或兼容性问题 |
| `diagnostics/` | 只读检查与问题诊断 |

## 推荐用法

### 新项目

1. 先执行 `setup/supabase-schema.sql`，创建最基础的业务表。
2. 再执行 `setup/complete-database-setup.sql`，补齐后续核心功能表、索引和策略。
3. 按实际启用的功能，从 `migrations/` 选择仍缺少的脚本。
4. 执行 `diagnostics/check-tables.sql` 检查关键表结构。

`setup/complete-database-setup.sql` 与部分迁移脚本存在历史重叠。脚本大多使用 `IF NOT EXISTS`，但不要无差别批量执行；应先核对目标数据库当前结构。

### 已有项目

1. 不要重新执行基础建表脚本覆盖现有结构。
2. 根据功能需求执行对应的 `migrations/` 脚本。
3. 只有遇到对应历史问题时，才执行 `fixes/` 中的脚本。
4. 涉及 `TRUNCATE`、策略重建或约束修改的脚本，必须先备份并人工确认。

## 重点脚本

| 脚本 | 说明 |
| --- | --- |
| `setup/supabase-schema.sql` | 照片、纪念日、食物、留言、五子棋等基础表 |
| `setup/complete-database-setup.sql` | 倒计时、日程、时光胶囊、日记等后续功能的综合初始化 |
| `setup/NEW_FEATURES_DATABASE_SETUP.sql` | 塔罗、星座、穿搭等一组历史新增功能 |
| `migrations/add-photo-tag.sql` | 为已有照片表补充分类字段和查询索引 |
| `migrations/supabase-new-tables-safe.sql` | 以较安全、可重复执行的方式补充一组新表和字段 |
| `migrations/chat-table-safe.sql` | 推荐用于初始化聊天表的可重复执行版本 |
| `diagnostics/check-tables.sql` | 查看部分关键表的字段结构 |

## 风险提示

- `migrations/update-food-options.sql` 会清空并重建食物选项数据。
- 已有数据库使用相册分类前，需要执行 `migrations/add-photo-tag.sql`；全新数据库的基础脚本已包含该字段。
- `fixes/` 目录中的脚本可能修改 RLS、策略、约束和现有字段。
- `*-safe.sql` 只表示脚本尽量支持重复执行，不代表无需备份。
- 本项目的部分策略允许公开访问，部署到公开环境前应重新审查认证和 RLS。
