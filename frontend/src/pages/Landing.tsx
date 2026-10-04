import type { ReactNode, SVGProps } from "react";
import { Link } from "react-router-dom";
import { StudyMark, Wordmark } from "../components/brand";
import Reveal from "../components/Reveal";
import { IconArrow, IconBook, IconCards, IconChat, IconDoc, IconPlan, IconQuiz } from "../components/icons";

type IconT = (p: SVGProps<SVGSVGElement>) => ReactNode;

function AppFrame() {
  return (
    <div aria-label="StudyMate workspace preview" className="overflow-hidden rounded-[10px] border border-line bg-surface shadow-[0_16px_48px_rgba(23,23,26,0.10)] card-lift-lg">
      <div className="flex items-center gap-1.5 border-b border-line px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-tint" />
        <span className="h-2.5 w-2.5 rounded-full bg-tint" />
        <span className="h-2.5 w-2.5 rounded-full bg-tint" />
        <span className="ml-2 hidden text-[11px] text-faint sm:block">StudyMate — ask</span>
      </div>
      <div className="grid md:grid-cols-[1fr_1.2fr_0.9fr]">
        <div className="border-b border-line p-4 md:border-b-0 md:border-r">
          <p className="text-[12px] font-bold text-ink">Computer Networks.pdf</p>
          <p className="text-[11px] tabular-nums text-faint">p. 4 / 16</p>
          <div className="mt-2.5 rounded-lg bg-paper p-3 text-[12px] leading-relaxed text-ink">
            TCP congestion control regulates how much data can be transmitted{" "}
            <span className="rounded bg-accent px-1 font-semibold text-white">before acknowledgements are received</span>.
          </div>
          <div className="mt-2.5 flex items-center justify-between text-[11px] font-semibold text-muted">
            <span>‹ Prev</span>
            <span>Next ›</span>
          </div>
        </div>
        <div className="border-b border-line p-4 md:border-b-0 md:border-r">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-faint">Ask StudyMate</p>
          <p className="mt-1.5 text-[12px] font-semibold text-ink">“What is the difference between TCP and UDP?”</p>
          <p className="mt-1.5 text-[12px] leading-relaxed text-ink">
            TCP provides connection-oriented, reliable delivery, while UDP provides connectionless delivery with lower overhead.
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="rounded bg-accent-soft px-1.5 py-0.5 text-[11px] font-bold text-accent-deep">Computer Networks.pdf · p.4</span>
            <span className="rounded bg-accent-soft px-1.5 py-0.5 text-[11px] font-bold text-accent-deep">Computer Networks.pdf · p.5</span>
          </div>
        </div>
        <div className="p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-faint">Knowledge retention</p>
          <ul className="mt-2 space-y-2.5">
            {[
              ["TCP Flow Control", "Needs review", "text-warn"],
              ["UDP", "72%", "text-ink"],
              ["Transport Layer", "Strong", "text-ok"],
            ].map(([t, s, c]) => (
              <li key={t} className="flex items-baseline justify-between gap-2 border-b border-line pb-2 text-[12px] last:border-0 last:pb-0">
                <span className="font-semibold text-ink">{t}</span>
                <span className={`shrink-0 font-bold ${c}`}>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

const promise = [
  ["01 / UNDERSTAND", "Grounded understanding", "Ask questions about your uploaded material and get answers tied to the source pages.", "SOURCE-AWARE ANSWERS"],
  ["02 / PRACTICE", "Targeted practice", "Generate quizzes and flashcards directly from the material you are studying.", "ACTIVE RECALL"],
  ["03 / IMPROVE", "Know what to revise", "Use quiz performance and study plans to identify weak areas and decide what to study next.", "PROGRESS-DRIVEN REVISION"],
];

const workflow = [
  ["01", "UPLOAD", "Drop in PDFs and study notes."],
  ["02", "INDEX", "Extract text and create searchable representations."],
  ["03", "ASK", "Ask questions against your uploaded material."],
  ["04", "PRACTICE", "Generate quizzes and flashcards."],
  ["05", "REVIEW", "Identify what needs another pass."],
  ["06", "IMPROVE", "Build a practical study plan."],
];

const grounding = ["Question", "Embedding", "ChromaDB", "Relevant passages", "Gemma 4", "Answer + citations"];



const modules: [string, string, string, IconT][] = [
  ["01", "Notes", "Upload and organize your study PDFs, keeping all your course material in one place.", IconBook],
  ["02", "Ask", "Ask questions from your uploaded material and get grounded answers with source citations.", IconChat],
  ["03", "Summaries", "Turn long study material into focused summaries, key concepts, and quick revision notes.", IconDoc],
  ["04", "Quiz", "Test your understanding with quizzes generated directly from your study material.", IconQuiz],
  ["05", "Flashcards", "Practice active recall with flashcards built from the topics you need to remember.", IconCards],
  ["06", "Study Plan", "Turn your exam dates and weak topics into practical, focused revision sessions.", IconPlan],
];



export default function Landing() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between px-4 sm:px-6">
          <Wordmark compact />
          <nav aria-label="Landing" className="hidden items-center gap-6 text-[12px] font-semibold text-[#5E616A] md:flex">
            <a href="#features" className="nav-link hover:text-ink">Features</a>
            <a href="#workflow" className="nav-link hover:text-ink">How it works</a>
            <a href="#grounding" className="nav-link hover:text-ink">Grounding</a>
            <a href="#workspace" className="nav-link hover:text-ink">Workspace</a>
          </nav>
          <Link to="/dashboard" className="inline-flex h-9 items-center rounded-md bg-ink px-4 text-[13px] font-semibold text-white transition-opacity hover:opacity-85 btn-lift">
            Open workspace →
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1200px] px-4 sm:px-6">
        <section className="mx-auto max-w-[880px] pb-20 pt-20 text-center sm:pb-24 sm:pt-24">
          <p className="inline-flex items-center rounded-full border border-line bg-surface px-5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-accent-deep sm:text-[11px]">StudyMate · Grounded AI learning</p>
          <h1 className="mt-7 display display-hero text-[48px] text-ink sm:mt-8 md:text-[60px] lg:text-[76px]">
            Your notes.
            <br />
            Your AI.
            <br />
            <span className="italic text-accent-deep">Your study space.</span>
          </h1>
          <p className="mx-auto mt-7 max-w-[660px] text-[15px] leading-[1.65] text-muted">
            Turn your own course PDFs and study material into an interactive, citation-backed study workspace.
          </p>
          <p className="mx-auto mt-2 max-w-[660px] text-[15px] leading-[1.65] text-muted">
            Ask questions, generate practice, and build revision plans from the material you actually need to learn.
          </p>
          <div className="mt-6 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Link to="/dashboard" className="inline-flex h-10 min-h-[44px] items-center justify-center gap-2 rounded-md bg-ink px-6 text-[13px] font-semibold text-white transition-opacity hover:opacity-85 btn-lift sm:min-h-[40px]">
              Start studying <span className="btn-arrow"><IconArrow width={15} height={15} /></span>
            </Link>
            <Link to="/notes" className="inline-flex h-10 min-h-[44px] items-center justify-center rounded-md border border-line bg-surface px-6 text-[13px] font-semibold text-ink transition-colors hover:bg-tint btn-lift sm:min-h-[40px]">
              Explore features
            </Link>
          </div>
          <p className="mt-4 text-xs text-faint">PDF-first · grounded answers · source citations · structured practice</p>
        </section>

        <section aria-label="Product preview" className="mx-auto max-w-5xl">
          <Reveal label="Product preview">
            <AppFrame />
          </Reveal>
          <p className="mt-3 text-center text-xs text-faint">Document → grounded answer → source → practice</p>
        </section>

        <section id="features" className="mx-auto max-w-5xl scroll-mt-20 py-20 sm:py-28" aria-label="Product promise">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-accent-deep">The learning loop</p>
          <h2 className="mt-3 max-w-xl display text-[30px] text-ink sm:text-[40px]">
            Everything you need to master your material.
          </h2>
          <p className="mt-2 max-w-xl text-[15px] text-muted">StudyMate turns your notes into a repeatable workflow for understanding, practice, and revision.</p>
          <ol className="mt-8 grid gap-8 sm:grid-cols-3 sm:gap-6">
            {promise.map(([n, t, b, m]) => (
              <li key={n} className="border-t-2 border-ink pt-4">
                <p className="text-xs font-bold tracking-[0.14em] text-faint">{n}</p>
                <h3 className="mt-1.5 text-lg font-bold tracking-tight text-ink">{t}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{b}</p>
                <p className="mt-2.5 text-[11px] font-bold tracking-[0.12em] text-accent-deep">{m}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="workflow" className="scroll-mt-20 border-y border-line bg-tint/60 py-20 sm:py-28" aria-label="Workflow">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-accent-deep">The workflow</p>
            <h2 className="mt-3 display text-[30px] text-ink sm:text-[40px]">How your documents become answers.</h2>
            <ol className="mt-8 grid gap-x-6 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
              {workflow.map(([n, t, b], i) => (
                <li key={n} className="relative border-t border-line pt-4">
                  <p className="flex items-center gap-2 text-xs font-bold tabular-nums text-faint">
                    <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${i === 5 ? "bg-accent text-white" : "border border-line bg-surface text-muted"}`}>
                      {n}
                    </span>
                    {t}
                  </p>
                  <p className="mt-1.5 text-sm text-muted">{b}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="grounding" className="mx-auto max-w-5xl scroll-mt-20 py-20 sm:py-28" aria-label="Grounding">
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-accent-deep">Deterministic grounding</p>
              <h2 className="mt-3 display text-[30px] text-ink sm:text-[40px]">Answers should have somewhere to come from.</h2>
              <p className="mt-3 max-w-md text-[15px] leading-relaxed text-muted">
                StudyMate retrieves relevant passages from your uploaded documents before asking Gemma 4 to generate an answer.
              </p>
              <p className="mt-6 font-serif text-[24px] italic leading-[1.25] text-ink sm:text-[32px]">Your study material stays at the center.</p>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
                Instead of treating every question as an open-ended chat, StudyMate first searches the material you selected.
              </p>
              <ol className="mt-6" aria-label="Retrieval pipeline">
                {grounding.map((s, i) => (
                  <li key={s} className="relative flex gap-3 pb-4 last:pb-0">
                    {i < grounding.length - 1 && <span aria-hidden="true" className="absolute left-[13px] top-7 h-[calc(100%-1.5rem)] w-px bg-line" />}
                    <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-line bg-surface text-[11px] font-bold tabular-nums text-muted">
                      {i + 1}
                    </span>
                    <p className="pt-1 text-sm font-semibold text-ink">{s}</p>
                  </li>
                ))}
              </ol>
            </div>
            <div className="lg:pt-14">
              <Reveal label="Grounded answer example">
              <div className="rounded-xl border border-line bg-surface p-5 shadow-[0_8px_24px_rgba(23,23,26,0.06)] card-lift">
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-faint">Question</p>
                <p className="mt-1 text-sm font-semibold text-ink">“What is TCP flow control?”</p>
                <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.08em] text-faint">Answer</p>
                <p className="mt-1 text-sm leading-relaxed text-ink">
                  TCP flow control prevents a fast sender from overwhelming a slower receiver by regulating the amount of unacknowledged data.
                </p>
                <p className="mb-1.5 mt-4 text-[11px] font-bold uppercase tracking-[0.08em] text-faint">Sources</p>
                <ul className="grid gap-1.5">
                  {["Computer Networks.pdf · p.4", "Computer Networks.pdf · p.5"].map((s) => (
                    <li key={s} className="rounded-md bg-accent-soft px-2.5 py-1.5 text-xs font-bold text-accent-deep">{s}</li>
                  ))}
                </ul>
                <p className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-ok">
                  <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-ok" /> GROUNDED
                </p>
              </div>
              </Reveal>
            </div>
          </div>
        </section>

        

        
        

        

        
        <section className="mx-auto max-w-5xl border-t border-line py-20 sm:py-28" aria-label="Trust">
          <h2 className="max-w-xl display text-[30px] text-ink sm:text-[40px]">
            Your study material should remain the center of the experience.
          </h2>
          <p className="mt-2 max-w-xl text-[15px] text-muted">StudyMate is designed around user-provided study material instead of unrestricted web answers.</p>
          <ol className="mt-8 grid gap-8 sm:grid-cols-3 sm:gap-6">
            {[
              ["01", "Document-scoped retrieval", "Questions can be limited to selected uploaded documents."],
              ["02", "Source citations", "Relevant answers show the document and page they came from."],
              ["03", "Explicit uncertainty", "When relevant material cannot be found, StudyMate does not fabricate an answer."],
            ].map(([n, t, b]) => (
              <li key={n} className="border-t-2 border-ink pt-4">
                <p className="text-xs font-bold tracking-[0.14em] text-faint">{n}</p>
                <h3 className="mt-1.5 text-[15px] font-bold tracking-tight text-ink">{t}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{b}</p>
              </li>
            ))}
          </ol>
          <blockquote className="mt-10 rounded-xl bg-ink px-6 py-8 text-center sm:px-10">
            <p className="mx-auto max-w-xl font-serif text-[24px] italic leading-[1.25] text-white sm:text-[32px]">
              “I couldn't find this information in your uploaded study material.”
            </p>
          </blockquote>
        </section>

        <section id="workspace" className="mx-auto max-w-5xl scroll-mt-20 border-t border-line py-20 sm:py-28" aria-label="Workspace modules">
          <div className="text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent-deep sm:text-[11px]">One workspace</p>
          <h2 className="mx-auto mt-5 max-w-[640px] display text-[30px] text-ink sm:text-[40px]">One workspace for every course.</h2>
          <p className="mx-auto mt-3 max-w-[700px] text-[15px] leading-[1.6] text-muted">Upload your notes, ask questions, and turn revision into a structured, productive workflow.</p>
          </div>
          <ul className="mt-12 grid gap-5 text-left sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {modules.map(([n, t, b, Icon]) => (
              <li key={n} className="flex min-h-[220px] flex-col rounded-xl border border-line bg-surface p-8 shadow-[0_1px_2px_rgba(23,23,26,0.04)] card-lift">
                <span aria-hidden="true" className="icon-well flex h-11 w-11 items-center justify-center rounded-lg bg-accent-soft text-accent-deep">
                  <Icon width={18} height={18} />
                </span>
                <p className="mt-5 text-sm font-semibold text-ink">
                  <span className="mr-2 text-[13px] font-medium tabular-nums text-faint">{n}</span>
                  <span className="text-[19px] font-semibold">{t}</span>
                </p>
                <p className="mt-1.5 text-sm leading-[1.5] text-muted">{b}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mx-auto max-w-[960px] pb-14" aria-label="Get started">
          <Reveal label="Get started">
          <div className="rounded-xl border border-line bg-tint px-6 py-12 text-center shadow-[0_12px_36px_rgba(23,23,26,0.08)] sm:px-10 sm:py-16">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent-deep sm:text-[11px]">Ready to continue</p>
            <h2 className="mx-auto mt-6 max-w-[640px] display display-500 text-[30px] leading-[1.02] text-ink sm:text-[40px]">Start studying with your own<br />material.</h2>
            <p className="mx-auto mt-5 max-w-[560px] text-[15px] font-medium leading-[1.55] text-muted">Upload your course notes and turn them into a quiet, focused learning workspace in seconds.</p>
            <Link to="/dashboard" className="mt-6 inline-flex h-10 min-h-[44px] items-center gap-2 rounded-md bg-ink px-5 text-sm font-semibold text-white transition-opacity hover:opacity-85 btn-lift sm:min-h-[40px]">
              Open StudyMate <span className="btn-arrow"><IconArrow width={15} height={15} /></span>
            </Link>
          </div>
          </Reveal>
        </section>

        <footer className="border-t border-line py-8" aria-label="Footer">
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
            <p className="flex min-w-0 items-center gap-2.5">
              <span aria-hidden="true" className="shrink-0">
                <StudyMark size={22} />
              </span>
              <span className="truncate text-sm font-bold text-ink">
                StudyMate <span className="font-medium text-faint">· Personal AI study workspace</span>
              </span>
            </p>
            <nav className="flex flex-wrap gap-x-6 gap-y-2 text-[13px] font-medium text-muted" aria-label="Footer">
              <a href="#features" className="nav-link hover:text-ink">Features</a>
              <a href="#workflow" className="nav-link hover:text-ink">How it works</a>
              <a href="#grounding" className="nav-link hover:text-ink">Grounding</a>
              <a href="#workspace" className="nav-link hover:text-ink">Workspace</a>
            </nav>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4 text-xs text-faint">
            <p>© StudyMate — built for focused learning.</p>
            <p>Gemma 4 · Gemini Embeddings · ChromaDB</p>
          </div>
        </footer>
      </main>
    </div>
  );
}
