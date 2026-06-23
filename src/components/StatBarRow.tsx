interface StatBarRowProps {
  label: string;
  note: string | number;
  frac: number;
  variant?: 'lime' | 'gold';
}

export function StatBarRow({ label, note, frac, variant = 'lime' }: StatBarRowProps) {
  const pct = Math.min(100, Math.max(0, Math.round(frac * 100)));

  return (
    <div className="dl-statbar">
      <div className="dl-statbar-head">
        <span className="dl-statbar-label">{label}</span>
        <span className="dl-statbar-note">{note}</span>
      </div>
      <div className={`dl-statbar-track is-${variant}`}>
        <div className="dl-statbar-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
