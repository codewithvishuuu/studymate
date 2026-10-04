# StudyMate — Your notes. Your AI. Your study space.

A local-first AI study companion built for the DEV.to Hacktoberfest Weekend 2026 **Build for a Friend** challenge. Upload your PDFs → ask grounded questions → practice with quizzes and flashcards → follow a study plan → track weak topics. Your documents, vectors, and metadata stay on your machine; AI inference runs through the Google Gemini API using a backend-held key (cloud inference, not fully offline).

## Problem

[FRIEND_NAME] studies from long PDFs/notes ([FRIEND_SUBJECT]) but struggles to turn them into explanations, revision material, practice questions, and a routine ([FRIEND_STUDY_PROBLEM]). StudyMate removes that mechanical friction, not via the open web, but from the student's own material.

## Features

- PDF upload with validation, per-page extraction, processing status
- Document library (filter, view, delete with vector cleanup)
- Ask StudyMate: grounded answers with filename + page citations, or an explicit not-found message
- Summaries (short / key-points), quiz generation + scoring with weak-topic detection
- Flashcards (keyboard-first review), deterministic study plans, progress dashboard
- Settings: profile, study goal, live AI-engine status

## Architecture

```
React (Vite + TS + Tailwind) → FastAPI (/api/*) → services → AI/RAG layer → Google Gemini API (Gemma 4 + hosted embeddings) + local ChromaDB
```

- Frontend never calls Google. Backend owns AI orchestration.
- Model names are env-configured (`GEMMA_MODEL`, `EMBEDDING_MODEL`); key is backend-only (`GOOGLE_API_KEY`); single Google caller (`backend/app/services/ai_provider.py` behind the `ai.py` facade).
- RAG: extract → clean → page-aware chunk → cloud embed → local ChromaDB (`studymate_chunks`) → top-k retrieval → threshold + budget → Gemma 4 grounded generation → citations.
- Metadata store: SQLite via stdlib. Documents, metadata, and vectors stay on-device; only inference is cloud. The app is no longer fully offline.

## Technology stack

Frontend: React 19, TypeScript, Vite, Tailwind CSS v4, react-router-dom. Backend: Python 3.11, FastAPI, Pydantic, pypdf, chromadb, httpx, google-genai. AI: Gemma 4 (`gemma-4-26b-a4b-it`, open-weight) via the Google Gemini API + Google-hosted embeddings (`gemini-embedding-001`). No accounts; one backend-held API key.

## Setup

Prerequisites: Node.js 24+, Python 3.11+, a Google Gemini API key (Google AI Studio). No Ollama, no GPU needed.

Backend (from `backend/`; set `GOOGLE_API_KEY` in `.env` first — see `.env.example`):

```sh
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --port 8000
```

Frontend:

```sh
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. Tests run from `backend/`: `python -m pytest tests -q` (all mocked — no key needed). Real provider smoke test (needs your key): `python scripts/gemini_smoke.py` from `backend/`. Frontend build: `npm run build`. Never commit `.env` (see `.env.example`).

## Testing

46 backend tests: health + envelope, chunking (page-aware, overlap, metadata), documents (valid/invalid/empty/corrupt/oversize/traversal/delete), chat (not-found, 404 scope, 422, threshold filtering, real citations, idempotent clear), provider (missing key, invalid key, quota/timeout/model errors, empty output, health states, malformed-JSON retry, end-to-end RAG/summary/quiz/flashcards through the provider facade, clean error surfacing), quiz scoring/weak-topics/validation, summaries, flashcards, study-plan validation, progress aggregation, settings. Live-model end-to-end verification requires the owner's key.

## Project structure

```
frontend/src/  pages (Landing, Dashboard, Notes, Ask, Summaries, Quiz, Flashcards, Study Plan, Settings, NotFound), components (Layout, brand, dashboard/*, EmptyState, icons, Markdown, Reveal, SourceScope, ui), lib/api.ts
backend/app/   main.py, core (config, db, errors), api/routes/*, services (documents, chunks, ai, vector, chat, quizzes, flashcards, summaries, plans, progress), schemas
backend/tests/ fixtures (stdlib-built PDFs), health/chunks/documents/chat/learn tests
```

## Deployment (Render)

`render.yaml` at the repo root defines both services. Do not deploy yet without reading the storage warning below.

Backend (Web Service, `backend/` as root):
- Build: `pip install -r requirements.txt` · Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT` · Python `3.11.9` (pinned via `PYTHON_VERSION` in `render.yaml` and `backend/.python-version`)
- Health check: `GET /api/health`
- Env vars: `GOOGLE_API_KEY` (secret), `GEMMA_MODEL`, `EMBEDDING_MODEL`, `FRONTEND_URL` (public frontend URL, required for CORS)

Frontend (Static Site, `frontend/` as root):
- Build: `npm install && npm run build` · Publish: `dist`
- SPA fallback: `/*` rewrites to `/index.html` (declared in `render.yaml`)
- Env var: `VITE_BACKEND_URL` (public backend URL, baked in at build time)

Storage warning: uploads, SQLite, and ChromaDB live under `backend/data/`, which is ephemeral on Render — redeploys/restarts wipe user documents, vectors, and history unless a persistent disk is attached (requires a paid instance; a 1 GB disk mount is declared in `render.yaml`). Do not promise permanent storage on ephemeral hosting.

## Limitations

- A `GOOGLE_API_KEY` is required for AI answers, summaries, quiz/flashcard generation, and cloud embeddings; without it those paths return honest 503s while upload, scoring, plans, progress, and settings keep working.
- Text-extractable PDFs only — scanned images need OCR (future work).
- Single local user, no auth; synchronous generation (no job queue); 60-day plan horizon cap. See `ponytail:` code comments.

## Future improvements

Provider live verification with owner key, OCR for scanned PDFs, spaced-repetition scheduler, reranker + hybrid retrieval, Postgres/auth for multi-user, background job queue, device-tested responsive pass.

## Friend handoff

- Friend: [FRIEND_NAME] · Subject: [FRIEND_SUBJECT] · Problem: [FRIEND_STUDY_PROBLEM]
- Handoff date: [TBD] · Feedback: [FRIEND_FEEDBACK] (never fabricated — filled in after real use)

## Contribution

Issues and PRs welcome. Never commit `.env`, never fabricate citations or feedback.

## License

MIT — see [LICENSE](LICENSE).
