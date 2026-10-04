from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.services import plans

router = APIRouter()


class PlanRequest(BaseModel):
    subject: Optional[str] = None
    document_ids: Optional[list] = None
    exam_date: str
    minutes_per_day: int = Field(ge=10, le=480)


@router.post("/study-plan/generate", status_code=201)
def make_plan(body: PlanRequest):
    return plans.generate(body.subject, body.document_ids, body.exam_date, body.minutes_per_day)
