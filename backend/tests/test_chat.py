from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import app
from app.services.chat import NOT_FOUND
from tests.fixtures import make_pdf

client = TestClient(app)
PDF = make_pdf(["Photosynthesis converts light energy into glucose", "Mitochondria produce ATP for cells"])
DIM = 8


def _upload(monkeypatch):
    monkeypatch.setattr("app.services.ai.embed", lambda texts: [[0.1] * DIM for _ in texts])
    r = client.post("/api/documents/upload", files={"file": ("b.pdf", PDF, "application/pdf")})
    assert r.json()["status"] == "ready"
    return r.json()["id"]


def test_no_documents_returns_not_found():
    r = client.post("/api/chat", json={"query": "What is photosynthesis?"})
    assert r.status_code == 200
    body = r.json()
    assert body["answer"] == NOT_FOUND and body["sources"] == [] and body["grounded"] is False


def test_bad_scope_id_404():
    r = client.post("/api/chat", json={"query": "hi", "document_ids": ["missing"]})
    assert r.status_code == 404


def test_empty_query_422():
    assert client.post("/api/chat", json={"query": ""}).status_code == 422
    assert client.post("/api/chat", json={"query": "   "}).status_code == 422


def test_no_matching_chunk_returns_not_found(monkeypatch):
    doc_id = _upload(monkeypatch)
    monkeypatch.setattr(settings, "rag_min_score", 2.0)  # scores max out at 1.0
    r = client.post("/api/chat", json={"query": "quantum chromodynamics", "document_ids": [doc_id]})
    assert r.status_code == 200
    assert r.json()["answer"] == NOT_FOUND


def test_grounded_answer_cites_real_chunks(monkeypatch):
    doc_id = _upload(monkeypatch)
    monkeypatch.setattr("app.services.ai.generate", lambda prompt, temperature=0.2: "Photosynthesis makes glucose.")
    r = client.post("/api/chat", json={"query": "What does photosynthesis make?", "document_ids": [doc_id]})
    assert r.status_code == 200
    body = r.json()
    assert body["grounded"] is True
    assert body["sources"], "must cite in-context chunks"
    src = body["sources"][0]
    assert src["document_id"] == doc_id and src["filename"] == "b.pdf"
    assert src["page"] in (1, 2)  # real page, never invented
    assert "Photosynthesis" in src["excerpt"]


def test_clear_session_idempotent():
    r = client.post("/api/chat", json={"query": "anything"})
    sid = r.json()["session_id"]
    assert client.delete(f"/api/chat/{sid}").json() == {"cleared": True}
    assert client.delete(f"/api/chat/{sid}").json() == {"cleared": True}
