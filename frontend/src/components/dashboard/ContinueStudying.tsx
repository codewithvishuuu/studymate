import { Link } from "react-router-dom";
import { IconArrow, IconCards, IconQuiz } from "../icons";
import type { Doc, Progress } from "../../lib/api";

/* Dark continue card. All values are real props — never fabricated. */
export default function ContinueStudying({ docs, prog }: { docs: Doc[]; prog: Progress | null }) {
  if (docs.length === 0) {
    return (
      <section aria-label="Continue studying" className="relative overflow-hidden rounded-xl bg-ink p-6 text-white sm:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/60">Continue studying</p>
        <h2 className="mt-1.5 font-serif text-[26px] font-normal leading-tight sm:text-[30px]">Upload your first PDF</h2>
        <p className="mt-1 max-w-md text-sm text-white/70">Your notes become questions, quizzes, and a plan.</p>
        <Link to="/notes" className="btn-lift mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-white px-4 py-2 text-[13px] font-semibold text-ink hover:bg-paper">
          Upload PDF <span className="btn-arrow inline-flex"><IconArrow width={14} height={14} /></span>
        </Link>
      </section>
    );
  }
  const weak = prog?.weak_topics[0]?.topic;
  const latest = docs[0];
  const avg = prog?.avg_score != null ? `${Math.round(prog.avg_score * 100)}% avg` : null;
  return (
    <section aria-label="Continue studying" className="relative overflow-hidden rounded-xl bg-ink p-6 text-white sm:p-8">
      <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.35]">
        <defs>
          <pattern id="sm-grid" width="28" height="28" patternUnits="userSpaceOnUse">
            <path d="M 28 0 L 0 0 0 28" fill="none" stroke="#ffffff" strokeOpacity="0.06" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#sm-grid)" />
        <g fill="#5146E5" fillOpacity="0.5">
          <circle cx="88%" cy="22%" r="2.5" />
          <circle cx="94%" cy="48%" r="1.8" />
          <circle cx="82%" cy="66%" r="1.5" />
        </g>
        <g stroke="#5146E5" strokeOpacity="0.3" strokeWidth="1">
          <line x1="88%" y1="22%" x2="94%" y2="48%" />
          <line x1="94%" y1="48%" x2="82%" y2="66%" />
        </g>
      </svg>
      <div className="relative">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/60">Continue studying · Highest priority</p>
        <h2 className="mt-1.5 max-w-xl truncate font-serif text-[26px] font-normal leading-tight sm:text-[30px]">{latest.filename}</h2>
        <p className="mt-1 text-sm text-white/70">
          {latest.subject ? `${latest.subject} · ` : ""}
          {latest.page_count != null ? `${latest.page_count} pages` : "Indexed"}
          {weak ? (
            <>
              {" "}· Next: review <span className="font-semibold text-white">{weak}</span>
            </>
          ) : (
            " · Next: ask a question or take a practice quiz"
          )}
          {avg ? ` · ${avg}` : ""}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link to="/chat" className="btn-lift inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-[13px] font-semibold text-white hover:bg-accent-deep">
            Ask Questions <span className="btn-arrow inline-flex"><IconArrow width={14} height={14} /></span>
          </Link>
          <Link to="/quiz" className="btn-lift inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-white/10 px-4 py-2 text-[13px] font-semibold text-white hover:bg-white/15">
            <IconQuiz width={15} height={15} /> Take Quiz
          </Link>
          <Link to="/flashcards" className="btn-lift inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-white/10 px-4 py-2 text-[13px] font-semibold text-white hover:bg-white/15">
            <IconCards width={15} height={15} /> Review Flashcards
          </Link>
        </div>
      </div>
    </section>
  );
}
