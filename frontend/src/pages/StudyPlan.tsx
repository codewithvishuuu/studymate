import { useState } from "react";
import { Alert, Button, Spinner, TextInput } from "../components/ui";
import { genPlan, type PlanDay } from "../lib/api";

function dayParts(iso: string): { dow: string; day: string; mon: string } {
  const d = new Date(iso + "T12:00:00");
  const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return { dow: days[d.getDay()], day: String(d.getDate()), mon: months[d.getMonth()] };
}

function daysUntil(iso: string): number | null {
  const parts = iso.split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return null;
  const target = new Date(parts[0], parts[1] - 1, parts[2]);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / 86400000);
}

export default function StudyPlan() {
  const [subject, setSubject] = useState("");
  const [exam, setExam] = useState("");
  const [minutes, setMinutes] = useState(60);
  const [days, setDays] = useState<PlanDay[]>([]);
  const [examDate, setExamDate] = useState("");
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    if (!exam || pending) return;
    setPending(true);
    setError(null);
    try {
      const r = await genPlan(subject, exam, minutes);
      setDays(r.days);
      setExamDate(r.exam_date);
      setDone({});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong while building your plan.");
    } finally {
      setPending(false);
    }
  }

  const doneCount = Object.values(done).filter(Boolean).length;
  const totalTasks = days.reduce((n, d) => n + d.tasks.length, 0);
  const dayMinutes = [...new Set(days.map((d) => d.minutes))];
  const left = examDate ? daysUntil(examDate) : null;

  function focusSubject() {
    document.getElementById("plan-subject")?.focus();
  }

  return (
    <div className="mx-auto max-w-[1024px]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent-deep sm:text-[11px]">Personalized revision</p>
      <h1 className="display mt-3 max-w-xl text-[32px] text-ink sm:text-[40px]">Build a study plan that fits your exam.</h1>
      <p className="mb-5 mt-2 max-w-xl text-[15px] leading-[1.6] text-muted">
        Turn your exam date, subject, and available time into focused daily revision sessions.
      </p>

      <form onSubmit={generate} aria-label="Plan setup" className="rounded-xl border border-line bg-surface p-4 sm:p-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-faint">Plan your revision</p>
        <p className="mt-1 text-[13px] text-muted">Set your subject, exam date, and daily study time.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_180px_130px_auto] lg:items-end">
          <div className="min-w-0">
            <label htmlFor="plan-subject" className="mb-1 block text-[11px] font-bold uppercase tracking-[0.08em] text-faint">Subject</label>
            <TextInput id="plan-subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Biology" className="min-h-[44px]" />
          </div>
          <div className="min-w-0">
            <label htmlFor="plan-exam" className="mb-1 block text-[11px] font-bold uppercase tracking-[0.08em] text-faint">Exam date</label>
            <TextInput id="plan-exam" type="date" value={exam} onChange={(e) => setExam(e.target.value)} required className="min-h-[44px]" />
          </div>
          <div className="min-w-0">
            <label htmlFor="plan-min" className="mb-1 block text-[11px] font-bold uppercase tracking-[0.08em] text-faint">Minutes / day</label>
            <TextInput id="plan-min" type="number" value={minutes} min={10} max={480} onChange={(e) => setMinutes(Number(e.target.value))} className="min-h-[44px]" />
          </div>
          <Button type="submit" disabled={pending || !exam} loading={pending} className="btn-lift min-h-[44px] sm:min-h-[40px] lg:min-h-[44px]">
            {pending ? "Building…" : "Generate plan →"}
          </Button>
        </div>
      </form>

      {error && (
        <div className="mt-3">
          <Alert>{error}</Alert>
        </div>
      )}

      {pending && days.length === 0 && (
        <div className="mt-4 grid gap-2" role="status" aria-label="Loading plan">
          <p className="flex items-center gap-2 text-[13px] text-muted">
            <Spinner /> Building your revision plan…
          </p>
          <div className="grid animate-pulse gap-2" aria-hidden="true">
            <div className="h-28 rounded-xl bg-tint" />
            <div className="h-28 rounded-xl bg-tint" />
          </div>
        </div>
      )}

      {!pending && days.length === 0 && (
        <section aria-label="No plan yet" className="mt-4 rounded-xl border border-dashed border-line px-6 py-10 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-faint">Ready to plan</p>
          <h2 className="mx-auto mt-2 max-w-sm font-serif text-2xl font-normal text-ink">Create your first revision plan.</h2>
          <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted">
            Add your subject, exam date, and available study time above to build a focused routine.
          </p>
          <button
            type="button"
            onClick={focusSubject}
            className="btn-lift mt-4 inline-flex min-h-[44px] items-center rounded-lg bg-ink px-5 py-2 text-[13px] font-semibold text-white hover:opacity-85"
          >
            Create plan →
          </button>
        </section>
      )}

      {days.length > 0 && (
        <section aria-label="Revision roadmap" className="mt-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-faint">Revision roadmap</p>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="font-serif text-[28px] font-normal tracking-tight text-ink sm:text-[32px]">
              {left == null ? "Your revision days" : left > 0 ? `Exam in ${left} ${left === 1 ? "day" : "days"}` : left === 0 ? "Exam today" : `Exam ${examDate}`}
            </h2>
            <p className="text-[13px] tabular-nums text-muted" role="status">
              {days.length} {days.length === 1 ? "day" : "days"}
              {dayMinutes.length === 1 ? ` · ${dayMinutes[0]} min/day` : ""}
              {totalTasks > 0 ? ` · ${doneCount}/${totalTasks} done` : ""}
            </p>
          </div>
          <ol className="mt-4 grid gap-3">
            {days.map((d, di) => {
              const p = dayParts(d.date);
              return (
                <li key={d.date} className="rounded-xl border border-line bg-surface p-4 sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2.5">
                    <p className="flex items-center gap-2.5">
                      <span aria-hidden="true" className="flex min-w-[52px] flex-col items-center rounded-lg bg-tint px-2 py-1">
                        <span className="text-[10px] font-bold tracking-wide text-faint">{p.dow}</span>
                        <span className="text-base font-bold leading-none text-ink">{p.day} <span className="text-[11px] font-semibold text-muted">{p.mon}</span></span>
                      </span>
                      <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-faint">
                        Day {di + 1} · {d.date}
                      </span>
                    </p>
                    <p className="text-xs font-bold tabular-nums text-muted">{d.minutes} min</p>
                  </div>
                  <ul className="mt-2 space-y-1.5">
                    {d.tasks.map((t, i) => {
                      const key = `${d.date}-${i}`;
                      return (
                        <li key={key}>
                          <label className="flex min-h-[44px] cursor-pointer items-start gap-2.5 rounded-lg px-1 py-1 text-sm transition-colors hover:bg-paper">
                            <input type="checkbox" checked={!!done[key]} onChange={() => setDone((m) => ({ ...m, [key]: !m[key] }))} className="mt-1 h-4 w-4 shrink-0 accent-[#5146E5]" aria-label={`${t.title} — ${t.topic}`} />
                            <span className="min-w-0">
                              <span className="mb-1 inline-block rounded bg-accent-soft px-1.5 py-px text-[10px] font-bold uppercase tracking-wide text-accent-deep">
                                {t.kind}
                              </span>
                              <span className={`block break-words font-semibold ${done[key] ? "text-faint line-through" : "text-ink"}`}>{t.title}</span>
                              <span className="block break-words text-xs text-muted">{t.topic}</span>
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              );
            })}
          </ol>
        </section>
      )}
    </div>
  );
}
