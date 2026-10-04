from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import app
from app.services import documents
from tests.fixtures import make_pdf

client = TestClient(app)
PDF = make_pdf(["Photosynthesis converts light energy page one", "Mitochondria produce ATP page two"])
DIM = 8


def _stub_embed(monkeypatch, dim=DIM):
    monkeypatch.setattr("app.services.ai.embed", lambda texts: [[0.1] * dim for _ in texts])


def test_upload_valid_pdf_ready(monkeypatch):
    _stub_embed(monkeypatch)
    r = client.post("/api/documents/upload", files={"file": ("notes.pdf", PDF, "application/pdf")}, data={"subject": "Biology"})
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["status"] == "ready"
    assert body["page_count"] == 2
    assert body["filename"] == "notes.pdf"


def test_upload_rejects_non_pdf():
    r = client.post("/api/documents/upload", files={"file": ("n.txt", b"hello", "text/plain")})
    assert r.status_code == 400
    assert r.json()["error"]["code"] == "INVALID_FILE_TYPE"


def test_upload_rejects_bad_magic():
    r = client.post("/api/documents/upload", files={"file": ("fake.pdf", b"not a pdf at all", "application/pdf")})
    assert r.status_code == 400


def test_upload_rejects_empty():
    r = client.post("/api/documents/upload", files={"file": ("e.pdf", b"   ", "application/pdf")})
    assert r.status_code == 400
    assert r.json()["error"]["code"] == "EMPTY_FILE"


def test_upload_rejects_oversize(monkeypatch):
    monkeypatch.setattr(settings, "max_upload_mb", 0)
    r = client.post("/api/documents/upload", files={"file": ("big.pdf", PDF, "application/pdf")})
    assert r.status_code == 413


def test_upload_corrupt_pdf():
    bad = b"%PDF-1.4\n" + b"\xff" * 64
    r = client.post("/api/documents/upload", files={"file": ("c.pdf", bad, "application/pdf")})
    assert r.status_code == 201  # upload accepted; processing result recorded
    assert r.json()["status"] == "failed"


def test_embedding_failure_marks_failed(monkeypatch):
    from app.core.errors import AppError

    def boom(texts):
        raise AppError("EMBEDDING_FAILED", "down", 503)

    monkeypatch.setattr("app.services.ai.embed", boom)
    r = client.post("/api/documents/upload", files={"file": ("n.pdf", PDF, "application/pdf")})
    assert r.json()["status"] == "failed"
    assert r.json()["error_code"] == "embedding"


def test_list_get_delete(monkeypatch):
    _stub_embed(monkeypatch)
    up = client.post("/api/documents/upload", files={"file": ("d.pdf", PDF, "application/pdf")}).json()
    assert client.get("/api/documents").json()["documents"][0]["id"] == up["id"]
    assert client.get(f"/api/documents/{up['id']}").status_code == 200
    assert client.get("/api/documents/nope").status_code == 404
    assert client.delete(f"/api/documents/{up['id']}").json() == {"deleted": True, "id": up["id"]}
    assert client.get(f"/api/documents/{up['id']}").status_code == 404


def test_path_traversal_filename_neutralized(monkeypatch):
    _stub_embed(monkeypatch)
    r = client.post("/api/documents/upload", files={"file": ("../../etc/evil.pdf", PDF, "application/pdf")})
    assert r.status_code == 201
    assert ".." not in r.json()["filename"] and "/" not in r.json()["filename"]
    assert documents.get(r.json()["id"])["filename"].endswith(".pdf")
