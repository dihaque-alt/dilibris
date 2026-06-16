import { supabase } from './supabase';
import type { Note, UserBookEntry } from '../types/database';

export interface NoteFeedItem {
  note: Note;
  entry: UserBookEntry;
}

export async function fetchAllUserNotes(userId: string): Promise<NoteFeedItem[]> {
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

  return (data ?? [])
    .map((row) => {
      const entry = row.entry as UserBookEntry | null;
      if (!entry) return null;
      const { entry: _e, ...note } = row;
      return { note: note as Note, entry };
    })
    .filter(Boolean) as NoteFeedItem[];
}
