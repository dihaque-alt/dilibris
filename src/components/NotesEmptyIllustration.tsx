/** Open book with margin lines — notes feed empty state. */
export function NotesEmptyIllustration() {
  return (
    <svg
      viewBox="0 0 120 96"
      width={120}
      height={96}
      aria-hidden="true"
      className="notes-empty-glyph"
    >
      <path
        d="M18 22c0-2 14-6 42-6v58c-28 0-42 4-42 4V22z"
        fill="var(--bg-card-soft)"
        stroke="var(--ink-room-faint)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M60 16c28 0 42 4 42 4v58s-14 4-42 4V16z"
        fill="var(--bg-card)"
        stroke="var(--ink-room-faint)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M60 16v58" stroke="var(--wood-main)" strokeWidth="2" strokeLinecap="round" />
      <line x1="26" y1="36" x2="50" y2="36" stroke="var(--accent-lime)" strokeWidth="2" strokeLinecap="round" opacity="0.55" />
      <line x1="26" y1="44" x2="46" y2="44" stroke="var(--text-faint)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="26" y1="52" x2="48" y2="52" stroke="var(--text-faint)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="70" y1="36" x2="94" y2="36" stroke="var(--gold-deep)" strokeWidth="2" strokeLinecap="round" opacity="0.45" />
      <line x1="70" y1="44" x2="90" y2="44" stroke="var(--text-faint)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="70" y1="52" x2="92" y2="52" stroke="var(--text-faint)" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M88 68l14 8-3 5-14-8 3-5z"
        fill="var(--status-want-bg)"
        stroke="var(--status-want)"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
      <path d="M88 68l8 12" stroke="var(--status-want)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
