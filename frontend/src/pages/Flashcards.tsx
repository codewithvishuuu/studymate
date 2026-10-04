import { useEffect, useState } from "react";
import SourceScope from "../components/SourceScope";
import { Alert, Button, ProgressBar, Spinner } from "../components/ui";
import { genCards, listDocs, type Card as CardT, type Doc } from "../lib/api";

export default function Flashcards() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [scope, setScope] = useState<string[]>([]);
  const [cards, setCards] = useState<CardT[]>([]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<Record<string, boolean>>({});
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
    try {
      const r = await genCards(scope, 20);
      setCards(r.cards);
      setIdx(0);
      setFlipped(false);
      setKnown({});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong while creating your deck.");
    } finally {
      setPending(false);
    }
  }

  function mark(k: boolean) {
    if (!cards[idx]) return;
    setKnown((m) => ({ ...m, [cards[idx].id]: k }));
    if (idx < cards.length - 1) {
      setIdx(idx + 1);
      setFlipped(false);
    }
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (cards.length === 0) return;
      if (e.key === " ") {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (e.key === "ArrowRight") {
        setIdx((i) => Math.min(i + 1, cards.length - 1));
        setFlipped(false);
      } else if (e.key === "ArrowLeft") {
        setIdx((i) => Math.max(i - 1, 0));
        setFlipped(false);
      } else if (e.key === "1") mark(true);
      else if (e.key === "2") mark(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const marked = Object.keys(known).length;
  const knownCount = Object.values(known).filter(Boolean).length;
  const reviewCount = marked - knownCount;
  const scopeNames = docs.filter((d) => scope.includes(d.id)).map((d) => d.filename);

  function step(dir: 1 | -1) {
    setIdx((i) => Math.min(Math.max(i + dir, 0), cards.length - 1));
    setFlipped(false);
  }

  return (
    <div className="mx-auto max-w-[1024px]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent-deep sm:text-[11px]">Active recall</p>
      <h1 className="display mt-3 max-w-xl text-[32px] text-ink sm:text-[40px]">Turn study material into active recall.</h1>
      <p className="mb-5 mt-2 max-w-xl text-[15px] leading-[1.6] text-muted">
        Practice concepts from your uploaded material with focused flashcards.
      </p>

      {cards.length > 0 && (
        <p className="mb-3 truncate text-xs text-muted">
          {scopeNames.join(", ") || "Your deck"} · {cards.length} cards
        </p>
      )}

      {cards.length === 0 ? (
        <form onSubmit={generate} className="grid gap-4">
          <SourceScope
            docs={docs}
            label="Flashcard deck"
            description="Choose the material to build your recall deck from."
            mode="multi"
            multi={scope}
            onToggle={(id) => setScope((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))}
          />
          {docs.length > 0 && (
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={pending || scope.length === 0} loading={pending} className="btn-lift min-h-[44px] sm:min-h-[40px]">
                {pending ? "Creating your review deck…" : "Generate deck"}
              </Button>
              {scope.length === 0 && !pending && (
                <p className="text-[13px] text-muted">Select at least one document to build a deck of 20 cards.</p>
              )}
            </div>
          )}
          {pending && (
            <div className="grid gap-2" role="status" aria-label="Loading deck">
              <p className="flex items-center gap-2 text-[13px] text-muted">
                <Spinner /> Creating your review deck…
              </p>
              <div className="grid animate-pulse gap-2" aria-hidden="true">
                <div className="h-44 rounded-xl bg-tint" />
              </div>
            </div>
          )}
        </form>
      ) : (
        <div className="mx-auto max-w-2xl">
          <div className="mb-3 rounded-xl border border-line bg-surface px-4 py-3">
            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
              <p className="shrink-0 text-[13px] font-bold tabular-nums text-ink" role="status">
                {idx + 1} / {cards.length}
              </p>
              <p className="shrink-0 text-xs tabular-nums text-muted">
                {knownCount} known · {reviewCount} to review
              </p>
            </div>
            <ProgressBar value={idx + 1} max={cards.length} label="Deck progress" />
          </div>
          <button
            type="button"
            onClick={() => setFlipped((f) => !f)}
            aria-label={flipped ? "Show question" : "Reveal answer"}
            className="block min-h-[300px] w-full rounded-xl border border-line bg-surface p-6 text-center shadow-[0_1px_2px_rgba(23,23,26,0.04)] transition-shadow duration-150 hover:shadow-[0_4px_16px_rgba(23,23,26,0.07)] sm:min-h-[320px] sm:p-10"
          >
            <span className="block text-[11px] font-bold uppercase tracking-[0.12em] text-accent-deep">{cards[idx].topic}</span>
            <span className="mx-auto mt-3 block max-w-lg break-words text-2xl font-semibold leading-snug text-ink sm:text-[28px]">
              {flipped ? cards[idx].back : cards[idx].front}
            </span>
            <span aria-hidden="true" className="mx-auto my-4 block h-px w-12 bg-line" />
            <span className="block text-xs text-faint">{flipped ? "Answer" : "Question"} · click or Space to flip</span>
          </button>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => step(-1)} disabled={idx === 0} className="min-h-[44px]">
              ← Previous
            </Button>
            <Button variant="secondary" onClick={() => step(1)} disabled={idx === cards.length - 1} className="min-h-[44px]">
              Next →
            </Button>
            <Button variant="success" onClick={() => mark(true)} className="min-h-[44px]">
              Known <span className="opacity-70">(1)</span>
            </Button>
            <Button variant="secondary" onClick={() => mark(false)} className="min-h-[44px]">
              Needs review <span className="opacity-70">(2)</span>
            </Button>
          </div>
          <div className="mt-2 text-center">
            <Button variant="ghost" onClick={() => setCards([])} className="min-h-[44px] text-xs">
              Start a new deck · {marked} marked this round
            </Button>
          </div>
        </div>
      )}
      {error && (
        <div className="mt-3">
          <Alert>{error}</Alert>
        </div>
      )}
    </div>
  );
}
