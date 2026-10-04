export function StudyMark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect x="1.5" y="1.5" width="29" height="29" rx="8" fill="#17171A" />
      {/* open-book spine */}
      <path d="M16 8.5v15" stroke="#F8F8F6" strokeWidth="1.6" strokeLinecap="round" />
      {/* learning path: two page-curves rising to the right */}
      <path
        d="M16 11.5c-2.8-2-5.6-2.4-8-1.6v11.6c2.4-.8 5.2-.4 8 1.6 2.8-2 5.6-2.4 8-1.6V9.9c-2.4-.8-5.2-.4-8 1.6Z"
        stroke="#F8F8F6"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="22.6" cy="22.4" r="2.1" fill="#5146E5" />
    </svg>
  );
}

export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <StudyMark size={compact ? 26 : 30} />
      <span className="leading-none">
        <span className="block text-[15px] font-bold tracking-tight text-ink">StudyMate</span>
        {!compact && (
          <span className="mt-0.5 block text-[11px] font-medium tracking-wide text-muted">
            Your personal study workspace
          </span>
        )}
      </span>
    </span>
  );
}
