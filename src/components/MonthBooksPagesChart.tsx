import { useMemo } from 'react';
import { MONTH_NAMES_UK } from '../lib/stats';

interface MonthBooksPagesChartProps {
  data: { month: number; books: number; pages: number }[];
}

function formatPagesLabel(pages: number): string {
  if (pages >= 1000) return `${(pages / 1000).toFixed(pages >= 10000 ? 0 : 1).replace('.0', '')}k`;
  return String(pages);
}

function seriesPoints(
  data: { month: number; books: number; pages: number }[],
  key: 'books' | 'pages',
  max: number,
): string {
  const n = data.length;
  if (n === 0) return '';

  return data
    .map((row, i) => {
      const x = ((i + 0.5) / n) * 100;
      const y = 94 - (row[key] / max) * 82;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
}

export function MonthBooksPagesChart({ data }: MonthBooksPagesChartProps) {
  const maxBooks = Math.max(1, ...data.map((d) => d.books));
  const maxPages = Math.max(1, ...data.map((d) => d.pages));
  const hasPages = data.some((d) => d.pages > 0);

  const booksPolyline = useMemo(
    () => seriesPoints(data, 'books', maxBooks),
    [data, maxBooks],
  );
  const pagesPolyline = useMemo(
    () => (hasPages ? seriesPoints(data, 'pages', maxPages) : ''),
    [data, maxPages, hasPages],
  );

  return (
    <div className="dl-month-dual-line">
      <div className="dl-month-dual-legend">
        <span>
          <i className="is-books" aria-hidden="true" /> Книги
        </span>
        {hasPages && (
          <span>
            <i className="is-pages" aria-hidden="true" /> Сторінки
          </span>
        )}
      </div>

      <div className="dl-month-dual-plot">
        <svg
          className="dl-month-dual-lines"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <line x1="0" y1="94" x2="100" y2="94" className="dl-month-dual-axis" />
          <polyline points={booksPolyline} className="dl-month-dual-line-path is-books" fill="none" />
          {hasPages && (
            <polyline points={pagesPolyline} className="dl-month-dual-line-path is-pages" fill="none" />
          )}
        </svg>

        <div className="dl-month-dual-cols">
          {data.map((row) => (
            <div key={row.month} className="dl-month-dual-col">
              <div className="dl-month-dual-col-plot">
                {row.books > 0 && (
                  <span
                    className="dl-month-dual-dot is-books"
                    style={{ bottom: `calc(6% + ${(row.books / maxBooks) * 82}%)` }}
                  />
                )}
                {hasPages && row.pages > 0 && (
                  <span
                    className="dl-month-dual-dot is-pages"
                    style={{ bottom: `calc(6% + ${(row.pages / maxPages) * 82}%)` }}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="dl-month-dual-values">
        {data.map((row) => (
          <div key={row.month} className="dl-month-dual-value-col">
            {row.books > 0 && <span className="dl-month-dual-value is-books">{row.books}</span>}
            {hasPages && row.pages > 0 && (
              <span className="dl-month-dual-value is-pages">{formatPagesLabel(row.pages)}</span>
            )}
          </div>
        ))}
      </div>

      <div className="dl-month-dual-months">
        {data.map((row) => (
          <span key={row.month}>{MONTH_NAMES_UK[row.month - 1]}</span>
        ))}
      </div>
    </div>
  );
}
