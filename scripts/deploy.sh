#!/bin/bash

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 开始部署情侣网站...${NC}\n"

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ 未检测到 Node.js，请先安装 Node.js${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js 版本: $(node -v)${NC}"

# 检查 npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ 未检测到 npm${NC}"
    exit 1
fi

echo -e "${GREEN}✓ npm 版本: $(npm -v)${NC}\n"

# 检查环境变量文件
if [ ! -f .env.local ]; then
    echo -e "${YELLOW}⚠️  未找到 .env.local 文件${NC}"
    echo -e "${YELLOW}📝 正在创建 .env.local...${NC}"
    cp .env.local.example .env.local
    echo -e "${YELLOW}⚠️  请编辑 .env.local 文件，填入你的 Supabase 配置${NC}"
    echo -e "${YELLOW}   然后重新运行此脚本${NC}\n"
    exit 1
fi

echo -e "${GREEN}✓ 找到环境变量配置${NC}\n"

# 安装依赖
echo -e "${GREEN}📦 安装依赖...${NC}"
npm install

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 依赖安装失败${NC}"
    exit 1
fi

echo -e "${GREEN}✓ 依赖安装完成${NC}\n"

# 构建项目
echo -e "${GREEN}🔨 构建项目...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 项目构建失败${NC}"
    exit 1
fi

echo -e "${GREEN}✓ 项目构建完成${NC}\n"

# 完成
echo -e "${GREEN}🎉 部署准备完成！${NC}\n"
echo -e "${GREEN}启动开发服务器:${NC}"
echo -e "  npm run dev\n"
echo -e "${GREEN}启动生产服务器:${NC}"
echo -e "  npm start\n"
echo -e "${GREEN}访问地址:${NC}"
echo -e "  http://localhost:3000\n"
echo -e "${YELLOW}💡 提示: 如果是首次部署，请先在 Supabase 中创建数据库表${NC}"
echo -e "${YELLOW}   运行 supabase-schema.sql 中的 SQL 语句${NC}\n"
