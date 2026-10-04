"""Page-aware chunking. Pure functions (testable without models)."""

import re
from datetime import datetime, timezone

_WS = re.compile(r"\s+")
# Control/null chars from unmapped glyphs (e.g. custom Hindi fonts extract as U+0000).
# Never meaningful text; stripped before chunking so they can't poison embeddings or prompts.
_CONTROL = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]")


def clean_text(text: str) -> str:
    return _WS.sub(" ", _CONTROL.sub("", text)).strip()


def chunk_pages(
    pages: list,
    document_id: str,
    filename: str,
    subject=None,
    chunk_size: int = 2000,
    overlap: int = 200,
) -> list:
    """Split each page's cleaned text; never merge across pages without recording the page.

    pages: list of (page_number | None, raw_text). Returns chunk dicts with
    RAG.md metadata: document_id, filename, page_number, chunk_id, subject.
    """
    now = datetime.now(timezone.utc).isoformat()
    chunks: list = []
    step = max(chunk_size - overlap, 1)
    for page_number, raw in pages:
        text = clean_text(raw or "")
        if not text:
            continue
        idx = 0
        start = 0
        while start < len(text):
            piece = text[start : start + chunk_size]
            page_label = page_number if page_number is not None else "x"
            chunks.append(
                {
                    "id": f"{document_id}:{page_label}:{idx}",
                    "document_id": document_id,
                    "filename": filename,
                    "page_number": page_number,
                    "text": piece,
                    "subject": subject,
                    "char_count": len(piece),
                    "created_at": now,
                }
            )
            idx += 1
            if start + chunk_size >= len(text):
                break
            start += step
    return chunks
