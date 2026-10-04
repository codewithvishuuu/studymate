import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import DashTopbar from "../components/dashboard/DashTopbar";
import { IconDoc, IconFile, IconSearch, IconUpload } from "../components/icons";
import { Alert, Badge, docStatusTone } from "../components/ui";
import { deleteDoc, getSettings, listDocs, uploadDoc, type Doc } from "../lib/api";

export function friendlyError(doc: Doc): string {
  switch (doc.error_code) {
    case "scanned_no_text":
      return "No selectable text stream detected. This PDF appears to contain scanned images without an embedded text layer. StudyMate currently requires selectable text.";
    case "empty":
      return "No readable text found in this PDF.";
    case "encrypted":
      return "This PDF is password-protected. Remove the password and try again.";
    case "corrupt":
      return "This file couldn't be read. Try re-exporting the PDF.";
    case "poor_extraction":
      return "Too little readable text was extracted. Try re-exporting the PDF.";
    case "embedding":
    case "vector_db":
      return "Indexing failed temporarily. Delete and re-upload to retry.";
    default:
      return doc.error_message ?? "Processing failed. Delete and retry.";
  }
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString();
}

type View = "list" | "grid";

export default function Notes() {
  const [docs, setDocs] = useState<Doc[] | null>(null);
  const [subject, setSubject] = useState("");
  const [pending, setPending] = useState(false);
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [view, setView] = useState<View>("list");
  const [embedModel, setEmbedModel] = useState<string | null>(null);
  const [apiOk, setApiOk] = useState<boolean | null>(null);
  const [replacingId, setReplacingId] = useState<string | null>(null);
  const replaceRef = useRef<HTMLInputElement>(null);

  const refresh = () =>
    listDocs()
      .then((b) => {
        setDocs(b.documents);
        setApiOk(true);
      })
      .catch((e: Error) => {
        setError(e.message);
        setApiOk(false);
      });

  useEffect(() => {
    refresh();
    getSettings()
      .then((s) => setEmbedModel(s?.ai?.embedding_model ?? null))
      .catch(() => setEmbedModel(null));
  }, []);

  async function onFile(file: File | undefined) {
    if (!file || pending) return;
    setPending(true);
    setError(null);
    try {
      await uploadDoc(file, subject || undefined);
      setSubject("");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setPending(false);
    }
  }

  async function onDelete(id: string, filename: string) {
    if (!window.confirm(`Delete ${filename}? Its indexed content is removed too.`)) return;
    setError(null);
    try {
      await deleteDoc(id);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed.");
    }
  }

  async function onReplaceFile(file: File | undefined) {
    if (!file || !replacingId || pending) return;
    const old = docs?.find((d) => d.id === replacingId);
    setPending(true);
    setError(null);
    try {
      await uploadDoc(file, old?.subject ?? undefined);
      await deleteDoc(replacingId);
      setReplacingId(null);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Replace failed.");
    } finally {
      setPending(false);
    }
  }

  const subjects = useMemo(() => {
    const s = new Set<string>();
    (docs ?? []).forEach((d) => d.subject && s.add(d.subject));
    return [...s].sort();
  }, [docs]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (docs ?? []).filter(
      (d) =>
        (subjectFilter === "all" || d.subject === subjectFilter) &&
        (statusFilter === "all" || d.status === statusFilter) &&
        (q === "" ||
          d.filename.toLowerCase().includes(q) ||
          (d.subject ?? "").toLowerCase().includes(q)),
    );
  }, [docs, query, subjectFilter, statusFilter]);

  const readyCount = (docs ?? []).filter((d) => d.status === "ready").length;

  return (
    <div>
      <DashTopbar initial="S" title="Study Desk" />

      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent-deep sm:text-[11px]">
        Corpus Management{docs !== null && ` · ${readyCount} indexed document${readyCount === 1 ? "" : "s"}`}
      </p>
      <div className="mb-8 mt-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="display text-[32px] text-ink sm:text-[40px]">Notes &amp; Materials</h1>
          <p className="mt-2 max-w-xl text-[15px] leading-[1.6] text-muted">
            Your uploaded study material, parsed, embedded, and ready for grounded AI research.
          </p>
        </div>
        <label
          htmlFor="pdf-upload"
          className="btn-lift inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-lg bg-accent px-5 text-[13px] font-semibold text-white hover:bg-accent-deep sm:min-h-[40px]"
        >
          <IconUpload width={15} height={15} /> Upload PDF
        </label>
      </div>

      <div className="grid gap-4 xl:grid-cols-5">
        <section aria-label="Upload study material" className="surface min-w-0 p-5 sm:p-6 xl:col-span-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-bold tracking-tight text-ink">Add study material</h2>
              <p className="mt-0.5 text-[13px] text-muted">Text-based PDF only · Maximum 50MB per file · Gemini Embeddings</p>
            </div>
            <div className="w-44">
              <label htmlFor="subject" className="mb-1 block text-xs font-semibold text-muted">
                Subject <span className="font-normal">(optional)</span>
              </label>
              <input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Biology"
                className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </div>
          </div>
          <label
            htmlFor="pdf-upload"
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              void onFile(e.dataTransfer.files?.[0]);
            }}
            className={`mt-4 flex cursor-pointer flex-col items-center rounded-xl border border-dashed px-6 py-9 text-center transition-colors duration-150 sm:py-11 ${
              drag ? "border-accent bg-accent-soft" : "border-line bg-paper hover:border-accent hover:bg-accent-soft/40"
            }`}
          >
            <span aria-hidden="true" className="icon-well flex h-12 w-12 items-center justify-center rounded-xl bg-accent-soft text-accent-deep">
              <IconUpload width={20} height={20} />
            </span>
            <span className="mt-2.5 text-sm font-semibold text-ink">
              {pending ? "Processing document…" : "Drop PDF files here or choose files"}
            </span>
            <span className="mt-0.5 text-xs text-muted">Extraction and indexing start immediately</span>
            {!pending && (
              <span aria-hidden="true" className="mt-3 inline-flex min-h-[40px] items-center rounded-lg bg-ink px-5 py-2 text-[13px] font-semibold text-white">
                Choose PDF File
              </span>
            )}
          </label>
          <p className="mt-2.5 text-center text-[11px] leading-relaxed text-faint">
            Uploads are validated and parsed here; embeddings and answers run through the configured AI API.
          </p>
          <input
            id="pdf-upload"
            type="file"
            accept=".pdf,application/pdf"
            className="sr-only"
            disabled={pending}
            onChange={(e) => void onFile(e.target.files?.[0] ?? undefined)}
          />
          <input
            ref={replaceRef}
            type="file"
            accept=".pdf,application/pdf"
            className="sr-only"
            aria-label="Replacement PDF file"
            disabled={pending}
            onChange={(e) => void onReplaceFile(e.target.files?.[0] ?? undefined)}
          />
        </section>

        <div className="grid min-w-0 content-start gap-4 xl:col-span-2">
          <section aria-label="Vector store health" className="surface min-w-0 p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.08em] text-faint">Vector Store Health</h2>
              <Badge tone={apiOk === null ? "gray" : apiOk ? "green" : "red"}>
                {apiOk === null ? "Checking" : apiOk ? "Online" : "Unavailable"}
              </Badge>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-2">
              {[
                ["Storage Allocation", "—"],
                ["Indexed Chunks", "—"],
                ["Avg Parse Latency", "—"],
              ].map(([k, v]) => (
                <div key={k} className="rounded-lg border border-line bg-paper px-3 py-2">
                  <dt className="text-[11px] text-muted">{k}</dt>
                  <dd className="mt-0.5 text-sm font-bold tabular-nums text-ink">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 border-t border-line pt-2 text-xs text-muted">
              Embeddings Engine: <span className="font-semibold text-ink">{embedModel ?? "—"}</span>
            </p>
            <p className="mt-1 text-[11px] text-faint">Chunk counts and storage are not exposed by the API.</p>
          </section>

          <section aria-label="Text extraction advisory" className="rounded-xl border border-line bg-accent-soft/50 p-5">
            <h2 className="flex items-center gap-2 text-[13px] font-bold text-ink">
              <span aria-hidden="true" className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface text-accent-deep">
                <IconDoc width={15} height={15} />
              </span>
              Precision OCR Advisory
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed text-muted">
              Vector search accuracy relies directly on crisp text extraction. Scanned or image-only PDFs are rejected at upload —
              pre-process them with an OCR reader first.
            </p>
          </section>
        </div>
      </div>

      {error && (
        <div className="mt-4">
          <Alert>{error}</Alert>
        </div>
      )}

      <section aria-label="Search and filter" className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2.5">
        <span aria-hidden="true" className="pl-1 text-faint">
          <IconSearch width={16} height={16} />
        </span>
        <label htmlFor="doc-search" className="sr-only">Search documents</label>
        <input
          id="doc-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search documents, topics, or subjects..."
          className="min-h-[44px] min-w-0 flex-1 bg-transparent px-2 text-sm text-ink placeholder:text-faint focus:outline-none"
        />
        <label htmlFor="subject-filter" className="sr-only">Filter by subject</label>
        <select
          id="subject-filter"
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          className="min-h-[44px] rounded-md border border-line bg-surface px-2 text-[13px] font-medium text-ink focus:border-accent focus:outline-none"
        >
          <option value="all">All Subjects</option>
          {subjects.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <label htmlFor="status-filter" className="sr-only">Filter by status</label>
        <select
          id="status-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="min-h-[44px] rounded-md border border-line bg-surface px-2 text-[13px] font-medium text-ink focus:border-accent focus:outline-none"
        >
          <option value="all">All Statuses</option>
          <option value="ready">Ready</option>
          <option value="processing">Processing</option>
          <option value="failed">Failed</option>
        </select>
        <div role="group" aria-label="View mode" className="inline-flex rounded-md border border-line bg-paper p-0.5">
          {(["list", "grid"] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => setView(v)}
              className={`inline-flex min-h-[44px] items-center rounded px-3 text-xs font-bold capitalize transition-colors ${view === v ? "bg-surface text-ink shadow-[0_1px_2px_rgba(23,23,26,0.08)]" : "text-muted hover:text-ink"}`}
            >
              {v}
            </button>
          ))}
        </div>
      </section>

      <div className="mb-2 mt-7 flex items-baseline justify-between">
        <h2 className="font-serif text-[22px] font-normal tracking-tight text-ink">Documents</h2>
        {docs !== null && <p className="text-xs text-muted">{visible.length} of {docs.length} shown</p>}
      </div>

      {docs === null ? (
        <div className="grid animate-pulse gap-px overflow-hidden rounded-xl border border-line bg-line" aria-hidden="true">
          <div className="h-[76px] bg-surface" />
          <div className="h-[76px] bg-surface" />
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface px-6 py-10 text-center">
          <h3 className="text-[15px] font-bold text-ink">{docs.length === 0 ? "Your study library is empty." : "No documents match."}</h3>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
            {docs.length === 0
              ? "Upload your first PDF to get started — questions, summaries, and quizzes unlock from your material."
              : "Try a different search term or clear the filters."}
          </p>
        </div>
      ) : view === "grid" ? (
        <ul className="grid gap-3 sm:grid-cols-2" aria-label="Documents">
          {visible.map((d) => (
            <DocCard key={d.id} doc={d} onDelete={onDelete} onReplace={replaceRef} setReplacingId={setReplacingId} />
          ))}
        </ul>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface" aria-label="Documents">
          {visible.map((d) => (
            <DocRow key={d.id} doc={d} onDelete={onDelete} onReplace={replaceRef} setReplacingId={setReplacingId} />
          ))}
        </ul>
      )}

      <section aria-label="Embeddings integrity" className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-line bg-paper px-4 py-3">
        <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-tint text-muted">
          <IconDoc width={15} height={15} />
        </span>
        <div className="min-w-0">
          <h2 className="text-[13px] font-bold text-ink">Embeddings Integrity &amp; Provenance</h2>
          <p className="text-xs leading-relaxed text-muted">
            All parsed vectors are keyed with document, page, and chunk metadata required for verifiable page citation.
          </p>
        </div>
      </section>
    </div>
  );
}

function Meta({ doc }: { doc: Doc }) {
  return (
    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted">
      {doc.subject && <span className="truncate">{doc.subject}</span>}
      {doc.page_count != null && <span>{doc.page_count} pages</span>}
      <span>{fmtDate(doc.upload_date)}</span>
      <Badge tone={docStatusTone(doc.status)}>{doc.status}</Badge>
    </p>
  );
}

function Actions({ doc, onDelete }: { doc: Doc; onDelete: (id: string, f: string) => void }) {
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-1">
      {doc.status === "ready" && (
        <>
          <Link to="/chat" className="inline-flex min-h-[44px] items-center rounded-md px-2.5 text-xs font-semibold text-accent-deep transition-colors hover:bg-accent-soft">
            Ask
          </Link>
          <Link to="/summaries" className="inline-flex min-h-[44px] items-center rounded-md px-2.5 text-xs font-semibold text-accent-deep transition-colors hover:bg-accent-soft">
            Summary
          </Link>
          <Link to="/quiz" className="inline-flex min-h-[44px] items-center rounded-md px-2.5 text-xs font-semibold text-accent-deep transition-colors hover:bg-accent-soft">
            Quiz
          </Link>
        </>
      )}
      <button
        type="button"
        onClick={() => void onDelete(doc.id, doc.filename)}
        aria-label={`Delete ${doc.filename}`}
        className="inline-flex min-h-[44px] items-center rounded-md px-2.5 text-xs font-semibold text-muted transition-colors hover:bg-bad-bg hover:text-bad"
      >
        Delete
      </button>
    </div>
  );
}

function DocRow({ doc, onDelete, onReplace, setReplacingId }: { doc: Doc; onDelete: (id: string, f: string) => void; onReplace: React.RefObject<HTMLInputElement | null>; setReplacingId: (id: string | null) => void }) {
  return (
    <li className="card-lift px-4 py-4 transition-colors hover:bg-paper">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span aria-hidden="true" className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${doc.status === "failed" ? "bg-bad-bg text-bad" : "bg-tint text-muted"}`}>
          <IconFile width={17} height={17} />
        </span>
        <div className="min-w-0 flex-1 basis-44">
          <p className="truncate text-[17px] font-semibold leading-snug text-ink">{doc.filename}</p>
          <Meta doc={doc} />
        </div>
        <Actions doc={doc} onDelete={onDelete} />
      </div>
      {doc.status === "processing" && (
        <p className="mt-2 flex items-center gap-2 text-xs text-muted" role="status">
          <span aria-hidden="true" className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Indexing document — extracting text, then embedding for search…
        </p>
      )}
      {doc.status === "failed" && (
        <div className="mt-2.5 rounded-lg border border-bad/25 bg-bad-bg/50 px-3.5 py-3">
          <p className="text-[13px] font-bold text-bad">Text extraction failed</p>
          <p className="mt-1 text-xs leading-relaxed text-bad/90">{friendlyError(doc)}</p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setReplacingId(doc.id);
                onReplace.current?.click();
              }}
              className="inline-flex min-h-[44px] items-center rounded-lg bg-ink px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-85"
            >
              Replace PDF
            </button>
            <button
              type="button"
              onClick={() => void onDelete(doc.id, doc.filename)}
              className="inline-flex min-h-[44px] items-center rounded-lg border border-bad/30 bg-surface px-4 py-2 text-xs font-semibold text-bad transition-colors hover:bg-bad-bg"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

function DocCard({ doc, onDelete, onReplace, setReplacingId }: { doc: Doc; onDelete: (id: string, f: string) => void; onReplace: React.RefObject<HTMLInputElement | null>; setReplacingId: (id: string | null) => void }) {
  return (
    <li className="card-lift min-w-0 rounded-xl border border-line bg-surface p-5">
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${doc.status === "failed" ? "bg-bad-bg text-bad" : "bg-tint text-muted"}`}>
          <IconFile width={17} height={17} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[17px] font-semibold leading-snug text-ink">{doc.filename}</p>
          <Meta doc={doc} />
        </div>
      </div>
      {doc.status === "failed" && (
        <div className="mt-2.5 rounded-lg border border-bad/25 bg-bad-bg/50 px-3.5 py-3">
          <p className="text-[13px] font-bold text-bad">Text extraction failed</p>
          <p className="mt-1 text-xs leading-relaxed text-bad/90">{friendlyError(doc)}</p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setReplacingId(doc.id);
                onReplace.current?.click();
              }}
              className="inline-flex min-h-[44px] items-center rounded-lg bg-ink px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-85"
            >
              Replace PDF
            </button>
            <button
              type="button"
              onClick={() => void onDelete(doc.id, doc.filename)}
              className="inline-flex min-h-[44px] items-center rounded-lg border border-bad/30 bg-surface px-4 py-2 text-xs font-semibold text-bad transition-colors hover:bg-bad-bg"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-1 border-t border-line pt-2.5">
        <Actions doc={doc} onDelete={onDelete} />
      </div>
    </li>
  );
}
