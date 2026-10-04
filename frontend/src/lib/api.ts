const base: string = import.meta.env.VITE_BACKEND_URL ?? "";

export interface Doc {
  id: string;
  filename: string;
  subject: string | null;
  upload_date: string;
  status: string;
  page_count: number | null;
  error_code: string | null;
  error_message: string | null;
}

export interface Source {
  document_id: string;
  filename: string;
  page: number | null;
  excerpt: string;
  chunk_id: string;
}

export interface ChatResult {
  session_id: string;
  answer: string;
  sources: Source[];
  grounded: boolean;
}

async function req(path: string, init?: RequestInit) {
  const res = await fetch(`${base}${path}`, init);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error?.message ?? `Request failed: ${res.status}`);
  return body;
}

export const getHealth = () => req("/api/health");
export const listDocs = (): Promise<{ documents: Doc[] }> => req("/api/documents");

export async function uploadDoc(file: File, subject?: string): Promise<Doc> {
  const fd = new FormData();
  fd.append("file", file);
  if (subject) fd.append("subject", subject);
  return req("/api/documents/upload", { method: "POST", body: fd });
}

export const deleteDoc = (id: string) => req(`/api/documents/${id}`, { method: "DELETE" });

export const postChat = (query: string, document_ids: string[], session_id?: string): Promise<ChatResult> =>
  req("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, document_ids, session_id }),
  });

export const clearChat = (session_id: string) =>
  req(`/api/chat/${session_id}`, { method: "DELETE" });

export interface Summary {
  id: string;
  document_id: string;
  mode: string;
  content: string;
  key_points?: string[];
}

export const genSummary = (document_id: string, mode: string): Promise<Summary> =>
  req("/api/summaries/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ document_id, mode }),
  });

export interface QuizQ {
  id: string;
  type: string;
  topic: string;
  question: string;
  options?: string[];
}

export interface QuizResult {
  attempt_id: string;
  score: number;
  total: number;
  per_question: { question_id: string; correct: boolean; explanation: string; topic: string; needs_review?: boolean }[];
  weak_topics: string[];
}

export const genQuiz = (document_ids: string[], count: number, difficulty: string): Promise<{ id: string; questions: QuizQ[] }> =>
  req("/api/quiz/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ document_ids, count, difficulty }),
  });

export const submitQuiz = (quiz_id: string, answers: { question_id: string; answer: number | string }[]): Promise<QuizResult> =>
  req("/api/quiz/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ quiz_id, answers }),
  });

export interface Card {
  id: string;
  front: string;
  back: string;
  topic: string;
}

export const genCards = (document_ids: string[], count: number): Promise<{ cards: Card[] }> =>
  req("/api/flashcards/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ document_ids, count }),
  });

export interface PlanDay {
  date: string;
  minutes: number;
  tasks: { title: string; topic: string; document_id: string | null; kind: string }[];
}

export const genPlan = (subject: string, exam_date: string, minutes_per_day: number): Promise<{ id: string; exam_date: string; days: PlanDay[] }> =>
  req("/api/study-plan/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subject: subject || undefined, exam_date, minutes_per_day }),
  });

export interface Progress {
  documents_count: number;
  quizzes_taken: number;
  questions_asked: number;
  avg_score: number | null;
  weak_topics: { topic: string; accuracy: number; attempts: number }[];
  sessions_completed: number;
}

export const getProgress = (): Promise<Progress> => req("/api/progress");

export const getSettings = (): Promise<any> => req("/api/settings");

export const putSettings = (body: Record<string, unknown>): Promise<any> =>
  req("/api/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
