"""
统一评分网关。Next.js 应用（app/api/pte-scoring/*/route.ts）只需要跟这一个
服务对话，两个端点：

  POST /score/read-aloud   multipart/form-data: promptText, audio
  POST /score/writing      application/json: { promptText, sourceText?, text }

网关内部再去调用 whisper-service（转写）、openpronounce-service（发音）、
LanguageTool（语法/拼写）。任何一个下游不可用时，网关会尽量返回能算出来
的字段，缺失的字段留空/省略，由 Next.js 侧的 scoring.ts 决定怎么和本地
启发式结果合并——网关本身不做"整体降级"的决定。

鉴权：如果设置了 SHARED_TOKEN 环境变量，会校验 Authorization: Bearer 头。
这是一个只给两个人用的私有网站，共享密钥已经足够，没有做用户级别的权限。
"""

import os
import re

import httpx
from fastapi import FastAPI, File, Form, Header, HTTPException, UploadFile
from pydantic import BaseModel

WHISPER_URL = os.environ.get("WHISPER_SERVICE_URL", "http://whisper-service:8001")
OPENPRONOUNCE_URL = os.environ.get("OPENPRONOUNCE_SERVICE_URL", "http://openpronounce-service:8002")
LANGUAGETOOL_URL = os.environ.get("LANGUAGETOOL_URL", "http://languagetool:8010")
SHARED_TOKEN = os.environ.get("SHARED_TOKEN")

HTTP_TIMEOUT = httpx.Timeout(30.0, connect=10.0)

app = FastAPI(title="pte-scoring-gateway")


def _check_auth(authorization: str | None) -> None:
    if not SHARED_TOKEN:
        return
    if authorization != f"Bearer {SHARED_TOKEN}":
        raise HTTPException(status_code=401, detail="unauthorized")


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


# ---------------------------------------------------------------------------
# /score/read-aloud
# ---------------------------------------------------------------------------


def _word_overlap_ratio(reference: str, transcript: str) -> float:
    def normalize(text: str) -> set[str]:
        return {w for w in re.sub(r"[.,!?;:\"']", "", text.lower()).split() if w}

    ref_words = normalize(reference)
    if not ref_words:
        return 0.0
    hyp_words = normalize(transcript)
    matched = len(ref_words & hyp_words)
    return matched / len(ref_words)


async def _transcribe(client: httpx.AsyncClient, audio_bytes: bytes, filename: str) -> dict | None:
    try:
        headers = {"Authorization": f"Bearer {SHARED_TOKEN}"} if SHARED_TOKEN else {}
        res = await client.post(
            f"{WHISPER_URL}/transcribe",
            files={"audio": (filename, audio_bytes, "audio/webm")},
            headers=headers,
        )
        res.raise_for_status()
        return res.json()
    except Exception:  # noqa: BLE001 - 转写服务不可用时降级为 None，由调用方处理
        return None


async def _pronunciation_score(client: httpx.AsyncClient, audio_bytes: bytes, filename: str, reference_text: str) -> dict | None:
    try:
        res = await client.post(
            f"{OPENPRONOUNCE_URL}/score",
            data={"reference_text": reference_text},
            files={"audio": (filename, audio_bytes, "audio/webm")},
        )
        res.raise_for_status()
        return res.json()
    except Exception:  # noqa: BLE001 - OpenPronounce 不可用/未搭好时降级为 None
        return None


@app.post("/score/read-aloud")
async def score_read_aloud(
    promptText: str = Form(...),
    audio: UploadFile = File(...),
    authorization: str | None = Header(default=None),
) -> dict:
    _check_auth(authorization)

    audio_bytes = await audio.read()
    filename = audio.filename or "recording.webm"

    async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as client:
        transcript_result = await _transcribe(client, audio_bytes, filename)
        pronunciation_result = await _pronunciation_score(client, audio_bytes, filename, promptText)

    transcript = transcript_result.get("transcript") if transcript_result else None

    content_score = None
    fluency_score = None
    if transcript is not None:
        overlap = _word_overlap_ratio(promptText, transcript)
        content_score = round(overlap * 5, 2)

        # 极简流利度信号：录音时长（由 whisper 的 duration 字段给出）与原文
        # 期望朗读时长（按约 2.2 词/秒的常见朗读语速估算）的接近程度。
        # 这跟 Next.js 端已有的本地启发式思路一致，只是这里用的是服务端
        # 实际测得的音频时长而不是浏览器 MediaRecorder 的计时。
        expected_seconds = max(len(promptText.split()) / 2.2, 0.01)
        duration = transcript_result.get("duration") if transcript_result else None
        if isinstance(duration, (int, float)) and duration > 0:
            ratio = min(duration, expected_seconds) / max(duration, expected_seconds)
            fluency_score = round(ratio * 5, 2)

    pronunciation_score = pronunciation_result.get("pronunciationScore") if pronunciation_result else None

    return {
        "transcript": transcript,
        "contentScore": content_score,
        "pronunciationScore": pronunciation_score,
        "fluencyScore": fluency_score,
        "details": {
            "transcription": transcript_result,
            "pronunciation": pronunciation_result,
        },
    }


# ---------------------------------------------------------------------------
# /score/writing
# ---------------------------------------------------------------------------


class WritingScoringRequest(BaseModel):
    promptText: str
    sourceText: str | None = None
    text: str


@app.post("/score/writing")
async def score_writing(payload: WritingScoringRequest, authorization: str | None = Header(default=None)) -> dict:
    _check_auth(authorization)

    async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as client:
        try:
            lt_res = await client.post(
                f"{LANGUAGETOOL_URL}/v2/check",
                data={"text": payload.text, "language": "en-US"},
            )
            lt_res.raise_for_status()
            lt_data = lt_res.json()
        except Exception:  # noqa: BLE001 - LanguageTool 不可用时返回空结果，由 Next.js 侧回退
            lt_data = None

    grammar_issues: list[dict] = []
    spelling_issues: list[dict] = []
    if lt_data:
        for match in lt_data.get("matches", []):
            rule = match.get("rule", {}) or {}
            issue_type = ((rule.get("issueType") or "")).lower()
            entry = {
                "message": match.get("message"),
                "shortMessage": match.get("shortMessage"),
                "offset": match.get("offset"),
                "length": match.get("length"),
                "ruleId": rule.get("id"),
                "category": (rule.get("category") or {}).get("name"),
            }
            if issue_type == "misspelling" or (rule.get("category") or {}).get("id") == "TYPOS":
                spelling_issues.append(entry)
            else:
                grammar_issues.append(entry)

    word_count = max(len(payload.text.split()), 1)
    # 每 100 词允许的语法问题数量作为粗略基准，超出则线性扣分，封顶到 0。
    grammar_density = len(grammar_issues) / word_count * 100
    grammar_score_0_to_1 = max(0.0, 1 - grammar_density / 15)
    spelling_density = len(spelling_issues) / word_count * 100
    spelling_score_0_to_1 = max(0.0, 1 - spelling_density / 10)

    return {
        "grammarIssues": grammar_issues,
        "spellingIssues": spelling_issues,
        "grammarScore": round(grammar_score_0_to_1, 3),
        "spellingScore": round(spelling_score_0_to_1, 3),
        # 词汇多样性与内容关键词覆盖率交给 Next.js 侧本地计算（纯字符串处理，
        # 不需要额外的开源服务），这里不重复实现，保持网关职责单一。
    }
