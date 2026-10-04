import { useEffect, useState } from "react";
import Markdown from "../components/Markdown";
import SourceScope from "../components/SourceScope";
import { Alert, Button, SegmentedControl, Spinner } from "../components/ui";
import { genSummary, listDocs, type Doc, type Summary } from "../lib/api";

const MODES = ["short", "key-points"] as const;

export default function Summaries() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [docId, setDocId] = useState("");
  const [mode, setMode] = useState<(typeof MODES)[number]>("short");
  const [out, setOut] = useState<Summary | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listDocs().then((b) => {
      const ready = b.documents.filter((d) => d.status === "ready");
      setDocs(ready);
      if (ready[0]) setDocId(ready[0].id);
    }).catch(() => {});
  }, []);

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    if (!docId || pending) return;
    setPending(true);
    setError(null);
    try {
      setOut(await genSummary(docId, mode));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong while creating your summary.");
    } finally {
      setPending(false);
    }
  }

  const active = docs.find((d) => d.id === docId);

  return (
    <div className="mx-auto max-w-[1024px]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent-deep sm:text-[11px]">Focused revision</p>
      <h1 className="display mt-3 max-w-xl text-[32px] text-ink sm:text-[40px]">Turn your notes into revision-ready summaries.</h1>
      <p className="mb-5 mt-2 max-w-xl text-[15px] leading-[1.6] text-muted">
        Create focused summaries from the study material you have already uploaded.
      </p>

      <form onSubmit={generate} className="grid gap-4">
        <SourceScope
          docs={docs}
          label="Summarize from"
          description="Choose the material you want to turn into revision notes."
          mode="single"
          single={docId}
          onSingle={setDocId}
        />
        {docs.length > 0 && (
          <div className="flex flex-wrap items-center gap-3">
            <SegmentedControl label="Summary mode" options={MODES} value={mode} onChange={setMode} />
            <Button type="submit" disabled={pending || !docId} loading={pending} className="btn-lift min-h-[44px] sm:min-h-[40px]">
              {pending ? "Building your summary…" : "Generate summary"}
            </Button>
          </div>
        )}
      </form>

      {error && (
        <div className="mt-3">
          <Alert>{error}</Alert>
        </div>
      )}
      {pending && !out && (
        <div className="mt-4 grid gap-2" role="status" aria-label="Loading summary">
          <p className="flex items-center gap-2 text-[13px] text-muted">
            <Spinner /> Building your summary…
          </p>
          <div className="grid animate-pulse gap-2" aria-hidden="true">
            <div className="h-4 rounded bg-tint" />
            <div className="h-4 w-11/12 rounded bg-tint" />
            <div className="h-4 w-4/5 rounded bg-tint" />
            <div className="h-4 w-3/5 rounded bg-tint" />
          </div>
        </div>
      )}
      {!pending && !out && docs.length > 0 && (
        <section aria-label="No summary yet" className="mt-4 rounded-xl border border-dashed border-line px-6 py-10 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-faint">Ready to revise</p>
          <h2 className="mx-auto mt-2 max-w-sm font-serif text-2xl font-normal text-ink">Generate your first summary.</h2>
          <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted">Choose your study material and create a focused revision view.</p>
        </section>
      )}
      {out && (
        <article className="mt-4 rounded-xl border border-line bg-surface p-5 sm:p-7" aria-label="Summary">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-faint">Your summary</p>
              <h2 className="mt-0.5 truncate text-[15px] font-bold tracking-tight text-ink">{active?.filename ?? "Summary"}</h2>
              <p className="mt-0.5 text-xs text-muted">Generated from your material · {out.mode}</p>
            </div>
            <Button variant="secondary" onClick={() => void navigator.clipboard.writeText(out.content)} className="min-h-[44px] px-3 py-1 text-xs sm:min-h-[36px]">
              Copy
            </Button>
          </div>
          <div className="study-prose max-w-[68ch] break-words text-[15px] leading-[1.6] text-ink">
            <Markdown text={out.content} />
          </div>
        </article>
      )}
    </div>
  );
}
