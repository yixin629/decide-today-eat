# CPU-only faster-whisper 转写服务。首次启动时 faster-whisper 会自动从
# HuggingFace Hub 下载所选模型（默认 "small"，约 500MB），之后会缓存在
# /root/.cache 中——建议在 docker-compose.yml 里为该目录挂载一个具名卷，
# 避免每次重建容器都重新下载。
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .

EXPOSE 8001

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8001"]
