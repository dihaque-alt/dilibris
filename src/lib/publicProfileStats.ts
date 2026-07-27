import { supabase } from './supabase';

export interface PublicProfileStats {
  booksFinished: number;
  booksFinishedYear: number;
  pagesReadYear: number;
  minutesReadYear: number;
  avgRatingYear: number | null;
  currentlyReading: number;
}

function parseStats(raw: unknown): PublicProfileStats | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Record<string, unknown>;
  return {
    booksFinished: Number(row.books_finished ?? 0),
    booksFinishedYear: Number(row.books_finished_year ?? 0),
    pagesReadYear: Number(row.pages_read_year ?? 0),
    minutesReadYear: Number(row.minutes_read_year ?? 0),
    avgRatingYear:
      row.avg_rating_year == null || row.avg_rating_year === ''
        ? null
        : Number(row.avg_rating_year),
    currentlyReading: Number(row.currently_reading ?? 0),
  };
}

export async function fetchPublicProfileStats(userId: string): Promise<PublicProfileStats | null> {
  const { data, error } = await supabase.rpc('get_public_profile_stats', {
    p_user_id: userId,
  });

  if (error) throw error;
  return parseStats(data);
}
