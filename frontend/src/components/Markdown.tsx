import type { ReactNode } from "react";

/**
 * Minimal renderer for the Markdown subset Gemma emits in summaries/chat
 * (headings, **bold**, bullet/numbered lists, paragraphs).
 * Builds React elements only — no HTML parsing, no raw markup injection —
 * so AI text can never become executable markup. No new dependency.
 * ponytail: subset renderer (ceiling: no tables/code-fences/nesting; upgrade: react-markdown).
 */

function inline(text: string, key: string): ReactNode {
  // Strip any unmatched markers so users never see literal ** or stray *.
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    if (p === "") return null;
    if (p.startsWith("**") && p.endsWith("**") && p.length > 4) {
      return <strong key={`${key}-${i}`}>{p.slice(2, -2)}</strong>;
    }
    return <span key={`${key}-${i}`}>{p.replace(/\*\*/g, "")}</span>;
  });
}

export default function Markdown({ text }: { text: string }) {
  const blocks: ReactNode[] = [];
  let bullets: string[] = [];
  let numbered: string[] = [];
  let para: string[] = [];

  const flush = () => {
    if (bullets.length > 0) {
      const items = bullets;
      bullets = [];
      blocks.push(
        <ul key={`u-${blocks.length}`} className="list-disc space-y-1 pl-5 text-sm text-gray-900">
          {items.map((t, i) => (
            <li key={i}>{inline(t, `u-${blocks.length}-${i}`)}</li>
          ))}
        </ul>,
      );
    }
    if (numbered.length > 0) {
      const items = numbered;
      numbered = [];
      blocks.push(
        <ol key={`o-${blocks.length}`} className="list-decimal space-y-1 pl-5 text-sm text-gray-900">
          {items.map((t, i) => (
            <li key={i}>{inline(t, `o-${blocks.length}-${i}`)}</li>
          ))}
        </ol>,
      );
    }
    if (para.length > 0) {
      const lines = para;
      para = [];
      blocks.push(
        <p key={`p-${blocks.length}`} className="text-sm text-gray-900">
          {inline(lines.join(" "), `p-${blocks.length}`)}
        </p>,
      );
    }
  };

  for (const line of text.split("\n")) {
    const t = line.trim();
    const h = t.match(/^(#{1,4})\s+(.*)$/);
    const b = t.match(/^[*\-•]\s+(.*)$/);
    const o = t.match(/^\d+[.)]\s+(.*)$/);
    if (h) {
      flush();
      const level = h[1].length;
      const cls =
        level <= 1 ? "text-base font-bold text-gray-900" : "text-sm font-semibold text-gray-900";
      blocks.push(
        <p key={`h-${blocks.length}`} className={cls}>
          {inline(h[2], `h-${blocks.length}`)}
        </p>,
      );
    } else if (b) {
      if (numbered.length > 0 || para.length > 0) flush();
      bullets.push(b[1]);
    } else if (o) {
      if (bullets.length > 0 || para.length > 0) flush();
      numbered.push(o[1]);
    } else if (t === "") {
      flush();
    } else {
      if (bullets.length > 0 || numbered.length > 0) flush();
      para.push(t);
    }
  }
  flush();
  return <div className="space-y-2">{blocks}</div>;
}
