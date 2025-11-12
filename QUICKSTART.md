# 快速启动指南

## 🎯 10分钟快速部署

### 第一步：安装依赖 (2分钟)
```bash
npm install
```

### 第二步：配置 Supabase (5分钟)
1. 访问 https://supabase.com 创建免费账号
2. 创建新项目（等待2分钟）
3. 复制 API 配置到 `.env.local`：
   ```bash
   copy .env.local.example .env.local
   # 然后编辑 .env.local 填入你的配置
   ```
4. 在 Supabase SQL Editor 中运行 `supabase-schema.sql`

### 第三步：启动项目 (1分钟)
```bash
npm run dev
```
打开 http://localhost:3000 🎉

## 📋 详细配置

需要详细的配置说明？请查看：
- 📖 [README.md](./README.md) - 完整文档
- 🔧 [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) - Supabase 配置详解

## 🚀 一键部署到 Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/couple-website)

点击按钮后：
1. 连接 GitHub 账号
2. 导入仓库
3. 设置环境变量
4. 点击部署

## 💡 功能清单

- [x] 📸 照片相册
- [x] ⚫⚪ 五子棋游戏
- [x] 💝 纪念日提醒
- [x] 🍱 今晚吃什么
- [x] 💌 甜蜜留言板
- [x] ✨ 心愿清单

## 🎨 自定义你的网站

### 修改网站标题
编辑 `app/layout.tsx`:
```typescript
export const metadata: Metadata = {
  title: '我们的小世界 💕',  // 改成你想要的标题
}
```

### 修改颜色主题
编辑 `tailwind.config.ts`:
```typescript
colors: {
  primary: '#ff6b9d',    // 主色
  secondary: '#c44569',  // 副色
  accent: '#ffa502',     // 强调色
}
```

### 添加更多食物选项
编辑 `app/food/page.tsx`，在 FOOD_OPTIONS 数组中添加。

## 🔒 安全建议

1. **不要分享你的 `.env.local` 文件**
2. **将 `.env.local` 添加到 `.gitignore`**（已配置）
3. **使用强密码保护 Supabase 项目**
4. **考虑添加登录功能**（未来版本）

## ❓ 遇到问题？

### 依赖安装失败
```bash
# 清理缓存重试
npm cache clean --force
npm install
```

### 端口被占用
```bash
# 使用其他端口
npm run dev -- -p 3001
```

### TypeScript 报错
```bash
# 重新生成类型
npm run build
```

## 📱 移动端访问

启动后，使用手机浏览器访问：
```
http://你的电脑IP:3000
```

在同一 WiFi 下，手机和电脑可以互相访问！

## 🎁 额外资源

- [Next.js 文档](https://nextjs.org/docs)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [Supabase 文档](https://supabase.com/docs)
- [Vercel 部署指南](https://vercel.com/docs)

---

**祝你们幸福快乐！** ❤️
