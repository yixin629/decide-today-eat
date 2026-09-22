"""
OpenPronounce 的最小 HTTP 包装层 —— 未经实际验证，需要你对照仓库源码修正。

写这个文件时无法联网执行 OpenPronounce 的实际代码，因此下面 `import` 与
函数调用的具体名字（模块路径、函数签名）是根据其 README 描述的功能
（Wav2Vec2 + DTW 音素级发音评分）做的合理猜测，不保证与当前仓库版本完全
一致。部署前请：

1. 打开 https://github.com/Halleck45/OpenPronounce 的源码，找到它实际暴露
   的评分入口函数（可能叫 `score()`、`assess()`、`compare()` 之类）。
2. 把下面 `run_pronunciation_assessment()` 里的调用替换成真实的函数签名。
3. 确认它接受的是文件路径、音频字节数组还是其他格式。

在替换完成之前，这个 wrapper 会在调用失败时返回 501，gateway 会将其视为
"OpenPronounce 不可用"并把 pronunciationScore 留空，由 gateway 决定是否
整体回退。
"""

import os
import tempfile

from fastapi import FastAPI, File, Form, HTTPException, UploadFile

app = FastAPI(title="pte-openpronounce-wrapper")


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


def run_pronunciation_assessment(audio_path: str, reference_text: str) -> dict:
    """
    需要替换为 OpenPronounce 的真实调用方式。示意性伪代码：

        from openpronounce import PronunciationScorer
        scorer = PronunciationScorer()
        result = scorer.score(audio_path=audio_path, reference_text=reference_text)
        return {
            "pronunciationScore0to1": result.overall_score,  # 0-1
            "phonemeDetails": result.phoneme_scores,
        }

    在确认真实 API 之前，这里先抛出异常，让 /score 端点返回 501。
    """
    raise NotImplementedError(
        "请对照 OpenPronounce 实际源码替换 run_pronunciation_assessment() 的实现"
    )


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
