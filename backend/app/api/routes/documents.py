from typing import Optional

from fastapi import APIRouter, File, Form, UploadFile

from app.schemas.documents import DocumentListOut, DocumentOut
from app.services import documents

router = APIRouter()


@router.post("/documents/upload", response_model=DocumentOut, status_code=201)
async def upload(file: UploadFile = File(...), subject: Optional[str] = Form(None)):
    content = await file.read()
    return documents.create(file.filename or "upload.pdf", content, subject)


@router.get("/documents", response_model=DocumentListOut)
def list_docs(subject: Optional[str] = None, status: Optional[str] = None):
    return {"documents": documents.list_all(subject, status)}


@router.get("/documents/{doc_id}", response_model=DocumentOut)
def get_doc(doc_id: str):
    return documents.get(doc_id)


@router.delete("/documents/{doc_id}")
def delete_doc(doc_id: str):
    return documents.remove(doc_id)
