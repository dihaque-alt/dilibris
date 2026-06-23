import type { BookEntryStatus, ReadingFormat, UserBookEntry } from '../../types/database';
import { supabase } from '../supabase';
import { fetchLibrary } from '../offline/librarySync';
import { isOnline, nowIso, offlineDb } from '../offline/db';
import { ensureStatusShelf, reorganizeLibraryByStatus } from './reorganizeLibrary';
import type { GoodreadsCsvRow } from './parseCsv';
import { parseGoodreadsDate } from './parseCsv';

export type ImportProgress = {
  done: number;
  total: number;
  currentTitle: string;
};

export type ImportResult = {
  imported: number;
  skipped: number;
  failed: number;
  errors: string[];
};

const DNF_PATTERN = /\b(dnf|did-not-finish|abandoned|не дочит|кинула)\b/i;

function parseAuthors(row: GoodreadsCsvRow): string[] {
  const primary = row.author.trim();
  const extra = row.additionalAuthors
    .split(',')
    .map((a) => a.trim())
    .filter(Boolean);
  const all = primary ? [primary, ...extra] : extra;
  return all.length ? all : ['Невідомий автор'];
}

function mapGoodreadsRowStatus(row: GoodreadsCsvRow): BookEntryStatus {
  const shelves = row.bookshelves;
  const exclusive = row.exclusiveShelf.toLowerCase().trim();

  if (DNF_PATTERN.test(shelves)) return 'dnf';

  switch (exclusive) {
    case 'currently-reading':
      return 'reading';
    case 'read':
      return row.readCount > 1 ? 're_reading' : 'finished';
    case 'to-read':
      return 'want_to_read';
    default:
      return 'want_to_read';
  }
}

function mapFormat(binding: string): ReadingFormat | null {
  const b = binding.toLowerCase();
  if (b.includes('audio') || b.includes('audible')) {
    return 'audiobook';
  }
  if (b.includes('kindle') || b.includes('ebook') || b.includes('nook') || b.includes('digital')) {
    return 'ebook';
  }
  if (b.includes('paper') || b.includes('hardcover') || b.includes('paperback') || b.includes('mass market')) {
    return 'paper';
  }
  return null;
}

function isbnCoverUrl(isbn: string, isbn13: string): string | null {
  const raw = (isbn13 || isbn).replace(/[^0-9Xx]/g, '');
  if (raw.length < 10) return null;
  return `https://covers.openlibrary.org/b/isbn/${raw}-L.jpg`;
}

function existingGoodreadsIds(entries: UserBookEntry[]): Set<string> {
  const ids = new Set<string>();
  for (const entry of entries) {
    const grId = entry.book?.external_ids?.goodreads;
    if (grId) ids.add(grId);
  }
  return ids;
}

export { mapGoodreadsRowStatus };

async function importOneRow(
  userId: string,
  row: GoodreadsCsvRow,
  shelfId: string,
  status: BookEntryStatus,
): Promise<void> {
  const bookId = crypto.randomUUID();
  const entryId = crypto.randomUUID();
  const authors = parseAuthors(row);
  const externalIds: Record<string, string> = {};
  if (row.bookId) externalIds.goodreads = row.bookId;
  if (row.isbn13) externalIds.isbn_13 = row.isbn13.replace(/[^0-9Xx]/g, '');
  else if (row.isbn) externalIds.isbn_10 = row.isbn.replace(/[^0-9Xx]/g, '');

  const coverUrl = isbnCoverUrl(row.isbn, row.isbn13);
  const finishedOn = parseGoodreadsDate(row.dateRead);
  const startedOn = parseGoodreadsDate(row.dateAdded);
  const rating = row.myRating > 0 ? row.myRating : null;
  const format = mapFormat(row.binding);
  const totalPages = row.numPages;
  const isFinished = status === 'finished' || status === 're_reading';
  const currentPage = isFinished && totalPages ? totalPages : 0;

  const book = {
    id: bookId,
    title: row.title,
    subtitle: null,
    authors,
    cover_url: coverUrl,
    page_count: totalPages,
    published_year: row.yearPublished,
    language: null,
    external_ids: externalIds,
  };

  const entry: UserBookEntry = {
    id: entryId,
    user_id: userId,
    book_id: bookId,
    shelf_id: shelfId,
    status,
    format,
    rating,
    current_page: currentPage,
    total_pages: totalPages,
    total_minutes: 0,
    started_on: status === 'reading' || isFinished ? startedOn : null,
    finished_on: isFinished ? finishedOn ?? startedOn : null,
    counts_toward_stats: true,
    book,
  };

  await offlineDb.books.put(book);
  await offlineDb.entries.put(entry);

  if (!isOnline()) {
    throw new Error('Потрібен інтернет для імпорту з Goodreads.');
  }

  const { data: bookRow, error: bookError } = await supabase
    .from('books')
    .insert({
      id: bookId,
      title: row.title,
      authors,
      isbn_10: row.isbn || null,
      isbn_13: row.isbn13 || null,
      cover_url: coverUrl,
      page_count: totalPages,
      published_year: row.yearPublished,
      external_ids: externalIds,
      metadata_source: 'goodreads',
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
    status,
    format,
    rating,
    current_page: currentPage,
    total_pages: totalPages,
    started_on: entry.started_on,
    finished_on: entry.finished_on,
    counts_toward_stats: true,
  });
  if (entryError) throw entryError;

  if (row.myReview.trim()) {
    const reviewRating = rating ?? 3;
    await supabase.from('reviews').upsert(
      {
        user_id: userId,
        book_id: bookRow.id,
        entry_id: entryId,
        body: row.myReview.trim(),
        rating: reviewRating,
        contains_spoilers: row.spoiler,
        updated_at: nowIso(),
      },
      { onConflict: 'user_id,book_id' },
    );
  }

  if (row.privateNotes.trim()) {
    await supabase.from('notes').insert({
      user_id: userId,
      entry_id: entryId,
      book_id: bookRow.id,
      note_type: 'general',
      visibility: 'private',
      body: row.privateNotes.trim(),
      contains_spoilers: false,
    });
  }
}

export async function importGoodreadsLibrary(
  userId: string,
  rows: GoodreadsCsvRow[],
  onProgress?: (p: ImportProgress) => void,
): Promise<ImportResult> {
  if (!isOnline()) {
    throw new Error('Підключись до інтернету — імпорт працює лише онлайн.');
  }

  const library = await fetchLibrary(userId);
  const seen = existingGoodreadsIds(library.entries);
  const shelves = [...library.shelves];

  const result: ImportResult = { imported: 0, skipped: 0, failed: 0, errors: [] };
  const total = rows.length;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    onProgress?.({ done: i, total, currentTitle: row.title });

    if (row.bookId && seen.has(row.bookId)) {
      result.skipped++;
      continue;
    }

    try {
      const status = mapGoodreadsRowStatus(row);
      const shelfId = await ensureStatusShelf(userId, status, shelves);
      await importOneRow(userId, row, shelfId, status);
      if (row.bookId) seen.add(row.bookId);
      result.imported++;
    } catch (err) {
      result.failed++;
      const msg = err instanceof Error ? err.message : 'Невідома помилка';
      if (result.errors.length < 8) {
        result.errors.push(`«${row.title}»: ${msg}`);
      }
    }
  }

  onProgress?.({ done: total, total, currentTitle: '' });
  await reorganizeLibraryByStatus(userId);
  await fetchLibrary(userId);
  window.dispatchEvent(new CustomEvent('dilibris:library-imported'));

  return result;
}
