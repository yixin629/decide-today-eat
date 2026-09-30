# 已实测跑通（本机 Docker Desktop 用真实合成音频调用过 /score，能返回真实
# 分数，不再是占位实现）。仍保留下面的背景说明，方便你理解这个镜像的来源。
#
# OpenPronounce（https://github.com/Halleck45/OpenPronounce）没有官方发布的
# Docker 镜像，这里采用"克隆源码 + 按其 README 安装依赖"的方式自建镜像。
#
# 实测踩过的坑：README 里写明系统依赖需要 ffmpeg 和 espeak-ng，一开始只装了
# ffmpeg，运行时会在加载音素识别模型（facebook/wav2vec2-lv-60-espeak-cv-ft）
# 时抛出 `RuntimeError: espeak not installed on your system`——这是
# transformers 的 Wav2Vec2Phoneme tokenizer 在底层调用 espeak 做音素转写，
# 缺这个系统包会直接崩溃，不是 Python 依赖能替代的。补上 espeak-ng 后验证
# 正常返回分数。
#
# 如果这个 Dockerfile 未来构建失败（比如上游仓库改了依赖），最稳妥的备选
# 方案是：不在 Docker 里构建它，而是在宿主机（或另一台你控制的机器）上按
# 官方 README 手动搭建 Python 环境运行，然后把它的地址配置进 gateway 的
# OPENPRONOUNCE_URL 环境变量，gateway 侧的调用逻辑不关心它是否跑在容器里。

FROM python:3.11-slim

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends git ffmpeg espeak-ng build-essential \
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
