import { supabase } from '../supabase';
import type { Note, NoteType, NoteVisibility, UserBookEntry } from '../../types/database';
import { offlineDb, isOnline, nowIso, type PendingOp } from './db';

export type NoteWritePayload = {
  note_type: NoteType;
  visibility: NoteVisibility;
  body: string;
  page_number: number | null;
  chapter: string | null;
  contains_spoilers: boolean;
};

export type NotesForEntry = {
  ownNotes: Note[];
  publicNotes: Note[];
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

async function pendingNoteIds(userId: string): Promise<Set<string>> {
  const ops = await offlineDb.pendingOps.where('userId').equals(userId).toArray();
  return new Set(
    ops
      .filter((op) => op.table === 'notes')
      .map((op) => (op.payload as { id: string }).id)
      .filter(Boolean),
  );
}

async function cacheEntryNotes(userId: string, entryId: string, bookId: string, own: Note[], pub: Note[]) {
  const keep = await pendingNoteIds(userId);

  const oldOwnIds = await offlineDb.notes
    .where('entry_id')
    .equals(entryId)
    .filter((n) => n.user_id === userId)
    .primaryKeys();
  const oldPublicIds = await offlineDb.notes
    .where('book_id')
    .equals(bookId)
    .filter((n) => n.visibility === 'public' && n.user_id !== userId && n.buddy_read_id == null)
    .primaryKeys();

  const deleteIds = [...oldOwnIds, ...oldPublicIds].filter((id) => !keep.has(id));
  if (deleteIds.length > 0) {
    await offlineDb.notes.bulkDelete(deleteIds);
  }

  if (own.length + pub.length > 0) {
    await offlineDb.notes.bulkPut([...own, ...pub]);
  }
}

async function readCachedEntryNotes(
  userId: string,
  entryId: string,
  bookId: string,
): Promise<NotesForEntry> {
  const ownNotes = await offlineDb.notes
    .where('entry_id')
    .equals(entryId)
    .filter((n) => n.user_id === userId && n.buddy_read_id == null)
    .reverse()
    .sortBy('created_at');

  const publicNotes = await offlineDb.notes
    .where('book_id')
    .equals(bookId)
    .filter((n) => n.visibility === 'public' && n.user_id !== userId && n.buddy_read_id == null)
    .reverse()
    .sortBy('created_at');

  return { ownNotes, publicNotes, fromCache: true };
}

export async function fetchNotesForEntry(
  userId: string,
  entryId: string,
  bookId: string,
): Promise<NotesForEntry> {
  if (isOnline()) {
    try {
      const [ownResult, publicResult] = await Promise.all([
        supabase
          .from('notes')
          .select('*')
          .eq('entry_id', entryId)
          .eq('user_id', userId)
          .is('buddy_read_id', null)
          .order('created_at', { ascending: false }),
        supabase
          .from('notes')
          .select(`
            *,
            profile:profiles (display_name, avatar_url)
          `)
          .eq('book_id', bookId)
          .eq('visibility', 'public')
          .neq('user_id', userId)
          .is('buddy_read_id', null)
          .order('created_at', { ascending: false }),
      ]);

      if (ownResult.error) throw ownResult.error;
      if (publicResult.error) throw publicResult.error;

      const ownNotes = (ownResult.data as Note[]) ?? [];
      const publicNotes = (publicResult.data as Note[]) ?? [];
      await cacheEntryNotes(userId, entryId, bookId, ownNotes, publicNotes);
      return { ownNotes, publicNotes, fromCache: false };
    } catch {
      const cached = await readCachedEntryNotes(userId, entryId, bookId);
      if (cached.ownNotes.length > 0 || cached.publicNotes.length > 0) return cached;
      throw new Error('Offline — немає збережених нотаток. Підключись до інternet хоча б раз.');
    }
  }

  const cached = await readCachedEntryNotes(userId, entryId, bookId);
  if (cached.ownNotes.length === 0 && cached.publicNotes.length === 0) {
    throw new Error('Offline — немає збережених нотаток. Підключись до інternet хоча б раз.');
  }
  return cached;
}

export async function refreshUserNotesCache(userId: string): Promise<void> {
  if (!isOnline()) return;

  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .is('buddy_read_id', null)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const keep = await pendingNoteIds(userId);
  const remoteIds = new Set((data ?? []).map((n) => n.id));
  const localIds = await offlineDb.notes.where('user_id').equals(userId).primaryKeys();
  const staleLocal = localIds.filter((id) => !remoteIds.has(id) && !keep.has(id));
  if (staleLocal.length > 0) {
    await offlineDb.notes.bulkDelete(staleLocal);
  }

  if (data?.length) {
    await offlineDb.notes.bulkPut(data as Note[]);
  }
}

export async function saveNote(
  userId: string,
  entryId: string,
  bookId: string,
  noteId: string | null,
  payload: NoteWritePayload,
): Promise<Note> {
  const now = nowIso();
  const id = noteId ?? crypto.randomUUID();
  const existing = noteId ? await offlineDb.notes.get(noteId) : null;

  const note: Note = {
    id,
    user_id: userId,
    entry_id: entryId,
    book_id: bookId,
    buddy_read_id: null,
    note_type: payload.note_type,
    visibility: payload.visibility,
    body: payload.body,
    page_number: payload.page_number,
    chapter: payload.chapter,
    contains_spoilers: payload.contains_spoilers,
    created_at: existing?.created_at ?? now,
    updated_at: now,
  };

  await offlineDb.notes.put(note);

  if (isOnline()) {
    if (noteId) {
      const { error } = await supabase
        .from('notes')
        .update({ ...payload, updated_at: now })
        .eq('id', id)
        .eq('user_id', userId);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('notes').insert(note);
      if (error) throw error;
    }
    return note;
  }

  await enqueue(userId, {
    table: 'notes',
    operation: noteId ? 'update' : 'insert',
    payload: (noteId ? { id, ...payload, updated_at: now } : note) as Record<string, unknown>,
  });

  return note;
}

export async function deleteNote(userId: string, noteId: string): Promise<void> {
  await offlineDb.notes.delete(noteId);

  if (isOnline()) {
    const { error } = await supabase.from('notes').delete().eq('id', noteId).eq('user_id', userId);
    if (error) throw error;
    return;
  }

  await enqueue(userId, {
    table: 'notes',
    operation: 'delete',
    payload: { id: noteId },
  });
}

export async function executeNoteOp(op: PendingOp): Promise<void> {
  if (op.table !== 'notes') return;

  switch (op.operation) {
    case 'insert': {
      const { error } = await supabase.from('notes').insert(op.payload);
      if (error) throw error;
      break;
    }
    case 'update': {
      const row = op.payload as Record<string, unknown> & { id: string; updated_at: string };
      const { id, updated_at, ...patch } = row;
      const { data: remote, error: readError } = await supabase
        .from('notes')
        .select('updated_at')
        .eq('id', id)
        .maybeSingle();
      if (readError) throw readError;
      if (remote && new Date(remote.updated_at) > new Date(updated_at)) {
        return;
      }
      const { error } = await supabase
        .from('notes')
        .update({ ...patch, updated_at })
        .eq('id', id);
      if (error) throw error;
      break;
    }
    case 'delete': {
      const { id } = op.payload as { id: string };
      const { error } = await supabase.from('notes').delete().eq('id', id);
      if (error) throw error;
      break;
    }
  }
}

export interface NoteFeedItem {
  note: Note;
  entry: UserBookEntry;
}

export async function fetchAllUserNotes(userId: string): Promise<NoteFeedItem[]> {
  if (isOnline()) {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select(`
          *,
          entry:user_book_entries!inner (
            *,
            book:books (*)
          )
        `)
        .eq('user_id', userId)
        .is('buddy_read_id', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const items = (data ?? [])
        .map((row) => {
          const entry = row.entry as UserBookEntry | null;
          if (!entry) return null;
          const { entry: _e, ...note } = row;
          return { note: note as Note, entry };
        })
        .filter(Boolean) as NoteFeedItem[];

      if (items.length > 0) {
        await offlineDb.notes.bulkPut(items.map((item) => item.note));
      }

      return items;
    } catch {
      // fall through to cache
    }
  }

  const notes = await offlineDb.notes
    .where('user_id')
    .equals(userId)
    .filter((n) => n.buddy_read_id == null)
    .reverse()
    .sortBy('created_at');

  if (!notes.length) {
    throw new Error('Offline — немає збережених нотаток. Підключись до інternet хоча б раз.');
  }

  const items: NoteFeedItem[] = [];
  for (const note of notes) {
    const entryRaw = await offlineDb.entries.get(note.entry_id);
    if (!entryRaw) continue;
    const book = entryRaw.book ?? (await offlineDb.books.get(entryRaw.book_id));
    items.push({ note, entry: { ...entryRaw, book } });
  }

  return items;
}
