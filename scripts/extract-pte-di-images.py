"""Extract local DI image candidates from a source PDF for manual review.

Usage: python scripts/extract-pte-di-images.py INDEX.csv SOURCE.pdf OUTPUT_DIR
OUTPUT_DIR must be outside this repository. Nothing is uploaded or published.
"""

import argparse
import csv
import hashlib
import json
import re
from pathlib import Path

from pypdf import PdfReader


MARKER = re.compile(r"\(DI\s*#\s*(\d+)\s*\)")
REPO_ROOT = Path(__file__).resolve().parents[1]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("index", type=Path, help="CSV used for the Supabase import")
    parser.add_argument("pdf", type=Path, help="One original source PDF")
    parser.add_argument("output", type=Path, help="Local output directory outside the repository")
    parser.add_argument("--audit-only", action="store_true", help="Check mapping without writing files")
    args = parser.parse_args()

    index = args.index.resolve(strict=True)
    pdf = args.pdf.resolve(strict=True)
    output = args.output.resolve()
    if output == REPO_ROOT or output.is_relative_to(REPO_ROOT):
        parser.error("Output must stay outside the Git repository.")
    if output == index.parent or output == pdf.parent:
        parser.error("Use a dedicated output directory, not the input directory.")

    with index.open(encoding="utf-8-sig", newline="") as handle:
        rows = list(csv.DictReader(handle))
    indexed = {}
    for row in rows:
        if row.get("question_code") != "DI":
            continue
        pages = json.loads(row["source_pages"])
        if pdf.name in pages:
            number = int(row["source_number"])
            if number in indexed:
                parser.error(f"Duplicate DI question #{number} in CSV")
            indexed[number] = {"title": row["title"], "marker_page": int(pages[pdf.name])}
    if not indexed:
        parser.error("No DI questions in the CSV refer to this PDF filename.")

    reader = PdfReader(pdf)
    first = min(row["marker_page"] for row in indexed.values())
    last = max(row["marker_page"] for row in indexed.values())
    markers = []
    images = []
    for page_no in range(first, len(reader.pages) + 1):
        page = reader.pages[page_no - 1]
        if page_no <= last:
            markers.extend((int(number), page_no) for number in MARKER.findall(page.extract_text() or ""))
        images.extend((page_no, image) for image in page.images)
        if page_no >= last and len(images) >= len(indexed):
            break

    expected = sorted(indexed, key=lambda number: (indexed[number]["marker_page"], number))
    actual = [number for number, _ in markers]
    if actual != expected:
        parser.error("DI marker order differs from the CSV. No files were written.")
    if len(images) != len(markers):
        parser.error(f"Found {len(markers)} DI markers but {len(images)} images. No files were written.")

    manifest = []
    for (number, marker_page), (image_page, image) in zip(markers, images):
        suffix = Path(image.name).suffix.lower()
        if suffix not in {".jpg", ".jpeg", ".png", ".jp2"}:
            parser.error(f"Unsupported image format {suffix} for DI #{number}")
        data = image.data
        name = f"DI-{number:04d}{suffix}"
        manifest.append({
            "question_code": "DI",
            "source_number": number,
            "title": indexed[number]["title"],
            "source_pdf": pdf.name,
            "marker_page": marker_page,
            "image_page": image_page,
            "file": name,
            "sha256": hashlib.sha256(data).hexdigest(),
            "review_status": "pending-manual-check",
        })
    if args.audit_only:
        print(f"Matched {len(manifest)} DI markers to {len(images)} image candidates on pages {first}-{page_no}.")
        return

    manifest_path = output / "di-image-review.json"
    if manifest_path.exists():
        parser.error(f"Refusing to overwrite an existing manifest: {manifest_path}")
    output.mkdir(parents=True, exist_ok=True)
    for record, (_, image) in zip(manifest, images):
        destination = output / record["file"]
        if destination.exists() and hashlib.sha256(destination.read_bytes()).hexdigest() != record["sha256"]:
            parser.error(f"Refusing to overwrite a different file: {destination}")
        if not destination.exists():
            destination.write_bytes(image.data)
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Extracted {len(manifest)} DI image candidates to {output}")
    print("Review every image against its question before any use or publication.")


if __name__ == "__main__":
    main()
