import { NavLink } from "react-router-dom";
import { StudyMark } from "../brand";

const links = [
  { to: "/dashboard", label: "Overview", end: true },
  { to: "/notes", label: "Library", end: false },
  { to: "/chat", label: "Synthesizer", end: false },
];

/* Slim dashboard-local topbar. Routes are existing app routes. */
export default function DashTopbar({ initial, title = "Study Desk" }: { initial: string; title?: string }) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-line pb-3">
      <p className="flex min-w-0 items-center gap-2">
        <StudyMark size={22} />
        <span className="truncate text-sm font-bold tracking-tight text-ink">{title}</span>
      </p>
      <nav aria-label="Dashboard sections" className="flex items-center gap-1">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            className={({ isActive }) =>
              `rounded-md px-2.5 py-1.5 text-[13px] transition-colors ${
                isActive ? "font-semibold text-accent-deep" : "font-medium text-muted hover:text-ink"
              }`
            }
          >
            {l.label}
          </NavLink>
        ))}
        <NavLink
          to="/settings"
          aria-label="Profile and settings"
          className="relative ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-tint text-xs font-bold text-muted transition-colors hover:text-ink after:absolute after:-inset-3 after:content-['']"
        >
          {initial || "S"}
        </NavLink>
      </nav>
    </div>
  );
}
