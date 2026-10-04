import { useEffect, useState } from "react";
import { Alert, Button, Skeleton, TextInput } from "../components/ui";
import { getSettings, putSettings } from "../lib/api";

function val(v: unknown): string {
  return typeof v === "string" && v.trim() !== "" ? v : "—";
}

export default function Settings() {
  const [name, setName] = useState("");
  const [subjects, setSubjects] = useState("");
  const [exam, setExam] = useState("");
  const [goal, setGoal] = useState(60);
  const [ai, setAi] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSettings()
      .then((s) => {
        setName(s.profile.name ?? "");
        setSubjects((s.profile.subjects ?? []).join(", "));
        setExam(s.profile.exam_date ?? "");
        setGoal(s.study?.daily_goal_minutes ?? 60);
        setAi(s.ai);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoaded(true));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setMsg(null);
    setError(null);
    try {
      await putSettings({
        name: name || null,
        subjects: subjects.split(",").map((s) => s.trim()).filter(Boolean),
        exam_date: exam || null,
        daily_goal_minutes: goal,
      });
      setMsg("Preferences saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong while saving.");
    } finally {
      setSaving(false);
    }
  }

  const connected = ai?.reachable === true;

  return (
    <div className="mx-auto max-w-[1024px]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent-deep sm:text-[11px]">Workspace settings</p>
      <h1 className="display mt-3 max-w-xl text-[32px] text-ink sm:text-[40px]">Make StudyMate work your way.</h1>
      <p className="mb-8 mt-2 max-w-xl text-[15px] leading-[1.6] text-muted">
        Set your study preferences and see the AI engine powering your workspace.
      </p>

      <div className="grid gap-8 sm:gap-10">
        <section aria-label="AI runtime">
          <h2 className="font-serif text-[28px] font-normal tracking-tight text-ink sm:text-[32px]">AI runtime</h2>
          <p className="mt-1 max-w-xl text-sm text-muted">The model and engine behind your grounded answers.</p>
          <div className="mt-3 rounded-xl border border-line bg-surface p-4 sm:p-5">
            {!loaded ? (
              <Skeleton className="h-20" />
            ) : !ai ? (
              <p className="text-sm text-muted">Could not load status.</p>
            ) : (
              <div className="flex min-w-0 items-start gap-3">
                <span aria-hidden="true" className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${connected ? "bg-ok" : "bg-warn"}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-ink" role="status">
                    {connected ? "Connected" : "Not connected"}
                  </p>
                  <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                    {[
                      ["Generation", val(ai.generation_model)],
                      ["Embeddings", val(ai.embedding_model)],
                      ["Provider", val(ai.provider)],
                      ["Backend", "Connected"],
                    ].map(([k, v]) => (
                      <div key={k} className="min-w-0 rounded-lg border border-line bg-paper px-3 py-2">
                        <dt className="text-[11px] font-bold uppercase tracking-[0.08em] text-faint">{k}</dt>
                        <dd className="mt-0.5 truncate text-sm font-semibold text-ink" title={v}>{v}</dd>
                      </div>
                    ))}
                  </dl>
                  {!connected && <p className="mt-2.5 text-xs text-warn">Set GOOGLE_API_KEY on the backend, then reload this page.</p>}
                </div>
              </div>
            )}
          </div>
        </section>

        <section aria-label="Profile">
          <h2 className="font-serif text-[28px] font-normal tracking-tight text-ink sm:text-[32px]">Profile</h2>
          <p className="mt-1 max-w-xl text-sm text-muted">Basic details used to personalize your study workspace.</p>
          <div className="mt-3 rounded-xl border border-line bg-surface p-4 sm:p-5">
            {!loaded ? (
              <Skeleton className="h-24" />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="min-w-0">
                  <label htmlFor="set-name" className="mb-1 block text-[11px] font-bold uppercase tracking-[0.08em] text-faint">Name</label>
                  <TextInput id="set-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className="min-h-[44px]" />
                </div>
                <div className="min-w-0">
                  <label htmlFor="set-exam" className="mb-1 block text-[11px] font-bold uppercase tracking-[0.08em] text-faint">Exam date</label>
                  <TextInput id="set-exam" type="date" value={exam} onChange={(e) => setExam(e.target.value)} className="min-h-[44px]" />
                </div>
              </div>
            )}
          </div>
        </section>

        <section aria-label="Study preferences">
          <h2 className="font-serif text-[28px] font-normal tracking-tight text-ink sm:text-[32px]">Study preferences</h2>
          <p className="mt-1 max-w-xl text-sm text-muted">Set the subjects and daily time you want StudyMate to work around.</p>
          <div className="mt-3 rounded-xl border border-line bg-surface p-4 sm:p-5">
            {!loaded ? (
              <Skeleton className="h-24" />
            ) : (
              <form onSubmit={save} className="grid gap-3">
                <div className="min-w-0">
                  <label htmlFor="set-subjects" className="mb-1 block text-[11px] font-bold uppercase tracking-[0.08em] text-faint">Subjects</label>
                  <TextInput id="set-subjects" value={subjects} onChange={(e) => setSubjects(e.target.value)} placeholder="Biology, Chemistry" className="min-h-[44px]" />
                </div>
                <div className="flex flex-wrap items-end gap-3">
                  <div className="min-w-0">
                    <label htmlFor="set-goal" className="mb-1 block text-[11px] font-bold uppercase tracking-[0.08em] text-faint">Daily goal (minutes)</label>
                    <TextInput id="set-goal" type="number" value={goal} min={10} max={480} onChange={(e) => setGoal(Number(e.target.value))} className="min-h-[44px] w-32" />
                  </div>
                  <Button type="submit" loading={saving} className="btn-lift min-h-[44px] sm:min-h-[40px]">
                    {saving ? "Saving…" : "Save preferences →"}
                  </Button>
                  {msg && <p role="status" className="pb-2 text-[13px] font-medium text-ok">{msg}</p>}
                </div>
              </form>
            )}
          </div>
        </section>
      </div>

      {error && (
        <div className="mt-4">
          <Alert>{error}</Alert>
        </div>
      )}
    </div>
  );
}
