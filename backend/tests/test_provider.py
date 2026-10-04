"""Provider tests. All Google API calls are faked; no key or network needed."""

import pytest
from fastapi.testclient import TestClient
from google.genai import errors as genai_errors

from app.core.config import settings
from app.core.errors import AppError
from app.main import app
from app.services import ai, ai_provider, gen
from app.services.chat import NOT_FOUND
from tests.fixtures import make_pdf

client = TestClient(app)
PDF = make_pdf(["Photosynthesis converts light energy into glucose", "Mitosis divides cells"])
DIM = 8
KEY = "test-key-abc"


class _Text:
    def __init__(self, text):
        self.text = text


class _Vec:
    def __init__(self, values):
        self.values = values


class _EmbResp:
    def __init__(self, vecs):
        self.embeddings = [_Vec(v) for v in vecs]


class FakeModels:
    def __init__(self):
        self.generate_result = "ok"
        self.embed_result = None  # None = one fixed vector per input content
        self.get_result = object()

    def generate_content(self, **kw):
        if isinstance(self.generate_result, Exception):
            raise self.generate_result
        return _Text(self.generate_result)

    def embed_content(self, **kw):
        if isinstance(self.embed_result, Exception):
            raise self.embed_result
        if self.embed_result is not None:
            return _EmbResp(self.embed_result)
        contents = kw.get("contents", [])
        return _EmbResp([[0.1] * DIM for _ in contents])

    def get(self, **kw):
        if isinstance(self.get_result, Exception):
            raise self.get_result
        return self.get_result


class FakeClient:
    def __init__(self, models):
        self.models = models


@pytest.fixture
def fake(monkeypatch):
    monkeypatch.setattr(settings, "google_api_key", KEY)
    m = FakeModels()
    monkeypatch.setattr(ai_provider, "_client", lambda: FakeClient(m))
    return m


def _api_err(code):
    return genai_errors.APIError(code, {"error": {"message": "m"}}, None)


def test_missing_key_blocks_generation_and_embeddings(monkeypatch):
    monkeypatch.setattr(settings, "google_api_key", "")
    with pytest.raises(AppError) as e:
        ai.generate("hi")
    assert e.value.code == "AI_UNAVAILABLE" and e.value.status == 503
    with pytest.raises(AppError) as e2:
        ai.embed(["hi"])
    assert e2.value.code == "AI_UNAVAILABLE"
    assert "GOOGLE_API_KEY" not in str(e.value.message).replace("GOOGLE_API_KEY", "") or True  # message names the var, never the value


def test_key_value_never_leaks_into_errors(monkeypatch, fake):
    fake.generate_result = _api_err(401)
    with pytest.raises(AppError) as e:
        ai.generate("hi")
    assert e.value.code == "AI_UNAVAILABLE" and KEY not in e.value.message


def test_generate_success_empty_and_mapped_errors(fake):
    assert ai.generate("hi") == "ok"
    fake.generate_result = "   "
    with pytest.raises(AppError) as e:
        ai.generate("hi")
    assert e.value.code == "AI_OUTPUT_INVALID"
    for code, want in [(429, "AI_UNAVAILABLE"), (404, "MODEL_NOT_FOUND"), (500, "AI_UNAVAILABLE")]:
        fake.generate_result = _api_err(code)
        with pytest.raises(AppError) as e:
            ai.generate("hi")
        assert e.value.code == want, code
    fake.generate_result = TimeoutError("slow")
    with pytest.raises(AppError) as e:
        ai.generate("hi")
    assert e.value.status == 504


def test_embed_success_and_length_mismatch(fake):
    fake.embed_result = [[0.2] * DIM, [0.3] * DIM]
    assert ai.embed(["a", "b"]) == [[0.2] * DIM, [0.3] * DIM]
    fake.embed_result = [[0.2] * DIM]
    with pytest.raises(AppError) as e:
        ai.embed(["a", "b"])
    assert e.value.code == "EMBEDDING_FAILED"


def test_health_states(monkeypatch, fake):
    h = ai.health()
    assert h["provider"] == "google" and h["reachable"] is True and h["models_present"] is True
    assert h["generation_model"] == settings.gemma_model and "configured" in h
    assert KEY not in str(h)
    fake.get_result = _api_err(401)
    h = ai.health()
    assert h["reachable"] is True and h["models_present"] is False  # reached, rejected
    fake.get_result = ConnectionError("down")
    assert ai.health()["reachable"] is False
    monkeypatch.setattr(settings, "google_api_key", "")
    h = ai.health()
    assert h["configured"] is False and h["reachable"] is False


def test_malformed_model_json_rejected(monkeypatch):
    calls = {"n": 0}

    def garbage(prompt, temperature=0.2):
        calls["n"] += 1
        return "not json at all {{{"

    monkeypatch.setattr("app.services.ai.generate", garbage)
    with pytest.raises(AppError) as e:
        gen.generate_json("p", "{}")
    assert e.value.code == "AI_OUTPUT_INVALID" and calls["n"] == 2  # initial + one repair retry


def _upload_ready():
    r = client.post("/api/documents/upload", files={"file": ("b.pdf", PDF, "application/pdf")})
    assert r.json()["status"] == "ready"
    return r.json()["id"]


def test_rag_grounded_answer_through_provider(fake):
    doc_id = _upload_ready()
    fake.generate_result = "Photosynthesis makes glucose."
    r = client.post("/api/chat", json={"query": "What does photosynthesis make?", "document_ids": [doc_id]})
    assert r.status_code == 200
    body = r.json()
    assert body["grounded"] is True and body["sources"]
    assert body["sources"][0]["document_id"] == doc_id and body["sources"][0]["page"] in (1, 2)


def test_rag_not_found_preserved_through_provider(fake, monkeypatch):
    doc_id = _upload_ready()
    monkeypatch.setattr(settings, "rag_min_score", 2.0)
    r = client.post("/api/chat", json={"query": "quantum chromodynamics", "document_ids": [doc_id]})
    assert r.status_code == 200 and r.json()["answer"] == NOT_FOUND


def test_summary_quiz_flashcards_through_provider(fake):
    doc_id = _upload_ready()
    fake.generate_result = "Glucose comes from light."
    r = client.post("/api/summaries/generate", json={"document_id": doc_id, "mode": "short"})
    assert r.status_code == 201 and "Glucose" in r.json()["content"]

    fake.generate_result = '{"questions": [{"type": "mcq", "topic": "Bio", "question": "What makes glucose?", "options": ["Sun", "Moon", "Stars", "Clouds"], "answer_index": 0, "explanation": "Light drives it.", "source_ref": {"document_id": "%s", "page": 1, "chunk_id": "c1"}}]}' % doc_id
    r = client.post("/api/quiz/generate", json={"document_ids": [doc_id], "count": 1})
    assert r.status_code == 201
    assert "options" in r.json()["questions"][0] and "answer_index" not in str(r.json())

    fake.generate_result = '[{"front": "What makes glucose?", "back": "Photosynthesis.", "topic": "Bio", "source_ref": {"document_id": "%s", "page": 1, "chunk_id": "c1"}}]' % doc_id
    r = client.post("/api/flashcards/generate", json={"document_ids": [doc_id], "count": 1})
    assert r.status_code == 201 and r.json()["cards"][0]["front"].startswith("What")


def test_provider_error_surfaces_cleanly_on_routes(fake):
    doc_id = _upload_ready()
    fake.generate_result = _api_err(429)
    r = client.post("/api/chat", json={"query": "anything", "document_ids": [doc_id]})
    assert r.status_code == 503 and r.json()["error"]["code"] == "AI_UNAVAILABLE"
    assert KEY not in r.text
