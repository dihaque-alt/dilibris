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
  const barMaxH = 72;

  return (
    <div className="dl-month-dual-bars">
      <div className="dl-month-dual-legend">
        <span>
          <i className="is-books" aria-hidden="true" /> Книги
        </span>
        <span>
          <i className="is-pages" aria-hidden="true" /> Сторінки
        </span>
      </div>
      <div className="dl-month-chart is-dual" role="img" aria-label="Книги та сторінки за місяцями">
        {data.map(({ month, books, pages }) => (
          <div key={month} className="dl-month-col">
            <div className="dl-month-bar-stack is-dual">
              <div className="dl-month-dual-pair">
                <div className="dl-month-dual-item">
                  {books > 0 && <span className="dl-month-bar-value">{books}</span>}
                  <div
                    className="dl-bar is-books"
                    style={{
                      height: Math.max(books > 0 ? 6 : 3, (books / maxBooks) * barMaxH),
                    }}
                  />
                </div>
                <div className="dl-month-dual-item">
                  {pages > 0 && <span className="dl-month-bar-value">{formatPagesLabel(pages)}</span>}
                  <div
                    className="dl-bar is-pages"
                    style={{
                      height: Math.max(pages > 0 ? 6 : 3, (pages / maxPages) * barMaxH),
                    }}
                  />
                </div>
              </div>
            </div>
            <span className="dl-month-label">{MONTH_NAMES_UK[month - 1]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
