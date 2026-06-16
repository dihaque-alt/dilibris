/** Dashed empty shelf illustration from design-handoff EmptyRoom. */
export function EmptyShelfGlyph({ width = 120, height = 80 }: { width?: number; height?: number }) {
  return (
    <svg
      viewBox="0 0 120 80"
      width={width}
      height={height}
      aria-hidden="true"
      className="dl-empty-glyph"
    >
      <rect x="10" y="40" width="100" height="10" rx="2" fill="var(--wood-main)" />
      <rect x="10" y="40" width="100" height="3" fill="var(--wood-light)" />
      <rect x="14" y="50" width="6" height="14" fill="var(--wood-depth)" />
      <rect x="100" y="50" width="6" height="14" fill="var(--wood-depth)" />
      <rect
        x="34"
        y="20"
        width="14"
        height="20"
        rx="2"
        fill="none"
        stroke="var(--ink-room-faint)"
        strokeWidth="2"
        strokeDasharray="3 4"
      />
      <rect
        x="53"
        y="20"
        width="14"
        height="20"
        rx="2"
        fill="none"
        stroke="var(--ink-room-faint)"
        strokeWidth="2"
        strokeDasharray="3 4"
      />
      <rect
        x="72"
        y="20"
        width="14"
        height="20"
        rx="2"
        fill="none"
        stroke="var(--ink-room-faint)"
        strokeWidth="2"
        strokeDasharray="3 4"
      />
    </svg>
  );
}

interface EmptyShelfButtonProps {
  onClick: () => void;
  label?: string;
  sublabel?: string;
}

export function EmptyShelfButton({
  onClick,
  label = 'Порожня полиця',
  sublabel = 'Додай першу книгу',
}: EmptyShelfButtonProps) {
  return (
    <button type="button" className="dl-empty dl-empty-btn" onClick={onClick}>
      <EmptyShelfGlyph width={108} height={72} />
      <span className="dl-empty-label">{label}</span>
      {sublabel && <span className="dl-empty-sublabel">{sublabel}</span>}
    </button>
  );
}
