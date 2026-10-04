from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel

from app.services import progress

router = APIRouter()


class SettingsUpdate(BaseModel):
    name: Optional[str] = None
    subjects: Optional[list] = None
    exam_date: Optional[str] = None
    daily_goal_minutes: Optional[int] = None
    language: Optional[str] = None


@router.get("/progress")
def get_progress():
    return progress.compute()


@router.get("/settings")
def get_settings():
    return progress.get_profile()


@router.put("/settings")
def put_settings(body: SettingsUpdate):
    return progress.update_profile(body.name, body.subjects, body.exam_date, body.daily_goal_minutes, body.language)
