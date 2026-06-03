import Dexie, { type EntityTable } from 'dexie';
import type { Book, ReadingSession, UserBookEntry, UserShelf } from '../../types/database';

export interface PendingOp {
  id: string;
  userId: string;
  table: 'user_shelves' | 'books' | 'user_book_entries' | 'reading_sessions';
  operation: 'insert' | 'update' | 'delete';
  payload: Record<string, unknown>;
  createdAt: number;
}

class DiLibrisOfflineDB extends Dexie {
  shelves!: EntityTable<UserShelf, 'id'>;
  entries!: EntityTable<UserBookEntry, 'id'>;
  books!: EntityTable<Book, 'id'>;
  sessions!: EntityTable<ReadingSession, 'id'>;
  pendingOps!: EntityTable<PendingOp, 'id'>;

  constructor() {
    super('dilibris-offline');
    this.version(1).stores({
      shelves: 'id, user_id',
      entries: 'id, user_id, shelf_id, book_id',
      books: 'id',
      sessions: 'id, entry_id',
      pendingOps: 'id, userId, createdAt',
    });
  }
}

export const offlineDb = new DiLibrisOfflineDB();

export function isOnline(): boolean {
  return typeof navigator === 'undefined' ? true : navigator.onLine;
}

export function nowIso(): string {
  return new Date().toISOString();
}
