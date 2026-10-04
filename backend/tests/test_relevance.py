"""Relevance + contract tests: thresholding, scoping, citation integrity, cleaning."""

import pytest
from fastapi.testclient import TestClient

from app.core import db
from app.core.config import settings
from app.core.errors import AppError
from app.main import app
from app.services import chunks, vector
from app.services.chat import NOT_FOUND
from tests.fixtures import make_pdf

client = TestClient(app)
DIM = 8
PDF_A = make_pdf(["Photosynthesis converts light energy into glucose", "Chlorophyll absorbs sunlight"])
PDF_B = make_pdf(["Mitosis divides one cell into two identical daughters", "Cytokinesis splits cytoplasm"])


def _stub_embed(monkeypatch):
    monkeypatch.setattr("app.services.ai.embed", lambda texts: [[0.1] * DIM for _ in texts])


def _upload(filename, pdf):
    r = client.post("/api/documents/upload", files={"file": (filename, pdf, "application/pdf")})
    assert r.json()["status"] == "ready"
    return r.json()["id"]


def test_a_relevant_grounded_with_true_page(monkeypatch):
    _stub_embed(monkeypatch)
    doc_id = _upload("a.pdf", PDF_A)
    monkeypatch.setattr("app.services.ai.generate", lambda prompt, temperature=0.2: "Glucose.")
    r = client.post("/api/chat", json={"query": "What does photosynthesis make?", "document_ids": [doc_id]})
    body = r.json()
    assert body["grounded"] is True and body["answer"] == "Glucose."
    assert body["sources"] and body["sources"][0]["document_id"] == doc_id
    assert body["sources"][0]["page"] in (1, 2)


def test_b_unrelated_returns_no_sources(monkeypatch):
    _stub_embed(monkeypatch)
    doc_id = _upload("a.pdf", PDF_A)
    monkeypatch.setattr(settings, "rag_min_score", 2.0)  # nothing can pass: weak-simulation
    r = client.post("/api/chat", json={"query": "What is the capital of Japan?", "document_ids": [doc_id]})
    body = r.json()
    assert body["grounded"] is False and body["answer"] == NOT_FOUND and body["sources"] == []


def test_c_model_refusal_yields_no_sources(monkeypatch):
    """Even when neighbors pass the filter, a not-found answer must not carry citations."""
    _stub_embed(monkeypatch)
    doc_id = _upload("a.pdf", PDF_A)
    monkeypatch.setattr("app.services.ai.generate", lambda prompt, temperature=0.2: NOT_FOUND)
    r = client.post("/api/chat", json={"query": "Quantum chromodynamics?", "document_ids": [doc_id]})
    body = r.json()
    assert body["grounded"] is False and body["answer"] == NOT_FOUND and body["sources"] == []


def test_d_scope_isolation(monkeypatch):
    _stub_embed(monkeypatch)
    ida, idb = _upload("a.pdf", PDF_A), _upload("b.pdf", PDF_B)
    monkeypatch.setattr("app.services.ai.generate", lambda prompt, temperature=0.2: "An answer.")
    r = client.post("/api/chat", json={"query": "cells?", "document_ids": [idb]})
    srcs = r.json()["sources"]
    assert srcs and all(s["document_id"] == idb for s in srcs)


def test_e_citation_page_exists_in_document(monkeypatch):
    _stub_embed(monkeypatch)
    doc_id = _upload("a.pdf", PDF_A)
    pages = {1, 2}
    monkeypatch.setattr("app.services.ai.generate", lambda prompt, temperature=0.2: "Glucose.")
    r = client.post("/api/chat", json={"query": "photosynthesis?", "document_ids": [doc_id]})
    for s in r.json()["sources"]:
        assert s["page"] in pages
        assert s["chunk_id"].startswith(doc_id + ":")


def test_f_dimension_mismatch_fails_closed():
    meta = {"chunk_id": "d:1:0", "document_id": "d", "filename": "d.pdf", "page_number": 1, "subject": None}
    vector.upsert(["some text"], [[0.1] * DIM], [meta])
    with pytest.raises(AppError) as e:
        vector.query([[0.1] * (DIM - 1)], 1, None)
    assert e.value.code == "VECTOR_DB_UNAVAILABLE"


def test_clean_strips_control_chars():
    assert chunks.clean_text("a\x00\x00b\x07c \n d") == "abc d"
    assert chunks.clean_text("  hello   world  ") == "hello world"


def test_progress_counts_questions_asked(monkeypatch):
    _stub_embed(monkeypatch)
    doc_id = _upload("a.pdf", PDF_A)
    monkeypatch.setattr("app.services.ai.generate", lambda prompt, temperature=0.2: NOT_FOUND)
    assert client.get("/api/progress").json()["questions_asked"] == 0
    client.post("/api/chat", json={"query": "anything?", "document_ids": [doc_id]})
    assert client.get("/api/progress").json()["questions_asked"] == 1
