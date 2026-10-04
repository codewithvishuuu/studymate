"""SQLite via stdlib (ADR-008). Single-writer, one table per entity."""

import sqlite3
from pathlib import Path

from app.core.config import settings

SCHEMA = """
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  subject TEXT,
  upload_date TEXT NOT NULL,
  status TEXT NOT NULL,
  page_count INTEGER,
  error_code TEXT,
  error_message TEXT,
  storage_path TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS chat_sessions (
  id TEXT PRIMARY KEY,
  document_ids TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  sources TEXT,
  grounded INTEGER,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS quizzes (
  id TEXT PRIMARY KEY,
  document_ids TEXT NOT NULL DEFAULT '[]',
  difficulty TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  quiz_id TEXT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  topic TEXT NOT NULL,
  question TEXT NOT NULL,
  options TEXT,
  answer_index INTEGER,
  reference_answer TEXT,
  rubric TEXT,
  explanation TEXT NOT NULL,
  source_ref TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS attempts (
  id TEXT PRIMARY KEY,
  quiz_id TEXT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  answers TEXT NOT NULL,
  score INTEGER NOT NULL,
  total INTEGER NOT NULL,
  per_question TEXT NOT NULL,
  weak_topics TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS flashcards (
  id TEXT PRIMARY KEY,
  document_ids TEXT NOT NULL DEFAULT '[]',
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  topic TEXT NOT NULL,
  source_ref TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  subject TEXT,
  exam_date TEXT NOT NULL,
  days TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS study_sessions (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  minutes INTEGER NOT NULL,
  kind TEXT NOT NULL,
  ref_id TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT,
  subjects TEXT NOT NULL DEFAULT '[]',
  exam_date TEXT
);
CREATE TABLE IF NOT EXISTS prefs (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
"""


def db_path() -> Path:
    return Path(settings.data_dir) / "studymate.db"


def connect() -> sqlite3.Connection:
    path = db_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(path))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db() -> None:
    with connect() as conn:
        conn.executescript(SCHEMA)
