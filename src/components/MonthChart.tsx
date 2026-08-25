import { MONTH_NAMES_UK, monthMetricBarTitle, type MonthMetric } from '../lib/stats';

interface MonthChartProps {
  data: { month: number; value: number }[];
  metric: MonthMetric;
}

export function MonthChart({ data, metric }: MonthChartProps) {
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <div className="dl-month-chart" role="img" aria-label="Графік за місяцями">
      {data.map(({ month, value }) => (
        <div key={month} className="dl-month-col">
          <div className="dl-month-bar-stack">
            {value > 0 && (
              <span className="dl-month-bar-value">{monthMetricBarTitle(metric, value)}</span>
            )}
            <div
              className="dl-bar"
              style={{
                width: '100%',
                maxWidth: 34,
                height: Math.max(value > 0 ? 6 : 3, (value / max) * 122),
                background: value
                  ? 'linear-gradient(180deg, var(--accent-lime), var(--accent-lime-deep))'
                  : 'var(--line)',
              }}
              aria-label={`${MONTH_NAMES_UK[month - 1]}: ${monthMetricBarTitle(metric, value)}`}
            />
          </div>
          <span className="dl-month-label">{MONTH_NAMES_UK[month - 1]}</span>
        </div>
      ))}
    </div>
  );
}
