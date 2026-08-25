import { useMemo } from 'react';
import { MONTH_NAMES_UK } from '../lib/stats';

interface MonthBooksPagesChartProps {
  data: { month: number; books: number; pages: number }[];
}

function formatPagesLabel(pages: number): string {
  if (pages >= 1000) return `${(pages / 1000).toFixed(pages >= 10000 ? 0 : 1).replace('.0', '')}k`;
  return String(pages);
}

export function MonthBooksPagesChart({ data }: MonthBooksPagesChartProps) {
  const maxBooks = Math.max(1, ...data.map((d) => d.books));
  const maxPages = Math.max(1, ...data.map((d) => d.pages));

  const layout = useMemo(() => {
    const w = 360;
    const h = 88;
    const pad = { t: 16, r: 4, b: 4, l: 4 };
    const innerW = w - pad.l - pad.r;
    const innerH = h - pad.t - pad.b;

    const points = data.map((row, i) => {
      const x = pad.l + (i / Math.max(1, data.length - 1)) * innerW;
      const yBooks = pad.t + innerH - (row.books / maxBooks) * innerH;
      const yPages = pad.t + innerH - (row.pages / maxPages) * innerH;
      return { ...row, x, yBooks, yPages };
    });

    return { w, h, pad, innerH, points };
  }, [data, maxBooks, maxPages]);

  const booksPath = layout.points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.yBooks.toFixed(1)}`)
    .join(' ');
  const pagesPath = layout.points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.yPages.toFixed(1)}`)
    .join(' ');

  const baselineY = layout.pad.t + layout.innerH;

  return (
    <div className="dl-month-dual-line">
      <div className="dl-month-dual-legend">
        <span>
          <i className="is-books" aria-hidden="true" /> Книги
        </span>
        <span>
          <i className="is-pages" aria-hidden="true" /> Сторінки
        </span>
      </div>
      <svg
        className="dl-month-dual-svg"
        viewBox={`0 0 ${layout.w} ${layout.h}`}
        role="img"
        aria-label="Книги та сторінки за місяцями"
      >
        <line
          x1={layout.pad.l}
          y1={baselineY}
          x2={layout.w - layout.pad.r}
          y2={baselineY}
          className="dl-month-dual-axis"
        />
        <path d={booksPath} className="dl-month-dual-line-path is-books" fill="none" />
        <path d={pagesPath} className="dl-month-dual-line-path is-pages" fill="none" />
        {layout.points.map((p) => (
          <g key={p.month}>
            {p.books > 0 && (
              <>
                <text x={p.x} y={p.yBooks - 5} className="dl-month-dual-value is-books">
                  {p.books}
                </text>
                <circle cx={p.x} cy={p.yBooks} r={3} className="dl-month-dual-dot is-books" />
              </>
            )}
            {p.pages > 0 && (
              <>
                <text x={p.x} y={p.yPages - 5} className="dl-month-dual-value is-pages">
                  {formatPagesLabel(p.pages)}
                </text>
                <circle cx={p.x} cy={p.yPages} r={3} className="dl-month-dual-dot is-pages" />
              </>
            )}
          </g>
        ))}
      </svg>
      <div className="dl-month-dual-months">
        {data.map((row) => (
          <span key={row.month}>{MONTH_NAMES_UK[row.month - 1]}</span>
        ))}
      </div>
    </div>
  );
}
