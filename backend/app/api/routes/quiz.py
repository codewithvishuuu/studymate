from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.services import quizzes

router = APIRouter()


class QuizGenRequest(BaseModel):
    document_ids: list = Field(min_length=1)
    count: int = Field(default=5, ge=1, le=20)
    difficulty: str = "medium"
    types: Optional[list] = None


class QuizSubmitRequest(BaseModel):
    quiz_id: str
    answers: list


@router.post("/quiz/generate", status_code=201)
def make_quiz(body: QuizGenRequest):
    return quizzes.generate(body.document_ids, body.count, body.difficulty, body.types)


@router.post("/quiz/submit")
def submit_quiz(body: QuizSubmitRequest):
    return quizzes.submit(body.quiz_id, body.answers)
