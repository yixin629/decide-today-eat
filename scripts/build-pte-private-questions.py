"""Extract reviewable personal-use question drafts from the three local PDFs.

Usage: python scripts/build-pte-private-questions.py INDEX.csv OUTPUT.json PDF [PDF ...]
Output stays outside the repository. Text extraction is not an answer key audit.
"""

import csv
import json
import re
import sys
from pathlib import Path

from pypdf import PdfReader


ITEM_START = re.compile(r"(?m)^\d+\.\s*(?=\n|[A-Z])")
ANNOTATION = re.compile(r"\((?:预测|解析|同步跟读|完整⾳频|完整音频|新题|不完整)\)")
COMMENTARY = re.compile(r"(?:机经点评|解析)\s*[:：]")
ANSWER = re.compile(r"答案\s*[:：]")


def extract(text: str, code: str, number: int) -> tuple[str, str, bool]:
    marker = re.search(rf"\({re.escape(code)}\s*#\s*{number}\s*\)", text)
    if not marker:
        return "", "", True
    starts = [match.start() for match in ITEM_START.finditer(text)]
    begin = max((position for position in starts if position <= marker.start()), default=0)
    end = min((position for position in starts if position > marker.end()), default=len(text))
    piece = text[begin:end]
    piece = re.sub(r"^\d+\.\s*", "", piece)
    piece = ANNOTATION.sub("", piece)
    piece = re.sub(rf"\({re.escape(code)}\s*#\s*{number}\s*\)", "", piece)
    piece = re.sub(r"Page \d+ of \d+\s*$", "", piece).strip()
    answer_match = ANSWER.search(piece)
    answer = ""
    if answer_match:
        answer = COMMENTARY.split(piece[answer_match.end():], maxsplit=1)[0].strip()
        piece = piece[:answer_match.start()].strip()
    piece = COMMENTARY.split(piece, maxsplit=1)[0].strip()
    # For these spoken/dictation types the visible transcript is also the expected answer.
    if code in {"RS", "WFD", "RA"} and not answer:
        answer = piece
    return piece[:15000], answer[:15000], len(piece) < 12 or code == "DI"


def main() -> None:
    if len(sys.argv) < 5:
        raise SystemExit(__doc__)
    index_path = Path(sys.argv[1]).resolve()
    output = Path(sys.argv[2]).resolve()
    paths = [Path(value).resolve() for value in sys.argv[3:]]
    if output == index_path or output in paths:
        raise SystemExit("Output must not overwrite an input.")
    with index_path.open(encoding="utf-8-sig", newline="") as handle:
        index = list(csv.DictReader(handle))
    readers = {path.name: PdfReader(path) for path in paths}
    page_cache: dict[tuple[str, int], str] = {}
    rows = []
    for source in index:
        code = source["题型代码"]
        number = int(source["题号"])
        pages = {name: int(source[f"{name} 页码"]) for name in readers if source.get(f"{name} 页码")}
        question = answer = ""
        incomplete = True
        for name, page_no in pages.items():
            cache_key = (name, page_no)
            if cache_key not in page_cache:
                page_cache[cache_key] = readers[name].pages[page_no - 1].extract_text() or ""
            question, answer, incomplete = extract(page_cache[cache_key], code, number)
            if question:
                break
        rows.append({
            "question_code": code,
            "source_number": number,
            "title": source["短标题"],
            "question_text": question,
            "answer_text": answer,
            "source_pages": pages,
            "review_status": "incomplete" if incomplete or not answer else "needs-review",
        })
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {len(rows)} private drafts to {output}")
    print(f"With question text: {sum(bool(row['question_text']) for row in rows)}")
    print(f"With extracted answer: {sum(bool(row['answer_text']) for row in rows)}")
    print(f"Incomplete: {sum(row['review_status'] == 'incomplete' for row in rows)}")


if __name__ == "__main__":
    main()
