"""
最小可用的 faster-whisper 转写 HTTP 包装服务。

为什么选 faster-whisper 而不是官方 openai-whisper：
- 基于 CTranslate2 重新实现推理，CPU 上速度明显更快、内存占用更低，
  不需要 GPU 也能在几秒内转写几十秒的录音（对 PTE Read Aloud 场景足够）。
- 支持 int8 量化，small/base 模型在普通 VPS（2-4 core CPU）上就能跑。
- 纯 Python + ctranslate2，容器化简单，没有额外的系统级依赖（相比某些
  需要特定 CUDA/cuDNN 版本的方案）。

这不是通用 ASR 微服务，只服务于本项目 gateway 的 /score/read-aloud 调用，
所以接口故意做得很薄：一个 /transcribe 端点，接受音频文件，返回文本。
"""

import os
import tempfile

from fastapi import FastAPI, File, Header, HTTPException, UploadFile
from faster_whisper import WhisperModel

MODEL_SIZE = os.environ.get("WHISPER_MODEL_SIZE", "small")
DEVICE = os.environ.get("WHISPER_DEVICE", "cpu")
COMPUTE_TYPE = os.environ.get("WHISPER_COMPUTE_TYPE", "int8")
SHARED_TOKEN = os.environ.get("SHARED_TOKEN")  # 网关内部调用用的共享密钥，可选

app = FastAPI(title="pte-whisper-service")

# 模型只在进程启动时加载一次，避免每次请求都重新加载（那样会非常慢）。
model = WhisperModel(MODEL_SIZE, device=DEVICE, compute_type=COMPUTE_TYPE)


def _check_auth(authorization: str | None) -> None:
    if not SHARED_TOKEN:
        return
    expected = f"Bearer {SHARED_TOKEN}"
    if authorization != expected:
        raise HTTPException(status_code=401, detail="unauthorized")


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "model": MODEL_SIZE, "device": DEVICE}


@app.post("/transcribe")
async def transcribe(
    audio: UploadFile = File(...),
    authorization: str | None = Header(default=None),
) -> dict:
    _check_auth(authorization)

    suffix = os.path.splitext(audio.filename or "audio.webm")[1] or ".webm"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(await audio.read())
        tmp_path = tmp.name

    try:
        segments, info = model.transcribe(tmp_path, language="en", beam_size=5, vad_filter=True)
        text_segments = []
        segment_details = []
        for segment in segments:
            text_segments.append(segment.text.strip())
            segment_details.append(
                {"start": segment.start, "end": segment.end, "text": segment.text.strip()}
            )
        transcript = " ".join(part for part in text_segments if part).strip()
        return {
            "transcript": transcript,
            "language": info.language,
            "duration": info.duration,
            "segments": segment_details,
        }
    finally:
        os.unlink(tmp_path)
