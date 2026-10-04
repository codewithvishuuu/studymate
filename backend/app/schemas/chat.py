from typing import Optional

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    query: str = Field(min_length=1, max_length=2000)
    document_ids: Optional[list] = None
    session_id: Optional[str] = None


class ChatResponse(BaseModel):
    session_id: str
    answer: str
    sources: list
    grounded: bool
