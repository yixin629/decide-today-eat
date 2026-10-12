"""Convert extracted PTE drafts to a CSV for Supabase Table Editor import.

Usage: python scripts/build-pte-reference-csv.py INPUT.json OUTPUT.csv
Keep both files outside the repository. Import only after reviewing public access.
"""

import csv
import json
import re
import sys
from pathlib import Path


COLUMNS = (
    "question_code", "source_number", "title", "question_text", "answer_text",
    "source_pages", "review_status",
)


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit(__doc__)
    source = Path(sys.argv[1]).resolve()
    output = Path(sys.argv[2]).resolve()
    if source == output or not source.is_file():
        raise SystemExit("Input must exist and output must be a different file.")
    rows = json.loads(source.read_text(encoding="utf-8"))
    if not isinstance(rows, list) or not rows:
        raise SystemExit("Expected a non-empty JSON array.")
    seen = set()
    prepared = []
    for index, row in enumerate(rows, 1):
        code = row.get("question_code")
        number = row.get("source_number")
        key = (code, number)
        if (
            not isinstance(code, str) or not re.fullmatch(r"[A-Z&]{2,8}", code)
            or type(number) is not int or number < 1 or key in seen
            or row.get("review_status") not in {"needs-review", "reviewed", "incomplete"}
            or not isinstance(row.get("source_pages"), dict)
            or any(not isinstance(row.get(column), str) for column in ("title", "question_text", "answer_text"))
        ):
            raise SystemExit(f"Invalid or duplicate record at row {index}: {key}")
        seen.add(key)
        prepared.append({
            **{column: row[column] for column in COLUMNS if column != "source_pages"},
            "source_pages": json.dumps(row["source_pages"], ensure_ascii=False),
        })
    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=COLUMNS)
        writer.writeheader()
        writer.writerows(prepared)
    print(f"Prepared {len(prepared)} records in the CSV output")
    print(f"Incomplete: {sum(row['review_status'] == 'incomplete' for row in prepared)}")


if __name__ == "__main__":
    main()
