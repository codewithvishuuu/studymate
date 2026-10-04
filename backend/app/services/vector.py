"""ChromaDB abstraction. Frontend/services never touch Chroma directly.

Chroma metadata cannot hold None: page_number None <-> -1 sentinel.
"""

from pathlib import Path

from app.core.config import settings
from app.core.errors import AppError

COLLECTION = "studymate_chunks"
_NO_PAGE = -1

# One persistent client per data dir. Client construction opens the store on
# every call otherwise; caching removes that per-request overhead. The same
# process is single-writer (ADR-008), so no invalidation is needed.
_clients: dict = {}


def _handle(fn, *args, **kwargs):
    try:
        return fn(*args, **kwargs)
    except AppError:
        raise
    except Exception as e:
        raise AppError("VECTOR_DB_UNAVAILABLE", "Search is temporarily unavailable. Retry later.", 503) from e


def _collection():
    import chromadb

    key = str(Path(settings.data_dir) / "chroma")
    col = _clients.get(key)
    if col is None:
        client = chromadb.PersistentClient(path=key)
        col = client.get_or_create_collection(name=COLLECTION)
        _clients[key] = col
    return col


def upsert(chunk_texts: list, vectors: list, metadatas: list) -> None:
    def _do():
        col = _collection()
        col.upsert(
            ids=[m["chunk_id"] for m in metadatas],
            documents=chunk_texts,
            embeddings=vectors,
            metadatas=[
                {
                    "document_id": m["document_id"],
                    "filename": m["filename"],
                    "page_number": m["page_number"] if m["page_number"] is not None else _NO_PAGE,
                    "chunk_id": m["chunk_id"],
                    "subject": m["subject"] or "",
                }
                for m in metadatas
            ],
        )

    _handle(_do)


def query(vector: list, top_k: int, document_ids=None) -> list:
    def _do():
        col = _collection()
        where = {"document_id": {"$in": document_ids}} if document_ids else None
        res = col.query(query_embeddings=[vector], n_results=top_k, where=where, include=["documents", "metadatas", "distances"])
        out = []
        for doc, meta, dist in zip(res["documents"][0], res["metadatas"][0], res["distances"][0]):
            page = meta.get("page_number", _NO_PAGE)
            out.append(
                {
                    "text": doc,
                    "chunk_id": meta.get("chunk_id", ""),
                    "document_id": meta.get("document_id", ""),
                    "filename": meta.get("filename", ""),
                    "page_number": None if page == _NO_PAGE else page,
                    "score": 1.0 - float(dist),
                    "distance": float(dist),
                }
            )
        return out

    return _handle(_do)


def delete_by_document(document_id: str) -> None:
    def _do():
        col = _collection()
        col.delete(where={"document_id": document_id})

    _handle(_do)
