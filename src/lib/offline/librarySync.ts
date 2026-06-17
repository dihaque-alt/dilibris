import { supabase } from '../supabase';
import { flushActiveSession } from './activeSessionSync';
import { offlineDb, isOnline, nowIso, type PendingOp } from './db';
import type { BookEntryStatus, ReadingSession, UserBookEntry, UserShelf } from '../../types/database';

const ENTRY_SELECT = `
  *,
  book:books (
    id, title, subtitle, authors, cover_url, page_count, published_year, language, external_ids
  )
`;

export type LibraryData = {
  shelves: UserShelf[];
  entries: UserBookEntry[];
  fromCache: boolean;
};

async function enqueue(userId: string, op: Omit<PendingOp, 'id' | 'userId' | 'createdAt'>) {
  await offlineDb.pendingOps.add({
    id: crypto.randomUUID(),
    userId,
    ...op,
    createdAt: Date.now(),
  });
}

export async function getPendingCount(userId: string): Promise<number> {
  return offlineDb.pendingOps.where('userId').equals(userId).count();
}

async function cacheLibrary(userId: string, shelves: UserShelf[], entries: UserBookEntry[]) {
  await offlineDb.transaction('rw', offlineDb.shelves, offlineDb.entries, offlineDb.books, async () => {
    const existingShelves = await offlineDb.shelves.where('user_id').equals(userId).primaryKeys();
    const existingEntries = await offlineDb.entries.where('user_id').equals(userId).primaryKeys();
    await offlineDb.shelves.bulkDelete(existingShelves);
    await offlineDb.entries.bulkDelete(existingEntries);
    await offlineDb.shelves.bulkPut(shelves);
    await offlineDb.entries.bulkPut(entries);
    for (const entry of entries) {
      if (entry.book) await offlineDb.books.put(entry.book);
    }
  });
}

async function readCachedLibrary(userId: string): Promise<LibraryData | null> {
  const shelves = await offlineDb.shelves.where('user_id').equals(userId).sortBy('sort_order');
  const entriesRaw = await offlineDb.entries.where('user_id').equals(userId).toArray();
  if (!shelves.length && !entriesRaw.length) return null;

  const entries: UserBookEntry[] = await Promise.all(
    entriesRaw.map(async (entry) => {
      const book = entry.book ?? (await offlineDb.books.get(entry.book_id));
      return { ...entry, book };
    }),
  );

  return { shelves, entries, fromCache: true };
}

export async function fetchLibrary(userId: string): Promise<LibraryData> {
  if (isOnline()) {
    try {
      const [shelvesResult, entriesResult] = await Promise.all([
        supabase.from('user_shelves').select('*').eq('user_id', userId).order('sort_order'),
        supabase.from('user_book_entries').select(ENTRY_SELECT).eq('user_id', userId).order('updated_at', { ascending: false }),
      ]);

      if (shelvesResult.error) throw shelvesResult.error;
      if (entriesResult.error) throw entriesResult.error;

      const shelves = (shelvesResult.data ?? []) as UserShelf[];
      const entries = (entriesResult.data ?? []) as unknown as UserBookEntry[];
      await cacheLibrary(userId, shelves, entries);
      return { shelves, entries, fromCache: false };
    } catch (err) {
      const cached = await readCachedLibrary(userId);
      if (cached) return cached;
      throw err;
    }
  }

  const cached = await readCachedLibrary(userId);
  if (!cached) {
    throw new Error('Offline — немає збереженої бібліотеки. Підключись до інternet хоча б раз.');
  }
  return cached;
}

export async function createShelf(
  userId: string,
  name: string,
  statusFilter: BookEntryStatus | null,
  sortOrder: number,
): Promise<UserShelf> {
  const id = crypto.randomUUID();
  const timestamp = nowIso();
  const shelf: UserShelf = {
    id,
    user_id: userId,
    name,
    description: null,
    sort_order: sortOrder,
    status_filter: statusFilter,
    color: null,
    icon: null,
    created_at: timestamp,
    updated_at: timestamp,
  };

  await offlineDb.shelves.put(shelf);

  if (isOnline()) {
    const { data, error } = await supabase
      .from('user_shelves')
      .insert({
        id,
        user_id: userId,
        name,
        status_filter: statusFilter,
        sort_order: sortOrder,
      })
      .select()
      .single();
    if (error) throw error;
    await offlineDb.shelves.put(data as UserShelf);
    return data as UserShelf;
  }

  await enqueue(userId, {
    table: 'user_shelves',
    operation: 'insert',
    payload: { id, user_id: userId, name, status_filter: statusFilter, sort_order: sortOrder },
  });
  return shelf;
}

export async function deleteShelf(userId: string, shelfId: string) {
  await offlineDb.shelves.delete(shelfId);
  const affected = await offlineDb.entries.where('shelf_id').equals(shelfId).toArray();
  for (const entry of affected) {
    await offlineDb.entries.update(entry.id, { shelf_id: null });
  }

  if (isOnline()) {
    const { error } = await supabase.from('user_shelves').delete().eq('id', shelfId);
    if (error) throw error;
    return;
  }

  await enqueue(userId, { table: 'user_shelves', operation: 'delete', payload: { id: shelfId } });
}

export async function addBook(
  userId: string,
  shelfId: string,
  payload: {
    title: string;
    authors: string[];
    coverUrl: string | null;
    pageCount: number | null;
    publishedYear: number | null;
    externalIds: Record<string, string>;
    status: BookEntryStatus;
  },
) {
  const bookId = crypto.randomUUID();
  const entryId = crypto.randomUUID();

  const book = {
    id: bookId,
    title: payload.title,
    subtitle: null,
    authors: payload.authors,
    cover_url: payload.coverUrl,
    page_count: payload.pageCount,
    published_year: payload.publishedYear,
    language: null,
    external_ids: payload.externalIds,
  };

  const entry: UserBookEntry = {
    id: entryId,
    user_id: userId,
    book_id: bookId,
    shelf_id: shelfId,
    status: payload.status,
    format: null,
    rating: null,
    current_page: 0,
    total_pages: payload.pageCount,
    total_minutes: 0,
    started_on: null,
    finished_on: null,
    counts_toward_stats: true,
    book,
  };

  await offlineDb.books.put(book);
  await offlineDb.entries.put(entry);

  if (isOnline()) {
    const { data: bookRow, error: bookError } = await supabase
      .from('books')
      .insert({
        id: bookId,
        title: payload.title,
        authors: payload.authors,
        cover_url: payload.coverUrl,
        page_count: payload.pageCount,
        published_year: payload.publishedYear,
        external_ids: payload.externalIds,
        metadata_source: Object.keys(payload.externalIds).length ? 'open_library' : 'manual',
        created_by: userId,
      })
      .select()
      .single();
    if (bookError) throw bookError;

    const { error: entryError } = await supabase.from('user_book_entries').insert({
      id: entryId,
      user_id: userId,
      book_id: bookRow.id,
      shelf_id: shelfId,
      status: payload.status,
      total_pages: payload.pageCount,
    });
    if (entryError) throw entryError;
    return;
  }

  await enqueue(userId, {
    table: 'books',
    operation: 'insert',
    payload: {
      id: bookId,
      title: payload.title,
      authors: payload.authors,
      cover_url: payload.coverUrl,
      page_count: payload.pageCount,
      published_year: payload.publishedYear,
      external_ids: payload.externalIds,
      metadata_source: Object.keys(payload.externalIds).length ? 'open_library' : 'manual',
      created_by: userId,
    },
  });
  await enqueue(userId, {
    table: 'user_book_entries',
    operation: 'insert',
    payload: {
      id: entryId,
      user_id: userId,
      book_id: bookId,
      shelf_id: shelfId,
      status: payload.status,
      total_pages: payload.pageCount,
    },
  });
}

export async function updateEntry(userId: string, entryId: string, patch: Record<string, unknown>) {
  const existing = await offlineDb.entries.get(entryId);
  if (existing) {
    await offlineDb.entries.put({ ...existing, ...patch, updated_at: nowIso() } as UserBookEntry);
  }

  if (isOnline()) {
    const { error } = await supabase.from('user_book_entries').update(patch).eq('id', entryId);
    if (error) throw error;
    return;
  }

  await enqueue(userId, {
    table: 'user_book_entries',
    operation: 'update',
    payload: { id: entryId, ...patch },
  });
}

export async function renameShelf(userId: string, shelfId: string, name: string) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Назва полиці не може бути порожньою');

  const existing = await offlineDb.shelves.get(shelfId);
  if (existing) {
    await offlineDb.shelves.put({ ...existing, name: trimmed, updated_at: nowIso() });
  }

  if (isOnline()) {
    const { error } = await supabase
      .from('user_shelves')
      .update({ name: trimmed, updated_at: nowIso() })
      .eq('id', shelfId);
    if (error) throw error;
    return;
  }

  await enqueue(userId, {
    table: 'user_shelves',
    operation: 'update',
    payload: { id: shelfId, name: trimmed },
  });
}

export async function reorderShelves(userId: string, orderedIds: string[]) {
  await Promise.all(orderedIds.map((id, index) => updateShelfOrder(userId, id, index)));
}

export async function updateShelfOrder(userId: string, shelfId: string, sortOrder: number) {
  const existing = await offlineDb.shelves.get(shelfId);
  if (existing) {
    await offlineDb.shelves.put({ ...existing, sort_order: sortOrder, updated_at: nowIso() });
  }

  if (isOnline()) {
    const { error } = await supabase
      .from('user_shelves')
      .update({ sort_order: sortOrder })
      .eq('id', shelfId);
    if (error) throw error;
    return;
  }

  await enqueue(userId, {
    table: 'user_shelves',
    operation: 'update',
    payload: { id: shelfId, sort_order: sortOrder },
  });
}

export async function fetchSessions(entryId: string): Promise<ReadingSession[]> {
  if (isOnline()) {
    const { data, error } = await supabase
      .from('reading_sessions')
      .select('*')
      .eq('entry_id', entryId)
      .order('started_at', { ascending: false });
    if (error) throw error;
    const sessions = (data as ReadingSession[]) ?? [];
    await offlineDb.transaction('rw', offlineDb.sessions, async () => {
      const old = await offlineDb.sessions.where('entry_id').equals(entryId).primaryKeys();
      await offlineDb.sessions.bulkDelete(old);
      await offlineDb.sessions.bulkPut(sessions);
    });
    return sessions;
  }

  return offlineDb.sessions.where('entry_id').equals(entryId).reverse().sortBy('started_at');
}

async function sumSessionMinutes(entryId: string): Promise<number> {
  const sessions = await offlineDb.sessions.where('entry_id').equals(entryId).toArray();
  return sessions.reduce((sum, session) => sum + session.minutes, 0);
}

async function patchEntryProgress(
  entryId: string,
  patch: Pick<UserBookEntry, 'current_page' | 'total_minutes'>,
): Promise<UserBookEntry | null> {
  const entry = await offlineDb.entries.get(entryId);
  if (!entry) return null;
  const updated = { ...entry, ...patch, updated_at: nowIso() };
  await offlineDb.entries.put(updated);
  return updated;
}

export async function addSession(
  userId: string,
  entryId: string,
  payload: { sessionDate: string; pages: number; minutes: number; note: string | null },
) {
  const id = crypto.randomUUID();
  const session: ReadingSession = {
    id,
    entry_id: entryId,
    user_id: userId,
    started_at: `${payload.sessionDate}T12:00:00`,
    ended_at: null,
    pages_read: payload.pages,
    minutes: payload.minutes,
    note: payload.note,
    created_at: nowIso(),
  };

  await offlineDb.sessions.put(session);

  const entry = await offlineDb.entries.get(entryId);
  if (entry) {
    const nextPage = payload.pages > 0 ? entry.current_page + payload.pages : entry.current_page;
    await offlineDb.entries.put({
      ...entry,
      current_page: nextPage,
      total_minutes: entry.total_minutes + payload.minutes,
      updated_at: nowIso(),
    });
  }

  if (isOnline()) {
    const { error } = await supabase.from('reading_sessions').insert({
      id,
      entry_id: entryId,
      user_id: userId,
      started_at: session.started_at,
      pages_read: payload.pages,
      minutes: payload.minutes,
      note: payload.note,
    });
    if (error) throw error;
    if (entry && payload.pages > 0) {
      const { error: pageError } = await supabase
        .from('user_book_entries')
        .update({ current_page: entry.current_page + payload.pages })
        .eq('id', entryId);
      if (pageError) throw pageError;
    }
    await fetchEntry(entryId);
    return;
  }

  await enqueue(userId, {
    table: 'reading_sessions',
    operation: 'insert',
    payload: {
      id,
      entry_id: entryId,
      user_id: userId,
      started_at: session.started_at,
      pages_read: payload.pages,
      minutes: payload.minutes,
      note: payload.note,
    },
  });

  if (entry && (payload.pages > 0 || payload.minutes > 0)) {
    const entryPatch: { id: string; current_page?: number; total_minutes?: number } = { id: entryId };
    if (payload.pages > 0) entryPatch.current_page = entry.current_page + payload.pages;
    if (payload.minutes > 0) entryPatch.total_minutes = entry.total_minutes + payload.minutes;
    await enqueue(userId, {
      table: 'user_book_entries',
      operation: 'update',
      payload: entryPatch,
    });
  }
}

export async function deleteSession(userId: string, sessionId: string, entryId: string) {
  let session = await offlineDb.sessions.get(sessionId);

  if (!session && isOnline()) {
    const { data, error } = await supabase
      .from('reading_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();
    if (error) throw error;
    session = data as ReadingSession;
  }

  await offlineDb.sessions.delete(sessionId);

  const entry = await offlineDb.entries.get(entryId);
  if (entry && session) {
    const totalMinutes = await sumSessionMinutes(entryId);
    const currentPage = Math.max(0, entry.current_page - session.pages_read);
    await patchEntryProgress(entryId, { current_page: currentPage, total_minutes: totalMinutes });

    if (isOnline()) {
      const { error } = await supabase.from('reading_sessions').delete().eq('id', sessionId);
      if (error) throw error;
      const { error: pageError } = await supabase
        .from('user_book_entries')
        .update({ current_page: currentPage })
        .eq('id', entryId);
      if (pageError) throw pageError;
      await fetchEntry(entryId);
      return;
    }

    await enqueue(userId, {
      table: 'reading_sessions',
      operation: 'delete',
      payload: { id: sessionId, entry_id: entryId },
    });
    await enqueue(userId, {
      table: 'user_book_entries',
      operation: 'update',
      payload: { id: entryId, current_page: currentPage, total_minutes: totalMinutes },
    });
    return;
  }

  if (isOnline()) {
    const { error } = await supabase.from('reading_sessions').delete().eq('id', sessionId);
    if (error) throw error;
    await fetchEntry(entryId);
    return;
  }

  await enqueue(userId, {
    table: 'reading_sessions',
    operation: 'delete',
    payload: { id: sessionId, entry_id: entryId },
  });
}

async function executeOp(op: PendingOp) {
  switch (op.operation) {
    case 'insert':
      if (
        op.table === 'user_shelves' ||
        op.table === 'books' ||
        op.table === 'user_book_entries' ||
        op.table === 'reading_sessions'
      ) {
        const { error } = await supabase.from(op.table).insert(op.payload);
        if (error) throw error;
      }
      break;
    case 'update': {
      const { id, ...patch } = op.payload as { id: string };
      const { error } = await supabase.from(op.table).update(patch).eq('id', id);
      if (error) throw error;
      break;
    }
    case 'delete': {
      if (op.table === 'active_reading_sessions') {
        const { user_id } = op.payload as { user_id: string };
        const { error } = await supabase
          .from('active_reading_sessions')
          .delete()
          .eq('user_id', user_id);
        if (error) throw error;
        break;
      }
      const { id } = op.payload as { id: string };
      const { error } = await supabase.from(op.table).delete().eq('id', id);
      if (error) throw error;
      break;
    }
  }
}

export async function flushPendingOps(userId: string): Promise<{ synced: number; failed: number }> {
  if (!isOnline()) return { synced: 0, failed: 0 };

  await flushActiveSession(userId);

  const ops = await offlineDb.pendingOps.where('userId').equals(userId).sortBy('createdAt');
  let synced = 0;
  let failed = 0;

  for (const op of ops) {
    try {
      await executeOp(op);
      await offlineDb.pendingOps.delete(op.id);
      synced++;
    } catch {
      failed++;
    }
  }

  if (synced > 0) {
    await fetchLibrary(userId);
  }

  return { synced, failed };
}

export async function fetchEntry(entryId: string): Promise<UserBookEntry | null> {
  if (isOnline()) {
    const { data, error } = await supabase.from('user_book_entries').select(ENTRY_SELECT).eq('id', entryId).single();
    if (error) throw error;
    const entry = data as unknown as UserBookEntry;
    if (entry) await offlineDb.entries.put(entry);
    return entry;
  }
  const cached = await offlineDb.entries.get(entryId);
  if (!cached) return null;
  const book = cached.book ?? (await offlineDb.books.get(cached.book_id));
  return { ...cached, book };
}
