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

/** 32-char hex token for buddy_reads.invite_token (avoids DB default on pgcrypto). */
export function newInviteToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message.trim()) return err.message;
  if (typeof err === 'object' && err !== null && 'message' in err) {
    const message = (err as { message: unknown }).message;
    if (typeof message === 'string' && message.trim()) return message;
  }
  return fallback;
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

export function progressPercent(progress: MemberProgress): number {
  if (!progress.status) return 0;
  if (progress.status === 'finished') return 100;
  if (progress.total_pages && progress.total_pages > 0) {
    return Math.min(100, Math.round((progress.current_page / progress.total_pages) * 100));
  }
  return 0;
}

export function progressLabel(progress: MemberProgress): string {
  if (!progress.status) return 'Ще не додав(ла) книгу';
  if (progress.status === 'finished') return 'Прочитано';
  if (progress.total_pages && progress.total_pages > 0) {
    const pct = progressPercent(progress);
    return `${pct}% · ${progress.current_page}/${progress.total_pages} стор.`;
  }
  return `${progress.current_page} стор.`;
}

export function averageMemberProgress(
  memberIds: string[],
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
): number {
  if (!memberIds.length) return 0;
  const sum = memberIds.reduce((acc, userId) => {
    return acc + progressPercent(pickMemberProgress(entries, userId));
  }, 0);
  return Math.round(sum / memberIds.length);
}

/** «1 учасник», «2 учасники», «5 учасників». */
export function formatMemberCount(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return `${count} учасник`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
    return `${count} учасники`;
  }
  return `${count} учасників`;
}
