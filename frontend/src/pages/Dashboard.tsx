import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import EmptyState, { CtaLink } from "../components/EmptyState";
import { getProgress, getSettings, listDocs, type Doc, type Progress } from "../lib/api";
import ActivityMetrics from "../components/dashboard/ActivityMetrics";
import ContinueStudying from "../components/dashboard/ContinueStudying";
import DashTopbar from "../components/dashboard/DashTopbar";
import DocumentLibrary from "../components/dashboard/DocumentLibrary";
import PlanTimeline from "../components/dashboard/PlanTimeline";
import RuntimeStatus, { type AiInfo } from "../components/dashboard/RuntimeStatus";
import Synthesizer from "../components/dashboard/Synthesizer";
import WeakTopics from "../components/dashboard/WeakTopics";

function greeting(name: string | null): string {
  const h = new Date().getHours();
  const base = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  return name ? `${base}, ${name}` : base;
}

function today(): string {
  return new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}

export default function Dashboard() {
  const [docs, setDocs] = useState<Doc[] | null>(null);
  const [prog, setProg] = useState<Progress | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [ai, setAi] = useState<AiInfo | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    listDocs()
      .then((b) => setDocs(b.documents))
      .catch(() => {
        setDocs([]);
        setFailed(true);
      });
    getProgress().then(setProg).catch(() => setFailed(true));
    getSettings()
      .then((s) => {
        setName(s?.profile?.name ?? null);
        setAi(s?.ai ?? null);
      })
      .catch(() => {});
  }, []);

  const ready = docs?.filter((d) => d.status === "ready") ?? [];
  const loaded = docs !== null && prog !== null;

  return (
    <div>
      <DashTopbar initial={name ? name.trim().charAt(0).toUpperCase() : "S"} />

      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent-deep">Workspace session</p>
      <div className="mt-1 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="font-serif text-[32px] font-normal leading-tight tracking-tight text-ink sm:text-[36px]">
          {greeting(name)}
        </h1>
        <p className="text-xs tabular-nums text-muted">{today()}</p>
      </div>
      <p className="mb-5 mt-1 text-sm text-muted">Your study progress, priorities and next steps.</p>

      {failed && (
        <p role="alert" className="mb-4 rounded-lg border border-bad/25 bg-bad-bg px-4 py-2.5 text-sm text-bad">
          Backend not reachable. Start it and reload to see live stats.
        </p>
      )}

      {!loaded ? (
        <div className="grid animate-pulse gap-3" aria-hidden="true">
          <div className="h-44 rounded-2xl bg-tint" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <div className="h-[104px] rounded-xl bg-tint" />
            <div className="h-[104px] rounded-xl bg-tint" />
            <div className="h-[104px] rounded-xl bg-tint" />
            <div className="h-[104px] rounded-xl bg-tint" />
            <div className="hidden h-[104px] rounded-xl bg-tint sm:block" />
          </div>
        </div>
      ) : (
        <>
          <ContinueStudying docs={ready} prog={prog} />

          <div className="mt-6">
            <ActivityMetrics docsTotal={docs.length} ready={ready.length} prog={prog} />
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-5">
            <div className="min-w-0 xl:col-span-3 xl:col-start-1 xl:row-start-1">
              <WeakTopics prog={prog} />
            </div>
            <div className="min-w-0 xl:col-span-2 xl:col-start-4 xl:row-start-1">
              <PlanTimeline />
            </div>
            <div className="min-w-0 xl:col-span-3 xl:col-start-1 xl:row-start-2">
              <DocumentLibrary docs={docs} />
            </div>
            <div className="min-w-0 xl:col-span-2 xl:col-start-4 xl:row-start-2">
              <Synthesizer />
            </div>
            <div className="min-w-0 xl:col-span-2 xl:col-start-4 xl:row-start-3">
              <RuntimeStatus ai={ai} />
            </div>
          </div>

          {docs.length === 0 && (
            <div className="mt-4">
              <EmptyState
                title="Your study library is empty."
                body="Upload your first PDF to get started."
                action={<CtaLink to="/notes">Upload PDF</CtaLink>}
              />
            </div>
          )}

          <p className="mt-6 text-center text-xs text-faint">
            New here? <Link to="/notes" className="font-semibold text-accent-deep hover:underline">Upload notes</Link>
            {" · "}
            <Link to="/chat" className="font-semibold text-accent-deep hover:underline">Ask</Link>
            {" · "}
            <Link to="/quiz" className="font-semibold text-accent-deep hover:underline">Quiz</Link>
          </p>
        </>
      )}
    </div>
  );
}
