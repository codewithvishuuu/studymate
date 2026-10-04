import { Link } from "react-router-dom";

/* No plan-list endpoint exists, so this panel honestly covers the empty case.
   Generated plans live on the Study Plan page. */
export default function PlanTimeline() {
  return (
    <section aria-label="Today's study plan" className="surface p-5 sm:p-6">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-serif text-[22px] font-normal tracking-tight text-ink">Today&apos;s Study Plan</h2>
        <Link to="/study-plan" className="shrink-0 text-xs font-semibold text-accent-deep hover:underline">
          Open plan
        </Link>
      </div>
      <div className="mt-2 rounded-lg border border-dashed border-line px-4 py-6 text-center">
        <p className="text-sm font-semibold text-ink">No study plan for today yet.</p>
        <p className="mx-auto mt-1 max-w-[26ch] text-[13px] text-muted">Generate one from your exam date and daily minutes.</p>
        <Link
          to="/study-plan"
          className="mt-3 inline-flex min-h-[44px] items-center rounded-lg bg-ink px-4 py-2 text-[13px] font-semibold text-white transition-opacity hover:opacity-85"
        >
          Create a plan
        </Link>
      </div>
    </section>
  );
}
