import { Link } from "react-router-dom";
import { IconQuiz } from "../icons";
import { Badge, ProgressBar } from "../ui";
import type { Progress } from "../../lib/api";

function severity(accuracy: number): { label: string; tone: "red" | "amber" } {
  return accuracy < 0.5 ? { label: "Critical", tone: "red" } : { label: "Needs review", tone: "amber" };
}

/* Real quiz-derived weak topics only. No descriptions exist in the API — omitted, not invented. */
export default function WeakTopics({ prog }: { prog: Progress }) {
  return (
    <section aria-label="Knowledge gaps and weak topics" className="surface p-5 sm:p-6">
      <h2 className="font-serif text-[22px] font-normal tracking-tight text-ink">Knowledge Gaps &amp; Weak Topics</h2>
      {prog.weak_topics.length === 0 ? (
        <div className="mt-2 flex items-start gap-3">
          <span aria-hidden="true" className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-tint text-muted">
            <IconQuiz width={16} height={16} />
          </span>
          <div>
            <p className="text-sm font-semibold text-ink">No weak topics detected yet.</p>
            <p className="mt-0.5 text-[13px] text-muted">Complete a quiz to identify areas that need more practice.</p>
          </div>
        </div>
      ) : (
        <ul className="mt-4 space-y-4">
          {prog.weak_topics.slice(0, 5).map((w) => {
            const s = severity(w.accuracy);
            return (
              <li key={w.topic} className="border-b border-line pb-4 last:border-0 last:pb-0">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-ink">{w.topic}</span>
                  <Badge tone={s.tone}>{s.label}</Badge>
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex-1">
                    <ProgressBar value={Math.round(w.accuracy * 100)} max={100} label={`${w.topic} accuracy`} />
                  </div>
                  <span className="shrink-0 text-xs tabular-nums text-muted">
                    {Math.round(w.accuracy * 100)}% · {w.attempts} attempts
                  </span>
                </div>
                <Link to="/quiz" className="mt-1.5 inline-block text-xs font-semibold text-accent-deep hover:underline">
                  Quick Practice →
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
