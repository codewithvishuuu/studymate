"""Flashcards: model generation validated against schema, persisted."""

import json
import uuid
from datetime import datetime, timezone

from app.core import db
from app.core.config import settings
from app.core.errors import AppError
from app.services import documents, gen
from app.services.quizzes import _ready_chunks

SCHEMA_HINT = """[{"front": string (prompt, no answer), "back": string (<=60 words),
"topic": string, "source_ref": {"document_id": string, "page": int|null, "chunk_id": string}}]"""


def utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()


def generate(document_ids: list, count: int = 20, topic=None) -> dict:
    if not document_ids:
        raise AppError("VALIDATION_ERROR", "At least one document is required.", 422)
    ctx = _ready_chunks(document_ids, settings.rag_max_context_chars)
    numbered = "\n\n".join(f"[Chunk {cid}]\n{t}" for cid, t in ctx)
    focus = f" Focus on topic: {topic}." if topic else ""
    prompt = f"Write {count} front/back flashcards from the study material below.{focus} Front is a prompt, back is the answer.\n\n{numbered}"
    data = gen.generate_json(prompt, SCHEMA_HINT)
    cards = data if isinstance(data, list) else data.get("cards", [])
    valid = [c for c in cards if isinstance(c, dict) and c.get("front") and c.get("back") and c.get("topic") and (c.get("source_ref") or {}).get("chunk_id")]
    if not valid:
        raise AppError("AI_OUTPUT_INVALID", "The AI returned no valid flashcards. Retry generation.", 502)
    valid = valid[:count]
    out = []
    with db.connect() as conn:
        for c in valid:
            cid = str(uuid.uuid4())
            conn.execute(
                "INSERT INTO flashcards (id, document_ids, front, back, topic, source_ref, created_at) VALUES (?,?,?,?,?,?,?)",
                (cid, json.dumps(document_ids), c["front"], c["back"], c["topic"], json.dumps(c["source_ref"]), utcnow()),
            )
            out.append({"id": cid, "front": c["front"], "back": c["back"], "topic": c["topic"], "source_ref": c["source_ref"]})
    return {"cards": out}
