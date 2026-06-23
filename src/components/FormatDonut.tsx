interface FormatDonutProps {
  paper: number;
  ebook: number;
  audiobook?: number;
  unknown?: number;
  /** Center label — prototype shows finished book count. */
  centerValue?: number;
}

export function FormatDonut({
  paper,
  ebook,
  audiobook = 0,
  unknown = 0,
  centerValue,
}: FormatDonutProps) {
  const total = paper + ebook + audiobook + unknown;
  if (total === 0) {
    return <p className="empty-hint">Поки немає даних за цей рік.</p>;
  }

  const segments = [
    { count: paper, color: 'var(--accent-lime)' },
    { count: ebook, color: 'var(--status-done)' },
    { count: audiobook, color: 'var(--gold-deep)' },
    { count: unknown, color: 'var(--line)' },
  ].filter((s) => s.count > 0);

  let cursor = 0;
  const stops = segments.map((s) => {
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
        <div className="dl-format-donut-center">{center}</div>
      </div>
      <div className="dl-format-donut-legend">
        {paper > 0 && (
          <span>
            <i className="is-paper" />
            Паперова · <b>{paper}</b>
          </span>
        )}
        {ebook > 0 && (
          <span>
            <i className="is-ebook" />
            Електронна · <b>{ebook}</b>
          </span>
        )}
        {audiobook > 0 && (
          <span>
            <i className="is-audiobook" />
            Аудіо · <b>{audiobook}</b>
          </span>
        )}
        {unknown > 0 && (
          <span>
            <i className="is-unknown" />
            Не вказано · <b>{unknown}</b>
          </span>
        )}
      </div>
    </div>
  );
}
