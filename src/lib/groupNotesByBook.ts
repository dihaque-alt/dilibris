import type { NoteFeedItem } from '../lib/notesFeed';
import type { Book, UserBookEntry } from '../types/database';

export interface BookNotesGroup {
  bookId: string;
  book: Book;
  entry: UserBookEntry;
  notes: NoteFeedItem[];
  latestAt: string;
}

export function groupNotesByBook(items: NoteFeedItem[]): BookNotesGroup[] {
  const map = new Map<string, BookNotesGroup>();

  for (const item of items) {
    const bookId = item.note.book_id;
    const book = item.entry.book;
    if (!book) continue;

    const existing = map.get(bookId);
    if (existing) {
      existing.notes.push(item);
      if (item.note.created_at > existing.latestAt) {
        existing.latestAt = item.note.created_at;
      }
      continue;
    }

    map.set(bookId, {
      bookId,
      book,
      entry: item.entry,
      notes: [item],
      latestAt: item.note.created_at,
    });
  }

  for (const group of map.values()) {
    group.notes.sort((a, b) => b.note.created_at.localeCompare(a.note.created_at));
  }

  return [...map.values()].sort((a, b) => b.latestAt.localeCompare(a.latestAt));
}

export function noteCountLabel(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return `${count} нотатка`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${count} нотатки`;
  return `${count} нотаток`;
}
