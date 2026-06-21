import type { UserBookEntry } from '../types/database';

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
    const lang = e.book?.language?.trim() || 'Невідома';
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
