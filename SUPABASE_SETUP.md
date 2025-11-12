# Supabase 配置指南

## 步骤 1: 创建 Supabase 项目

1. 访问 https://supabase.com
2. 注册/登录账号
3. 点击 "New Project"
4. 填写项目信息：
   - 项目名称：couple-website（或任意名称）
   - 数据库密码：设置一个强密码并保存好
   - 区域：选择离你最近的区域
5. 等待项目创建完成（约2分钟）

## 步骤 2: 获取 API 密钥

1. 在项目 Dashboard，点击左侧菜单的 "Project Settings"（齿轮图标）
2. 选择 "API" 选项卡
3. 找到以下信息：
   - **Project URL**: 类似 `https://xxxxxxxxxxxxx.supabase.co`
   - **anon public**: 一串很长的密钥

4. 复制这两个值，粘贴到项目根目录的 `.env.local` 文件：

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的anon密钥
```

## 步骤 3: 创建数据库表

1. 在 Supabase Dashboard，点击左侧菜单的 "SQL Editor"
2. 点击 "New query"
3. 复制项目根目录的 `supabase-schema.sql` 文件内容
4. 粘贴到 SQL 编辑器
5. 点击 "Run" 执行 SQL

执行成功后，你将看到以下表被创建：
- `photos` - 照片
- `anniversaries` - 纪念日
- `gomoku_games` - 五子棋游戏
- `food_options` - 食物选项
- `love_notes` - 留言
- `wishlist` - 心愿清单

## 步骤 4: 配置 Storage（照片上传功能）

1. 点击左侧菜单的 "Storage"
2. 点击 "Create a new bucket"
3. 填写信息：
   - Name: `photos`
   - Public bucket: ✅ 勾选（让照片可以公开访问）
4. 点击 "Create bucket"

### 设置 Storage 策略

需要创建 **3 个独立的策略**，分别控制上传、查看和删除权限。

#### 策略 1: 允许上传照片 (INSERT)

1. 点击刚创建的 `photos` bucket
2. 点击 "Policies" 标签
3. 点击 "New Policy" 按钮
4. 选择 **"INSERT"** 操作类型（或选择 "For full customization"）
5. 填写表单：
   - **Policy name**: 保持自动生成的名字，或改成 `Allow public uploads`
   - **Target roles**: 保持默认 "Defaults to all (public) roles if none selected"
   - **WITH CHECK expression**: 填写：
     ```
     (bucket_id = 'photos'::text)
     ```
     或者简化版：
     ```
     (bucket_id = 'photos')
     ```
6. 点击右下角绿色的 **"Review"** 按钮
7. 确认后点击 **"Save policy"** 保存

#### 策略 2: 允许查看照片 (SELECT)

1. 再次点击 "New Policy" 按钮（创建第二个策略）
2. 选择 **"SELECT"** 操作类型
3. 填写表单：
   - **Policy name**: 保持自动生成的名字，或改成 `Allow public reads`
   - **Target roles**: 保持默认
   - **USING expression**: 填写：
     ```
     (bucket_id = 'photos'::text)
     ```
     或者：
     ```
     (bucket_id = 'photos')
     ```
4. 点击 "Review" → "Save policy"

#### 策略 3: 允许删除照片 (DELETE)

1. 第三次点击 "New Policy" 按钮（创建第三个策略）
2. 选择 **"DELETE"** 操作类型
3. 填写表单：
   - **Policy name**: 保持自动生成的名字，或改成 `Allow public deletes`
   - **Target roles**: 保持默认
   - **USING expression**: 填写：
     ```
     (bucket_id = 'photos'::text)
     ```
     或者：
     ```
     (bucket_id = 'photos')
     ```
4. 点击 "Review" → "Save policy"

#### 验证策略

完成后，在 Policies 页面应该看到 3 个策略：
- ✅ Allow public uploads (INSERT) 或类似名称
- ✅ Allow public reads (SELECT) 或类似名称  
- ✅ Allow public deletes (DELETE) 或类似名称

**重要提示**：
- Supabase 新版界面会简化操作流程
- 你只需要在对应的操作类型下填写 `(bucket_id = 'photos')` 或 `(bucket_id = 'photos'::text)`
- 两种写法都可以，`::text` 是明确指定类型，但不加也能正常工作
- INSERT 操作填在 "WITH CHECK expression"
- SELECT 和 DELETE 操作填在 "USING expression"

## 步骤 5: 验证配置

1. 回到项目，确保 `.env.local` 文件配置正确
2. 重启开发服务器：
```bash
npm run dev
```
3. 访问 http://localhost:3000
4. 测试各个功能是否正常工作

## 可选：添加身份验证

如果你想要添加登录功能保护网站：

1. 在 Supabase Dashboard，点击 "Authentication"
2. 在 "Users" 中手动添加用户，或
3. 配置 "Providers" 启用邮箱/社交登录
4. 在代码中添加 Supabase Auth 功能

## 数据管理

### 查看数据
- 点击 "Table Editor" 查看和编辑表数据

### 备份数据
- 点击 "Database" → "Backups" 可以创建数据库备份

### 查看日志
- 点击 "Logs" 查看 API 请求和错误日志

## 常见问题

### Q: RLS (Row Level Security) 错误？
A: 确保在 SQL 中正确创建了访问策略，允许公开访问。

### Q: Storage 上传失败？
A: 检查 Storage bucket 是否设为 public，且策略配置正确。

### Q: API 密钥泄露怎么办？
A: 在 Project Settings → API 中可以重新生成密钥。

## 费用说明

Supabase 免费计划包括：
- 500MB 数据库空间
- 1GB 文件存储
- 50GB 带宽/月
- 无限 API 请求

对于个人使用完全足够！

---

配置完成后，你的情侣网站就可以正常使用所有功能了！ 💕
