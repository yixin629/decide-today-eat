# 未验证的 Dockerfile —— 请在部署前自行核实。
#
# OpenPronounce（https://github.com/Halleck45/OpenPronounce）在写这份文件时
# 没有官方发布的 Docker 镜像，因此这里采用"克隆源码 + 按其 README 安装依赖"
# 的方式自建镜像。这是我们能给出的最佳猜测，不是已验证可运行的构建：
# 部署前请你自己打开该仓库确认：
#   1. requirements.txt / pyproject.toml 的实际依赖列表和 Python 版本要求
#   2. 它是命令行工具还是本身就带 HTTP server；如果只是 CLI，需要用下面的
#      wrapper_server.py（同目录）把它包成一个 /score 端点
#   3. 预训练 Wav2Vec2 模型权重的获取方式（HuggingFace Hub 自动下载，还是
#      需要手动下载并挂载）
#
# 如果这个 Dockerfile 构建失败，最稳妥的备选方案是：不在 Docker 里构建它，
# 而是在宿主机（或另一台你控制的机器）上按官方 README 手动搭建 Python
# 环境运行，然后把它的地址配置进 gateway 的 OPENPRONOUNCE_URL 环境变量，
# gateway 侧的调用逻辑不关心它是否跑在容器里。

FROM python:3.11-slim

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends git ffmpeg build-essential \
    && rm -rf /var/lib/apt/lists/*

# 克隆源码。若仓库结构或依赖文件名与预期不同，构建会在这一步之后失败，
# 请对照实际仓库内容调整下面几行。
RUN git clone --depth 1 https://github.com/Halleck45/OpenPronounce.git /app/OpenPronounce

WORKDIR /app/OpenPronounce

# 优先尝试 requirements.txt；如果仓库改用 poetry/pyproject.toml，需要把
# 这一行换成 `pip install --no-cache-dir .` 或对应的 poetry 安装命令。
RUN pip install --no-cache-dir -r requirements.txt || pip install --no-cache-dir .

# 本项目自带的最小 HTTP 包装层：如果 OpenPronounce 本身没有暴露 HTTP 服务，
# 就用这个文件把它的 Python API 包成 /score 端点。见同目录 wrapper_server.py
# 的注释——里面明确写了它调用的函数名是猜测的，需要你对照实际源码修正。
COPY wrapper_server.py /app/wrapper_server.py
RUN pip install --no-cache-dir fastapi "uvicorn[standard]" python-multipart

EXPOSE 8002

CMD ["uvicorn", "wrapper_server:app", "--host", "0.0.0.0", "--port", "8002", "--app-dir", "/app"]
