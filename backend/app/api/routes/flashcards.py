from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.services import flashcards

router = APIRouter()


class FlashGenRequest(BaseModel):
    document_ids: list = Field(min_length=1)
    count: int = Field(default=20, ge=1, le=50)
    topic: Optional[str] = None


@router.post("/flashcards/generate", status_code=201)
def make_cards(body: FlashGenRequest):
    return flashcards.generate(body.document_ids, body.count, body.topic)
