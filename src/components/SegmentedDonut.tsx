interface SegmentedDonutProps {
  segments: Array<{ count: number; color: string; label: string }>;
  centerValue?: number;
  centerLabel?: string;
}

export function SegmentedDonut({ segments, centerValue, centerLabel }: SegmentedDonutProps) {
  const active = segments.filter((s) => s.count > 0);
  const total = active.reduce((sum, s) => sum + s.count, 0);

  if (total === 0) {
    return <p className="empty-hint">Поки немає даних за цей рік</p>;
  }

  let cursor = 0;
  const stops = active.map((s) => {
    const pct = Math.round((s.count / total) * 100);
    const start = cursor;
    cursor += pct;
    return `${s.color} ${start}% ${cursor}%`;
  });
  const gradient = `conic-gradient(${stops.join(', ')})`;
  const center = centerValue ?? total;

  return (
    <div className="dl-format-donut">
      <div className="dl-format-donut-ring" style={{ background: gradient }}>
        <div className="dl-format-donut-center">
          {center}
          {centerLabel && <span className="dl-format-donut-center-sub">{centerLabel}</span>}
        </div>
      </div>
      <div className="dl-format-donut-legend">
        {active.map((s) => (
          <span key={s.label}>
            <i style={{ background: s.color }} />
            {s.label} · <b>{s.count}</b>
          </span>
        ))}
      </div>
    </div>
  );
}
