"""Centralized configuration. Only module allowed to read AI model env (RULES.md 8)."""

from pydantic_settings import BaseSettings, SettingsConfigDict


def _env_file() -> str:
    """Documented location backend/.env wins; repo-root .env is a fallback.

    The key is never copied or moved — it is read in place from one file.
    """
    from pathlib import Path

    backend_dir = Path(__file__).resolve().parents[2]  # .../backend
    for cand in (backend_dir / ".env", backend_dir.parent / ".env"):
        if cand.is_file():
            return str(cand)
    return str(backend_dir / ".env")


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=_env_file(), extra="ignore")

    app_name: str = "StudyMate"
    # ponytail: single local user, no auth (ceiling: one machine/profile; upgrade: auth + user_id scoping).
    # Cloud AI via Google Gemini API. Key lives only on the backend, never in code/logs/responses.
    google_api_key: str = ""
    gemma_model: str = "gemma-4-26b-a4b-it"
    embedding_model: str = "gemini-embedding-001"
    ai_timeout_seconds: int = 120
    ai_max_retries: int = 1
    rag_top_k: int = 5
    # Tuned from live data (Hindi report): relevant EN→HI retrieval scored
    # 0.22+, unrelated queries ~0.0. Floor kills near-orthogonal neighbors only.
    rag_min_score: float = 0.10
    rag_max_context_chars: int = 12000
    chunk_size_chars: int = 2000
    chunk_overlap_chars: int = 200
    max_upload_mb: int = 50
    frontend_url: str = "http://localhost:5173"
    data_dir: str = "./data"


settings = Settings()
