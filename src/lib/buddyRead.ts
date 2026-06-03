import type { BookEntryStatus } from '../types/database';

const STATUS_PRIORITY: BookEntryStatus[] = [
  'reading',
  're_reading',
  'finished',
  'want_to_read',
  'dnf',
];

export interface MemberProgress {
  user_id: string;
  status: BookEntryStatus | null;
  current_page: number;
  total_pages: number | null;
  rating: number | null;
  finished_on: string | null;
  entry_id: string | null;
}

export function inviteUrl(token: string): string {
  return `${window.location.origin}/buddy-reads/join/${token}`;
}

export function parseInviteToken(input: string): string {
  const trimmed = input.trim();
  const match = trimmed.match(/join\/([a-f0-9]+)$/i);
  return match ? match[1] : trimmed;
}

export function pickMemberProgress(
  entries: {
    id: string;
    user_id: string;
    status: BookEntryStatus;
    current_page: number;
    total_pages: number | null;
    rating: number | null;
    finished_on: string | null;
    updated_at: string;
  }[],
  userId: string,
): MemberProgress {
  const userEntries = entries.filter((e) => e.user_id === userId);
  if (!userEntries.length) {
    return {
      user_id: userId,
      status: null,
      current_page: 0,
      total_pages: null,
      rating: null,
      finished_on: null,
      entry_id: null,
    };
  }

  const sorted = [...userEntries].sort((a, b) => {
    const pa = STATUS_PRIORITY.indexOf(a.status);
    const pb = STATUS_PRIORITY.indexOf(b.status);
    if (pa !== pb) return pa - pb;
    return b.updated_at.localeCompare(a.updated_at);
  });

  const best = sorted[0];
  return {
    user_id: userId,
    status: best.status,
    current_page: best.current_page,
    total_pages: best.total_pages,
    rating: best.rating,
    finished_on: best.finished_on,
    entry_id: best.id,
  };
}

export function progressLabel(progress: MemberProgress): string {
  if (!progress.status) return 'Ще не додав(ла) книгу';
  if (progress.status === 'finished') return 'Прочитано';
  if (progress.total_pages && progress.total_pages > 0) {
    const pct = Math.min(100, Math.round((progress.current_page / progress.total_pages) * 100));
    return `${pct}% · ${progress.current_page}/${progress.total_pages} стор.`;
  }
  return `${progress.current_page} стор.`;
}
