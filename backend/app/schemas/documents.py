from typing import Optional

from pydantic import BaseModel


class DocumentOut(BaseModel):
    id: str
    filename: str
    subject: Optional[str] = None
    upload_date: str
    status: str
    page_count: Optional[int] = None
    error_code: Optional[str] = None
    error_message: Optional[str] = None


class DocumentListOut(BaseModel):
    documents: list
