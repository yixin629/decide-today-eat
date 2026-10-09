# 项目文档索引

文档按用途分类存放。项目入口、技术栈和最短启动流程以根目录 [README.md](../README.md) 为准。

## 快速开始

- [快速启动](./getting-started/QUICKSTART.md)：从克隆仓库到本地运行
- [Supabase 配置](./getting-started/SUPABASE_SETUP.md)：数据库、Storage 与安全边界
- [部署与持续集成](./getting-started/DEPLOYMENT.md)：Vercel、Cloudflare Workers Builds 与故障排查
- [PTE 评分服务云服务器部署](./getting-started/PTE_SCORING_CLOUD_DEPLOYMENT.md)：把自托管评分服务迁到长期在线的云服务器并接入 Vercel
- [PTE 正式账号与支付配置](./getting-started/PTE_COMMERCIAL_SETUP.md)：Supabase Auth、会员权益与 Stripe 沙箱

## 使用指南

- [个人资料与提醒](./guides/PROFILE_GUIDE.md)
- [互动功能与数据库依赖](./guides/INTERACTIVE_FEATURES.md)
- [计划与记录功能](./guides/PLANNING_AND_RECORDS.md)
- [PTE 备考与练习](./guides/PTE_STUDY.md)：备考计划、练习平台、上传题目与评分服务

## 架构

- [项目结构说明](./architecture/PROJECT_STRUCTURE.md)
- [数据库脚本说明](../database/README.md)
- [PTE 自托管评分服务](../pte-scoring-service/README.md)
- [PTE 商业上线验收](./architecture/PTE_RELEASE_READINESS.md)：上线阻断项、测试边界与人工环境准备
- [PTE 平台改进计划](./architecture/PTE_ROADMAP.md)：工程收尾、功能完善与收费前置条件的分档计划

## 历史报告

`reports/` 保存开发阶段的历史快照，不是当前部署、功能完成度或待办事项的依据。

- [2024 年开发历史摘要](./reports/HISTORY_2024.md)：合并了 2024-11 的 UI 优化与 V2 功能报告，原文可在 git 历史中查看

## 文档优先级

发生内容冲突时，按以下顺序判断：

1. 当前代码、`package.json` 和部署配置
2. 根目录 `README.md`、`AGENTS.md`
3. `getting-started/`、`guides/` 和 `architecture/`
4. `reports/` 历史快照
