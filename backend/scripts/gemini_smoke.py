"""Real-provider smoke test. Requires GOOGLE_API_KEY in the environment.

Usage (from backend/):
    python scripts/gemini_smoke.py

Verifies: key configured -> generation responds -> embeddings respond.
Prints PASS/FAIL lines and exits nonzero on failure. Never prints the key.
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings  # noqa: E402
from app.services import ai_provider  # noqa: E402


def main() -> int:
    if not settings.google_api_key:
        print("FAIL: GOOGLE_API_KEY is not set (backend/.env or repo-root .env).")
        return 2
    try:
        text = ai_provider.generate_text("Reply with exactly: smoke-ok")
    except Exception as e:
        print(f"FAIL: generation error: {type(e).__name__}: {e}")
        return 1
    if not text:
        print("FAIL: empty generation response.")
        return 1
    print(f"PASS: generation responded ({len(text)} chars, model={ai_provider.settings.gemma_model}).")
    try:
        vecs = ai_provider.embed_texts(["smoke test sentence"])
    except Exception as e:
        print(f"FAIL: embedding error: {type(e).__name__}: {e}")
        return 1
    if not vecs or not vecs[0]:
        print("FAIL: empty embedding response.")
        return 1
    print(f"PASS: embeddings responded (dim={len(vecs[0])}, model={ai_provider.settings.embedding_model}).")
    status = ai_provider.check()
    print(f"STATUS: reachable={status['reachable']} models_present={status['models_present']}")
    if not status["reachable"]:
        print("FAIL: provider health check reports unreachable.")
        return 1
    print("SMOKE OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
