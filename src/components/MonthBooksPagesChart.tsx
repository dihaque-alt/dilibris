import { useMemo, useState } from 'react';
import { MONTH_NAMES_UK } from '../lib/stats';

interface MonthBooksPagesChartProps {
  data: { month: number; books: number; pages: number }[];
  totalBooks: number;
  totalPages: number;
}

export function MonthBooksPagesChart({ data, totalBooks, totalPages }: MonthBooksPagesChartProps) {
  const [activeMonth, setActiveMonth] = useState<number | null>(null);

  const maxBooks = Math.max(1, ...data.map((d) => d.books));
  const maxPages = Math.max(1, ...data.map((d) => d.pages));

  const points = useMemo(() => {
    const w = 320;
    const h = 118;
    const pad = { t: 12, r: 8, b: 4, l: 8 };
    const innerW = w - pad.l - pad.r;
    const innerH = h - pad.t - pad.b;

    return data.map((row, i) => {
      const x = pad.l + (i / Math.max(1, data.length - 1)) * innerW;
      const yBooks = pad.t + innerH - (row.books / maxBooks) * innerH;
      const yPages = pad.t + innerH - (row.pages / maxPages) * innerH;
      return { ...row, x, yBooks, yPages };
    });
  }, [data, maxBooks, maxPages]);

  const booksPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.yBooks}`).join(' ');
  const pagesPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.yPages}`).join(' ');

  const active = activeMonth != null ? points.find((p) => p.month === activeMonth) : null;

  return (
    <div className="dl-month-dual">
      <p className="dl-month-dual-summary">
        {totalBooks} {totalBooks === 1 ? 'книга' : totalBooks < 5 ? 'книги' : 'книг'},{' '}
        {totalPages.toLocaleString('uk-UA')} сторінок
      </p>
      <div className="dl-month-dual-legend">
        <span>
          <i className="is-books" /> Книги
        </span>
        <span>
          <i className="is-pages" /> Сторінки
        </span>
      </div>
      <div className="dl-month-dual-chart-wrap">
        {active && (
          <div className="dl-month-dual-popover">
            <strong>{MONTH_NAMES_UK[active.month - 1]}</strong>
            <span>
              {active.books} {active.books === 1 ? 'книга' : active.books < 5 ? 'книги' : 'книг'}
            </span>
            <span>{active.pages.toLocaleString('uk-UA')} стор.</span>
          </div>
        )}
        <svg
          className="dl-month-dual-chart"
          viewBox="0 0 320 118"
          role="img"
          aria-label="Книги та сторінки за місяцями"
        >
          {points.map((p) => (
            <g
              key={p.month}
              onMouseEnter={() => setActiveMonth(p.month)}
              onMouseLeave={() => setActiveMonth(null)}
              onClick={() => setActiveMonth((current) => (current === p.month ? null : p.month))}
            >
              <rect
                x={p.x - 14}
                y={0}
                width={28}
                height={118}
                fill="transparent"
              />
              <circle
                cx={p.x}
                cy={p.yBooks}
                r={activeMonth === p.month ? 5 : 3.5}
                className="dl-month-dual-dot is-books"
              />
              <circle
                cx={p.x}
                cy={p.yPages}
                r={activeMonth === p.month ? 5 : 3.5}
                className="dl-month-dual-dot is-pages"
              />
            </g>
          ))}
          <path d={booksPath} className="dl-month-dual-line is-books" fill="none" />
          <path d={pagesPath} className="dl-month-dual-line is-pages" fill="none" />
        </svg>
        <div className="dl-month-dual-months">
          {data.map((row) => (
            <span key={row.month}>{MONTH_NAMES_UK[row.month - 1]}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
