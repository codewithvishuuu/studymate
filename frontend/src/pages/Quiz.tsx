import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import SourceScope from "../components/SourceScope";
import { Alert, Badge, Button, ProgressBar, Select, Spinner } from "../components/ui";
import { genQuiz, listDocs, submitQuiz, type Doc, type QuizQ, type QuizResult } from "../lib/api";

export default function Quiz() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [scope, setScope] = useState<string[]>([]);
  const [count, setCount] = useState(5);
  const [difficulty, setDifficulty] = useState("medium");
  const [quizId, setQuizId] = useState("");
  const [qs, setQs] = useState<QuizQ[]>([]);
  const [answers, setAnswers] = useState<Record<string, number | string>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listDocs().then((b) => setDocs(b.documents.filter((d) => d.status === "ready"))).catch(() => {});
  }, []);

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    if (scope.length === 0 || pending) return;
    setPending(true);
    setError(null);
    setResult(null);
    try {
      const q = await genQuiz(scope, count, difficulty);
      setQuizId(q.id);
      setQs(q.questions);
      setAnswers({});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong while building your practice set.");
    } finally {
      setPending(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      setResult(await submitQuiz(quizId, qs.map((q) => ({ question_id: q.id, answer: answers[q.id] ?? "" }))));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong while scoring your quiz.");
    } finally {
      setPending(false);
    }
  }

  const answered = qs.filter((q) => answers[q.id] !== undefined && answers[q.id] !== "").length;
  const scopeNames = docs.filter((d) => scope.includes(d.id)).map((d) => d.filename);
  const correctCount = result ? result.per_question.filter((p) => p.correct).length : 0;

  return (
    <div className="mx-auto max-w-[1024px]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent-deep sm:text-[11px]">Active recall</p>
      <h1 className="display mt-3 max-w-xl text-[32px] text-ink sm:text-[40px]">Test what you actually remember.</h1>
      <p className="mb-5 mt-2 max-w-xl text-[15px] leading-[1.6] text-muted">
        Practice with questions generated from your uploaded study material.
      </p>

      {qs.length === 0 ? (
        <form onSubmit={generate} className="grid gap-4">
          <SourceScope
            docs={docs}
            label="Build a quiz"
            description="Choose the material to test yourself on."
            mode="multi"
            multi={scope}
            onToggle={(id) => setScope((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))}
          />
          {docs.length > 0 && (
            <div className="flex flex-wrap items-end gap-3 rounded-xl border border-line bg-surface px-4 py-3.5">
              <div>
                <label htmlFor="quiz-count" className="mb-1 block text-[11px] font-bold uppercase tracking-[0.08em] text-faint">
                  Questions
                </label>
                <Select id="quiz-count" value={count} onChange={(e) => setCount(Number(e.target.value))} className="min-h-[44px] w-20 sm:min-h-[36px]">
                  {[5, 10, 15].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </Select>
              </div>
              <div>
                <label htmlFor="quiz-difficulty" className="mb-1 block text-[11px] font-bold uppercase tracking-[0.08em] text-faint">
                  Difficulty
                </label>
                <Select id="quiz-difficulty" value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="min-h-[44px] w-28 sm:min-h-[36px]">
                  {["easy", "medium", "hard"].map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </Select>
              </div>
              <Button type="submit" disabled={pending || scope.length === 0} loading={pending} className="btn-lift min-h-[44px] sm:min-h-[40px]">
                {pending ? "Building your practice set…" : "Start quiz →"}
              </Button>
            </div>
          )}
          {pending && docs.length > 0 && (
            <div className="grid gap-2" role="status" aria-label="Loading quiz">
              <p className="flex items-center gap-2 text-[13px] text-muted">
                <Spinner /> Building your practice set…
              </p>
              <div className="grid animate-pulse gap-2" aria-hidden="true">
                <div className="h-24 rounded-xl bg-tint" />
                <div className="h-24 rounded-xl bg-tint" />
              </div>
            </div>
          )}
        </form>
      ) : result ? (
        <section aria-label="Quiz result">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-faint">Quiz complete</p>
          <div className="mt-3 rounded-2xl bg-ink p-5 text-white sm:p-6">
            <p className="font-serif text-[32px] font-normal tabular-nums leading-none sm:text-[36px]">
              {result.score}<span className="text-lg text-white/50">/{result.total}</span>
            </p>
            <p className="mt-1.5 text-[13px] text-white/70">
              {correctCount} correct · {result.total - correctCount} to review
            </p>
            {result.weak_topics.length > 0 ? (
              <div className="mt-3 border-t border-white/15 pt-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/60">What to improve</p>
                <p className="mt-1 text-sm font-semibold">{result.weak_topics.join(" · ")}</p>
              </div>
            ) : (
              <p className="mt-2 text-sm text-white/70">Clean run — nothing flagged for revision.</p>
            )}
          </div>
          <ol className="mt-3 grid gap-2.5">
            {result.per_question.map((p, i) => (
              <li key={p.question_id} className={`rounded-xl border px-4 py-3 ${p.correct ? "border-ok/30 bg-ok-bg/50" : "border-bad/30 bg-bad-bg/50"}`}>
                <p className="flex flex-wrap items-center gap-2 text-[13px] font-bold text-ink">
                  <Badge tone={p.correct ? "green" : "red"}>{p.correct ? "Correct" : "Incorrect"}</Badge>
                  <span className="font-semibold text-muted">Q{i + 1} · {p.topic}</span>
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink">{p.explanation}</p>
                {p.needs_review && <p className="mt-1 text-xs text-warn">Short answer — needs AI review when the engine is available.</p>}
              </li>
            ))}
          </ol>
          <div className="mt-4 flex flex-wrap gap-2">
            {result.weak_topics.length > 0 && (
              <Link to="/flashcards" className="btn-lift inline-flex min-h-[44px] items-center rounded-lg bg-ink px-5 py-2 text-[13px] font-semibold text-white hover:opacity-85 sm:min-h-[40px]">
                Review weak topics
              </Link>
            )}
            <Button variant="secondary" onClick={() => { setQs([]); setResult(null); }} className="min-h-[44px] sm:min-h-[40px]">Try another quiz</Button>
          </div>
        </section>
      ) : (
        <form onSubmit={submit}>
          <div className="mb-4 rounded-xl border border-line bg-surface px-4 py-3">
            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm font-bold text-ink" role="status">
                Question {Math.min(answered + 1, qs.length)} of {qs.length}
              </p>
              <p className="text-xs tabular-nums text-muted">
                {answered}/{qs.length} answered · {difficulty} · {scopeNames.join(", ") || "your notes"}
              </p>
            </div>
            <ProgressBar value={answered} max={qs.length} label="Quiz progress" />
          </div>
          <div className="grid gap-3">
            {qs.map((q, i) => (
              <fieldset key={q.id} className="min-w-0 rounded-xl border border-line bg-surface p-4 sm:p-5">
                <legend className="px-1 text-[11px] font-bold uppercase tracking-[0.08em] text-faint">
                  Q{i + 1} · {q.topic}
                </legend>
                <p className="text-[18px] font-semibold leading-snug text-ink sm:text-[20px]">{q.question}</p>
                {q.options ? (
                  <ul className="mt-3 grid gap-2">
                    {q.options.map((o, idx) => {
                      const sel = answers[q.id] === idx;
                      return (
                        <li key={idx}>
                          <label
                            className={`flex min-h-[44px] cursor-pointer items-center gap-3 rounded-lg border px-3.5 py-2.5 text-[15px] transition-colors duration-150 ${
                              sel ? "border-accent bg-accent-soft font-semibold text-accent-deep" : "border-line hover:border-accent/60 hover:bg-paper"
                            }`}
                          >
                            <input type="radio" name={q.id} checked={sel} onChange={() => setAnswers((a) => ({ ...a, [q.id]: idx }))} className="accent-[#5146E5]" />
                            <span className={sel ? "" : "text-ink"}>{o}</span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <label className="mt-3 block text-[13px] font-medium text-muted">
                    Your answer
                    <textarea
                      value={String(answers[q.id] ?? "")}
                      onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                      rows={3}
                      className="mt-1.5 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                    />
                  </label>
                )}
              </fieldset>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={pending || answered < qs.length} loading={pending} className="btn-lift min-h-[44px] sm:min-h-[40px]">
              {pending ? "Scoring…" : `Submit ${answered}/${qs.length}`}
            </Button>
            <Button variant="ghost" onClick={() => { setQs([]); setResult(null); }} className="min-h-[44px] sm:min-h-[40px]">
              Discard quiz
            </Button>
          </div>
        </form>
      )}
      {error && (
        <div className="mt-3">
          <Alert>{error}</Alert>
        </div>
      )}
    </div>
  );
}
