import { useState } from 'react';
import { MONTH_NAMES_UK, monthMetricBarTitle, type MonthMetric } from '../lib/stats';

interface MonthChartProps {
  data: { month: number; value: number }[];
  metric: MonthMetric;
}

export function MonthChart({ data, metric }: MonthChartProps) {
  const [activeMonth, setActiveMonth] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <div className="dl-month-chart" role="img" aria-label="Графік за місяцями">
      {data.map(({ month, value }) => {
        const isActive = activeMonth === month;
        return (
          <div
            key={month}
            className={`dl-month-col${isActive ? ' is-active' : ''}`}
            onMouseEnter={() => setActiveMonth(month)}
            onMouseLeave={() => setActiveMonth(null)}
            onClick={() => setActiveMonth((current) => (current === month ? null : month))}
            onFocus={() => setActiveMonth(month)}
            onBlur={() => setActiveMonth(null)}
          >
            <div className="dl-month-bar-stack">
              {isActive && (
                <span className="dl-month-hover-value">{monthMetricBarTitle(metric, value)}</span>
              )}
              <div
                className="dl-bar"
                tabIndex={0}
                role="graphics-symbol"
                aria-label={`${MONTH_NAMES_UK[month - 1]}: ${monthMetricBarTitle(metric, value)}`}
                style={{
                  width: '100%',
                  maxWidth: 34,
                  height: Math.max(5, (value / max) * 122),
                  background: value
                    ? 'linear-gradient(180deg, var(--accent-lime), var(--accent-lime-deep))'
                    : 'var(--line)',
                }}
              />
            </div>
            <span className="dl-month-label">{MONTH_NAMES_UK[month - 1]}</span>
          </div>
        );
      })}
    </div>
  );
}
