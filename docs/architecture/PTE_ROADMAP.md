# PTE 平台改进计划

本文记录 PTE 备考与练习平台的后续改进项，按投入从小到大分为三档。对外收费前必须关闭的事项以 [PTE 商业上线验收](./PTE_RELEASE_READINESS.md) 为准，本文只做摘要。

状态：⬜ 未开始 · 🔄 进行中 · ✅ 已完成

## 一、工程收尾

| # | 事项 | 说明 | 状态 |
| --- | --- | --- | --- |
| 1 | 统一换行符 | 新增 `.gitattributes`，源码统一 LF，`.bat` 保持 CRLF，消除 "LF will be replaced by CRLF" 警告 | ✅ |
| 2 | 清理 lint 警告 | 修复音乐播放器两处 `react-hooks/exhaustive-deps` 警告，让 `npm run lint` 零警告 | ✅ |
| 3 | GitHub Actions 检查 | 每次 push / PR 自动运行 lint、typecheck、build 和 `scripts/test-pte-practice.mjs` | ✅ |
| 4 | 文档与提交收尾 | 部署方案转为 Markdown 并删除 `.docx`，按主题分批提交 | ✅ |

## 二、功能完善

| # | 事项 | 说明 | 状态 |
| --- | --- | --- | --- |
| 5 | 补齐新题型 | 实现 Summarize Group Discussion（SGD）和 Respond to a Situation（RTS），并纳入题库、模考与评分 | ⬜ |
| 6 | 离线记录补传 | 断网时保存在本机的练习记录，联网后可一键同步到云端，避免记录分散 | ⬜ |
| 7 | 编辑已上传题目 | 支持修改自定义题目内容，并为来源登记前上传的题目补填 provenance | ⬜ |
| 8 | 评分服务逐词结果 | 部署评分服务后，由 whisper / OpenPronounce 返回逐词识别与发音结果，替代浏览器识别做颜色标注 | ⬜ |
| 9 | 模考逐词标注 | 模拟考试结果页也展示 Read Aloud / Repeat Sentence 的逐词发音标注 | ⬜ |

## 三、对外收费前置条件

完整验收要求见 [PTE 商业上线验收](./PTE_RELEASE_READINESS.md)，其中最关键的是：

| 事项 | 当前问题 |
| --- | --- |
| 真实认证 | zyx / zly 身份保存在浏览器，可被冒充；需要注册、登录和服务端会话校验 |
| 评分接口防滥用 | 两个评分代理只有请求体大小限制，没有用户校验、限流和配额 |
| 题库与成绩防篡改 | 答案与计分在客户端完成；收费题目和正式成绩需要服务端发放与计算 |
| 产品与数据隔离 | PTE 与私人情侣网站共用外壳、Supabase 和身份，需要先确定是否独立成站 |

这些事项依赖产品方向决策，建议在确定是否独立成站后再排期。
