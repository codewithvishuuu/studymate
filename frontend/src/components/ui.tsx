import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

/* StudyMate primitives. Radius: 6px inputs / 8px buttons & flat cards / 12px panels.
   Borders + spacing carry hierarchy; shadows stay near-invisible. */

type Variant = "primary" | "secondary" | "ghost" | "danger" | "success";

const btnBase =
  "inline-flex min-h-[38px] items-center justify-center gap-2 rounded-lg px-4 py-2 text-[13px] font-semibold transition-colors duration-150 focus-visible:outline-2 disabled:cursor-not-allowed disabled:opacity-50";

const btnVariant: Record<Variant, string> = {
  primary: "bg-accent text-white hover:bg-accent-deep active:bg-accent-deep",
  secondary: "border border-line bg-surface text-ink hover:bg-tint active:bg-tint",
  ghost: "text-accent-deep hover:bg-accent-soft active:bg-accent-soft",
  danger: "bg-bad text-white hover:brightness-95 active:brightness-90",
  success: "bg-ok text-white hover:brightness-95 active:brightness-90",
};

export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <span role="status" aria-label={label} className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
}

export function Button({ variant = "primary", loading = false, disabled, children, className = "", ...rest }: ButtonProps) {
  return (
    <button
      type="button"
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      className={`${btnBase} ${btnVariant[variant]} ${className}`}
      {...rest}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}

export function Card({ children, label, flat = false }: { children: ReactNode; label?: string; flat?: boolean }) {
  return (
    <section aria-label={label} className={flat ? "surface-flat p-4" : "surface p-5"}>
      {children}
    </section>
  );
}

export function CardTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-[13px] font-semibold tracking-tight text-ink">{children}</h2>;
}

export function SectionHeader({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="mb-1 flex flex-wrap items-end justify-between gap-2">
      <div>
        <h2 className="text-[15px] font-bold tracking-tight text-ink">{title}</h2>
        {sub && <p className="mt-0.5 text-[13px] text-muted">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-5">
      <h1 className="text-[22px] font-bold leading-tight tracking-[-0.01em] text-ink">{title}</h1>
      {sub && <p className="mt-1 max-w-prose text-sm text-muted">{sub}</p>}
    </div>
  );
}

const fieldCls =
  "w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-faint hover:border-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:opacity-50";

export function Field({
  label,
  htmlFor,
  helper,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  helper?: string;
  error?: string | null;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1 block text-[13px] font-semibold text-ink">
        {label}
      </label>
      {children}
      {error ? (
        <p role="alert" className="mt-1 text-xs text-bad">
          {error}
        </p>
      ) : (
        helper && <p className="mt-1 text-xs text-muted">{helper}</p>
      )}
    </div>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${fieldCls} ${props.className ?? ""}`} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${fieldCls} ${props.className ?? ""}`} />;
}

type BadgeTone = "green" | "amber" | "red" | "indigo" | "gray";

const badgeTone: Record<BadgeTone, string> = {
  green: "bg-ok-bg text-ok",
  amber: "bg-warn-bg text-warn",
  red: "bg-bad-bg text-bad",
  indigo: "bg-accent-soft text-accent-deep",
  gray: "bg-tint text-muted",
};

export function Badge({ tone = "gray", children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span className={`inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-xs font-semibold ${badgeTone[tone]}`}>
      {children}
    </span>
  );
}

export function StatusDot({ state, label }: { state: "ready" | "busy" | "bad" | "idle"; label: string }) {
  const dot = state === "ready" ? "bg-ok" : state === "busy" ? "bg-warn" : state === "bad" ? "bg-bad" : "bg-faint";
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted">
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

export function docStatusTone(status: string): BadgeTone {
  if (status === "ready") return "green";
  if (status === "failed") return "red";
  return "amber";
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-lg bg-tint ${className}`} />;
}

export function Alert({ tone = "red", children }: { tone?: "red" | "amber" | "green"; children: ReactNode }) {
  const cls =
    tone === "red"
      ? "border-bad/25 bg-bad-bg text-bad"
      : tone === "amber"
        ? "border-warn/25 bg-warn-bg text-warn"
        : "border-ok/25 bg-ok-bg text-ok";
  return (
    <p role={tone === "green" ? "status" : "alert"} className={`rounded-lg border px-4 py-2.5 text-sm ${cls}`}>
      {children}
    </p>
  );
}

export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex flex-wrap rounded-lg border border-line bg-surface p-0.5">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          aria-pressed={value === o}
          onClick={() => onChange(o)}
          className={`min-h-[44px] rounded-md px-3 py-1.5 text-[13px] font-semibold transition-colors duration-150 sm:min-h-[32px] ${
            value === o ? "bg-accent text-white shadow-[0_1px_2px_rgba(23,23,26,0.08)]" : "text-muted hover:text-ink"
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

export function ProgressBar({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max} aria-label={label}>
      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-tint">
        <span className="block h-full rounded-full bg-accent transition-all duration-200" style={{ width: `${pct}%` }} />
      </span>
    </div>
  );
}

export function SourceCard({ page, filename, excerpt }: { page: number | null; filename: string; excerpt: string }) {
  return (
    <div className="rounded-lg border border-line bg-paper px-3 py-2 transition-colors hover:border-accent/50">
      <p className="flex min-w-0 items-center gap-2 text-xs">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 text-muted">
          <path d="M6 3h8l4 4v14H6V3Z" />
          <path d="M14 3v4h4" />
        </svg>
        <span className="min-w-0 flex-1 truncate font-semibold text-ink">{filename}</span>
        <span className="shrink-0 rounded bg-accent-soft px-1.5 py-0.5 text-[11px] font-bold text-accent-deep">
          {page != null ? `p. ${page}` : "p. —"}
        </span>
      </p>
      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">“{excerpt}”</p>
    </div>
  );
}
