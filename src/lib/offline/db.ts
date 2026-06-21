import Dexie, { type EntityTable } from 'dexie';
import type {
  ActiveReadingSession,
  Book,
  Note,
  Review,
  ReadingSession,
  UserBookEntry,
  UserShelf,
} from '../../types/database';

export interface PendingOp {
  id: string;
  userId: string;
  table: 'user_shelves' | 'books' | 'user_book_entries' | 'reading_sessions' | 'active_reading_sessions' | 'notes' | 'reviews';
  operation: 'insert' | 'update' | 'delete';
  payload: Record<string, unknown>;
  createdAt: number;
}

export interface ActiveReadingSessionLocal extends ActiveReadingSession {
  dirty?: boolean;
}

class DiLibrisOfflineDB extends Dexie {
  shelves!: EntityTable<UserShelf, 'id'>;
  entries!: EntityTable<UserBookEntry, 'id'>;
  books!: EntityTable<Book, 'id'>;
  sessions!: EntityTable<ReadingSession, 'id'>;
  activeSessions!: EntityTable<ActiveReadingSessionLocal, 'user_id'>;
  notes!: EntityTable<Note, 'id'>;
  reviews!: EntityTable<Review, 'id'>;
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
    this.version(2).stores({
      shelves: 'id, user_id',
      entries: 'id, user_id, shelf_id, book_id',
      books: 'id',
      sessions: 'id, entry_id',
      activeSessions: 'user_id, entry_id',
      pendingOps: 'id, userId, createdAt',
    });
    this.version(3).stores({
      shelves: 'id, user_id',
      entries: 'id, user_id, shelf_id, book_id',
      books: 'id',
      sessions: 'id, entry_id',
      activeSessions: 'user_id, entry_id',
      notes: 'id, user_id, entry_id, book_id, updated_at',
      pendingOps: 'id, userId, createdAt',
    });
    this.version(4).stores({
      shelves: 'id, user_id',
      entries: 'id, user_id, shelf_id, book_id',
      books: 'id',
      sessions: 'id, entry_id',
      activeSessions: 'user_id, entry_id',
      notes: 'id, user_id, entry_id, book_id, updated_at',
      reviews: 'id, user_id, book_id, entry_id, updated_at',
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
