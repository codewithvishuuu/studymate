"""Study plans: deterministic scheduling shell over real docs/topics.

Model enhances titles when available; the schedule itself never needs the model,
so plans work fully offline (honest, practical, never dense-by-default).
"""

import json
import uuid
from datetime import date, datetime, timedelta, timezone

from app.core import db
from app.core.errors import AppError
from app.services import documents, progress as progress_svc

KINDS = ("read", "quiz", "flashcards", "revise")


def utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()


def generate(subject=None, document_ids=None, exam_date: str = "", minutes_per_day: int = 60) -> dict:
    try:
        exam = date.fromisoformat(exam_date)
    except ValueError:
        raise AppError("VALIDATION_ERROR", "exam_date must be YYYY-MM-DD.", 422)
    if exam <= date.today():
        raise AppError("VALIDATION_ERROR", "Exam date must be in the future.", 422)
    if not (10 <= minutes_per_day <= 480):
        raise AppError("VALIDATION_ERROR", "minutes_per_day must be 10-480.", 422)
    docs = [d for d in documents.list_all() if d["status"] == "ready" and (not document_ids or d["id"] in document_ids)]
    if subject is None and not docs:
        raise AppError("NO_MATERIAL", "No study material in scope. Upload a PDF first.", 422)
    weak = [w["topic"] for w in progress_svc.compute()["weak_topics"][:5]]
    days, day = [], date.today() + timedelta(days=1)
    # ponytail: one task block per day from a 4-kind rotation (ceiling: simple rotation; upgrade: spaced-repetition scheduler).
    rotation = ["read", "flashcards", "quiz", "revise"]
    doc_pool = docs or [{"id": None, "filename": subject or "general"}]
    while day <= exam:
        kind = rotation[(day.toordinal()) % len(rotation)]
        target = doc_pool[(day.toordinal()) % len(doc_pool)]
        topic = weak[(day.toordinal()) % len(weak)] if weak else (subject or "general revision")
        days.append({
            "date": day.isoformat(),
            "minutes": min(minutes_per_day, 90),
            "tasks": [{
                "title": f"{kind.capitalize()}: {topic} ({target['filename']})",
                "topic": topic,
                "document_id": target["id"],
                "kind": kind,
            }],
        })
        day += timedelta(days=1)
        if len(days) >= 60:
            break  # ceiling guard: cap horizon at 60 days
    plan_id = str(uuid.uuid4())
    with db.connect() as conn:
        conn.execute(
            "INSERT INTO plans (id, subject, exam_date, days, created_at) VALUES (?,?,?,?,?)",
            (plan_id, subject, exam.isoformat(), json.dumps(days), utcnow()),
        )
    return {"id": plan_id, "exam_date": exam.isoformat(), "days": days}
