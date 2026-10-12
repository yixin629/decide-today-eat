"""Build a local, metadata-only index from personally licensed PTE PDFs.

Usage: python scripts/build-pte-private-index.py OUTPUT.csv PDF [PDF ...]
The generated CSV is for local personal reference, not commercial publication.
"""

import csv
import re
import sys
from pathlib import Path

from pypdf import PdfReader


CODE = re.compile(r"\((RA|RS|DI|RL|SGD|ASQ|SWT|WE|FIBD&D|FIB|MCMR|MCSR|RO|SST|MCML|FIBL|HCS|MCSL|SMW|HIW|WFD)\s*#\s*(\d+)\s*\)")
TOC_ENTRY = re.compile(r"^\d+\.\s*(.{1,100}?)\s*\([^)]*\)\s*(?:\([^)]*\)\s*)*\(([A-Z][A-Z&]+)\s*#\s*(\d+)\)$")


def inspect(path: Path) -> dict[tuple[str, str], tuple[str, int]]:
    reader = PdfReader(path)
    found: dict[tuple[str, str], tuple[str, int]] = {}
    titles: dict[tuple[str, str], str] = {}
    content_started = False

    for page_no, page in enumerate(reader.pages, 1):
        text = page.extract_text() or ""
        # Generated contents pages have thousands of dotted leaders.
        is_contents = text.count("·") > 300
        if is_contents:
            for line in text.splitlines():
                match = TOC_ENTRY.match(line.strip())
                if match:
                    title, code, number = match.groups()
                    if CODE.fullmatch(f"({code} #{number})"):
                        titles[(code, number)] = title.strip()
            continue

        if page_no > 1:
            content_started = True
        if not content_started:
            continue

        for code, number in CODE.findall(text):
            key = (code, number)
            found.setdefault(key, (titles.get(key, ""), page_no))

    return found


def main() -> None:
    if len(sys.argv) < 4:
        raise SystemExit(__doc__)
    output = Path(sys.argv[1]).resolve()
    inputs = [Path(value).resolve() for value in sys.argv[2:]]
    if any(not path.is_file() for path in inputs):
        raise SystemExit("Every PDF input must exist.")
    if output in inputs:
        raise SystemExit("Output must not overwrite an input PDF.")

    sources = [(path.name, inspect(path)) for path in inputs]
    keys = sorted(set().union(*(set(records) for _, records in sources)), key=lambda key: (key[0], int(key[1])))
    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.writer(handle)
        writer.writerow(["题型代码", "题号", "短标题", *[f"{name} 页码" for name, _ in sources]])
        for key in keys:
            title = next((records[key][0] for _, records in sources if key in records and records[key][0]), "")
            writer.writerow([*key, title, *[records[key][1] if key in records else "" for _, records in sources]])

    print(f"Indexed {len(keys)} unique question IDs into {output}")
    for name, records in sources:
        print(f"{name}: {len(records)} IDs")


if __name__ == "__main__":
    main()
