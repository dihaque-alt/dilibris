import { defaultProgressMode, type ProgressMode } from './progress';
import type { ReadingSession, UserBookEntry } from '../types/database';

export function entryProgressMode(entry: Pick<UserBookEntry, 'progress_mode' | 'format'>): ProgressMode {
  return entry.progress_mode ?? defaultProgressMode(entry.format);
}

export function parseSessionProgressDelta(raw: string, mode: ProgressMode): number {
  const n = parseInt(raw.replace(/[^0-9]/g, ''), 10) || 0;
  if (mode === 'percent') return Math.min(100, Math.max(0, n));
  return Math.max(0, n);
}

export function nextCurrentPageAfterSession(
  entry: Pick<UserBookEntry, 'current_page' | 'progress_mode' | 'format'>,
  delta: number,
): number {
  const mode = entryProgressMode(entry);
  if (delta <= 0) return entry.current_page;
  if (mode === 'percent') return Math.min(100, entry.current_page + delta);
  return entry.current_page + delta;
}

export function revertCurrentPageAfterSession(
  entry: Pick<UserBookEntry, 'current_page' | 'progress_mode' | 'format'>,
  delta: number,
): number {
  const mode = entryProgressMode(entry);
  if (delta <= 0) return entry.current_page;
  if (mode === 'percent') return Math.max(0, entry.current_page - delta);
  return Math.max(0, entry.current_page - delta);
}

export function formatSessionProgressLine(
  session: Pick<ReadingSession, 'pages_read' | 'minutes'>,
  mode: ProgressMode,
): string {
  const parts: string[] = [];
  if (session.pages_read > 0) {
    parts.push(mode === 'percent' ? `${session.pages_read}%` : `${session.pages_read} стор.`);
  }
  if (session.minutes > 0) parts.push(`${session.minutes} хв`);
  return parts.join(' · ');
}

export type SessionLogInput = {
  sessionDate: string;
  minutes: number;
  note: string | null;
  pages?: number;
  percent?: number;
};

export function resolveSessionDelta(
  entry: Pick<UserBookEntry, 'progress_mode' | 'format'>,
  input: Pick<SessionLogInput, 'pages' | 'percent'>,
): number {
  const mode = entryProgressMode(entry);
  if (mode === 'percent') return Math.min(100, Math.max(0, input.percent ?? 0));
  return Math.max(0, input.pages ?? 0);
}
