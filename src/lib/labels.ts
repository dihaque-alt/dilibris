import type { BookEntryStatus } from '../types/database';

export const STATUS_LABELS: Record<BookEntryStatus, string> = {
  want_to_read: 'Хочу прочитати',
  reading: 'Читаю зараз',
  finished: 'Прочитано',
  dnf: 'Не дочитала',
  re_reading: 'Перечитую',
};

export const PLACEHOLDER_COVER = '/placeholder-cover.svg';

export const NOTE_TYPE_LABELS = {
  quote: 'Цитата',
  thought: 'Думка',
  general: 'Загальна',
} as const;

export const NOTE_VISIBILITY_LABELS = {
  private: 'Особиста',
  public: 'Публічна',
} as const;

export function formatAuthors(authors: string[] | null | undefined): string {
  if (!authors?.length) return 'Невідомий автор';
  return authors.join(', ');
}
