# 项目结构说明

## 📁 目录结构

```
couple-website/
├── app/                          # Next.js App Router 页面
│   ├── layout.tsx               # 根布局（全局样式和元数据）
│   ├── page.tsx                 # 首页（功能导航卡片）
│   ├── globals.css              # 全局样式（Tailwind CSS）
│   ├── food/                    # 今晚吃什么功能
│   │   └── page.tsx
│   ├── gomoku/                  # 五子棋游戏
│   │   └── page.tsx
│   ├── anniversaries/           # 纪念日提醒
│   │   └── page.tsx
│   ├── photos/                  # 照片相册
│   │   └── page.tsx
│   ├── notes/                   # 甜蜜留言板
│   │   └── page.tsx
│   └── wishlist/                # 心愿清单
│       └── page.tsx
├── lib/                         # 工具库
│   └── supabase.ts             # Supabase 客户端配置
├── .vscode/                     # VSCode 编辑器配置
│   ├── settings.json           # 编辑器设置
│   └── extensions.json         # 推荐扩展
├── .env.local.example          # 环境变量示例
├── .gitignore                  # Git 忽略文件
├── next.config.js              # Next.js 配置
├── tailwind.config.ts          # Tailwind CSS 配置
├── postcss.config.js           # PostCSS 配置
├── tsconfig.json               # TypeScript 配置
├── package.json                # 项目依赖和脚本
├── supabase-schema.sql         # 数据库表结构
├── deploy.bat                  # Windows 部署脚本
├── deploy.sh                   # Linux/Mac 部署脚本
├── README.md                   # 项目文档
├── QUICKSTART.md               # 快速开始指南
├── SUPABASE_SETUP.md           # Supabase 配置详解
└── PROJECT_STRUCTURE.md        # 本文件
```

## 🎯 核心文件说明

### 配置文件

| 文件 | 作用 |
|------|------|
| `package.json` | 定义项目依赖和脚本命令 |
| `tsconfig.json` | TypeScript 编译配置 |
| `tailwind.config.ts` | Tailwind CSS 主题配置（颜色、字体等） |
| `next.config.js` | Next.js 框架配置（图片域名等） |
| `.env.local` | 环境变量（Supabase 密钥，不要提交到 Git） |

### 主要页面

| 路由 | 文件 | 功能 |
|------|------|------|
| `/` | `app/page.tsx` | 首页导航 |
| `/food` | `app/food/page.tsx` | 随机选择晚餐 |
| `/gomoku` | `app/gomoku/page.tsx` | 五子棋对战 |
| `/anniversaries` | `app/anniversaries/page.tsx` | 纪念日管理 |
| `/photos` | `app/photos/page.tsx` | 照片相册 |
| `/notes` | `app/notes/page.tsx` | 留言板 |
| `/wishlist` | `app/wishlist/page.tsx` | 心愿清单 |

### 工具库

| 文件 | 功能 |
|------|------|
| `lib/supabase.ts` | Supabase 客户端初始化 |

## 🗄️ 数据库表结构

在 `supabase-schema.sql` 中定义了以下表：

1. **photos** - 照片数据
   - id, title, description, image_url, uploaded_by, likes, created_at

2. **anniversaries** - 纪念日
   - id, title, date, description, icon, recurring, created_at

3. **gomoku_games** - 五子棋游戏状态
   - id, board, current_player, status, winner, last_move, created_at

4. **food_options** - 食物选项
   - id, name, category, emoji, is_favorite, created_at

5. **love_notes** - 留言
   - id, author, content, to_person, is_read, created_at

6. **wishlist** - 心愿清单
   - id, title, description, status, completed_at, added_by, created_at

## 🎨 样式系统

### Tailwind CSS 类

项目使用 Tailwind CSS，在 `app/globals.css` 中定义了自定义组件类：

- `.card` - 卡片容器样式
- `.btn-primary` - 主按钮样式
- `.btn-secondary` - 次要按钮样式

### 颜色主题

在 `tailwind.config.ts` 中定义：

```typescript
colors: {
  primary: '#ff6b9d',    // 粉色（主色调）
  secondary: '#c44569',  // 深粉色（次要色）
  accent: '#ffa502',     // 橙色（强调色）
}
```

在 CSS 中使用：
```tsx
<div className="bg-primary text-white">内容</div>
```

## 🔧 开发工作流

### 1. 启动开发服务器
```bash
npm run dev
```
访问 http://localhost:3000

### 2. 代码检查
```bash
npm run lint
```

### 3. 构建生产版本
```bash
npm run build
npm start
```

## 📦 依赖说明

### 核心依赖
- **next** - React 框架
- **react** - UI 库
- **@supabase/supabase-js** - Supabase 客户端
- **date-fns** - 日期处理

### 开发依赖
- **typescript** - 类型系统
- **tailwindcss** - CSS 框架
- **eslint** - 代码检查
- **autoprefixer** - CSS 自动前缀

## 🔐 环境变量

在 `.env.local` 中配置：

```env
NEXT_PUBLIC_SUPABASE_URL=你的Supabase项目URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的Supabase匿名密钥
```

> ⚠️ 注意：以 `NEXT_PUBLIC_` 开头的变量会暴露到浏览器端

## 🚀 部署

### Vercel 部署（推荐）
1. 推送代码到 GitHub
2. 在 Vercel 导入仓库
3. 配置环境变量
4. 自动部署

### 其他平台
- **Netlify**: 支持 Next.js
- **Cloudflare Pages**: 需要配置
- **自托管**: 使用 Docker 或直接运行

## 📝 添加新功能

### 添加新页面
1. 在 `app/` 下创建新文件夹
2. 创建 `page.tsx` 文件
3. 在首页 `app/page.tsx` 添加导航卡片

### 添加新数据表
1. 在 Supabase SQL Editor 运行 CREATE TABLE
2. 设置 RLS 策略
3. 在代码中使用 supabase 客户端操作

### 自定义样式
1. 修改 `tailwind.config.ts` 的颜色
2. 在 `app/globals.css` 添加全局样式
3. 使用 Tailwind 类名

## 🐛 调试技巧

### 查看 Supabase 请求
打开浏览器开发者工具 → Network 标签，筛选 supabase.co

### TypeScript 错误
- 运行 `npm install` 确保依赖完整
- 检查 `tsconfig.json` 配置

### 样式不生效
- 确保类名拼写正确
- 检查 Tailwind 配置
- 清除浏览器缓存

## 📚 学习资源

- [Next.js 文档](https://nextjs.org/docs)
- [React 文档](https://react.dev)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [Supabase 文档](https://supabase.com/docs)
- [TypeScript 文档](https://www.typescriptlang.org/docs)

---

有问题？查看 [README.md](./README.md) 或 [QUICKSTART.md](./QUICKSTART.md)
