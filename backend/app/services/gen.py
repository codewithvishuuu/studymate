"""Structured-output helper: generate JSON, validate, one repair retry, else reject."""

import json

from app.core.errors import AppError
from app.services import ai

REPAIR_SUFFIX = "\nYour previous reply was invalid JSON or broke the schema: {err}\nReply with ONLY the corrected JSON object, no prose."


def generate_json(prompt: str, schema_hint: str, temperature: float = 0.2) -> dict:
    raw = ai.generate(prompt + "\n\nReturn ONLY valid JSON matching this schema:\n" + schema_hint, temperature)
    try:
        return json.loads(_strip_fences(raw))
    except (json.JSONDecodeError, ValueError):
        fixed = ai.generate(prompt + REPAIR_SUFFIX.format(err="unparseable JSON"), temperature)
        try:
            return json.loads(_strip_fences(fixed))
        except (json.JSONDecodeError, ValueError):
            raise AppError("AI_OUTPUT_INVALID", "The AI returned malformed data. Retry generation.", 502)


def _strip_fences(text: str) -> str:
    t = text.strip()
    if t.startswith("```"):
        t = t.split("\n", 1)[1] if "\n" in t else t[3:]
        t = t.rsplit("```", 1)[0]
    return t.strip()
