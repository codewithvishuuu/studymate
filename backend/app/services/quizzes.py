"""Quiz generation (model) + deterministic scoring (no model needed)."""

import json
import uuid
from datetime import datetime, timezone

from app.core import db
from app.core.config import settings
from app.core.errors import AppError
from app.services import ai, documents, gen, vector

DIFFICULTIES = ("easy", "medium", "hard")
TYPES = ("mcq", "short")

SCHEMA_HINT = """{"questions": [{"type": "mcq|short", "topic": string, "question": string,
"options": [4 strings, mcq only], "answer_index": 0-3 (mcq only),
"reference_answer": string (short only), "rubric": string (short only),
"explanation": string, "source_ref": {"document_id": string, "page": int|null, "chunk_id": string}}]}"""


def utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()


def _ready_chunks(document_ids: list, budget: int) -> list:
    docs = [d for d in documents.list_all() if d["status"] == "ready" and d["id"] in document_ids]
    if not docs:
        missing = [d for d in document_ids if True]
        for did in document_ids:
            documents.get(did)  # 404 on unknown id
        raise AppError("DOCUMENT_NOT_READY", "Selected documents are not ready yet.", 409)
    # ponytail: representative context = chunks in doc order up to budget (ceiling: no per-topic sampling; upgrade: topic-clustered sampling).
    ctx, total = [], 0
    col_texts = _all_chunk_texts([d["id"] for d in docs])
    for chunk_id, text in col_texts:
        if total + len(text) > budget:
            break
        ctx.append((chunk_id, text))
        total += len(text)
    if not ctx:
        raise AppError("DOCUMENT_NOT_READY", "No indexed content found for these documents.", 409)
    return ctx


def _all_chunk_texts(doc_ids: list) -> list:
    import chromadb
    from pathlib import Path

    client = chromadb.PersistentClient(path=str(Path(settings.data_dir) / "chroma"))
    col = client.get_or_create_collection(name=vector.COLLECTION)
    res = col.get(where={"document_id": {"$in": doc_ids}}, include=["documents", "metadatas"], limit=5000)
    pairs = []
    for doc, meta in zip(res.get("documents") or [], res.get("metadatas") or []):
        pairs.append((meta.get("chunk_id", ""), doc))
    pairs.sort()
    return pairs


def generate(document_ids: list, count: int = 5, difficulty: str = "medium", types=None) -> dict:
    if not document_ids:
        raise AppError("VALIDATION_ERROR", "At least one document is required.", 422)
    if difficulty not in DIFFICULTIES:
        raise AppError("VALIDATION_ERROR", f"Difficulty must be one of {DIFFICULTIES}.", 422)
    types = types or ["mcq"]
    if any(t not in TYPES for t in types):
        raise AppError("VALIDATION_ERROR", f"Types must be subset of {TYPES}.", 422)
    ctx = _ready_chunks(document_ids, settings.rag_max_context_chars)
    numbered = "\n\n".join(f"[Chunk {cid}]\n{t}" for cid, t in ctx)
    prompt = (
        f"Write {count} {difficulty} quiz questions ({', '.join(types)}) from the study material below. "
        f"Vary topics. Every question needs a source_ref pointing at the chunk it came from.\n\n{numbered}"
    )
    data = gen.generate_json(prompt, SCHEMA_HINT)
    questions = _validate_questions(data)
    if not questions:
        raise AppError("AI_OUTPUT_INVALID", "The AI returned no valid questions. Retry generation.", 502)
    questions = questions[:count]
    quiz_id = str(uuid.uuid4())
    with db.connect() as conn:
        conn.execute(
            "INSERT INTO quizzes (id, document_ids, difficulty, created_at) VALUES (?,?,?,?)",
            (quiz_id, json.dumps(document_ids), difficulty, utcnow()),
        )
        for q in questions:
            qid = str(uuid.uuid4())
            q["id"] = qid
            conn.execute(
                "INSERT INTO questions (id, quiz_id, type, topic, question, options, answer_index, reference_answer, rubric, explanation, source_ref) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
                (qid, quiz_id, q["type"], q["topic"], q["question"], json.dumps(q.get("options")), q.get("answer_index"), q.get("reference_answer"), q.get("rubric"), q["explanation"], json.dumps(q["source_ref"])),
            )
    return {"id": quiz_id, "document_ids": document_ids, "difficulty": difficulty, "questions": [_public(q) for q in questions], "created_at": utcnow()}


def _validate_questions(data: dict) -> list:
    if not isinstance(data, dict) or not isinstance(data.get("questions"), list):
        raise AppError("AI_OUTPUT_INVALID", "The AI returned malformed data. Retry generation.", 502)
    valid = []
    for q in data["questions"]:
        try:
            if q["type"] not in TYPES or not q.get("topic") or not q.get("question") or not q.get("explanation"):
                continue
            ref = q.get("source_ref") or {}
            if not ref.get("document_id") or not ref.get("chunk_id"):
                continue
            if q["type"] == "mcq":
                if not isinstance(q.get("options"), list) or len(q["options"]) != 4:
                    continue
                if q.get("answer_index") not in (0, 1, 2, 3):
                    continue
            else:
                if not q.get("reference_answer"):
                    continue
            valid.append(q)
        except (KeyError, TypeError, AttributeError):
            continue
    return valid


def _public(q: dict) -> dict:
    out = {"id": q["id"], "type": q["type"], "topic": q["topic"], "question": q["question"]}
    if q["type"] == "mcq":
        out["options"] = q["options"]
    return out


def _load_quiz(quiz_id: str) -> tuple:
    with db.connect() as conn:
        quiz = conn.execute("SELECT * FROM quizzes WHERE id=?", (quiz_id,)).fetchone()
        if quiz is None:
            raise AppError("QUIZ_NOT_FOUND", "Quiz not found.", 404)
        qs = conn.execute("SELECT * FROM questions WHERE quiz_id=?", (quiz_id,)).fetchall()
    questions = []
    for r in qs:
        questions.append({
            "id": r["id"], "type": r["type"], "topic": r["topic"], "question": r["question"],
            "options": json.loads(r["options"]) if r["options"] else None,
            "answer_index": r["answer_index"], "reference_answer": r["reference_answer"],
            "rubric": r["rubric"], "explanation": r["explanation"], "source_ref": json.loads(r["source_ref"]),
        })
    return dict(quiz), questions


def _judge_short(question: dict, answer: str) -> tuple:
    """Model rubric scoring; falls back honestly when the engine is down."""
    try:
        verdict = ai.generate(
                    f"Rubric: {question.get('rubric') or 'Accept semantically equivalent answers.'}\n"
            f"Reference answer: {question['reference_answer']}\nStudent answer: {answer}\n"
            "Reply with exactly one word: CORRECT or INCORRECT."
        ).strip().upper()
        return ("CORRECT" in verdict, None)
    except AppError:
        return (False, True)  # fallback: not counted correct, flagged for review


def submit(quiz_id: str, answers: list) -> dict:
    _, questions = _load_quiz(quiz_id)
    by_id = {q["id"]: q for q in questions}
    if len(answers) != len(questions) or {a.get("question_id") for a in answers} != set(by_id):
        raise AppError("VALIDATION_ERROR", "Answers must cover every question exactly once.", 422)
    per, correct_n, topic_stats = [], 0, {}
    for a in answers:
        q = by_id[a["question_id"]]
        topic_stats.setdefault(q["topic"], [0, 0])
        topic_stats[q["topic"]][1] += 1
        if q["type"] == "mcq":
            ok = int(a["answer"]) == q["answer_index"] if str(a["answer"]).isdigit() else False
            per.append({"question_id": q["id"], "correct": ok, "explanation": q["explanation"], "topic": q["topic"]})
        else:
            ok, review = _judge_short(q, str(a.get("answer", "")))
            item = {"question_id": q["id"], "correct": ok, "explanation": q["explanation"], "topic": q["topic"]}
            if review:
                item["needs_review"] = True  # MCQ-only fallback; short unscored without engine
            per.append(item)
        if per[-1]["correct"]:
            correct_n += 1
            topic_stats[q["topic"]][0] += 1
    weak = [t for t, (c, n) in topic_stats.items() if n > 0 and c / n < 0.7]
    attempt_id = str(uuid.uuid4())
    with db.connect() as conn:
        conn.execute(
            "INSERT INTO attempts (id, quiz_id, answers, score, total, per_question, weak_topics, created_at) VALUES (?,?,?,?,?,?,?,?)",
            (attempt_id, quiz_id, json.dumps(answers), correct_n, len(questions), json.dumps(per), json.dumps(weak), utcnow()),
        )
        conn.execute(
            "INSERT INTO study_sessions (id, date, minutes, kind, ref_id, created_at) VALUES (?,?,?,?,?,?)",
            (str(uuid.uuid4()), utcnow()[:10], 0, "quiz", attempt_id, utcnow()),
        )
    return {"attempt_id": attempt_id, "score": correct_n, "total": len(questions), "per_question": per, "weak_topics": weak}
