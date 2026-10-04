"""Document lifecycle: validate -> store -> extract -> chunk -> embed -> index."""

import re
import uuid
from datetime import datetime, timezone
from pathlib import Path

from app.core import db
from app.core.config import settings
from app.core.errors import AppError
from app.services import ai, chunks, vector

_SAFE = re.compile(r"[^A-Za-z0-9._-]+")


def utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()


def sanitize_filename(name: str) -> str:
    base = (name or "").split("/")[-1].split("\\")[-1].replace("\x00", "")
    base = _SAFE.sub("_", base).strip("._") or "upload.pdf"
    if not base.lower().endswith(".pdf"):
        base += ".pdf"
    return base[:180]


def _fail(doc_id: str, code: str, message: str) -> dict:
    with db.connect() as conn:
        conn.execute(
            "UPDATE documents SET status='failed', error_code=?, error_message=? WHERE id=?",
            (code, message, doc_id),
        )
    return get(doc_id)


def validate_upload(filename: str, content: bytes) -> None:
    if not filename.lower().endswith(".pdf"):
        raise AppError("INVALID_FILE_TYPE", "Only .pdf files are accepted.", 400)
    if not content or not content.strip():
        raise AppError("EMPTY_FILE", "The uploaded file is empty.", 400)
    limit = settings.max_upload_mb * 1024 * 1024
    if len(content) > limit:
        raise AppError("FILE_TOO_LARGE", f"File exceeds the {settings.max_upload_mb}MB limit.", 413)
    if not content.lstrip().startswith(b"%PDF"):
        raise AppError("INVALID_FILE_TYPE", "File does not look like a PDF (bad header).", 400)


def extract_pages(content: bytes) -> list:
    """Returns [(page_number|None, text)]. Raises AppError(corrupt/encrypted)."""
    from io import BytesIO

    from pypdf import PdfReader
    from pypdf.errors import PdfReadError

    try:
        reader = PdfReader(BytesIO(content))
        if reader.is_encrypted:
            try:
                reader.decrypt("")
            except Exception:
                raise AppError("INVALID_FILE_TYPE", "This PDF is password-protected. Remove the password and retry.", 400, {"error_code": "encrypted"})
            if reader.is_encrypted:
                raise AppError("INVALID_FILE_TYPE", "This PDF is password-protected. Remove the password and retry.", 400, {"error_code": "encrypted"})
        return [(i + 1, page.extract_text() or "") for i, page in enumerate(reader.pages)]
    except AppError:
        raise
    except Exception as e:
        raise AppError("INVALID_FILE_TYPE", "Could not read this PDF. It may be corrupt — try re-exporting it.", 400, {"error_code": "corrupt"}) from e


def create(filename: str, content: bytes, subject=None) -> dict:
    validate_upload(filename, content)
    safe = sanitize_filename(filename)
    doc_id = str(uuid.uuid4())
    uploads = Path(settings.data_dir) / "uploads"
    uploads.mkdir(parents=True, exist_ok=True)
    storage = str(uploads / f"{doc_id}.pdf")
    Path(storage).write_bytes(content)

    with db.connect() as conn:
        conn.execute(
            "INSERT INTO documents (id, filename, subject, upload_date, status, storage_path) VALUES (?,?,?,?,?,?)",
            (doc_id, safe, subject, utcnow(), "processing", storage),
        )

    try:
        pages = extract_pages(content)
    except AppError as e:
        code = (e.details or {}).get("error_code", "corrupt") if isinstance(e.details, dict) else "corrupt"
        return _fail(doc_id, code, e.message)

    texts = [chunks.clean_text(t) for _, t in pages]
    total = sum(len(t) for t in texts)
    if total == 0:
        # ponytail: scanned-image PDFs unsupported (ceiling: text PDFs only; upgrade: OCR pipeline per RAG.md).
        code = "scanned_no_text" if pages else "empty"
        msg = "This looks like scanned images — text extraction isn't supported in this version." if pages else "No readable text found in this PDF."
        return _fail(doc_id, code, msg)
    if len(pages) > 0 and total / len(pages) < 20:
        return _fail(doc_id, "poor_extraction", "Too little readable text was extracted. Try re-exporting the PDF.")

    page_pairs = [(p, t) for (p, _), t in zip(pages, texts)]
    items = chunks.chunk_pages(
        page_pairs, doc_id, safe, subject,
        chunk_size=settings.chunk_size_chars, overlap=settings.chunk_overlap_chars,
    )
    try:
        vectors = ai.embed([c["text"] for c in items])
    except AppError as e:
        return _fail(doc_id, "embedding", e.message)
    try:
        vector.upsert([c["text"] for c in items], vectors, [{"chunk_id": c["id"], **c} for c in items])
    except AppError as e:
        return _fail(doc_id, "vector_db", e.message)

    with db.connect() as conn:
        conn.execute(
            "UPDATE documents SET status='ready', page_count=?, error_code=NULL, error_message=NULL WHERE id=?",
            (len(pages), doc_id),
        )
    return get(doc_id)


def _row_to_doc(row) -> dict:
    return {
        "id": row["id"],
        "filename": row["filename"],
        "subject": row["subject"],
        "upload_date": row["upload_date"],
        "status": row["status"],
        "page_count": row["page_count"],
        "error_code": row["error_code"],
        "error_message": row["error_message"],
    }


def get(doc_id: str) -> dict:
    with db.connect() as conn:
        row = conn.execute("SELECT * FROM documents WHERE id=?", (doc_id,)).fetchone()
    if row is None:
        raise AppError("DOCUMENT_NOT_FOUND", "Document not found.", 404)
    return _row_to_doc(row)


def list_all(subject=None, status=None) -> list:
    q = "SELECT * FROM documents"
    clauses, params = [], []
    if subject:
        clauses.append("subject=?")
        params.append(subject)
    if status:
        clauses.append("status=?")
        params.append(status)
    if clauses:
        q += " WHERE " + " AND ".join(clauses)
    q += " ORDER BY upload_date DESC"
    with db.connect() as conn:
        rows = conn.execute(q, params).fetchall()
    return [_row_to_doc(r) for r in rows]


def remove(doc_id: str) -> dict:
    doc = get(doc_id)  # 404 if missing
    with db.connect() as conn:
        storage = conn.execute("SELECT storage_path FROM documents WHERE id=?", (doc_id,)).fetchone()["storage_path"]
        conn.execute("DELETE FROM documents WHERE id=?", (doc_id,))
    try:
        Path(storage).unlink(missing_ok=True)
    except OSError:
        pass
    try:
        vector.delete_by_document(doc_id)
    except AppError:
        pass  # metadata gone; orphan vectors cleaned on next vacuum (documented ceiling)
    return {"deleted": True, "id": doc["id"]}
