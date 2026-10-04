from fastapi import APIRouter

from app.schemas.chat import ChatRequest, ChatResponse
from app.services import chat

router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
def post_chat(body: ChatRequest):
    return chat.ask(body.query, body.document_ids, body.session_id)


@router.delete("/chat/{session_id}")
def delete_chat(session_id: str):
    return chat.clear_session(session_id)
