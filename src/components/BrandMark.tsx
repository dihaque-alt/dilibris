export function BrandMark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect x="3" y="5" width="26" height="22" rx="5" fill="var(--accent-lime)" />
      <rect x="3" y="5" width="13" height="22" rx="5" fill="var(--accent-lime-deep)" />
      <rect x="14.5" y="7" width="3" height="18" rx="1.5" fill="var(--bg-room)" />
      <circle cx="9.5" cy="16" r="2" fill="var(--gold-highlight)" />
    </svg>
  );
}
