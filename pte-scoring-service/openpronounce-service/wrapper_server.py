"""
OpenPronounce 的最小 HTTP 包装层。

之前这里的 run_pronunciation_assessment() 是未经验证的占位实现（直接抛
NotImplementedError），已对照实际安装在容器里的 openpronounce 包源码
（`python -c "import openpronounce, inspect; ..."` 核实过真实函数签名）
改为调用真实 API：

    openpronounce.load_audio(file_path, sr=16000) -> ndarray
    openpronounce.compare_audio_with_text(audio, text_reference, sampling_rate=16000,
                                           use_phone_model=None, lang='en') -> dict
                                           包含 "score"（0-100）等字段

我们保留这层自己的 /score 端点（而不是直接跑 OpenPronounce 自带的
server.py），是为了让 gateway 侧的调用契约（reference_text + audio 表单
字段、返回 0-5 的 pronunciationScore）保持稳定，不随 OpenPronounce 自身
服务端点的字段命名变化而变化。
"""

import os
import tempfile

from fastapi import FastAPI, File, Form, HTTPException, UploadFile

app = FastAPI(title="pte-openpronounce-wrapper")


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


def run_pronunciation_assessment(audio_path: str, reference_text: str) -> dict:
    from openpronounce import load_audio, compare_audio_with_text

    audio = load_audio(audio_path, sr=16000)
    result = compare_audio_with_text(audio, reference_text, sampling_rate=16000, lang="en")

    score_0_to_100 = result.get("score", 0)
    return {
        "pronunciationScore0to1": max(0.0, min(1.0, score_0_to_100 / 100)),
        "phonemeDetails": result.get("differences", {}),
    }


@app.post("/score")
async def score(
    reference_text: str = Form(...),
    audio: UploadFile = File(...),
) -> dict:
    suffix = os.path.splitext(audio.filename or "audio.webm")[1] or ".webm"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(await audio.read())
        tmp_path = tmp.name

    try:
        result = run_pronunciation_assessment(tmp_path, reference_text)
    except NotImplementedError as exc:
        raise HTTPException(status_code=501, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001 - 对外统一转成 502，细节留在日志里
        raise HTTPException(status_code=502, detail=f"OpenPronounce 调用失败: {exc}") from exc
    finally:
        os.unlink(tmp_path)

    # 归一化到 0-5，与 Pearson 公开的 Read Aloud Pronunciation 单题小分制对齐。
    score_0_to_1 = result.get("pronunciationScore0to1", 0)
    return {
        "pronunciationScore": round(score_0_to_1 * 5, 2),
        "details": result,
    }
