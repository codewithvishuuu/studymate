"""Facade over the Google provider. The rest of the app calls generate()/embed()/health()
here and never touches the Google SDK directly (RULES.md 8). Signatures are unchanged
so existing RAG/quiz/summary/flashcard flows keep working."""

from app.services import ai_provider


def generate(prompt: str, temperature: float = 0.2) -> str:
    return ai_provider.generate_text(prompt, temperature)


def embed(texts: list) -> list:
    return ai_provider.embed_texts(texts)


def health() -> dict:
    return ai_provider.check()
