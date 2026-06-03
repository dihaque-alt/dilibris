import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { AppNav } from '../components/AppNav';
import { supabase } from '../lib/supabase';
import { formatMinutes, formatStarRating } from '../lib/rating';
import {
  availableYears,
  averageRating,
  booksByMonth,
  booksByYear,
  finishedInYear,
  formatBreakdown,
  languageBreakdown,
  longestBreakDays,
  MONTH_NAMES_UK,
  topAuthors,
  totalMinutesRead,
  totalPagesRead,
  type StatsEntry,
} from '../lib/stats';
import type { ReadingChallenge } from '../types/database';

interface DashboardPageProps {
  userId: string;
  userEmail: string;
}

function MonthChart({ data }: { data: { month: number; count: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));

  return (
    <div className="bar-chart">
      {data.map(({ month, count }) => (
        <div key={month} className="bar-chart-col">
          <div className="bar-chart-bar-wrap">
            <div
              className="bar-chart-bar"
              style={{ height: `${(count / max) * 100}%` }}
              title={`${count} книг`}
            />
          </div>
          <span className="bar-chart-label">{MONTH_NAMES_UK[month - 1]}</span>
        </div>
      ))}
    </div>
  );
}

function BreakdownList({
  items,
  valueKey,
  labelKey,
}: {
  items: Record<string, string | number>[];
  valueKey: string;
  labelKey: string;
}) {
  if (!items.length) {
    return <p className="empty-hint">Поки немає даних за цей рік.</p>;
  }

  const max = Math.max(...items.map((item) => Number(item[valueKey])));

  return (
    <ul className="breakdown-list">
      {items.map((item) => {
        const value = Number(item[valueKey]);
        const label = String(item[labelKey]);
        return (
          <li key={label}>
            <div className="breakdown-row">
              <span className="breakdown-label">{label}</span>
              <span className="breakdown-value">{value}</span>
            </div>
            <div className="breakdown-track">
              <div className="breakdown-fill" style={{ width: `${(value / max) * 100}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function DashboardPage({ userId, userEmail }: DashboardPageProps) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [entries, setEntries] = useState<StatsEntry[]>([]);
  const [challenge, setChallenge] = useState<ReadingChallenge | null>(null);
  const [targetBooks, setTargetBooks] = useState('12');
  const [loading, setLoading] = useState(true);
  const [savingChallenge, setSavingChallenge] = useState(false);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    const [entriesResult, challengeResult] = await Promise.all([
      supabase
        .from('user_book_entries')
        .select(`
          id, status, counts_toward_stats, finished_on, started_on,
          rating, total_pages, total_minutes, format,
          book:books (title, authors, language, page_count)
        `)
        .eq('user_id', userId),
      supabase
        .from('reading_challenges')
        .select('*')
        .eq('user_id', userId)
        .eq('year', selectedYear)
        .maybeSingle(),
    ]);

    if (entriesResult.error) throw entriesResult.error;
    if (challengeResult.error) throw challengeResult.error;

    setEntries((entriesResult.data as unknown as StatsEntry[]) ?? []);
    setChallenge((challengeResult.data as ReadingChallenge | null) ?? null);
    if (challengeResult.data) {
      setTargetBooks(String(challengeResult.data.target_books));
    } else {
      setTargetBooks('12');
    }
  }, [userId, selectedYear]);

  useEffect(() => {
    setLoading(true);
    setError('');
    loadData()
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Не вдалося завантажити дашборд');
      })
      .finally(() => setLoading(false));
  }, [loadData]);

  const yearOptions = availableYears(entries);
  const finishedThisYear = finishedInYear(entries, selectedYear);
  const finishedCount = finishedThisYear.length;
  const target = challenge?.target_books ?? (parseInt(targetBooks, 10) || 0);
  const challengeProgress = target > 0 ? Math.min(100, Math.round((finishedCount / target) * 100)) : 0;
  const avgRating = averageRating(entries, selectedYear);
  const pages = totalPagesRead(entries, selectedYear);
  const minutes = totalMinutesRead(entries, selectedYear);
  const monthData = booksByMonth(entries, selectedYear);
  const formats = formatBreakdown(entries, selectedYear);
  const authors = topAuthors(entries, selectedYear);
  const languages = languageBreakdown(entries, selectedYear);
  const breakDays = longestBreakDays(entries);
  const yearly = booksByYear(entries);

  async function handleSaveChallenge(e: FormEvent) {
    e.preventDefault();
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

    setChallenge(data as ReadingChallenge);
    setSavingChallenge(false);
  }

  if (loading) {
    return (
      <div className="app-shell app-shell--room">
        <AppNav userEmail={userEmail} active="dashboard" />
        <div className="center-page">Завантажуємо статистику…</div>
      </div>
    );
  }

  return (
    <div className="app-shell app-shell--room">
      <AppNav userEmail={userEmail} active="dashboard" />

      <main className="dashboard-page">
        <div className="dashboard-toolbar">
          <h2>Статистика читання</h2>
          <label className="year-select">
            Рік
            <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>
        </div>

        {error && <p className="banner-error">{error}</p>}

        <section className="dashboard-card challenge-card">
          <h3>Reading challenge {selectedYear}</h3>
          <form className="challenge-form" onSubmit={handleSaveChallenge}>
            <label>
              Ціль — книг
              <input
                type="number"
                min={0}
                value={targetBooks}
                onChange={(e) => setTargetBooks(e.target.value)}
              />
            </label>
            <button type="submit" disabled={savingChallenge}>
              {savingChallenge ? 'Зберігаємо…' : 'Зберегти ціль'}
            </button>
          </form>
          <div className="challenge-progress">
            <div className="challenge-progress-bar">
              <div className="challenge-progress-fill" style={{ width: `${challengeProgress}%` }} />
            </div>
            <p className="challenge-progress-text">
              <strong>{finishedCount}</strong>
              {target > 0 ? ` / ${target} книг` : ' книг прочитано'}
              {target > 0 && ` (${challengeProgress}%)`}
            </p>
          </div>
        </section>

        <div className="stats-row dashboard-summary">
          <div className="stat-chip">
            <span className="stat-label">Книги</span>
            <strong>{finishedCount}</strong>
          </div>
          <div className="stat-chip">
            <span className="stat-label">Сторінки</span>
            <strong>{pages.toLocaleString('uk-UA')}</strong>
          </div>
          <div className="stat-chip">
            <span className="stat-label">Час</span>
            <strong>{formatMinutes(minutes)}</strong>
          </div>
          <div className="stat-chip">
            <span className="stat-label">Середня оцінка</span>
            <strong>{avgRating != null ? formatStarRating(Math.round(avgRating * 2) / 2) : '—'}</strong>
          </div>
          {breakDays != null && (
            <div className="stat-chip">
              <span className="stat-label">Найдовша перерва</span>
              <strong>{breakDays} дн.</strong>
            </div>
          )}
        </div>

        <div className="dashboard-grid">
          <section className="dashboard-card">
            <h3>Книги по місяцях</h3>
            {finishedCount === 0 ? (
              <p className="empty-hint">Познач книги як «Прочитано», щоб побачити графік.</p>
            ) : (
              <MonthChart data={monthData} />
            )}
          </section>

          <section className="dashboard-card">
            <h3>Формат</h3>
            <BreakdownList
              items={[
                { label: 'Паперова', value: formats.paper },
                { label: 'Електронна', value: formats.ebook },
                ...(formats.unknown ? [{ label: 'Не вказано', value: formats.unknown }] : []),
              ].filter((item) => item.value > 0)}
              labelKey="label"
              valueKey="value"
            />
          </section>

          <section className="dashboard-card">
            <h3>Топ авторів</h3>
            <BreakdownList
              items={authors.map((a) => ({ label: a.author, value: a.count }))}
              labelKey="label"
              valueKey="value"
            />
          </section>

          <section className="dashboard-card">
            <h3>Мови</h3>
            <BreakdownList
              items={languages.map((l) => ({ label: l.language, value: l.count }))}
              labelKey="label"
              valueKey="value"
            />
          </section>

          {yearly.length > 1 && (
            <section className="dashboard-card dashboard-card--wide">
              <h3>Порівняння років</h3>
              <BreakdownList
                items={yearly.map((y) => ({ label: String(y.year), value: y.count }))}
                labelKey="label"
                valueKey="value"
              />
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
