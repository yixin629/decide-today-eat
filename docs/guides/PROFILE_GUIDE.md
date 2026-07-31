# 个人资料与提醒指南

个人资料页位于 `/profile`，个人设置页位于 `/settings`。两者都依赖 `user_profiles`，提醒使用 `reminders`。

## 数据库准备

在 Supabase SQL Editor 执行：

```text
database/migrations/profile-tables.sql
```

需要上传自定义头像时，再执行：

```text
database/migrations/update-profile-avatar.sql
```

并创建名为 `avatars` 的 Supabase Storage bucket。Storage 读取和上传权限要单独配置，数据库 RLS 不会自动授权文件操作。

## 个人资料

`/profile` 可记录：

- 姓名
- 昵称
- 生日
- emoji 头像
- 对方的名字

页面会显示生日信息和距离下次生日的天数。当前登录身份是固定的本地标识，页面会用它匹配
`user_profiles.name`；两份资料的姓名因此应分别与所用登录标识一致，并保持唯一。

`/settings` 用于调整昵称、个性签名和自定义头像等个人偏好。上传头像后，公开 URL 会保存到 `user_profiles.avatar_url`。

## 提醒

提醒包含：

- 标题与说明
- 提醒日期
- 提醒对象
- 创建者
- 完成状态

个人资料页打开时会检查临近生日，并在符合条件时创建生日提醒。它不是持续运行的后台任务，因此：

- 页面未打开时不会主动检查。
- 当前没有浏览器推送、邮件或微信通知。
- 同一生日提醒是否重复取决于数据库中已有记录和页面检查结果。

处理完成后可标记提醒，或删除不再需要的记录。

## 当前身份

当前身份保存在浏览器 `localStorage` 中，供页面显示作者、发送者和收件人。它具有以下限制：

- 换浏览器或清理站点数据后需要重新选择。
- 不会自动同步到另一台设备。
- 用户可以在浏览器中修改这个值。
- 它不是 Supabase Auth，不能用于可信授权。

公开部署前，应接入可靠认证，并把 `user_profiles`、`reminders`、Storage 与其他业务表的 RLS 绑定到真实用户 ID。

## 常见问题

### 资料或提醒无法加载

确认 `profile-tables.sql` 已执行，并检查浏览器控制台是否出现缺表、缺字段或 RLS 错误。

### 自定义头像上传失败

确认：

1. `avatars` bucket 已创建。
2. `user_profiles.avatar_url` 字段存在。
3. 当前客户端角色拥有对应对象路径的上传和读取权限。
4. bucket 可见性与代码使用公开 URL 的方式一致。

### 生日提醒没有出现

打开 `/profile` 并刷新一次，确认生日字段有效、日期在提醒范围内，并检查是否已经存在同类提醒。

### 两个人显示成同一身份

重新选择当前身份，并检查两份个人资料的 `name` 是否重复。身份仍只保存在当前浏览器中。
