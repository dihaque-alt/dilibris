import { supabase } from '../supabase';
import { defaultProgressMode } from '../progress';
import { entryToStatsEntry, type SessionMonthRow, type StatsEntry } from '../stats';
import type { ReadingChallenge, UserBookEntry } from '../../types/database';
import { offlineDb, isOnline, nowIso } from './db';

const STATS_ENTRY_SELECT = `
  id, status, counts_toward_stats, finished_on, started_on,
  rating, total_pages, total_minutes, format, progress_mode,
  book:books (title, authors, language, page_count)
`;

export type DashboardData = {
  entries: StatsEntry[];
  challenges: ReadingChallenge[];
  sessions: SessionMonthRow[];
  fromCache: boolean;
  cachedAt: string | null;
};

function buildSessionMonthRows(
  sessions: { started_at: string; pages_read: number; minutes: number; entry_id: string }[],
  entries: StatsEntry[],
): SessionMonthRow[] {
  const modeByEntry = new Map(
    entries.map((e) => [e.id, e.progress_mode ?? defaultProgressMode(e.format)]),
  );
  return sessions.map((s) => ({
    started_at: s.started_at,
    pages_read: s.pages_read,
    minutes: s.minutes,
    progress_mode: modeByEntry.get(s.entry_id) ?? 'pages',
  }));
}

async function cacheSnapshot(
  userId: string,
  entries: StatsEntry[],
  challenges: ReadingChallenge[],
  sessions: SessionMonthRow[],
): Promise<string> {
  const cached_at = nowIso();
  await offlineDb.dashboardSnapshots.put({
    user_id: userId,
    entries,
    challenges,
    sessions,
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
    sessions: snap.sessions ?? [],
    fromCache: true,
    cachedAt: snap.cached_at,
  };
}

async function sessionsFromOffline(userId: string, entries: StatsEntry[]): Promise<SessionMonthRow[]> {
  const raw = await offlineDb.sessions.where('user_id').equals(userId).toArray();
  return buildSessionMonthRows(raw, entries);
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

  const statsEntries = entries.map(entryToStatsEntry);
  const snap = await offlineDb.dashboardSnapshots.get(userId);
  const sessions = snap?.sessions?.length
    ? snap.sessions
    : await sessionsFromOffline(userId, statsEntries);

  return {
    entries: statsEntries,
    challenges: snap?.challenges ?? [],
    sessions,
    fromCache: true,
    cachedAt: snap?.cached_at ?? null,
  };
}

export async function fetchDashboardData(userId: string): Promise<DashboardData> {
  if (isOnline()) {
    try {
      const [entriesResult, challengesResult, sessionsResult] = await Promise.all([
        supabase
          .from('user_book_entries')
          .select(STATS_ENTRY_SELECT)
          .eq('user_id', userId),
        supabase.from('reading_challenges').select('*').eq('user_id', userId),
        supabase
          .from('reading_sessions')
          .select('started_at, pages_read, minutes, entry_id')
          .eq('user_id', userId),
      ]);

      if (entriesResult.error) throw entriesResult.error;
      if (challengesResult.error) throw challengesResult.error;
      if (sessionsResult.error) throw sessionsResult.error;

      const entries = (entriesResult.data as unknown as StatsEntry[]) ?? [];
      const challenges = (challengesResult.data as ReadingChallenge[]) ?? [];
      const sessions = buildSessionMonthRows(sessionsResult.data ?? [], entries);
      const cachedAt = await cacheSnapshot(userId, entries, challenges, sessions);

      return { entries, challenges, sessions, fromCache: false, cachedAt };
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
