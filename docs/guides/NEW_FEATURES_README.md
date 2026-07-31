# 计划与记录功能指南

本文档覆盖倒计时、共享日程、时光胶囊和恋爱日记。四个页面的当前数据表由
`database/setup/complete-database-setup.sql` 创建。

## 数据库准备

全新数据库先执行：

1. `database/setup/supabase-schema.sql`
2. `database/setup/complete-database-setup.sql`

对应关系：

| 页面 | 路由 | 表 |
| --- | --- | --- |
| 时光计时器 | `/countdown` | `countdowns` |
| 共享日程 | `/schedule` | `schedules` |
| 时光胶囊 | `/time-capsule` | `time_capsules` |
| 恋爱日记 | `/diary` | `diary_entries` |

历史数据库可能来自 `supabase-new-tables.sql`、`supabase-new-tables-safe.sql` 或早期修复脚本，字段名不完全一致。不要根据文件名中的 `safe` 判断一定适合当前结构；执行前先用
`database/diagnostics/check-tables.sql` 查看字段，再阅读 [数据库脚本说明](../../database/README.md)。

## 时光计时器

时光计时器支持：

- 为未来日期创建倒计时
- 从过去日期开始正计时
- 自定义标题和 emoji
- 删除不再需要的计时器

页面会根据 `type`、`target_date` 计算显示结果。浏览器时间不准确时，显示也会受影响。

## 共享日程

共享日程支持：

- 标题、描述、日期时间和地点
- 提前提醒分钟数
- 即将到来、已完成和已取消状态
- 按状态筛选和删除

当前提醒是页面内提示，不是浏览器推送、邮件或系统后台任务；关闭页面后不会主动发送通知。

## 时光胶囊

时光胶囊使用 `sender`、`receiver` 和 `unlock_date`：

1. 当前用户创建内容并选择收件人。
2. 列表查询不直接下载正文。
3. 到达开启时间且当前本地身份符合条件时，页面再读取正文。
4. 开启结果写回 `is_opened` 和 `opened_at`。

这是体验层面的限制，不是可靠的安全控制。数据库当前公开策略仍可能允许客户端绕过页面直接读取或修改数据；公开部署前必须使用 Supabase Auth、服务端时间和严格 RLS。

## 恋爱日记

恋爱日记支持：

- 日期、标题、正文、心情、天气和贴纸
- 按日期查看
- 新增、编辑和删除
- 编辑草稿在浏览器本地延迟保存和恢复

本地草稿只用于防止误关闭丢字，不等同于已写入 Supabase。更换浏览器、清理本地存储或使用另一台设备时，未正式保存的草稿不会同步。

如果数据库缺少天气或贴纸字段，执行：

```text
database/migrations/enhance-diary-table.sql
```

## 身份与数据安全

这些页面使用 `hooks/useAuth.ts` 提供的浏览器本地用户标识。它可以区分界面中的两位使用者，但不能证明请求者身份。因此：

- 不要把页面上的发送者、收件人或作者校验当作服务端授权。
- 不要在公开环境继续使用允许匿名全量读写的策略。
- 删除和结构迁移前先备份 Supabase 数据。
- 多设备同步只覆盖已经保存到数据库的数据。

## 排错

- `relation does not exist`：对应表尚未创建。
- `column does not exist`：旧表缺少当前字段，先运行只读诊断再选迁移。
- `new row violates row-level security policy`：RLS 没有允许当前角色执行该操作。
- 时间显示不一致：检查浏览器时区、数据库字段类型和保存值是否包含时区。
