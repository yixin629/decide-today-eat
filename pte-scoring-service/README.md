# PTE 练习 · 自托管开源评分服务 部署文档

## 1. 简介（Introduction）

这个目录是给网站的 PTE 练习模块（`app/pte-practice/`）配套的一套**可选的**自托管
评分后端。它由四个 Docker 容器组成，用三个开源、免费、不需要 API Key 的模型/工具，
把口语朗读（Read Aloud）和写作（SWT/Essay）这类主观题的评分，从"固定占位分"升级
为"基于真实开源模型的估算"——但依然不是、也不冒充 Pearson 官方评分。

**它不是什么：**
- 不是 Pearson 官方评分引擎的复现，任何分数都只是练习参考。
- 不部署在 Vercel 或 Cloudflare Workers 上——那两个是无服务器/边缘运行时，跑不了
  这里用到的常驻容器、GB 级模型权重和本地磁盘缓存。
- 不是必需品。不部署这套服务，PTE 练习模块照常可以使用，主观题维度会自动回退到
  网站自带的本地启发式估分，行为跟没有这套服务之前完全一样。

**它解决什么问题：**

`app/pte-practice/engine/scoring.ts` 里，客观题（阅读单选/重排/填空、听力填空/
选概要）本来就是精确判分，不受这套服务影响。但口语朗读、写作这两类主观题之前
只能给固定数字（比如发音永远是 2.5/5，写作 Grammar/Vocabulary 永远是满分的一半），
跟考生实际表现毫无关系。这套服务引入三个真实开源组件替换掉这些假分数：

| 组件 | 作用 | 来源 |
| --- | --- | --- |
| **faster-whisper** | 把 Read Aloud 录音转写成文字，供内容匹配与流利度估算使用 | 自建 `whisper-service/`，基于 [SYSTRAN/faster-whisper](https://github.com/SYSTRAN/faster-whisper) |
| **OpenPronounce** | Wav2Vec2 + DTW 音素级发音评分，给出 Pronunciation 维度 | 自建 `openpronounce-service/`，源码来自 [Halleck45/OpenPronounce](https://github.com/Halleck45/OpenPronounce)（MIT，仅校准英语） |
| **LanguageTool** | 开源语法/拼写检查器，给出 Writing 任务的 Grammar/Spelling 信号 | 官方 Docker 镜像 `erikvl87/languagetool` |

`gateway/`（FastAPI）把这三者统一成一个 HTTP 接口，Next.js 网站只需要认识这一个
地址，不用分别对接三套 API。

## 2. 架构示意

```
浏览器录音/写作文本
        │
        ▼
Vercel/Cloudflare 上的 Next.js
  app/api/pte-scoring/*/route.ts   ← 服务端专用，读取 PTE_SCORING_SERVICE_URL
        │  HTTPS + Bearer Token
        ▼
你自己的服务器（VPS / NAS / 家用主机）
  ┌─────────────── docker compose ───────────────┐
  │  gateway (8080)  ← Next.js 唯一对话的入口      │
  │    ├─ whisper-service   （录音转写）            │
  │    ├─ openpronounce-service  （发音评分）        │
  │    └─ languagetool      （语法/拼写检查）         │
  └────────────────────────────────────────────────┘
```

## 3. 目录结构

```
pte-scoring-service/
├── docker-compose.yml         # 一键启动全部四个容器
├── gateway/                   # 统一网关：Next.js 唯一要对话的服务
│   ├── app.py
│   ├── Dockerfile
│   └── requirements.txt
├── whisper-service/           # faster-whisper 转写包装服务
│   ├── app.py
│   ├── Dockerfile
│   └── requirements.txt
└── openpronounce-service/     # OpenPronounce 发音评分包装服务（未完全验证，见第 8 节）
    ├── Dockerfile
    ├── wrapper_server.py
    └── （OpenPronounce 源码在构建时克隆进镜像）
```

LanguageTool 直接用官方镜像，不需要额外目录。

## 4. 前置条件（Prerequisites）

- 一台你自己能登录、能开端口的机器：VPS、家用服务器、NAS 都可以。不需要 GPU，
  三个模型都能在 CPU 上跑，见第 7 节资源需求。
- 已安装 Docker 与 Docker Compose v2（`docker compose version` 能正常输出）。
- 服务器有可访问的公网地址或域名（如果 Next.js 部署在 Vercel/Cloudflare，需要能
  从公网访问到这台机器；如果 Next.js 也在你自己内网/同一台机器，可以只开内网）。
- 建议准备一个域名并申请好 HTTPS 证书（或用 Caddy/Nginx 自动签发），不要让评分
  服务用裸 HTTP 跑在公网上。

## 5. 快速开始（Quick Start）

```bash
# 1. 把这个目录搬到服务器上（或者 git clone 整个仓库后 cd 进来）
git clone <你的仓库地址>
cd decide-today-eat/pte-scoring-service

# 2. 生成一个随机共享密钥
export SHARED_TOKEN=$(openssl rand -hex 32)
echo "记下这个值，等下要填到 Vercel/Cloudflare 环境变量里：$SHARED_TOKEN"

# 3. 构建并启动
docker compose up -d --build

# 4. 等待启动完成后做健康检查
curl http://localhost:8080/health
```

首次启动会比较慢：LanguageTool 要预热 ngram 模型，faster-whisper 要从
HuggingFace Hub 下载权重（默认 `small`，约 500MB），OpenPronounce 镜像要克隆
源码并安装依赖，整个过程可能需要几分钟到十几分钟，取决于网络速度。之后的重启
会快很多，因为模型缓存在 Docker 具名卷里。

## 6. 详细部署步骤

1. **安装 Docker**：如果服务器还没有 Docker，参考 [Docker 官方安装文档](https://docs.docker.com/engine/install/)，安装完成后运行 `sudo usermod -aG docker $USER` 并重新登录，避免每条命令都要 `sudo`。
2. **拉取代码**：`git clone` 整个网站仓库到服务器，或者只用 `scp`/`rsync` 把 `pte-scoring-service/` 这一个目录传上去（它是自包含的，不依赖仓库其他部分）。
3. **生成共享密钥**：`export SHARED_TOKEN=$(openssl rand -hex 32)`。这个值相当于评分服务的密码，两边（服务器环境变量、Vercel/Cloudflare 环境变量）必须完全一致，别提交进 git，也别贴在聊天记录/文档里。
4. **启动服务**：`docker compose up -d --build`。
5. **确认容器都在运行**：`docker compose ps`，四个服务都应该是 `running`/`healthy`。如果 `openpronounce-service` 起不来，看第 8 节，不影响其余功能。
6. **健康检查**：`curl http://localhost:8080/health`，应该返回类似 `{"status":"ok", ...}` 的 JSON。
7. **加 HTTPS 反向代理**（强烈建议）：用 Caddy（最省心，自动签证书）或 Nginx + Certbot，把 `https://pte-scoring.你的域名` 反向代理到本机的 `127.0.0.1:8080`，不要把 8080 端口直接暴露在公网。示例 Caddyfile：
   ```
   pte-scoring.你的域名 {
       reverse_proxy 127.0.0.1:8080
   }
   ```
8. **在 Next.js 部署平台配置环境变量**（Vercel：Project → Settings → Environment Variables；Cloudflare：Pages/Workers 项目设置里的 Variables and Secrets）：
   ```
   PTE_SCORING_SERVICE_URL=https://pte-scoring.你的域名
   PTE_SCORING_SERVICE_TOKEN=和 SHARED_TOKEN 完全一样的值
   ```
   两者都不要加 `NEXT_PUBLIC_` 前缀，它们只应该出现在 `app/api/pte-scoring/*/route.ts` 这些服务端 Route Handler 里——现有实现已经是这样写的，不要在客户端组件里直接引用。
9. **触发重新部署**：加完环境变量后，Vercel/Cloudflare 不会自动让已发布的版本生效，需要手动点一次 Redeploy，或者推一个新 commit。
10. **验证**：打开网站的 PTE 练习模块，做一次口语朗读练习，提交后如果看到"基于开源评分服务的估算，仍非 Pearson 官方评分"这样的说明文字（而不是"本地估算，评分服务未配置/不可用"），说明已经接通。

## 7. 资源需求（粗略估计，未做正式压测）

| 服务 | CPU | 内存 | 磁盘 | 是否需要 GPU |
| --- | --- | --- | --- | --- |
| LanguageTool | 1-2 核 | 1-2GB | 数百 MB | 否 |
| faster-whisper（small, int8） | 2 核起 | 1-2GB | 约 1GB（含模型缓存） | 否，CPU 足够应付几十秒的录音 |
| OpenPronounce | 视其模型大小而定 | 建议预留 2GB+ | 取决于模型权重 | 官方定位 CPU-only |
| gateway | 极低 | < 512MB | 可忽略 | 否 |

一台 4 核 8GB 内存的普通 VPS 大致可以同时跑起这四个服务，但响应延迟（尤其是
OpenPronounce 未优化时）可能到几秒甚至十几秒，属于预期行为，不代表故障。

## 8. 已知局限（部署前务必了解）

- **OpenPronounce 只针对英语校准**，对非英语母语口音（尤其中文母语者的口音特征）
  评分准确度没有第三方验证，仅供参考。
- **`openpronounce-service/` 是未经实际验证的最佳猜测**：编写这套包装代码时无法
  联网运行 OpenPronounce 真实代码，只能依据其公开 README 描述编写。部署前请对照
  [实际仓库源码](https://github.com/Halleck45/OpenPronounce)核实模块名、函数签名和依赖列表，必要时自行修正
  `openpronounce-service/wrapper_server.py`。就算它一直起不来，网关会把
  `pronunciationScore` 留空，Next.js 侧会对应回退到本地启发式，不影响其余功能。
- **LanguageTool 不是 Pearson 官方算法**，是通用规则+统计的语法检查器，对学术写作
  中"技术上没错但不够地道"的表达不一定敏感，也可能误报合理但非标准的表达。
- **faster-whisper 对非母语者口音的转写准确率**是行业共性局限，重音、语速不均、
  背景噪音都会明显影响转写质量，进而影响依赖转写文本的 Content/Fluency 分数。
- 首次调用可能因模型冷启动较慢，Next.js 侧 API 路由设了 20 秒超时，超时会当作
  服务不可用处理并自动回退，不会让用户卡住，但体验上第一次会明显慢一些。
- 这套服务给出的**所有分数依然是"练习估分"**，没有经过官方认证或大规模校准，
  UI 上的文案会一直标注这一点，请不要把它当作真实备考进度的依据。

## 9. 排障（Troubleshooting）

| 现象 | 排查方向 |
| --- | --- |
| `docker compose up` 卡在下载模型 | 网络访问 HuggingFace Hub 较慢，可以配置国内镜像源或耐心等待，不要中途 Ctrl+C 强制退出导致镜像缓存损坏 |
| `curl http://localhost:8080/health` 连接被拒绝 | `docker compose ps` 看 gateway 是否真的在运行；确认端口没被本机防火墙拦截 |
| Next.js 侧一直显示"评分服务未配置/不可用" | 检查 Vercel/Cloudflare 环境变量拼写、是否已重新部署；检查 `PTE_SCORING_SERVICE_TOKEN` 是否和服务器 `SHARED_TOKEN` 完全一致；从 Next.js 部署所在网络能否访问到你的服务器地址（防火墙/安全组是否放行） |
| `openpronounce-service` 容器反复重启/退出 | 大概率是第 8 节提到的"未验证包装代码"问题，查看 `docker compose logs openpronounce-service`，对照 OpenPronounce 官方仓库修正依赖或调用方式；修不好也不影响其他功能 |
| 响应很慢（十几秒以上） | 检查服务器 CPU/内存是否够（见第 7 节），第一次请求的模型冷启动本来就慢，多试几次看是否稳定下来 |

## 10. 更新与卸载

**更新代码后重新部署：**
```bash
git pull
docker compose up -d --build
```

**只想更新某一个服务（比如改了 gateway 代码）：**
```bash
docker compose up -d --build gateway
```

**完全卸载：**
```bash
docker compose down -v   # -v 会一并删除模型缓存卷，下次重新拉取会比较慢
```
卸载后记得去 Vercel/Cloudflare 项目设置里删掉 `PTE_SCORING_SERVICE_URL` 和
`PTE_SCORING_SERVICE_TOKEN` 两个环境变量并重新部署，Next.js 侧会自动回退到
本地启发式估分，不会报错。

## 11. 安全建议

- `SHARED_TOKEN` 只当密码用，不要提交进 git、不要写进任何文档或聊天记录明文分享。
- 一定要加 HTTPS 反向代理（见第 6 步），不要让评分服务的端口直接裸奔在公网 HTTP 上。
- 如果服务器上还跑着其他服务，建议给这四个容器单独规划网络/防火墙规则，只放行
  网关端口对外，`whisper-service`/`openpronounce-service`/`languagetool` 不需要
  暴露给容器网络之外的任何人。
- 定期关注 [LanguageTool](https://github.com/languagetool-org/languagetool)、
  [faster-whisper](https://github.com/SYSTRAN/faster-whisper)、
  [OpenPronounce](https://github.com/Halleck45/OpenPronounce) 上游仓库的安全更新，
  按第 10 节的方式重新构建。

## 12. 接口契约（供二次开发参考）

### `POST /score/read-aloud`（multipart/form-data）

请求字段：
- `promptText`（string，必填）：Read Aloud 的原文
- `audio`（file，必填）：录音文件

响应：
```json
{
  "transcript": "识别到的文本或 null",
  "contentScore": 4.2,
  "pronunciationScore": 3.5,
  "fluencyScore": 4.0,
  "details": { "transcription": {}, "pronunciation": {} }
}
```
任意分数字段都可能为 `null`（对应的下游服务不可用时），Next.js 侧会对每个维度
分别决定是否使用服务结果或回退到本地启发式。

### `POST /score/writing`（application/json）

请求体：
```json
{ "promptText": "...", "sourceText": "可选，原文", "text": "考生写的文本" }
```

响应：
```json
{
  "grammarIssues": [ { "message": "...", "offset": 12, "length": 5, "ruleId": "..." } ],
  "spellingIssues": [],
  "grammarScore": 0.86,
  "spellingScore": 0.95
}
```
`grammarScore`/`spellingScore` 是 0-1 的问题密度换算比例，由 Next.js 侧按各题型
官方公开的小分制上限（如 Essay Grammar 满分 2）再做换算，不是最终分数。词汇多样性
（Vocabulary）和内容关键词覆盖率（Content）由 Next.js 侧本地计算（纯字符串统计，
不需要额外的开源服务），网关不重复实现。
