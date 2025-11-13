# 💕 我们的小世界 - 情侣专属网站

这是一个为情侣设计的温馨网站，包含照片分享、游戏、纪念日提醒等功能。

## ✨ 功能特性

### 核心功能

- � **双人登录系统** - 专属的个人账号（密码提示：love+对方名字首字母缩写）
- 👤 **个人资料管理** - 查看和编辑个人信息，显示专属昵称和 emoji
- �📸 **照片相册** - 上传和分享你们的美好回忆
- 💝 **纪念日提醒** - 永远记住重要的日子，支持农历纪念日
- 🍱 **今晚吃什么** - 帮你们决定晚餐吃什么
- 💌 **甜蜜留言板** - 给对方留下温馨的话语
- 📔 **情侣日记** - 记录每天的点点滴滴
- 🗓️ **日程安排** - 共同规划未来的约会和活动
- ✨ **心愿清单** - 记录一起想完成的愿望
- 💭 **随机回忆** - 在首页随机展示一条美好记忆

### 游戏娱乐

- ⚫⚪ **五子棋** - 来一场甜蜜的对战
- 🎨 **你画我猜** - 画出你的想法让对方猜（已修复画笔精度问题）
- 🎮 **记忆翻牌** - 考验默契的记忆游戏
- ✊✋✌️ **石头剪刀布** - 简单有趣的小游戏
- 🎯 **真心话大冒险** - 增进感情的互动游戏
- 💑 **情侣小测验** - 测试你们彼此的了解

### 特色功能

- ⏰ **倒计时** - 为重要日子设置倒计时
- 💝 **情话语录** - 每日情话分享
- 📝 **功能建议** - 提交你想要的新功能
- ⏳ **时光胶囊** - 写下只能在未来打开的信件
- 🪣 **愿望清单** - 列出一起想做的 100 件事

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置 Supabase

1. 访问 [Supabase](https://supabase.com) 创建一个新项目
2. 在项目设置中找到 API 配置信息
3. 复制 `.env.local.example` 为 `.env.local`
4. 填入你的 Supabase URL 和 Anon Key：

```env
NEXT_PUBLIC_SUPABASE_URL=你的项目URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的anon密钥
```

### 3. 创建数据库表

在 Supabase Dashboard 的 SQL Editor 中执行 `supabase-schema.sql` 文件中的 SQL 语句。

### 4. 配置 Storage (可选)

如果需要照片上传功能：

1. 在 Supabase Dashboard 中创建一个名为 `photos` 的 Storage bucket
2. 设置 bucket 为公开访问（或配置适当的访问策略）

### 5. 启动开发服务器

```bash
npm run dev
```

在浏览器中打开 [http://localhost:3000](http://localhost:3000)

## 📦 技术栈

- **前端框架**: Next.js 14 (App Router)
- **样式**: Tailwind CSS
- **后端服务**: Supabase
  - 数据库: PostgreSQL
  - 存储: Supabase Storage
  - 实时功能: Supabase Realtime (可扩展)
- **类型安全**: TypeScript
- **日期处理**: date-fns

## 🎨 自定义

### 修改颜色主题

编辑 `tailwind.config.ts` 中的颜色设置：

```typescript
theme: {
  extend: {
    colors: {
      primary: '#ff6b9d',    // 主色调
      secondary: '#c44569',  // 次要色
      accent: '#ffa502',     // 强调色
    },
  },
}
```

### 添加更多食物选项

在 `app/food/page.tsx` 的 `FOOD_OPTIONS` 数组中添加：

```typescript
{ name: '你喜欢的食物', emoji: '🍜' }
```

## 📱 部署

### 部署到 Vercel (推荐)

1. 将代码推送到 GitHub
2. 在 [Vercel](https://vercel.com) 导入你的仓库
3. 配置环境变量（Supabase URL 和 Key）
4. 点击部署

### 其他部署选项

- **Netlify**: 支持 Next.js
- **Cloudflare Pages**: 支持 Next.js
- **自托管**: 使用 `npm run build` 和 `npm start`

## 🔐 安全提示

- 这是一个私人网站，建议：
  - 不要在公共场合分享网站链接
  - 使用强密码保护 Supabase 项目
  - 考虑添加身份验证功能
  - 定期备份数据

## 💡 最近更新

### v2.1 (2024-11-13) - UI/UX 大优化 🎨

**核心改进**:

- ✅ **Toast 通知系统**: 替代 alert()，支持 4 种类型的优雅通知
- ✅ **照片查看器增强**: 键盘导航、触摸滑动、循环浏览
- ✅ **响应式优化**: 首页、导航栏、卡片全面优化移动端体验
- ✅ **加载骨架屏**: 5 种类型的骨架屏组件，提升加载体验
- ✅ **统一返回按钮**: 可复用的返回按钮组件
- ✅ **动画系统**: 新增滑入、脉冲等动画效果
- ✅ **照片批量上传**: 支持拖拽、多选（最多 10 张）
- ✅ **图片自动压缩**: 上传前自动优化，节省 70%空间

**新增组件**: Toast、BackButton、LoadingSkeleton、BatchUploadDialog、imageUtils

详见 [COMPLETE_OPTIMIZATION_REPORT.md](./COMPLETE_OPTIMIZATION_REPORT.md)

### v2.0 (2024-11)

- ✅ 修复画笔位置不准确问题（已考虑画布缩放比例）
- ✅ 优化登录页面密码提示文案
- ✅ 新增个人资料页面
- ✅ 新增随机回忆功能
- ✅ 新增多个互动游戏
- ✅ 完善数据库结构

### v1.0 (2024-10)

- ✅ 基础功能上线
- ✅ 照片相册、纪念日、留言板
- ✅ 五子棋游戏

## 💡 未来功能扩展

- [ ] 实时聊天功能
- [ ] 照片批量上传和分类
- [ ] 日记自动保存草稿
- [ ] 纪念日提前提醒
- [ ] 数据统计面板
- [ ] 照片自动生成回忆视频
- [ ] 移动端 App（React Native）
- [ ] 推送通知提醒重要日子
- [ ] AI 生成情话和祝福
- [ ] 语音留言功能
- [ ] 视频通话功能

## 🐛 常见问题

### 照片上传失败？

1. 检查 Supabase Storage bucket 是否正确创建
2. 确认 bucket 访问权限设置正确
3. 查看浏览器控制台的错误信息

### TypeScript 报错？

运行 `npm install` 确保所有依赖都已安装。

### 样式不生效？

确保已安装 Tailwind CSS 相关依赖，运行：

```bash
npm install -D tailwindcss postcss autoprefixer
```

## 📝 License

这是一个个人项目，仅供学习和个人使用。

## ❤️ 致谢

感谢所有开源项目的贡献者！

---

**愿你们的爱情永远甜蜜！** 💕
