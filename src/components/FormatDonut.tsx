interface FormatDonutProps {
  paper: number;
  ebook: number;
  unknown?: number;
}

export function FormatDonut({ paper, ebook, unknown = 0 }: FormatDonutProps) {
  const total = paper + ebook + unknown;
  if (total === 0) {
    return <p className="empty-hint">Поки немає даних за цей рік.</p>;
  }

  const paperPct = Math.round((paper / total) * 100);
  const ebookStart = paperPct;
  const ebookPct = Math.round((ebook / total) * 100);

  const gradient =
    unknown > 0
      ? `conic-gradient(var(--accent-lime) 0 ${paperPct}%, var(--status-done) ${paperPct}% ${ebookStart + ebookPct}%, var(--line) ${ebookStart + ebookPct}% 100%)`
      : `conic-gradient(var(--accent-lime) 0 ${paperPct}%, var(--status-done) ${paperPct}% 100%)`;

  return (
    <div className="dl-format-donut">
      <div className="dl-format-donut-ring" style={{ background: gradient }}>
        <div className="dl-format-donut-center">{total}</div>
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
