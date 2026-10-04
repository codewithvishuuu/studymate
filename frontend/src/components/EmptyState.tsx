import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export default function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <section aria-label={title} className="mx-auto max-w-md rounded-xl border border-stone-200 bg-white px-8 py-12 text-center">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      <p className="mt-2 text-sm text-gray-600">{body}</p>
      {action && <div className="mt-6">{action}</div>}
    </section>
  );
}

export function CtaLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="inline-block rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
    >
      {children}
    </Link>
  );
}
