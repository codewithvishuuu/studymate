"""Grounded chat: embed -> retrieve -> filter -> generate -> cite. Never invent sources."""

import json
import logging
import time
import uuid
from datetime import datetime, timezone

from app.core import db
from app.core.config import settings
from app.core.errors import AppError
from app.services import ai, documents, vector

NOT_FOUND = "I couldn't find this information in your uploaded study material."

log = logging.getLogger("studymate.rag")


def utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()


def _get_or_create_session(session_id, scope: list) -> str:
    sid = session_id or str(uuid.uuid4())
    with db.connect() as conn:
        row = conn.execute("SELECT id FROM chat_sessions WHERE id=?", (sid,)).fetchone()
        if row is None:
            conn.execute(
                "INSERT INTO chat_sessions (id, document_ids, created_at, updated_at) VALUES (?,?,?,?)",
                (sid, json.dumps(scope), utcnow(), utcnow()),
            )
    return sid


def _save_message(sid: str, role: str, content: str, sources=None, grounded=None) -> None:
    with db.connect() as conn:
        conn.execute(
            "INSERT INTO chat_messages (id, session_id, role, content, sources, grounded, created_at) VALUES (?,?,?,?,?,?,?)",
            (str(uuid.uuid4()), sid, role, content, json.dumps(sources or []), grounded, utcnow()),
        )
        conn.execute("UPDATE chat_sessions SET updated_at=? WHERE id=?", (utcnow(), sid))


def _prompt(query: str, ctx_blocks: list) -> str:
    ctx = "\n\n".join(f"[Source {i+1}]\n{b}" for i, b in enumerate(ctx_blocks))
    return (
        "Answer ONLY from the sources below. If they do not contain the answer, reply exactly:\n"
        f"{NOT_FOUND}\n\nSources:\n{ctx}\n\nQuestion: {query}\nAnswer:"
    )


def ask(query: str, document_ids=None, session_id=None) -> dict:
    if not query or not query.strip() or len(query) > 2000:
        raise AppError("VALIDATION_ERROR", "Query must be 1-2000 characters.", 422)
    scope = document_ids or []
    for did in scope:
        documents.get(did)  # 404 DOCUMENT_NOT_FOUND on bad scope id
    ready = [d for d in documents.list_all() if d["status"] == "ready" and (not scope or d["id"] in scope)]
    sid = _get_or_create_session(session_id, scope)
    _save_message(sid, "user", query.strip())

    if not ready:
        _save_message(sid, "assistant", NOT_FOUND, [], False)
        return {"session_id": sid, "answer": NOT_FOUND, "sources": [], "grounded": False}

    t0 = time.perf_counter()
    qvec = ai.embed([query.strip()])[0]
    t1 = time.perf_counter()
    hits = vector.query(qvec, settings.rag_top_k, scope or None)
    t2 = time.perf_counter()
    hits = [h for h in hits if h["score"] >= settings.rag_min_score]
    if not hits:
        t2 = time.perf_counter()
        log.info("rag.ask embed=%.0fms retrieval=%.0fms generate=0ms hits=0 used=0", (t1 - t0) * 1000, (t2 - t1) * 1000)
        _save_message(sid, "assistant", NOT_FOUND, [], False)
        return {"session_id": sid, "answer": NOT_FOUND, "sources": [], "grounded": False}

    budget, ctx_blocks, used = settings.rag_max_context_chars, [], []
    for h in hits:
        if len("\n\n".join(ctx_blocks + [h["text"]])) > budget:
            break
        ctx_blocks.append(h["text"])
        used.append(h)
    answer = ai.generate(_prompt(query.strip(), ctx_blocks)).strip()
    t3 = time.perf_counter()
    # Stage timings only: no query text, no chunk content, no credentials.
    log.info(
        "rag.ask embed=%.0fms retrieval=%.0fms generate=%.0fms hits=%d used=%d",
        (t1 - t0) * 1000, (t2 - t1) * 1000, (t3 - t2) * 1000, len(hits), len(used),
    )
    if answer == NOT_FOUND:
        # Model refused on the retrieved context: report not-found honestly,
        # never present the unused neighbors as citations.
        _save_message(sid, "assistant", NOT_FOUND, [], False)
        return {"session_id": sid, "answer": NOT_FOUND, "sources": [], "grounded": False}
    sources = [
        {"document_id": h["document_id"], "filename": h["filename"], "page": h["page_number"], "excerpt": h["text"][:300], "chunk_id": h["chunk_id"]}
        for h in used  # ponytail: citations only from in-context chunks (ceiling: no rerank; upgrade: reranker service).
    ]
    _save_message(sid, "assistant", answer, sources, True)
    return {"session_id": sid, "answer": answer, "sources": sources, "grounded": True}


def clear_session(session_id: str) -> dict:
    with db.connect() as conn:
        conn.execute("DELETE FROM chat_messages WHERE session_id=?", (session_id,))
        conn.execute("DELETE FROM chat_sessions WHERE id=?", (session_id,))
    return {"cleared": True}
