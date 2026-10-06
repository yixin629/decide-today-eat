# PTE 评分服务云服务器部署方案

部署实施手册：将本地 Docker 评分服务迁移为长期在线的生产基础设施。评分服务本身的组成与本地运行方式见 [pte-scoring-service/README.md](../../pte-scoring-service/README.md)，网站环境变量见 [部署与持续集成](./DEPLOYMENT.md#环境变量)。

> **结论**
>
> 前端继续由 Vercel 托管。将 pte-scoring-service 部署到长期在线的 Linux 云服务器，通过固定 HTTPS 域名接入 Vercel 后，本地电脑即可关机，线上评分仍能持续工作。

- **适用项目**：我们的小世界 PTE 练习平台
- **目标读者**：项目维护者、部署人员和后续运维人员
- **推荐平台**：Ubuntu 24.04 LTS 或 22.04 LTS 云服务器
- **文档版本**：1.0（2026 年 10 月）

## 1 部署目标与范围

本方案把当前运行在开发电脑上的 PTE 评分服务迁移到云服务器。迁移后，网站仍由 Vercel 提供页面和服务端 API，Supabase 继续承担业务数据与存储，云服务器只负责语音转写、发音分析、语法检查和统一评分网关。

- 消除对本地电脑、Docker Desktop 和临时 trycloudflare.com 地址的依赖。
- 为评分服务提供固定 HTTPS 域名、健康检查、自动重启和可观察性。
- 保持内部模型端口不公开，只允许评分网关接收来自 Vercel 的授权请求。
- 保留当前回退机制：评分服务异常时，前端仍可提供本地启发式估分。

## 2 推荐生产架构

```text
用户浏览器
  |
  v
Vercel 站点与 Next.js API
  |  HTTPS + Bearer Token
  v
scoring.example.com
  |  Cloudflare Tunnel 或 Caddy/Nginx
  v
Docker Compose 评分服务
  +-- gateway :8080
  +-- whisper-service :8001
  +-- openpronounce-service :8002
  +-- languagetool :8010
```

> **网络边界**
>
> 公网只暴露 HTTPS 入口。8080、8001、8002 和 8010 均不得直接对公网开放。Vercel 环境变量中的令牌必须与服务器端 SHARED_TOKEN 完全一致。

## 3 服务器规格与预算

| **场景** | **建议配置** | **适用范围** | **注意事项** |
| --- | --- | --- | --- |
| 验证与小规模试用 | 4 vCPU / 8 GB / 50 GB SSD | 少量用户，低并发 | CPU 语音处理可能较慢 |
| 正式初期 | 8 vCPU / 16 GB / 80 GB SSD | 中低并发商业试运营 | 推荐起点 |
| 增长阶段 | GPU 或独立推理服务 | 口语高并发 | 需要队列、限流和容量测试 |

- 系统：Ubuntu 24.04 LTS，使用普通 sudo 用户维护。
- 区域：选择接近主要用户和 Vercel 区域的机房。
- 磁盘：容器镜像和模型占用较大，建议至少保留 20 GB 可用空间。
- 备份：配置文件和密钥单独备份；模型容器可通过镜像重新生成。

## 4 上线前准备

1. 准备一台具有固定公网访问能力的 Linux 云服务器。
2. 准备评分子域名，例如 scoring.example.com，并能修改其 DNS。
3. 确认 GitHub 仓库访问方式；私有仓库建议使用只读 Deploy Key。
4. 生成至少 32 字节的随机共享令牌，不在聊天、日志或 Git 中保存。
5. 在 Vercel 项目中保留生产环境变量的编辑权限。

```bash
openssl rand -hex 32
```

> **密钥管理**
>
> 本文所有 YOUR_ 开头的值都是占位符。不要把真实令牌写进 compose 文件、README、命令历史或 Git 提交。

## 5 云服务器部署步骤

### 5.1 安装 Docker

```bash
sudo apt update
sudo apt install -y ca-certificates curl git
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
newgrp docker
docker --version
docker compose version
```

### 5.2 拉取代码

```bash
sudo mkdir -p /opt/pte-platform
sudo chown $USER:$USER /opt/pte-platform
git clone YOUR_REPOSITORY_URL /opt/pte-platform/app
cd /opt/pte-platform/app/pte-scoring-service
```

### 5.3 创建服务器环境配置

在 pte-scoring-service 目录中创建不会提交到 Git 的服务器环境文件：

```bash
umask 077
cat > .env <<'EOF'
SHARED_TOKEN=YOUR_RANDOM_64_CHARACTER_TOKEN
EOF
chmod 600 .env
```

`docker-compose.yml` 中的 gateway 和 whisper-service 都从 `SHARED_TOKEN` 读取令牌；未设置时 Compose 会拒绝启动。

### 5.4 构建并启动

```bash
docker compose pull
docker compose build
docker compose up -d
docker compose ps
curl --fail http://127.0.0.1:8080/health
```

首次构建需要下载模型和较大的 Python 依赖，耗时可能达到数十分钟。构建期间应保持 SSH 会话稳定，并确认磁盘空间充足。

### 5.5 设置自动启动

Compose 已为容器配置重启策略时，Docker 服务随系统启动即可自动恢复。执行以下命令启用并检查：

```bash
sudo systemctl enable --now docker
systemctl is-enabled docker
docker compose ps
```

## 6 固定 HTTPS 域名

### 6.1 推荐方案 Cloudflare 命名隧道

命名隧道不需要开放服务器入站端口，适合当前架构。应在 Cloudflare Zero Trust 中创建正式 Tunnel，绑定 scoring.example.com，并将上游服务设置为 http://127.0.0.1:8080。不要继续使用随机 trycloudflare.com 地址。

1. 在 Cloudflare Zero Trust 创建 Tunnel 并选择 Docker 连接器。
2. 在服务器以 Secret 或受限配置文件运行 cloudflared。
3. 添加 Public Hostname：scoring.example.com。
4. Service 设置为 http://127.0.0.1:8080。
5. 验证 https://scoring.example.com/health 返回成功。

### 6.2 备选方案 Caddy 或 Nginx

如果直接使用服务器公网 IP，可开放 80 和 443，由 Caddy 或 Nginx 终止 TLS，再反向代理到 127.0.0.1:8080。防火墙不得开放内部模型端口。

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

## 7 Vercel 生产环境配置

在 Vercel 项目的 Production 环境中配置以下服务端变量。修改后必须重新部署生产环境。

| **变量** | **生产值** | **用途** |
| --- | --- | --- |
| PTE_SCORING_SERVICE_URL | https://scoring.example.com | 评分网关固定地址 |
| PTE_SCORING_SERVICE_TOKEN | 与 SHARED_TOKEN 完全一致 | 网关请求认证 |

- 变量只配置在服务端，不添加 NEXT_PUBLIC_ 前缀。
- 不要在浏览器开发者工具、客户端日志或前端代码中暴露令牌。
- 更新后使用 Redeploy 创建新的 Production deployment。
- 如果返回 401，优先核对两端令牌；如果返回 502 或 504，检查域名、隧道和容器健康状态。

## 8 上线验收

### 8.1 服务器验收

```bash
cd /opt/pte-platform/app/pte-scoring-service
docker compose ps
curl --fail http://127.0.0.1:8080/health
curl --fail https://scoring.example.com/health
docker compose logs --tail=100 gateway
```

### 8.2 网站验收

1. 打开生产站点 /pte-practice，确认页面无需本地电脑即可访问。
2. 完成一题写作并提交，确认收到远程评分结果。
3. 完成一题朗读，允许麦克风权限并提交，确认语音链路返回评分。
4. 检查历史记录、搜索、题型筛选、详情展开和重新练习。
5. 分别在桌面和移动视口测试，无内容遮挡或不可点击控件。
6. 关闭开发电脑上的 Docker 后重复写作和朗读测试，确认线上仍正常。

### 8.3 Playwright 自动验收

仓库已提供线上测试脚本。运行前设置生产地址和 Playwright 模块位置：

```powershell
$env:PTE_ONLINE_URL='https://YOUR_SITE_DOMAIN'
$env:PLAYWRIGHT_MODULE='YOUR_PLAYWRIGHT_MODULE_PATH'
node scripts/test-pte-online.mjs
```

> **通过标准**
>
> 生产页面公开可达，评分请求返回 HTTP 200，服务器健康检查通过，且关闭本地开发电脑后结果不变。

## 9 运维与监控

| **检查项** | **建议频率** | **告警条件** | **处理动作** |
| --- | --- | --- | --- |
| HTTPS 健康检查 | 每 1 分钟 | 连续 3 次失败 | 检查 Tunnel 和 gateway |
| CPU 与内存 | 持续采集 | 持续超过 80% | 扩容或限制并发 |
| 磁盘空间 | 每日 | 可用空间低于 20% | 清理旧镜像和日志 |
| 容器重启次数 | 每日 | 异常增长 | 查看容器日志和 OOM |
| 评分延迟与错误率 | 持续采集 | P95 超标或错误率上升 | 定位模型与网络瓶颈 |

```bash
docker compose ps
docker compose logs --since=30m gateway
docker stats --no-stream
df -h
docker system df
```

## 10 更新与回滚

### 10.1 常规更新

```bash
cd /opt/pte-platform/app
git fetch origin
git checkout main
git pull --ff-only
cd pte-scoring-service
docker compose build
docker compose up -d
docker compose ps
```

更新前记录当前提交号，并在维护窗口执行。不要使用会覆盖服务器本地配置的 Git 命令。

### 10.2 回滚

```bash
cd /opt/pte-platform/app
git log --oneline -5
git checkout YOUR_PREVIOUS_VERIFIED_COMMIT
cd pte-scoring-service
docker compose build
docker compose up -d
curl --fail http://127.0.0.1:8080/health
```

回滚恢复后先验证服务器健康，再验证生产网站。确认稳定后再决定是否恢复 main 分支的新版本。

## 11 安全与商业化前置条件

迁移 Docker 解决了评分服务的在线可用性，但不等于平台已经达到完整商业化标准。公开收费前至少应完成以下事项：

- 接入可信身份认证，移除依赖 localStorage 的服务端授权假设。
- 按用户和资源重写 Supabase RLS，复核 Storage bucket 权限。
- 对评分 API 增加按用户和 IP 的限流、配额、超时和请求体大小限制。
- 实施题库来源审查、授权记录、下架机制和内容版本管理。
- 建立支付、订阅、退款、隐私政策、用户协议和数据删除流程。
- 用人工标注样本校准评分，持续监测与 Pearson 官方标准的偏差。
- 建立日志脱敏、密钥轮换、漏洞更新、备份恢复和事故响应流程。
- 进行容量测试，明确并发上限、服务等级目标和降级策略。

## 12 实施清单

- [ ] 云服务器规格满足当前并发目标
- [ ] Docker 与 Compose 已安装并设为开机启动
- [ ] 代码已部署到 /opt/pte-platform/app
- [ ] SHARED_TOKEN 已安全生成并限制文件权限
- [ ] gateway、whisper-service、openpronounce-service 为 healthy，languagetool 为 running（未配置健康检查）
- [ ] 固定 HTTPS 域名返回健康状态
- [ ] 公网未开放内部容器端口
- [ ] Vercel 两个生产环境变量已配置
- [ ] Vercel 已重新部署
- [ ] 写作和朗读真实流程均已通过
- [ ] 关闭本地电脑后线上评分仍正常
- [ ] 监控、告警、日志和回滚负责人已明确

## 13 故障快速定位

| **现象** | **常见原因** | **优先检查** |
| --- | --- | --- |
| 401 | 两端令牌不一致 | Vercel Token 与 SHARED_TOKEN |
| 404 | 评分 URL 路径或域名错误 | PTE_SCORING_SERVICE_URL |
| 502 | 网关或模型服务异常 | docker compose ps 和 gateway 日志 |
| 504 | 模型超时或资源不足 | CPU、内存、评分耗时 |
| 域名无法访问 | DNS、Tunnel 或证书异常 | Cloudflare/Caddy 状态 |
| 重启后失效 | Docker 或 Tunnel 未自启 | systemd 与 restart policy |

> **最终状态**
>
> 当固定域名、云端 Docker、Vercel 环境变量和端到端验收全部完成后，本地电脑不再参与生产链路。此时可以删除 Vercel 中的临时 trycloudflare.com 地址，并停止本地 pte-scoring-tunnel。
