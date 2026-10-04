from typing import Optional

from fastapi import APIRouter

from app.services import summaries

router = APIRouter()


@router.post("/summaries/generate", status_code=201)
def make_summary(body: dict):
    return summaries.generate(body.get("document_id", ""), body.get("mode", "short"), body.get("selection"))
