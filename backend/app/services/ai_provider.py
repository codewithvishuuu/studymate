"""Google Gemini API provider. Sole place that touches the Google Gen AI SDK (RULES.md 8).

Generation model stays in the open Gemma family (GEMMA_MODEL, default gemma-4-26b-a4b-it).
Embeddings use the Google-hosted embedding model (EMBEDDING_MODEL, default gemini-embedding-001)
so document ingestion no longer needs local inference. Vectors still live in local ChromaDB.

The API key is read from centralized config only. It is never logged, never returned,
and never interpolated into user-facing messages.
"""

from app.core.config import settings
from app.core.errors import AppError

MISSING_KEY_MSG = "Google API key is not configured. Set GOOGLE_API_KEY and restart the backend."


def _client():
    if not settings.google_api_key:
        raise AppError("AI_UNAVAILABLE", MISSING_KEY_MSG, 503)
    from google import genai

    # ponytail: sync SDK calls in request handlers (ceiling: long generations block; upgrade: background jobs).
    return genai.Client(
        api_key=settings.google_api_key,
        http_options={"timeout": settings.ai_timeout_seconds * 1000},
    )


def _code_of(exc) -> int | None:
    try:
        return int(getattr(exc, "code"))
    except (TypeError, ValueError):
        return None


def _raise_provider_error(exc: Exception, action: str) -> None:
    """Map SDK/transport failures to clean API errors. Never leaks the key."""
    from google.genai import errors as genai_errors

    if isinstance(exc, TimeoutError) or "timeout" in type(exc).__name__.lower():
        raise AppError("AI_UNAVAILABLE", f"Google API timed out while {action}. Retry.", 504) from exc
    if isinstance(exc, genai_errors.APIError):
        code = _code_of(exc)
        if code == 404:
            raise AppError("MODEL_NOT_FOUND", f"Configured model is not available via the Google API while {action}.", 503) from exc
        if code in (400, 401, 403):
            raise AppError("AI_UNAVAILABLE", "Google API key is invalid or lacks access. Check GOOGLE_API_KEY.", 503) from exc
        if code == 429:
            raise AppError("AI_UNAVAILABLE", "Google API quota/rate limit reached. Wait and retry.", 503) from exc
        raise AppError("AI_UNAVAILABLE", f"Google API error while {action}. Retry later.", 503) from exc
    # ClientError, connection failures, unknown transport issues.
    raise AppError("AI_UNAVAILABLE", f"Could not reach the Google API while {action}. Check network and retry.", 503) from exc


def generate_text(prompt: str, temperature: float = 0.2) -> str:
    from google.genai import types

    client = _client()
    try:
        resp = client.models.generate_content(
            model=settings.gemma_model,
            contents=prompt,
            config=types.GenerateContentConfig(temperature=temperature),
        )
    except Exception as e:
        _raise_provider_error(e, "generating text")
    text = (resp.text or "").strip()
    if not text:
        raise AppError("AI_OUTPUT_INVALID", "The AI returned an empty response. Retry.", 502)
    return text


def embed_texts(texts: list) -> list:
    client = _client()
    try:
        resp = client.models.embed_content(model=settings.embedding_model, contents=list(texts))
    except Exception as e:
        _raise_provider_error(e, "creating embeddings")
    vectors = [list(e.values) for e in (resp.embeddings or [])]
    if len(vectors) != len(texts):
        raise AppError("EMBEDDING_FAILED", "Embedding service returned an unexpected result.", 503)
    return vectors


def check() -> dict:
    """Provider status for settings/health. Safe: exposes names and booleans only."""
    base = {
        "provider": "google",
        "configured": bool(settings.google_api_key),
        "reachable": False,
        "generation_model": settings.gemma_model,
        "embedding_model": settings.embedding_model,
        "models_present": False,
    }
    if not settings.google_api_key:
        return {**base, "error": MISSING_KEY_MSG}
    try:
        client = _client()
        client.models.get(model=settings.gemma_model)
    except Exception as e:
        from google.genai import errors as genai_errors

        if isinstance(e, genai_errors.APIError) and _code_of(e) in (400, 401, 403):
            return {**base, "reachable": True, "error": "Google API key is invalid or lacks access."}
        return {**base, "error": "Google API is unreachable."}
    return {**base, "reachable": True, "models_present": True}
