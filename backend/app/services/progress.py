"""Progress: computed aggregation (nothing stored). Weak-topic rule per DATA_MODEL.md."""

import json
from collections import defaultdict

from app.core import db
from app.core.errors import AppError
from app.services import ai, documents

WINDOW = 10


def compute() -> dict:
    with db.connect() as conn:
        doc_count = conn.execute("SELECT COUNT(*) c FROM documents WHERE status='ready'").fetchone()["c"]
        attempts = conn.execute("SELECT * FROM attempts ORDER BY created_at DESC").fetchall()
        sessions = conn.execute("SELECT COUNT(*) c FROM study_sessions").fetchone()["c"]
        questions_asked = conn.execute("SELECT COUNT(*) c FROM chat_messages WHERE role='user'").fetchone()["c"]
    quizzes_taken = len(attempts)
    avg = round(sum(a["score"] / a["total"] for a in attempts) / quizzes_taken, 3) if quizzes_taken and all(a["total"] for a in attempts) else None
    per_topic: dict = defaultdict(list)
    for a in reversed(attempts):  # oldest -> newest; keep last WINDOW per topic
        for pq in json.loads(a["per_question"]):
            per_topic[pq["topic"]].append(1 if pq["correct"] else 0)
    weak = []
    for topic, hist in per_topic.items():
        recent = hist[-WINDOW:]
        if len(recent) >= 2 and sum(recent) / len(recent) < 0.7:
            weak.append({"topic": topic, "accuracy": round(sum(recent) / len(recent), 3), "attempts": len(recent)})
    weak.sort(key=lambda w: w["accuracy"])
    return {
        "documents_count": doc_count,
        "quizzes_taken": quizzes_taken,
        "questions_asked": questions_asked,
        "avg_score": avg,
        "weak_topics": weak,
        "flashcards_known_rate": None,  # frontend-local in MVP (DATA_MODEL.md tiers)
        "sessions_completed": sessions,
    }


def get_profile() -> dict:
    with db.connect() as conn:
        row = conn.execute("SELECT * FROM users LIMIT 1").fetchone()
        prefs = {r["key"]: r["value"] for r in conn.execute("SELECT * FROM prefs").fetchall()}
    profile = {"name": None, "subjects": [], "exam_date": None}
    if row:
        import json as _json

        profile = {"name": row["name"], "subjects": _json.loads(row["subjects"]), "exam_date": row["exam_date"]}
    return {
        "profile": profile,
        "ai": {**ai.health(), "backend_url_set": True},
        "rag": {"top_k": int(prefs.get("top_k", "5")), "max_context_chars": 12000},
        "study": {"daily_goal_minutes": int(prefs.get("daily_goal_minutes", "60")), "language": prefs.get("language", "en")},
    }


def update_profile(name=None, subjects=None, exam_date=None, daily_goal_minutes=None, language=None) -> dict:
    import json as _json
    import uuid

    if exam_date is not None and exam_date != "":
        from datetime import date as _date

        try:
            _date.fromisoformat(exam_date)
        except ValueError:
            raise AppError("VALIDATION_ERROR", "exam_date must be YYYY-MM-DD.", 422)
    with db.connect() as conn:
        row = conn.execute("SELECT * FROM users LIMIT 1").fetchone()
        if row is None:
            conn.execute(
                "INSERT INTO users (id, name, subjects, exam_date) VALUES (?,?,?,?)",
                (str(uuid.uuid4()), name, _json.dumps(subjects or []), exam_date),
            )
        else:
            conn.execute(
                "UPDATE users SET name=COALESCE(?,name), subjects=COALESCE(?,subjects), exam_date=COALESCE(?,exam_date)",
                (name, _json.dumps(subjects) if subjects is not None else None, exam_date or None),
            )
        if daily_goal_minutes is not None:
            if not (10 <= int(daily_goal_minutes) <= 480):
                raise AppError("VALIDATION_ERROR", "daily_goal_minutes must be 10-480.", 422)
            conn.execute("INSERT OR REPLACE INTO prefs (key, value) VALUES ('daily_goal_minutes', ?)", (str(daily_goal_minutes),))
        if language is not None:
            conn.execute("INSERT OR REPLACE INTO prefs (key, value) VALUES ('language', ?)", (str(language),))
    return get_profile()
