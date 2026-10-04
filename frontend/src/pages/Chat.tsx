import { useEffect, useRef, useState } from "react";
import Markdown from "../components/Markdown";
import { Alert, Button, SourceCard, Spinner } from "../components/ui";
import { IconSend } from "../components/icons";
import { clearChat, listDocs, postChat, type ChatResult, type Doc } from "../lib/api";

interface Msg {
  role: "user" | "assistant";
  content: string;
  sources?: ChatResult["sources"];
  grounded?: boolean;
}

function useElapsed(active: boolean) {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    if (!active) {
      setSecs(0);
      return;
    }
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [active]);
  return secs;
}

export default function Chat() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [scope, setScope] = useState<string[]>([]);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [session, setSession] = useState<string | undefined>();
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const elapsed = useElapsed(pending);

  useEffect(() => {
    listDocs().then((b) => setDocs(b.documents)).catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs.length, pending]);

  const ready = docs.filter((d) => d.status === "ready");

  function toggle(id: string) {
    setScope((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const q = input.trim();
    if (!q || pending) return;
    setPending(true);
    setError(null);
    setMsgs((m) => [...m, { role: "user", content: q }]);
    setInput("");
    try {
      const r = await postChat(q, scope, session);
      setSession(r.session_id);
      setMsgs((m) => [...m, { role: "assistant", content: r.answer, sources: r.sources, grounded: r.grounded }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong while generating your answer.");
    } finally {
      setPending(false);
    }
  }

  async function onClear() {
    if (session) {
      try {
        await clearChat(session);
      } catch {
        /* offline-safe: local state still clears */
      }
    }
    setMsgs([]);
    setSession(undefined);
  }

  return (
    <div className="mx-auto max-w-[1024px]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent-deep sm:text-[11px]">Grounded AI · Ask</p>
      <div className="mb-5 mt-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="display text-[32px] text-ink sm:text-[40px]">Ask your study material.</h1>
          <p className="mt-2 max-w-xl text-[15px] leading-[1.6] text-muted">
            Ask questions across your uploaded material and get grounded answers with source citations.
          </p>
        </div>
        {msgs.length > 0 && (
          <Button variant="secondary" onClick={() => void onClear()} className="min-h-[44px] px-3 py-1.5 text-xs">
            Clear chat
          </Button>
        )}
      </div>

      <section aria-label="Document scope" className="rounded-xl border border-line bg-surface px-4 py-3.5">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-faint">Asking across</p>
        <ul className="mt-2 flex flex-wrap gap-1.5">
          <li>
            <button
              type="button"
              onClick={() => setScope([])}
              aria-pressed={scope.length === 0}
              className={`inline-flex min-h-[44px] items-center rounded-md border px-2.5 py-1 text-xs font-semibold transition-colors duration-150 sm:min-h-[28px] ${
                scope.length === 0 ? "border-accent bg-accent text-white" : "border-line bg-paper text-muted hover:border-accent hover:text-accent-deep"
              }`}
            >
              All documents
            </button>
          </li>
          {ready.map((d) => {
            const on = scope.includes(d.id);
            return (
              <li key={d.id}>
                <button
                  type="button"
                  onClick={() => toggle(d.id)}
                  aria-pressed={on}
                  title={d.filename}
                  className={`inline-flex max-w-[220px] items-center truncate rounded-md border px-2.5 py-1 text-xs font-semibold transition-colors duration-150 min-h-[44px] sm:min-h-[28px] ${
                    on ? "border-accent bg-accent text-white" : "border-line bg-paper text-muted hover:border-accent hover:text-accent-deep"
                  }`}
                >
                  {d.filename}
                </button>
              </li>
            );
          })}
        </ul>
        {ready.length === 0 && (
          <p className="mt-2 text-[13px] text-muted">Upload a PDF in Notes to ask about your own material.</p>
        )}
      </section>

      <section aria-label="Grounded answers" className="mt-4 rounded-xl border border-line bg-surface p-4 sm:p-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-faint">Grounded answers</p>
        <div className="mt-3 space-y-5" role="log" aria-label="Conversation">
          {msgs.length === 0 && !pending && (
            <div className="rounded-xl border border-dashed border-line px-6 py-10 text-center">
              <p className="text-sm font-semibold text-ink">Ask a question about your material.</p>
              <p className="mx-auto mt-1 max-w-sm text-[13px] text-muted">
                Your answers will be grounded in the documents you select. StudyMate will cite the source pages when the material contains the answer.
              </p>
            </div>
          )}
          {msgs.map((m, i) =>
            m.role === "user" ? (
              <div key={i}>
                <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.08em] text-faint">Question</p>
                <div className="flex justify-end">
                  <p className="max-w-[85%] break-words rounded-xl rounded-br-md bg-accent-soft px-4 py-2.5 text-sm font-medium text-ink">{m.content}</p>
                </div>
              </div>
            ) : (
              <article key={i} aria-label="Assistant answer" className="min-w-0 break-words">
                <p className="mb-1.5 flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.08em] text-faint">
                  Answer
                  {m.grounded === true && (
                    <span className="inline-flex items-center gap-1 font-bold tracking-wide text-ok">
                      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-ok" /> Grounded
                    </span>
                  )}
                  {m.grounded === false && (
                    <span className="inline-flex items-center gap-1 font-bold tracking-wide text-muted">
                      Not found in material
                    </span>
                  )}
                </p>
                <div className="study-prose max-w-[68ch] text-[15px] text-ink">
                  <Markdown text={m.content} />
                </div>
                {m.sources && m.sources.length > 0 && (
                  <div className="mt-3">
                    <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-faint">Sources</p>
                    <ul className="grid gap-1.5 sm:grid-cols-2">
                      {m.sources.map((s) => (
                        <li key={s.chunk_id}>
                          <SourceCard page={s.page} filename={s.filename} excerpt={s.excerpt} />
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </article>
            ),
          )}
          {pending && (
            <div className="flex items-center gap-2.5 py-2" role="status">
              <span className="flex gap-1" aria-hidden="true">
                {[0, 1, 2].map((d) => (
                  <span key={d} className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" style={{ animationDelay: `${d * 150}ms` }} />
                ))}
              </span>
              <p className="text-[13px] text-muted">
                {elapsed > 4 ? "Generating answer…" : "Searching your notes…"}
                <span className="tabular-nums text-faint"> ({elapsed}s)</span>
              </p>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </section>

      {error && (
        <div className="mt-3">
          <Alert>
            Something went wrong while generating your answer. {error} <Button variant="ghost" onClick={() => setError(null)} className="min-h-0 px-1 py-0 text-xs">Dismiss</Button>
          </Alert>
        </div>
      )}

      <form onSubmit={send} className="sticky bottom-16 mt-4 lg:bottom-4">
        <div className="flex items-end gap-2 rounded-xl border border-line bg-surface p-2 shadow-[0_2px_10px_rgba(23,23,26,0.06)] focus-within:border-accent">
          <label htmlFor="chat-input" className="sr-only">
            Ask a question
          </label>
          <textarea
            id="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) void send(e as unknown as React.FormEvent);
            }}
            placeholder="Ask about your notes, concepts, formulas...  (Enter to send)"
            maxLength={2000}
            disabled={pending}
            rows={1}
            className="max-h-32 min-h-[40px] w-full resize-none bg-transparent px-3 py-2 text-sm text-ink placeholder:text-faint focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={pending || !input.trim()}
            aria-label="Send question"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-white transition-colors hover:bg-accent-deep disabled:cursor-not-allowed disabled:opacity-40"
          >
            {pending ? <Spinner /> : <IconSend width={17} height={17} />}
          </button>
        </div>
      </form>
    </div>
  );
}
