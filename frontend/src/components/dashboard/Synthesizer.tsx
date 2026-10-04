import { useState } from "react";
import { Link } from "react-router-dom";
import { IconSend } from "../icons";
import { Alert, Badge, Spinner, TextInput } from "../ui";
import { postChat } from "../../lib/api";

const STARTERS = ["Summarize the key points", "What should I revise first?"];

/* Mini ask box wired to the real POST /api/chat (all-document scope).
   Full threads live on the Ask page. */
export default function Synthesizer() {
  const [q, setQ] = useState("");
  const [pending, setPending] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [sources, setSources] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const query = q.trim();
    if (!query || pending) return;
    setPending(true);
    setError(null);
    try {
      const r = await postChat(query, []);
      setAnswer(r.answer);
      setSources(r.sources.length);
      setQ("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong while generating your answer.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section aria-label="Synthesizer" className="surface p-5 sm:p-6">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-serif text-[22px] font-normal tracking-tight text-ink">Synthesizer Direct</h2>
        <Badge tone="indigo">Grounded RAG</Badge>
      </div>
      <form onSubmit={send} className="mt-3">
        <label htmlFor="synth-q" className="mb-1 block text-xs font-semibold text-muted">
          Ask about your study material
        </label>
        <div className="flex items-end gap-2">
          <div className="min-w-0 flex-1">
          <TextInput
            id="synth-q"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ask anything about your notes, formulas, or slides…"
            maxLength={2000}
            disabled={pending}
            autoComplete="off"
          />
          </div>
          <button
            type="submit"
            disabled={pending || !q.trim()}
            aria-label="Send question"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent-deep disabled:cursor-not-allowed disabled:opacity-40"
          >
            {pending ? <Spinner /> : <IconSend width={16} height={16} />}
          </button>
        </div>
      </form>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {STARTERS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setQ(s)}
            className="rounded-md border border-line bg-paper px-2.5 py-1.5 text-xs font-medium text-muted transition-colors hover:border-accent hover:text-accent-deep"
          >
            {s}
          </button>
        ))}
      </div>
      {error && (
        <div className="mt-3">
          <Alert>{error}</Alert>
        </div>
      )}
      {answer !== null && !error && (
        <div className="mt-3 rounded-lg border border-line bg-paper px-3.5 py-3">
          <p className="line-clamp-4 text-[13px] leading-relaxed text-ink">{answer}</p>
          <p className="mt-2 flex items-center justify-between gap-2 text-xs text-muted">
            <span>
              {sources > 0 ? `${sources} source${sources === 1 ? "" : "s"} cited` : "No sources cited"}
            </span>
            <Link to="/chat" className="shrink-0 font-semibold text-accent-deep hover:underline">
              Open in Ask →
            </Link>
          </p>
        </div>
      )}
    </section>
  );
}
