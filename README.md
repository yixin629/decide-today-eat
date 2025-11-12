# 💕 我们的小世界 - 情侣专属网站

这是一个为情侣设计的温馨网站，包含照片分享、游戏、纪念日提醒等功能。

## ✨ 功能特性

- 📸 **照片相册** - 上传和分享你们的美好回忆
- ⚫⚪ **五子棋游戏** - 来一场甜蜜的对战
- 💝 **纪念日提醒** - 永远记住重要的日子
- 🍱 **今晚吃什么** - 帮你们决定晚餐吃什么
- 💌 **甜蜜留言板** - 给对方留下温馨的话语
- ✨ **心愿清单** - 记录一起想完成的愿望

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

## 💡 未来功能扩展

- [ ] 添加用户登录/注册
- [ ] 实时聊天功能
- [ ] 更多小游戏（如猜数字、真心话大冒险等）
- [ ] 日历视图显示纪念日
- [ ] 照片自动生成回忆视频
- [ ] 移动端 App（React Native）
- [ ] 推送通知提醒重要日子

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
