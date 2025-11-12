# 🎉 新功能部署指南

## 📋 已完成的功能

### 1. 💡 功能申请箱 (`/feature-requests`)
- ✅ 双方都可以提交功能申请
- ✅ 可以标记完成状态（待处理/已完成/已拒绝）
- ✅ 可以编辑和删除申请
- ✅ 查看历史记录
- ✅ 按状态筛选

### 2. 💖 真心话大冒险 (`/truth-or-dare`)
- ✅ 随机抽取真心话或大冒险
- ✅ 按类型和难度筛选
- ✅ 可以添加自定义题目
- ✅ 预设10条默认题目

### 3. 💑 100件想做的事 (`/bucket-list`)
- ✅ 记录想一起完成的事情
- ✅ 勾选完成状态
- ✅ 显示进度条
- ✅ 按分类筛选（旅行/美食/体验/学习/运动/其他）
- ✅ 优先级设置

### 4. 💝 情话生成器 (`/love-quotes`)
- ✅ 随机显示情话
- ✅ 可以添加专属情话
- ✅ 一键复制功能
- ✅ 预设5条默认情话

## 🚀 部署步骤

### 步骤 1: 执行数据库脚本

1. 打开 Supabase Dashboard
2. 进入 **SQL Editor**
3. 打开项目中的 `supabase-new-features.sql` 文件
4. 复制全部内容到 SQL Editor
5. 点击 **RUN** 执行

这将创建以下新表：
- `truth_or_dare` - 真心话大冒险题目
- `love_bucket_list` - 100件想做的事
- `love_quotes` - 情话库
- `feature_requests` - 功能申请
- 其他预留表（用于未来扩展）

### 步骤 2: 提交代码到 GitHub

```bash
git add .
git commit -m "✨ 新增多个情侣互动功能：真心话大冒险、任务清单、情话生成器、功能申请箱"
git push origin main
```

### 步骤 3: Vercel 自动部署

推送到 GitHub 后，Vercel 会自动触发部署。
确保环境变量已经配置（之前已完成）：
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 步骤 4: 测试功能

部署完成后，访问以下页面测试：
- https://your-domain.vercel.app/feature-requests
- https://your-domain.vercel.app/truth-or-dare
- https://your-domain.vercel.app/bucket-list
- https://your-domain.vercel.app/love-quotes

## 📝 功能使用说明

### 功能申请箱
1. 点击"新建申请"按钮
2. 填写功能标题和详细描述
3. 选择申请人（zyx 或 zly）
4. 设置优先级（低/中/高）
5. 提交后可以在列表中查看
6. 点击 ✓ 按钮可以切换状态：待处理 → 已完成 → 已拒绝 → 待处理
7. 点击 ✏️ 可以编辑内容
8. 点击 🗑️ 可以删除申请

### 真心话大冒险
1. 选择类型（真心话/大冒险/随机）
2. 选择难度（简单/中等/困难/随机）
3. 点击"随机抽取"按钮
4. 可以点击"添加自定义题目"增加专属题目

### 100件想做的事
1. 点击"添加任务"
2. 填写任务标题和描述
3. 选择分类和优先级
4. 完成后点击左侧的复选框
5. 系统会提示输入完成者（zyx 或 zly）
6. 顶部进度条显示完成百分比

### 情话生成器
1. 页面会自动显示一条随机情话
2. 点击"换一句"查看其他情话
3. 点击"复制"按钮可以复制到剪贴板
4. 点击"添加情话"可以添加专属情话

## 🎨 下一步可以添加的功能

以下功能的数据库表已经创建，可以后续实现：
- 🎭 情侣问答 (`couple_quiz`)
- 🎨 猜猜我画的 (`drawings`)
- ✊ 石头剪刀布 (`rps_games`)
- ⏰ 倒计时 (`countdowns`)
- 📅 共享日程 (`shared_calendar`)
- 🎁 时光胶囊 (`time_capsules`)
- 📖 恋爱日记 (`love_diary`)

## 💡 提示

1. 所有功能都已连接到 Supabase 数据库
2. 数据会永久保存，不用担心丢失
3. 功能申请箱可以用来记录你们想要的新功能
4. 记得定期备份 Supabase 数据库

## ❤️ 享受你们的专属小世界吧！
