import type { UserBookEntry } from '../types/database';
import { formatLanguageLabel } from './language';

export interface StatsEntry {
  id: string;
  status: string;
  counts_toward_stats: boolean;
  finished_on: string | null;
  started_on: string | null;
  rating: number | null;
  total_pages: number | null;
  total_minutes: number;
  format: string | null;
  progress_mode?: 'pages' | 'percent';
  book?: {
    title: string;
    authors: string[];
    language: string | null;
    page_count: number | null;
  };
}

export const MONTH_NAMES_UK = [
  'Січ',
  'Лют',
  'Бер',
  'Кві',
  'Тра',
  'Чер',
  'Лип',
  'Сер',
  'Вер',
  'Жов',
  'Лис',
  'Гру',
];

export function entryToStatsEntry(entry: UserBookEntry): StatsEntry {
  return {
    id: entry.id,
    status: entry.status,
    counts_toward_stats: entry.counts_toward_stats,
    finished_on: entry.finished_on,
    started_on: entry.started_on,
    rating: entry.rating,
    total_pages: entry.total_pages,
    total_minutes: entry.total_minutes,
    format: entry.format,
    progress_mode: entry.progress_mode,
    book: entry.book
      ? {
          title: entry.book.title,
          authors: entry.book.authors,
          language: entry.book.language,
          page_count: entry.book.page_count,
        }
      : undefined,
  };
}

export function finishedForStats(entries: StatsEntry[]): StatsEntry[] {
  return entries.filter((e) => {
    if (!e.counts_toward_stats) return false;
    if (e.status === 'finished') return true;
    return e.status === 're_reading' && Boolean(e.finished_on);
  });
}

export function finishedInYear(entries: StatsEntry[], year: number): StatsEntry[] {
  return finishedForStats(entries).filter((e) => e.finished_on?.startsWith(String(year)));
}

export type MonthMetric = 'books' | 'pages' | 'minutes';

export interface SessionMonthRow {
  started_at: string;
  pages_read: number;
  minutes: number;
  progress_mode: 'pages' | 'percent';
}

export function monthSeriesFromBooks(
  entries: StatsEntry[],
  year: number,
): { month: number; value: number }[] {
  return booksByMonth(entries, year).map(({ month, count }) => ({ month, value: count }));
}

export function monthSeriesFromSessions(
  sessions: SessionMonthRow[],
  year: number,
  metric: 'pages' | 'minutes',
): { month: number; value: number }[] {
  const counts = Array(12).fill(0);
  sessions.forEach((s) => {
    const y = parseInt(s.started_at.slice(0, 4), 10);
    if (y !== year) return;
    const monthIdx = parseInt(s.started_at.slice(5, 7), 10) - 1;
    if (monthIdx < 0 || monthIdx > 11) return;
    if (metric === 'minutes') {
      counts[monthIdx] += s.minutes;
    } else if (s.progress_mode === 'pages') {
      counts[monthIdx] += s.pages_read;
    }
  });
  return counts.map((value, i) => ({ month: i + 1, value }));
}

export function formatMonthMetricValue(metric: MonthMetric, value: number): string {
  if (metric === 'minutes') {
    if (value >= 60) return `${Math.round(value / 60)} год`;
    return `${value} хв`;
  }
  if (metric === 'pages') return `${value} стор.`;
  return String(value);
}

export function monthBooksAndPagesSeries(
  entries: StatsEntry[],
  sessions: SessionMonthRow[],
  year: number,
): { month: number; books: number; pages: number }[] {
  const books = monthSeriesFromBooks(entries, year);
  const pages = monthSeriesFromSessions(sessions, year, 'pages');
  return books.map((row, i) => ({
    month: row.month,
    books: row.value,
    pages: pages[i]?.value ?? 0,
  }));
}

export function monthMetricBarTitle(metric: MonthMetric, value: number): string {
  if (metric === 'books') return `${value} ${value === 1 ? 'книга' : value < 5 ? 'книги' : 'книг'}`;
  if (metric === 'pages') return `${value} сторінок`;
  return formatMonthMetricValue('minutes', value);
}

export function booksByMonth(entries: StatsEntry[], year: number): { month: number; count: number }[] {
  const counts = Array(12).fill(0);
  finishedInYear(entries, year).forEach((e) => {
    if (!e.finished_on) return;
    const month = parseInt(e.finished_on.slice(5, 7), 10) - 1;
    if (month >= 0 && month < 12) counts[month]++;
  });
  return counts.map((count, i) => ({ month: i + 1, count }));
}

export function averageRating(entries: StatsEntry[], year: number): number | null {
  const rated = finishedInYear(entries, year).filter((e) => e.rating != null);
  if (!rated.length) return null;
  return rated.reduce((sum, e) => sum + (e.rating ?? 0), 0) / rated.length;
}

export function totalPagesRead(entries: StatsEntry[], year: number): number {
  return finishedInYear(entries, year).reduce(
    (sum, e) => sum + (e.total_pages ?? e.book?.page_count ?? 0),
    0,
  );
}

export function totalMinutesRead(entries: StatsEntry[], year: number): number {
  return finishedInYear(entries, year).reduce((sum, e) => sum + e.total_minutes, 0);
}

export function formatBreakdown(entries: StatsEntry[], year: number) {
  const finished = finishedInYear(entries, year);
  return {
    paper: finished.filter((e) => e.format === 'paper').length,
    ebook: finished.filter((e) => e.format === 'ebook').length,
    audiobook: finished.filter((e) => e.format === 'audiobook').length,
    unknown: finished.filter((e) => !e.format).length,
  };
}

export function topAuthors(
  entries: StatsEntry[],
  year: number,
  limit = 5,
): { author: string; count: number }[] {
  const counts = new Map<string, number>();
  finishedInYear(entries, year).forEach((e) => {
    const authors = e.book?.authors?.length ? e.book.authors : ['Невідомий автор'];
    authors.forEach((author) => {
      counts.set(author, (counts.get(author) ?? 0) + 1);
    });
  });
  return [...counts.entries()]
    .map(([author, count]) => ({ author, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export function languageBreakdown(entries: StatsEntry[], year: number): { language: string; count: number }[] {
  const counts = new Map<string, number>();
  finishedInYear(entries, year).forEach((e) => {
    const lang = formatLanguageLabel(e.book?.language);
    counts.set(lang, (counts.get(lang) ?? 0) + 1);
  });
  return [...counts.entries()]
    .map(([language, count]) => ({ language, count }))
    .sort((a, b) => b.count - a.count);
}

export function longestBreakDays(entries: StatsEntry[]): number | null {
  const dates = finishedForStats(entries)
    .map((e) => e.finished_on)
    .filter(Boolean)
    .sort() as string[];

  if (dates.length < 2) return null;

  let max = 0;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(`${dates[i - 1]}T00:00:00`);
    const curr = new Date(`${dates[i]}T00:00:00`);
    const diff = Math.round((curr.getTime() - prev.getTime()) / 86400000);
    if (diff > max) max = diff;
  }
  return max;
}

export function booksByYear(entries: StatsEntry[]): { year: number; count: number }[] {
  const counts = new Map<number, number>();
  finishedForStats(entries).forEach((e) => {
    if (!e.finished_on) return;
    const year = parseInt(e.finished_on.slice(0, 4), 10);
    counts.set(year, (counts.get(year) ?? 0) + 1);
  });
  return [...counts.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([year, count]) => ({ year, count }));
}

export function availableYears(entries: StatsEntry[]): number[] {
  const years = new Set<number>([new Date().getFullYear()]);
  finishedForStats(entries).forEach((e) => {
    if (e.finished_on) years.add(parseInt(e.finished_on.slice(0, 4), 10));
  });
  return [...years].sort((a, b) => b - a);
}

export function ratingBreakdown(
  entries: StatsEntry[],
  year: number,
): { rating: number; count: number }[] {
  const counts = new Map<number, number>();
  finishedInYear(entries, year).forEach((e) => {
    if (e.rating == null) return;
    const rating = Math.round(e.rating * 2) / 2;
    counts.set(rating, (counts.get(rating) ?? 0) + 1);
  });
  return [...counts.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([rating, count]) => ({ rating, count }));
}

export function bookLengthBreakdown(entries: StatsEntry[], year: number) {
  const finished = finishedInYear(entries, year);
  let short = 0;
  let medium = 0;
  let long = 0;
  let unknown = 0;

  finished.forEach((e) => {
    const pages = e.total_pages ?? e.book?.page_count ?? 0;
    if (pages <= 0) unknown += 1;
    else if (pages < 300) short += 1;
    else if (pages < 500) medium += 1;
    else long += 1;
  });

  return { short, medium, long, unknown };
}

export function averageDaysToFinish(entries: StatsEntry[], year: number): number | null {
  const durations: number[] = [];
  finishedInYear(entries, year).forEach((e) => {
    if (!e.started_on || !e.finished_on) return;
    const start = new Date(`${e.started_on}T00:00:00`).getTime();
    const end = new Date(`${e.finished_on}T00:00:00`).getTime();
    const days = Math.round((end - start) / 86400000);
    if (days >= 0) durations.push(days);
  });
  if (!durations.length) return null;
  return Math.round(durations.reduce((sum, d) => sum + d, 0) / durations.length);
}

export function formatDaysToFinish(days: number): string {
  if (days === 1) return '1 день';
  if (days >= 2 && days <= 4) return `${days} дні`;
  if (days >= 5 && days <= 20) return `${days} днів`;
  const weeks = Math.round(days / 7);
  if (weeks < 8) return `${weeks} ${weeks === 1 ? 'тиждень' : weeks < 5 ? 'тижні' : 'тижнів'}`;
  const months = Math.round(days / 30);
  return `${months} ${months === 1 ? 'місяць' : months < 5 ? 'місяці' : 'місяців'}`;
}
