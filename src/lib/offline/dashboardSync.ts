import { supabase } from '../supabase';
import { entryToStatsEntry, type StatsEntry } from '../stats';
import type { ReadingChallenge, UserBookEntry } from '../../types/database';
import { offlineDb, isOnline, nowIso } from './db';

const STATS_ENTRY_SELECT = `
  id, status, counts_toward_stats, finished_on, started_on,
  rating, total_pages, total_minutes, format,
  book:books (title, authors, language, page_count)
`;

export type DashboardData = {
  entries: StatsEntry[];
  challenges: ReadingChallenge[];
  fromCache: boolean;
  cachedAt: string | null;
};

async function cacheSnapshot(
  userId: string,
  entries: StatsEntry[],
  challenges: ReadingChallenge[],
): Promise<string> {
  const cached_at = nowIso();
  await offlineDb.dashboardSnapshots.put({
    user_id: userId,
    entries,
    challenges,
    cached_at,
  });
  return cached_at;
}

async function readSnapshot(userId: string): Promise<DashboardData | null> {
  const snap = await offlineDb.dashboardSnapshots.get(userId);
  if (!snap) return null;
  return {
    entries: snap.entries,
    challenges: snap.challenges,
    fromCache: true,
    cachedAt: snap.cached_at,
  };
}

async function fallbackFromLibraryEntries(userId: string): Promise<DashboardData | null> {
  const entriesRaw = await offlineDb.entries.where('user_id').equals(userId).toArray();
  if (!entriesRaw.length) return null;

  const entries: UserBookEntry[] = await Promise.all(
    entriesRaw.map(async (entry) => {
      const book = entry.book ?? (await offlineDb.books.get(entry.book_id));
      return { ...entry, book };
    }),
  );

  const snap = await offlineDb.dashboardSnapshots.get(userId);
  return {
    entries: entries.map(entryToStatsEntry),
    challenges: snap?.challenges ?? [],
    fromCache: true,
    cachedAt: snap?.cached_at ?? null,
  };
}

export async function fetchDashboardData(userId: string): Promise<DashboardData> {
  if (isOnline()) {
    try {
      const [entriesResult, challengesResult] = await Promise.all([
        supabase
          .from('user_book_entries')
          .select(STATS_ENTRY_SELECT)
          .eq('user_id', userId),
        supabase.from('reading_challenges').select('*').eq('user_id', userId),
      ]);

      if (entriesResult.error) throw entriesResult.error;
      if (challengesResult.error) throw challengesResult.error;

      const entries = (entriesResult.data as unknown as StatsEntry[]) ?? [];
      const challenges = (challengesResult.data as ReadingChallenge[]) ?? [];
      const cachedAt = await cacheSnapshot(userId, entries, challenges);

      return { entries, challenges, fromCache: false, cachedAt };
    } catch {
      const cached = await readSnapshot(userId);
      if (cached) return cached;
      const libraryFallback = await fallbackFromLibraryEntries(userId);
      if (libraryFallback) return libraryFallback;
      throw new Error('Не вдалося завантажити читацьку статистику');
    }
  }

  const cached = await readSnapshot(userId);
  if (cached) return cached;

  const libraryFallback = await fallbackFromLibraryEntries(userId);
  if (libraryFallback) return libraryFallback;

  throw new Error('Офлайн — немає збереженої статистики. Відкрий читацьку статистику онлайн хоча б раз.');
}
