import { Link } from "react-router-dom";
import { IconFile } from "../icons";
import { Badge, docStatusTone } from "../ui";
import type { Doc } from "../../lib/api";
import { friendlyError } from "../../pages/Notes";

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString();
}

/* Document rows from the real documents API. No Open action exists as a route —
   Ask and Quiz deep-link to the real flows. Chunk counts are not exposed by the
   API, so they are omitted rather than invented. */
export default function DocumentLibrary({ docs }: { docs: Doc[] }) {
  return (
    <section aria-label="Document library" className="surface p-5 sm:p-6">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-serif text-[22px] font-normal tracking-tight text-ink">Document Library</h2>
        <Link to="/notes" className="shrink-0 text-xs font-semibold text-accent-deep hover:underline">
          View All Documents
        </Link>
      </div>
      {docs.length === 0 ? (
        <p className="mt-2 text-sm text-muted">Your uploads will show up here.</p>
      ) : (
        <ul className="mt-3 divide-y divide-line">
          {docs.slice(0, 5).map((d) => (
            <li key={d.id} className="flex items-center gap-3 py-2.5">
              <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-tint text-muted">
                <IconFile width={16} height={16} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-ink">{d.filename}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted">
                  <Badge tone={docStatusTone(d.status)}>{d.status}</Badge>
                  {d.page_count != null && <span>{d.page_count} pages</span>}
                  {d.subject && <span className="truncate">{d.subject}</span>}
                  {fmtDate(d.upload_date) && <span>{fmtDate(d.upload_date)}</span>}
                </p>
                {d.status === "failed" && <p className="mt-1 text-xs leading-relaxed text-bad">{friendlyError(d)}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Link to="/chat" className="rounded-md px-2.5 py-2 text-xs font-semibold text-accent-deep hover:bg-accent-soft">
                  Ask
                </Link>
                <Link to="/quiz" className="rounded-md px-2.5 py-2 text-xs font-semibold text-accent-deep hover:bg-accent-soft">
                  Quiz
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
