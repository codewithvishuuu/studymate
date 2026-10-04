import { IconBook, IconCards, IconChat, IconClock, IconQuiz } from "../icons";
import type { Progress } from "../../lib/api";

function Metric({
  label,
  value,
  sub,
  Icon,
}: {
  label: string;
  value: string;
  sub: string;
  Icon: (p: any) => React.ReactNode;
}) {
  return (
    <div role="listitem" className="min-w-0 rounded-xl border border-line bg-surface p-4">
      <p className="flex items-center justify-between gap-2 text-[11px] font-bold uppercase tracking-[0.08em] text-faint">
        {label}
        <Icon width={14} height={14} />
      </p>
      <p className="mt-1.5 font-serif text-[30px] font-normal leading-none tabular-nums text-ink">{value}</p>
      <p className="mt-1.5 truncate text-xs text-muted">{sub}</p>
    </div>
  );
}

/* Five real metrics from getProgress only. Nothing derived, windowed, or forecasted. */
export default function ActivityMetrics({ docsTotal, ready, prog }: { docsTotal: number; ready: number; prog: Progress }) {
  const avg = prog.avg_score != null ? `${Math.round(prog.avg_score * 100)}%` : "—";
  return (
    <section aria-label="Diagnostic and activity overview">
      <div className="mb-2 flex items-baseline justify-between">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-faint">Diagnostic &amp; activity overview</h2>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5" role="list" aria-label="Metrics">
        <Metric label="Documents" value={String(docsTotal)} sub={`${ready} ready`} Icon={IconBook} />
        <Metric label="Questions" value={String(prog.questions_asked)} sub="asked" Icon={IconChat} />
        <Metric label="Quizzes" value={String(prog.quizzes_taken)} sub="completed" Icon={IconQuiz} />
        <Metric label="Avg score" value={avg} sub={prog.quizzes_taken === 0 ? "No attempts yet" : "across attempts"} Icon={IconCards} />
        <Metric label="Sessions" value={String(prog.sessions_completed)} sub="study volume logged" Icon={IconClock} />
      </div>
    </section>
  );
}
