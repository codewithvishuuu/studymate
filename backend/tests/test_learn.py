import json
import uuid
from datetime import date, timedelta

from fastapi.testclient import TestClient

from app.core import db
from app.core.config import settings
from app.main import app
from tests.fixtures import make_pdf

client = TestClient(app)
PDF = make_pdf(["Photosynthesis makes glucose from light", "Mitosis divides cells"])


def _upload_ready(monkeypatch):
    monkeypatch.setattr("app.services.ai.embed", lambda texts: [[0.1] * 8 for _ in texts])
    r = client.post("/api/documents/upload", files={"file": ("b.pdf", PDF, "application/pdf")})
    assert r.json()["status"] == "ready"
    return r.json()["id"]


def _seed_quiz():
    qz, q1, q2 = str(uuid.uuid4()), str(uuid.uuid4()), str(uuid.uuid4())
    with db.connect() as conn:
        conn.execute("INSERT INTO quizzes (id, document_ids, difficulty, created_at) VALUES (?, '[]', 'easy', 't')", (qz,))
        conn.execute(
            "INSERT INTO questions (id, quiz_id, type, topic, question, options, answer_index, explanation, source_ref) VALUES (?,?,?,?,?,?,?,?,?)",
            (q1, qz, "mcq", "Bio", "Q1?", json.dumps(["a", "b", "c", "d"]), 1, "E1", json.dumps({"document_id": "d", "page": 1, "chunk_id": "c"})),
        )
        conn.execute(
            "INSERT INTO questions (id, quiz_id, type, topic, question, options, answer_index, explanation, source_ref) VALUES (?,?,?,?,?,?,?,?,?)",
            (q2, qz, "mcq", "Bio", "Q2?", json.dumps(["a", "b", "c", "d"]), 0, "E2", json.dumps({"document_id": "d", "page": 1, "chunk_id": "c"})),
        )
    return qz, q1, q2


def test_quiz_submit_scores_mcq():
    qz, q1, q2 = _seed_quiz()
    r = client.post("/api/quiz/submit", json={"quiz_id": qz, "answers": [{"question_id": q1, "answer": 1}, {"question_id": q2, "answer": 3}]})
    assert r.status_code == 200
    body = r.json()
    assert (body["score"], body["total"]) == (1, 2)
    assert body["per_question"][0]["correct"] is True
    assert body["weak_topics"] == ["Bio"]


def test_quiz_submit_rejects_partial():
    qz, q1, _ = _seed_quiz()
    r = client.post("/api/quiz/submit", json={"quiz_id": qz, "answers": [{"question_id": q1, "answer": 1}]})
    assert r.status_code == 422
    assert client.post("/api/quiz/submit", json={"quiz_id": "nope", "answers": []}).status_code == 404


def test_quiz_generate_needs_engine(monkeypatch):
    _upload_ready(monkeypatch)  # no generate stub: simulate missing key
    monkeypatch.setattr(settings, "google_api_key", "")
    r = client.post("/api/quiz/generate", json={"document_ids": ["x"], "count": 2})
    # unknown-id docs resolve inside service; use real ready doc instead
    docs = client.get("/api/documents").json()["documents"]
    r = client.post("/api/quiz/generate", json={"document_ids": [docs[0]["id"]], "count": 2})
    assert r.status_code == 503
    assert r.json()["error"]["code"] == "AI_UNAVAILABLE"


def test_summary_paths(monkeypatch):
    doc_id = _upload_ready(monkeypatch)
    assert client.post("/api/summaries/generate", json={"document_id": "nope", "mode": "short"}).status_code == 404
    assert client.post("/api/summaries/generate", json={"document_id": doc_id, "mode": "huge"}).status_code == 422
    monkeypatch.setattr("app.services.ai.generate", lambda *a, **k: "Light and cells.")
    r = client.post("/api/summaries/generate", json={"document_id": doc_id, "mode": "short"})
    assert r.status_code == 201 and "Light" in r.json()["content"]
    r = client.post("/api/summaries/generate", json={"document_id": doc_id, "mode": "key-points"})
    assert "key_points" in r.json()


def test_flashcards_needs_engine(monkeypatch):
    doc_id = _upload_ready(monkeypatch)
    monkeypatch.setattr(settings, "google_api_key", "")
    r = client.post("/api/flashcards/generate", json={"document_ids": [doc_id], "count": 3})
    assert r.status_code == 503


def test_study_plan_deterministic():
    future = (date.today() + timedelta(days=4)).isoformat()
    r = client.post("/api/study-plan/generate", json={"subject": "Bio", "exam_date": future, "minutes_per_day": 45})
    assert r.status_code == 201
    days = r.json()["days"]
    assert len(days) == 4 and days[0]["date"] < days[-1]["date"]
    assert all(t["kind"] in ("read", "quiz", "flashcards", "revise") for d in days for t in d["tasks"])
    past = (date.today() - timedelta(days=1)).isoformat()
    assert client.post("/api/study-plan/generate", json={"exam_date": past, "minutes_per_day": 30}).status_code == 422
    assert client.post("/api/study-plan/generate", json={"exam_date": future, "minutes_per_day": 30}).status_code == 422  # NO_MATERIAL


def test_progress_and_settings():
    p = client.get("/api/progress").json()
    assert p["documents_count"] == 0 and p["quizzes_taken"] == 0 and p["weak_topics"] == []
    qz, q1, q2 = _seed_quiz()
    client.post("/api/quiz/submit", json={"quiz_id": qz, "answers": [{"question_id": q1, "answer": 1}, {"question_id": q2, "answer": 3}]})
    p = client.get("/api/progress").json()
    assert p["quizzes_taken"] == 1 and p["avg_score"] == 0.5 and p["weak_topics"][0]["topic"] == "Bio"

    s = client.get("/api/settings").json()
    assert s["profile"]["name"] is None and "ai" in s and "rag" in s
    u = client.put("/api/settings", json={"name": "Asha", "subjects": ["Bio"], "daily_goal_minutes": 90}).json()
    assert u["profile"]["name"] == "Asha" and u["study"]["daily_goal_minutes"] == 90
    assert client.put("/api/settings", json={"exam_date": "not-a-date"}).status_code == 422
