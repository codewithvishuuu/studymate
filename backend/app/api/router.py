from fastapi import APIRouter

from app.api.routes import chat, documents, flashcards, health, meta, quiz, studyplan, summaries

router = APIRouter()
router.include_router(health.router)
router.include_router(documents.router)
router.include_router(chat.router)
router.include_router(summaries.router)
router.include_router(quiz.router)
router.include_router(flashcards.router)
router.include_router(studyplan.router)
router.include_router(meta.router)
