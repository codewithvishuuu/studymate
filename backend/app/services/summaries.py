"""Summaries: model generation over real document text. No persistence (response only)."""

import uuid
from datetime import datetime, timezone

from app.core.config import settings
from app.core.errors import AppError
from app.services import ai, documents
from app.services.quizzes import _ready_chunks

MODES = ("short", "key-points")


def utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()


def generate(document_id: str, mode: str = "short", selection=None) -> dict:
    if mode not in MODES:
        raise AppError("VALIDATION_ERROR", f"Mode must be one of {MODES}.", 422)
    doc = documents.get(document_id)
    if doc["status"] != "ready":
        raise AppError("DOCUMENT_NOT_READY", "Document is not ready yet.", 409)
    ctx = _ready_chunks([document_id], settings.rag_max_context_chars)
    if selection:
        try:
            lo, hi = int(selection["page_from"]), int(selection["page_to"])
        except (KeyError, TypeError, ValueError):
            raise AppError("VALIDATION_ERROR", "Selection needs integer page_from/page_to.", 422)
        if lo > hi or lo < 1:
            raise AppError("VALIDATION_ERROR", "Invalid page range.", 422)
    text = "\n\n".join(t for _, t in ctx)
    style = "one short paragraph" if mode == "short" else "a bullet list of key points"
    content = ai.generate(f"Summarize the study material below as {style}. Use only this material.\n\n{text}", temperature=0.4).strip()
    if not content:
        raise AppError("AI_OUTPUT_INVALID", "The AI returned an empty summary. Retry.", 502)
    out = {"id": str(uuid.uuid4()), "document_id": document_id, "mode": mode, "content": content, "created_at": utcnow()}
    if mode == "key-points":
        out["key_points"] = [line.strip("- •\t ") for line in content.splitlines() if line.strip()]
    return out
