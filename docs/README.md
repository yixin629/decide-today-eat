# 项目文档索引

文档按用途分类存放。项目入口、技术栈和最短启动流程以根目录 [README.md](../README.md) 为准。

## 快速开始

- [快速启动](./getting-started/QUICKSTART.md)：从克隆仓库到本地运行
- [Supabase 配置](./getting-started/SUPABASE_SETUP.md)：数据库、Storage 与安全边界
- [部署与持续集成](./getting-started/DEPLOYMENT.md)：Vercel、Cloudflare Workers Builds 与故障排查

## 使用指南

- [个人资料与提醒](./guides/PROFILE_GUIDE.md)
- [互动功能与数据库依赖](./guides/NEW_FEATURES_GUIDE.md)
- [计划与记录功能](./guides/NEW_FEATURES_README.md)

## 架构

- [项目结构说明](./architecture/PROJECT_STRUCTURE.md)
- [数据库脚本说明](../database/README.md)

## 历史报告

`reports/` 保存开发阶段产生的实现总结、优化进度和版本说明。这些文件是历史快照，不是当前部署、功能完成度或待办事项的依据；每份报告顶部都标明了这一点。

- [V2 功能实现总结](./reports/IMPLEMENTATION_SUMMARY_V2.md)
- [V2 新功能说明](./reports/NEW_FEATURES_V2.md)
- [全面优化完成报告](./reports/COMPLETE_OPTIMIZATION_REPORT.md)
- [优化进度](./reports/OPTIMIZATION_PROGRESS.md)
- [UI 优化报告](./reports/UI_OPTIMIZATION_REPORT.md)
- [UI 优化第二阶段](./reports/UI_OPTIMIZATION_PHASE2.md)

## 文档优先级

发生内容冲突时，按以下顺序判断：

1. 当前代码、`package.json` 和部署配置
2. 根目录 `README.md`、`AGENTS.md`
3. `getting-started/`、`guides/` 和 `architecture/`
4. `reports/` 历史快照
