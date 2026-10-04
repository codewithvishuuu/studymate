import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { Wordmark } from "./brand";
import { IconBook, IconCards, IconChat, IconDoc, IconGear, IconHome, IconMenu, IconPlan, IconQuiz } from "./icons";
import { getSettings } from "../lib/api";

const groups = [
  {
    label: "Study",
    links: [
      { to: "/dashboard", label: "Dashboard", Icon: IconHome },
      { to: "/notes", label: "Notes", Icon: IconBook },
      { to: "/chat", label: "Ask", Icon: IconChat },
    ],
  },
  {
    label: "Practice",
    links: [
      { to: "/summaries", label: "Summaries", Icon: IconDoc },
      { to: "/quiz", label: "Quiz", Icon: IconQuiz },
      { to: "/flashcards", label: "Flashcards", Icon: IconCards },
    ],
  },
  {
    label: "Plan",
    links: [{ to: "/study-plan", label: "Study Plan", Icon: IconPlan }],
  },
];

const tabs = [
  { to: "/dashboard", label: "Home", Icon: IconHome },
  { to: "/notes", label: "Notes", Icon: IconBook },
  { to: "/chat", label: "Ask", Icon: IconChat },
  { to: "/quiz", label: "Practice", Icon: IconQuiz },
  { to: "/study-plan", label: "Plan", Icon: IconPlan },
];

function SideLink({ to, label, Icon }: { to: string; label: string; Icon: (p: any) => React.ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `relative flex items-center gap-2.5 rounded-lg px-3 py-[7px] text-[13px] transition-colors ${
          isActive ? "bg-accent-soft font-semibold text-accent-deep" : "font-medium text-muted hover:bg-tint hover:text-ink"
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && <span aria-hidden="true" className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full bg-accent" />}
          <Icon width={16} height={16} />
          {label}
        </>
      )}
    </NavLink>
  );
}

function SidebarFooter() {
  const [ai, setAi] = useState<{ reachable: boolean } | null>(null);
  const [name, setName] = useState<string | null>(null);
  useEffect(() => {
    getSettings()
      .then((s) => {
        setAi({ reachable: !!s?.ai?.reachable });
        setName(s?.profile?.name ?? null);
      })
      .catch(() => {
        setAi({ reachable: false });
      });
  }, []);
  const on = ai?.reachable === true;
  return (
    <div>
      {name && (
        <p className="flex items-center gap-2.5 px-3 py-2" aria-label="Profile">
          <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-tint text-xs font-bold text-muted">
            {name.trim().charAt(0).toUpperCase()}
          </span>
          <span className="min-w-0 truncate text-[13px] font-semibold text-ink">{name}</span>
        </p>
      )}
      <p className="flex items-center gap-2 px-3 py-2 text-xs text-muted" role="status">
        <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${ai === null ? "bg-faint" : on ? "bg-ok" : "bg-bad"}`} />
          {ai === null ? "Checking AI…" : on ? "AI connected" : "AI offline"}
      </p>
    </div>
  );
}

export default function Layout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  useEffect(() => setOpen(false), [location.pathname]);

  return (
    <div className="min-h-screen lg:flex">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:shadow-lg">
        Skip to content
      </a>

      {/* Mobile header */}
      <header className="sticky top-0 z-30 border-b border-line bg-paper/95 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between px-4 py-2.5">
          <Link to="/" aria-label="StudyMate home">
            <Wordmark compact />
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Close navigation" : "Open navigation"}
            className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border border-line bg-surface text-muted hover:text-ink"
          >
            <IconMenu />
          </button>
        </div>
        {open && (
          <nav aria-label="Mobile" className="border-t border-line px-4 py-3">
            {groups.map((g) => (
              <div key={g.label} className="mb-1">
                <p className="px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-[0.08em] text-faint">{g.label}</p>
                {g.links.map((l) => (
                  <SideLink key={l.to} {...l} />
                ))}
              </div>
            ))}
            <div className="mt-2 border-t border-line pt-2">
              <SideLink to="/settings" label="Settings" Icon={IconGear} />
            </div>
          </nav>
        )}
      </header>

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-[232px] shrink-0 flex-col border-r border-line bg-surface px-3 py-5 lg:flex" aria-label="Sidebar">
        <div className="px-2">
          <Link to="/" aria-label="StudyMate home">
            <Wordmark />
          </Link>
        </div>
        <nav className="mt-7 flex-1 space-y-5 overflow-y-auto" aria-label="Primary">
          {groups.map((g) => (
            <div key={g.label}>
              <p className="px-3 pb-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-faint">{g.label}</p>
              <div className="grid gap-0.5">
                {g.links.map((l) => (
                  <SideLink key={l.to} {...l} />
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="border-t border-line pt-2">
          <SideLink to="/settings" label="Settings" Icon={IconGear} />
          <div className="mt-1 border-t border-line">
            <SidebarFooter />
          </div>
        </div>
      </aside>

      {/* Workspace */}
      <div className="min-w-0 flex-1">
        <main id="main" className="mx-auto w-full max-w-[1200px] px-4 pb-24 pt-5 sm:px-6 sm:pt-7 lg:pb-12">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom tabs */}
      <nav aria-label="Mobile bottom" className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur lg:hidden">
        <ul className="grid grid-cols-5">
          {tabs.map(({ to, label, Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `flex min-h-[52px] flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-semibold ${
                    isActive ? "text-accent-deep" : "text-muted"
                  }`
                }
              >
                <Icon width={19} height={19} />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
