import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { AppNav } from '../components/AppNav';
import { ChallengeBar } from '../components/ChallengeBar';
import { FormatDonut } from '../components/FormatDonut';
import { PageHead } from '../components/PageHead';
import { RoomBackdrop } from '../components/RoomBackdrop';
import { SegmentedDonut } from '../components/SegmentedDonut';
import { StatBarRow } from '../components/StatBarRow';
import { useIsMobile } from '../hooks/useIsMobile';
import { useOfflinePageDetail } from '../components/OfflineProvider';
import { formatDateTimeUk } from '../lib/dates';
import { fetchDashboardData } from '../lib/offline/dashboardSync';
import { isOnline } from '../lib/offline/db';
import { supabase } from '../lib/supabase';
import {
  availableYears,
  averageDaysToFinish,
  averageRating,
  bookLengthBreakdown,
  booksByYear,
  finishedInYear,
  formatBreakdown,
  formatDaysToFinish,
  languageBreakdown,
  longestBreakDays,
  MONTH_NAMES_UK,
  monthSeriesFromBooks,
  monthSeriesFromSessions,
  ratingBreakdown,
  topAuthors,
  totalMinutesRead,
  totalPagesRead,
  type MonthMetric,
  type SessionMonthRow,
  type StatsEntry,
} from '../lib/stats';
import { formatMinutes, formatStarRating } from '../lib/rating';
import type { ReadingChallenge } from '../types/database';
import '../styles/library.css';
import '../styles/screens-ui.css';

interface DashboardPageProps {
  userId: string;
  userEmail: string;
}

function challengeHint(finished: number, target: number, year: number): string {
  if (target <= 0) return 'Задай ціль на рік — і відстежуй прогрес без тиску.';
  const start = new Date(year, 0, 1);
  const now = new Date();
  const dayOfYear = Math.max(1, Math.floor((now.getTime() - start.getTime()) / 86400000) + 1);
  const daysInYear = (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) ? 366 : 365;
  const expected = Math.round((target * dayOfYear) / daysInYear);
  const diff = finished - expected;
  if (diff > 0) return `Ти на ${diff} ${diff === 1 ? 'книгу' : 'книги'} попереду графіка — так тримати`;
  if (diff < 0) return `Ще ${Math.abs(diff)} ${Math.abs(diff) === 1 ? 'книга' : 'книг'} до комфортного темпу — без поспіху`;
  return 'Тримаєш ідеальний темп — продовжуй у своєму ритмі';
}

function MonthChart({ data }: { data: { month: number; value: number }[]; metric: MonthMetric }) {
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <div className="dl-month-chart">
      {data.map(({ month, value }) => (
        <div key={month} className="dl-month-col">
          <div
            className="dl-bar"
            style={{
              width: '100%',
              maxWidth: 34,
              height: Math.max(5, (value / max) * 122),
              background: value
                ? 'linear-gradient(180deg, var(--accent-lime), var(--accent-lime-deep))'
                : 'var(--line)',
            }}
          />
          <span className="dl-month-label">{MONTH_NAMES_UK[month - 1]}</span>
        </div>
      ))}
    </div>
  );
}

function MonthMetricPicker({
  value,
  onChange,
}: {
  value: MonthMetric;
  onChange: (metric: MonthMetric) => void;
}) {
  const options: [MonthMetric, string][] = [
    ['books', 'Книги'],
    ['pages', 'Сторінки'],
    ['minutes', 'Час'],
  ];

  return (
    <div className="dl-settings-segments dl-month-metric" role="group" aria-label="Метрика графіка">
      {options.map(([key, label]) => (
        <button
          key={key}
          type="button"
          className={value === key ? 'is-active' : ''}
          onClick={() => onChange(key)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function DashboardPage({ userId, userEmail }: DashboardPageProps) {
  const wide = !useIsMobile(860);
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [entries, setEntries] = useState<StatsEntry[]>([]);
  const [sessions, setSessions] = useState<SessionMonthRow[]>([]);
  const [challenges, setChallenges] = useState<ReadingChallenge[]>([]);
  const [monthMetric, setMonthMetric] = useState<MonthMetric>('books');
  const [fromCache, setFromCache] = useState(false);
  const [cachedAt, setCachedAt] = useState<string | null>(null);
  const [targetBooks, setTargetBooks] = useState('12');
  const [loading, setLoading] = useState(true);
  const [savingChallenge, setSavingChallenge] = useState(false);
  const [editChallengeTarget, setEditChallengeTarget] = useState(false);
  const [error, setError] = useState('');

  const staleDetail =
    fromCache && cachedAt && isOnline()
      ? `Дані станом на ${formatDateTimeUk(cachedAt)}`
      : null;
  useOfflinePageDetail(staleDetail);

  const challenge = useMemo(
    () => challenges.find((c) => c.year === selectedYear) ?? null,
    [challenges, selectedYear],
  );

  const loadData = useCallback(async () => {
    const data = await fetchDashboardData(userId);
    setEntries(data.entries);
    setSessions(data.sessions);
    setChallenges(data.challenges);
    setFromCache(data.fromCache);
    setCachedAt(data.cachedAt);
  }, [userId]);

  useEffect(() => {
    setLoading(true);
    setError('');
    loadData()
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Не вдалося завантажити читацьку статистику');
      })
      .finally(() => setLoading(false));
  }, [loadData]);

  useEffect(() => {
    if (challenge) {
      setTargetBooks(String(challenge.target_books));
    } else {
      setTargetBooks('12');
    }
    setEditChallengeTarget(false);
  }, [challenge, selectedYear]);

  const yearOptions = availableYears(entries);
  const finishedThisYear = finishedInYear(entries, selectedYear);
  const finishedCount = finishedThisYear.length;
  const target = challenge?.target_books ?? (parseInt(targetBooks, 10) || 0);
  const challengePct = target > 0 ? Math.min(100, Math.round((finishedCount / target) * 100)) : 0;
  const avgRating = averageRating(entries, selectedYear);
  const pages = totalPagesRead(entries, selectedYear);
  const minutes = totalMinutesRead(entries, selectedYear);
  const monthData =
    monthMetric === 'books'
      ? monthSeriesFromBooks(entries, selectedYear)
      : monthSeriesFromSessions(sessions, selectedYear, monthMetric);
  const monthChartEmpty =
    monthMetric === 'books'
      ? finishedCount === 0
      : monthData.every((row) => row.value === 0);
  const monthPanelTitle =
    monthMetric === 'books'
      ? 'Книги за місяць'
      : monthMetric === 'pages'
        ? 'Сторінки за місяць'
        : 'Час за місяць';
  const monthEmptyHint =
    monthMetric === 'books'
      ? 'Познач книги як «Прочитано», щоб побачити статистику'
      : 'Записуй сесії читання, щоб побачити статистику';
  const formats = formatBreakdown(entries, selectedYear);
  const authors = topAuthors(entries, selectedYear, 4);
  const languages = languageBreakdown(entries, selectedYear);
  const breakDays = longestBreakDays(entries);
  const yearly = booksByYear(entries);
  const langTotal = languages.reduce((sum, l) => sum + l.count, 0);
  const maxAuthor = authors[0]?.count ?? 1;
  const ratings = ratingBreakdown(entries, selectedYear);
  const maxRating = ratings[0]?.count ?? 1;
  const lengths = bookLengthBreakdown(entries, selectedYear);
  const avgFinishDays = averageDaysToFinish(entries, selectedYear);
  const hoursRead =
    minutes >= 60 ? `${(minutes / 60).toFixed(minutes >= 600 ? 0 : 1).replace('.0', '')} год` : `${minutes} хв`;

  const stats = [
    [String(finishedCount), 'книг'],
    [pages.toLocaleString('uk-UA'), 'сторінок'],
    [formatMinutes(minutes), 'часу'],
    [avgRating != null ? formatStarRating(Math.round(avgRating * 2) / 2) : '—', 'середня оцінка'],
    ...(avgFinishDays != null ? [[formatDaysToFinish(avgFinishDays), 'на книгу']] : []),
    ...(breakDays != null ? [[`${breakDays} днів`, 'найдовша пауза']] : []),
  ] as const;

  async function handleSaveChallenge(e: FormEvent) {
    e.preventDefault();
    if (!isOnline()) {
      setError('Зберегти ціль можна лише з підключенням до інтернету.');
      return;
    }

    const parsed = parseInt(targetBooks, 10);
    if (!Number.isFinite(parsed) || parsed < 0) {
      setError('Ціль має бути числом від 0');
      return;
    }

    setSavingChallenge(true);
    setError('');

    const payload = {
      user_id: userId,
      year: selectedYear,
      title: `Challenge ${selectedYear}`,
      target_books: parsed,
    };

    const { data, error: saveError } = challenge
      ? await supabase
          .from('reading_challenges')
          .update({ target_books: parsed })
          .eq('id', challenge.id)
          .select()
          .single()
      : await supabase.from('reading_challenges').insert(payload).select().single();

    if (saveError) {
      setError(saveError.message);
      setSavingChallenge(false);
      return;
    }

    setChallenges((prev) => {
      const rest = prev.filter((c) => c.year !== selectedYear);
      return [...rest, data as ReadingChallenge];
    });
    await loadData();
    setSavingChallenge(false);
  }

  if (loading) {
    return (
      <div className="app-shell">
        <RoomBackdrop />
        <AppNav userEmail={userEmail} userId={userId} active="dashboard" />
        <div className="center-page" style={{ color: 'var(--ink-room-soft)' }}>
          Завантажуємо статистику…
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <RoomBackdrop />
      <AppNav userEmail={userEmail} userId={userId} active="dashboard" />

      <main className="dl-page dashboard-page">
        <PageHead
          eyebrow="Твій читацький рік"
          title="Статистика"
          sub="Книги, сторінки, час і оцінки — усі підсумки року"
        >
          <label className="dl-year-pill">
            Рік
            <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <span className="dl-year-pill-chevron" aria-hidden="true">
              ▾
            </span>
          </label>
        </PageHead>

        {error && <p className="banner-error">{error}</p>}

        {finishedCount > 0 && (
          <p className="dl-stats-overview">
            {finishedCount} {finishedCount === 1 ? 'книга' : finishedCount < 5 ? 'книги' : 'книг'}
            {' · '}
            {pages.toLocaleString('uk-UA')} сторінок
            {minutes > 0 && (
              <>
                {' · '}
                {hoursRead}
              </>
            )}
          </p>
        )}

        <section className="dl-panel dl-challenge">
          <div className="dl-challenge-head">
            <div>
              <div className="dl-challenge-kicker">Челендж {selectedYear}</div>
              <div className="dl-challenge-title">
                {finishedCount} з {target > 0 ? target : '—'} книг
              </div>
            </div>
            {target > 0 && <div className="dl-challenge-pct">{challengePct}%</div>}
          </div>
          {target > 0 && <ChallengeBar value={finishedCount} target={target} height={16} />}
          <div className="dl-challenge-foot">
            <span className="dl-challenge-foot-star" aria-hidden="true">
              ✦
            </span>
            {challengeHint(finishedCount, target, selectedYear)}
          </div>
          <div className="dl-challenge-edit-wrap">
            <button
              type="button"
              className="dl-challenge-edit-toggle"
              onClick={() => setEditChallengeTarget((open) => !open)}
            >
              {editChallengeTarget ? 'Сховати' : 'Змінити ціль'}
            </button>
            {editChallengeTarget && (
              <form className="dl-challenge-edit" onSubmit={handleSaveChallenge}>
                <label>
                  Ціль на рік
                  <input
                    type="number"
                    min={0}
                    value={targetBooks}
                    onChange={(e) => setTargetBooks(e.target.value)}
                  />
                </label>
                <button type="submit" className="dl-ghost" disabled={savingChallenge || !isOnline()}>
                  {savingChallenge ? 'Зберігаємо…' : 'Зберегти ціль'}
                </button>
              </form>
            )}
          </div>
        </section>

        <div className={`dl-stat-grid${wide ? ' is-wide' : ''}`}>
          {stats.map(([value, label]) => (
            <section key={label} className="dl-panel is-soft dl-stat-card">
              <div className="dl-stat-card-value">{value}</div>
              <div className="dl-stat-card-label">{label}</div>
            </section>
          ))}
        </div>

        <div className="dl-dash-row is-chart-format">
          <section className="dl-panel">
            <h2 className="dl-panel-title">{monthPanelTitle}</h2>
            <MonthMetricPicker value={monthMetric} onChange={setMonthMetric} />
            {monthChartEmpty ? (
              <p className="empty-hint">{monthEmptyHint}</p>
            ) : (
              <MonthChart data={monthData} metric={monthMetric} />
            )}
          </section>

          <section className="dl-panel">
            <h2 className="dl-panel-title">Формат</h2>
            <FormatDonut
              paper={formats.paper}
              ebook={formats.ebook}
              audiobook={formats.audiobook}
              unknown={formats.unknown}
              centerValue={finishedCount}
            />
          </section>
        </div>

        <div className="dl-dash-row is-length-ratings">
          <section className="dl-panel">
            <h2 className="dl-panel-title">Обсяг книг</h2>
            <SegmentedDonut
              centerValue={finishedCount}
              segments={[
                { count: lengths.short, color: 'var(--accent-lime)', label: '< 300 стор.' },
                { count: lengths.medium, color: 'var(--status-done)', label: '300–499' },
                { count: lengths.long, color: 'var(--gold-deep)', label: '500+' },
                { count: lengths.unknown, color: 'var(--line)', label: 'Невідомо' },
              ]}
            />
          </section>

          <section className="dl-panel">
            <h2 className="dl-panel-title">Оцінки</h2>
            {ratings.length === 0 ? (
              <p className="empty-hint">Постав оцінки прочитаним книгам — побачиш розподіл</p>
            ) : (
              <div className="dl-statbar-list">
                {ratings.map((row) => (
                  <StatBarRow
                    key={row.rating}
                    label={formatStarRating(row.rating)}
                    note={row.count}
                    frac={row.count / maxRating}
                    variant="gold"
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="dl-dash-row is-authors-langs">
          <section className="dl-panel">
            <h2 className="dl-panel-title">Топ авторів</h2>
            {authors.length === 0 ? (
              <p className="empty-hint">Поки немає даних за цей рік</p>
            ) : (
              <div className="dl-statbar-list">
                {authors.map((a) => (
                  <StatBarRow
                    key={a.author}
                    label={a.author}
                    note={a.count}
                    frac={a.count / maxAuthor}
                    variant="lime"
                  />
                ))}
              </div>
            )}
          </section>

          <section className="dl-panel">
            <h2 className="dl-panel-title">Мови</h2>
            {languages.length === 0 ? (
              <p className="empty-hint">Поки немає даних за цей рік</p>
            ) : (
              <div className="dl-statbar-list">
                {languages.map((l) => (
                  <StatBarRow
                    key={l.language}
                    label={l.language}
                    note={`${langTotal > 0 ? Math.round((l.count / langTotal) * 100) : 0}%`}
                    frac={langTotal > 0 ? l.count / langTotal : 0}
                    variant="gold"
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        {yearly.length > 1 && (
          <section className="dl-panel" style={{ marginTop: 16 }}>
            <h2 className="dl-panel-title">Порівняння років</h2>
            <div className="dl-statbar-list">
              {yearly.map((y) => {
                const maxY = Math.max(...yearly.map((row) => row.count));
                return (
                  <StatBarRow
                    key={y.year}
                    label={String(y.year)}
                    note={y.count}
                    frac={y.count / maxY}
                    variant="lime"
                  />
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
