import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { AppNav } from '../components/AppNav';
import { ChallengeBar } from '../components/ChallengeBar';
import { FormatDonut } from '../components/FormatDonut';
import { InfoTooltip, PanelTitle } from '../components/InfoTooltip';
import { PageHead } from '../components/PageHead';
import { RoomBackdrop } from '../components/RoomBackdrop';
import { StatBarRow } from '../components/StatBarRow';
import { useIsMobile } from '../hooks/useIsMobile';
import { formatDateTimeUk } from '../lib/dates';
import { fetchDashboardData } from '../lib/offline/dashboardSync';
import { isOnline } from '../lib/offline/db';
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

function MonthChart({ data }: { data: { month: number; count: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));

  return (
    <div className="dl-month-chart">
      {data.map(({ month, count }) => (
        <div key={month} className="dl-month-col">
          <div
            className="dl-bar"
            style={{
              width: '100%',
              maxWidth: 34,
              height: Math.max(5, (count / max) * 122),
              background: count
                ? 'linear-gradient(180deg, var(--accent-lime), var(--accent-lime-deep))'
                : 'var(--line)',
            }}
            title={`${count} книг`}
          />
          <span className="dl-month-label">{MONTH_NAMES_UK[month - 1]}</span>
        </div>
      ))}
    </div>
  );
}

export function DashboardPage({ userId, userEmail }: DashboardPageProps) {
  const wide = !useIsMobile(860);
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [entries, setEntries] = useState<StatsEntry[]>([]);
  const [challenges, setChallenges] = useState<ReadingChallenge[]>([]);
  const [fromCache, setFromCache] = useState(false);
  const [cachedAt, setCachedAt] = useState<string | null>(null);
  const [targetBooks, setTargetBooks] = useState('12');
  const [loading, setLoading] = useState(true);
  const [savingChallenge, setSavingChallenge] = useState(false);
  const [editChallengeTarget, setEditChallengeTarget] = useState(false);
  const [error, setError] = useState('');

  const challenge = useMemo(
    () => challenges.find((c) => c.year === selectedYear) ?? null,
    [challenges, selectedYear],
  );

  const loadData = useCallback(async () => {
    const data = await fetchDashboardData(userId);
    setEntries(data.entries);
    setChallenges(data.challenges);
    setFromCache(data.fromCache);
    setCachedAt(data.cachedAt);
  }, [userId]);

  useEffect(() => {
    setLoading(true);
    setError('');
    loadData()
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Не вдалося завантажити дашборд');
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
  const monthData = booksByMonth(entries, selectedYear);
  const formats = formatBreakdown(entries, selectedYear);
  const authors = topAuthors(entries, selectedYear, 4);
  const languages = languageBreakdown(entries, selectedYear);
  const breakDays = longestBreakDays(entries);
  const yearly = booksByYear(entries);
  const langTotal = languages.reduce((sum, l) => sum + l.count, 0);
  const maxAuthor = authors[0]?.count ?? 1;

  const stats = [
    [String(finishedCount), 'книг'],
    [pages.toLocaleString('uk-UA'), 'сторінок'],
    [formatMinutes(minutes), 'часу'],
    [avgRating != null ? formatStarRating(Math.round(avgRating * 2) / 2) : '—', 'сер. оцінка'],
    ...(breakDays != null ? [[`${breakDays} днів`, 'найдовша пауза']] : []),
  ] as const;

  async function handleSaveChallenge(e: FormEvent) {
    e.preventDefault();
    if (!isOnline()) {
      setError('Зберегти ціль можна лише з підключенням до інternet');
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

      {fromCache && cachedAt && (
        <p className="offline-hint">
          Дані станом на {formatDateTimeUk(cachedAt)}.
        </p>
      )}

      <main className="dl-page dashboard-page">
        <PageHead
          eyebrow="Твій читацький рік"
          title="Дашборд"
          sub="Теплі підсумки — без тиску, лише радість від прочитаного"
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

        <section className="dl-panel dl-challenge">
          <div className="dl-challenge-head">
            <div>
              <div className="dl-challenge-kicker">
                Челендж {selectedYear}
                <InfoTooltip
                  label="Як рахується челендж"
                  placement="top"
                  text="Книги зі статусом «Прочитано» (або перечитання з датою завершення), де увімкнено «Рахувати в challenge», і дата завершення у вибраному році."
                />
              </div>
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
            <PanelTitle
              title="Книги за місяць"
              tipLabel="Як рахуються книги за місяць"
              tip="Кількість прочитаних книг за кожен місяць обраного року — за датою завершення (finished_on)."
            />
            {finishedCount === 0 ? (
              <p className="empty-hint">Познач книги як «Прочитано», щоб побачити графік.</p>
            ) : (
              <MonthChart data={monthData} />
            )}
          </section>

          <section className="dl-panel">
            <PanelTitle
              title="Формат"
              tipLabel="Як рахується формат"
              tip="Поле «Формат» з картки книги: паперова, електронна або аудіо. Без формату — у блоці «Не вказано»."
            />
            <FormatDonut
              paper={formats.paper}
              ebook={formats.ebook}
              audiobook={formats.audiobook}
              unknown={formats.unknown}
              centerValue={finishedCount}
            />
          </section>
        </div>

        <div className="dl-dash-row is-authors-langs">
          <section className="dl-panel">
            <PanelTitle
              title="Топ авторів"
              tipLabel="Як рахуються автори"
              tip="Автори з прочитаних книг обраного року. Якщо в книзі кілька авторів — кожен отримує +1."
            />
            {authors.length === 0 ? (
              <p className="empty-hint">Поки немає даних за цей рік.</p>
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
            <PanelTitle
              title="Мови"
              tipLabel="Як рахуються мови"
              tip="Мова з картки книги (вкладка «Прогрес» → «Мова книги»). Якщо не задано — потрапляє в «Мова не вказана»."
            />
            {languages.length === 0 ? (
              <p className="empty-hint">Поки немає даних за цей рік.</p>
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
