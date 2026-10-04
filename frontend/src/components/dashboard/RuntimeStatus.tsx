/* Runtime facts from GET /api/settings only. Chunk counts are not exposed by
   the API, so they are omitted rather than invented. No secrets rendered. */
export interface AiInfo {
  provider?: string;
  configured?: boolean;
  reachable?: boolean;
  generation_model?: string;
  embedding_model?: string;
  models_present?: boolean;
}

export default function RuntimeStatus({ ai }: { ai: AiInfo | null }) {
  const status = ai === null ? "checking" : ai.reachable ? "up" : ai.configured ? "down" : "missing";
  return (
    <section aria-label="AI runtime status" className="rounded-xl border border-line bg-paper px-4 py-3">
      <div className="flex items-center justify-between gap-2">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.08em] text-faint">AI runtime</h3>
        <p className="flex items-center gap-1.5 text-xs font-semibold text-muted" role="status">
          <span
            aria-hidden="true"
            className={`h-1.5 w-1.5 rounded-full ${status === "up" ? "bg-ok" : status === "down" ? "bg-bad" : status === "missing" ? "bg-warn" : "bg-faint"}`}
          />
          {status === "up" ? "Operational" : status === "down" ? "Unavailable" : status === "missing" ? "Not configured" : "Checking…"}
        </p>
      </div>
      <dl className="mt-2 grid gap-x-4 gap-y-1 text-xs sm:grid-cols-2">
        <div className="flex justify-between gap-2 border-t border-line/60 pt-1">
          <dt className="shrink-0 text-muted">Model</dt>
          <dd className="min-w-0 truncate font-semibold text-ink">{ai?.generation_model ?? "—"}</dd>
        </div>
        <div className="flex justify-between gap-2 border-t border-line/60 pt-1">
          <dt className="shrink-0 text-muted">Embedder</dt>
          <dd className="min-w-0 truncate font-semibold text-ink">{ai?.embedding_model ?? "—"}</dd>
        </div>
      </dl>
    </section>
  );
}
