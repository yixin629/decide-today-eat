@echo off
chcp 65001 >nul
echo.
echo 🚀 开始部署情侣网站...
echo.

REM 检查 Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 未检测到 Node.js，请先安装 Node.js
    pause
    exit /b 1
)

echo ✓ Node.js 已安装
node -v

REM 检查 npm
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 未检测到 npm
    pause
    exit /b 1
)

echo ✓ npm 已安装
npm -v
echo.

REM 检查环境变量文件
if not exist .env.local (
    echo ⚠️  未找到 .env.local 文件
    echo 📝 正在创建 .env.local...
    copy .env.local.example .env.local
    echo.
    echo ⚠️  请编辑 .env.local 文件，填入你的 Supabase 配置
    echo    然后重新运行此脚本
    echo.
    pause
    exit /b 1
)

echo ✓ 找到环境变量配置
echo.

REM 安装依赖
echo 📦 安装依赖...
call npm install
if %errorlevel% neq 0 (
    echo ❌ 依赖安装失败
    pause
    exit /b 1
)

echo ✓ 依赖安装完成
echo.

REM 构建项目
echo 🔨 构建项目...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ 项目构建失败
    pause
    exit /b 1
)

echo ✓ 项目构建完成
echo.

REM 完成
echo 🎉 部署准备完成！
echo.
echo 启动开发服务器:
echo   npm run dev
echo.
echo 启动生产服务器:
echo   npm start
echo.
echo 访问地址:
echo   http://localhost:3000
echo.
echo 💡 提示: 如果是首次部署，请先在 Supabase 中创建数据库表
echo    运行 supabase-schema.sql 中的 SQL 语句
echo.
pause
