import { Link } from "react-router-dom";
import { IconCheck, IconFile } from "./icons";
import type { Doc } from "../lib/api";

/* Single source of truth for Practice document selection (Summaries, Quiz,
   Flashcards). Small selectable study-material cards — not filter tags.
   Selection state + callbacks stay in the owning page; this component only
   renders real API data (filename, page_count) and derives the count text. */

export default function SourceScope({
  docs,
  label,
  description,
  mode,
  single,
  multi,
  onSingle,
  onToggle,
  onClear,
}: {
  docs: Doc[];
  label: string;
  description?: string;
  mode: "single" | "multi";
  single?: string;
  multi?: string[];
  onSingle?: (id: string) => void;
  onToggle?: (id: string) => void;
  onClear?: () => void;
}) {
  if (docs.length === 0) {
    return (
      <section aria-label={label} className="rounded-xl border border-dashed border-line bg-surface px-6 py-8 text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-faint">No study material yet</p>
        <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted">
          Upload a PDF from Notes to start building your study session.
        </p>
        <Link
          to="/notes"
          className="btn-lift mt-3 inline-flex min-h-[44px] items-center rounded-lg bg-ink px-5 py-2 text-[13px] font-semibold text-white hover:opacity-85"
        >
          Go to Notes
        </Link>
      </section>
    );
  }

  const isOn = (id: string) => (mode === "single" ? single === id : (multi ?? []).includes(id));
  const selectedCount = mode === "single" ? (single ? 1 : 0) : (multi ?? []).length;

  return (
    <section aria-label={label} className="rounded-xl border border-line bg-surface px-4 py-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-faint">{label}</p>
        {mode === "multi" && selectedCount > 0 && onClear && (
          <button type="button" onClick={onClear} className="inline-flex min-h-[44px] items-center text-xs font-semibold text-accent-deep hover:underline sm:min-h-0">
            Clear
          </button>
        )}
      </div>
      {description && <p className="mt-1 text-[13px] text-muted">{description}</p>}
      <ul className="mt-2.5 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {docs.map((d) => {
          const on = isOn(d.id);
          return (
            <li key={d.id} className="min-w-0">
              <button
                type="button"
                onClick={() => (mode === "single" ? onSingle?.(d.id) : onToggle?.(d.id))}
                aria-pressed={on}
                title={d.filename}
                className={`flex min-h-[44px] w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-[transform,border-color,background-color] duration-200 ease-out hover:-translate-y-0.5 ${
                  on
                    ? "border-accent bg-accent-soft/40 hover:border-accent"
                    : "border-line bg-surface hover:border-accent/60"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                    on ? "bg-accent text-white" : "bg-tint text-muted"
                  }`}
                >
                  <IconFile width={16} height={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold leading-snug text-ink sm:text-sm">
                    {d.filename}
                  </span>
                  {d.page_count != null && (
                    <span className="mt-0.5 block text-xs tabular-nums text-muted">
                      {d.page_count} {d.page_count === 1 ? "page" : "pages"}
                    </span>
                  )}
                </span>
                {on && (
                  <span aria-hidden="true" className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-white">
                    <IconCheck width={12} height={12} />
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
      <p className="mt-2.5 text-xs text-muted" role="status">
        {selectedCount === 0 ? "No documents selected" : `${selectedCount} ${selectedCount === 1 ? "document" : "documents"} selected`}
      </p>
    </section>
  );
}
