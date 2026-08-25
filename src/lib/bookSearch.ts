import { type BookSearchHit, searchGoogleBooks } from './googleBooks';
import { normalizeIsbnQuery, openLibraryHitToSearchHit, searchOpenLibrary } from './openLibrary';

const CYRILLIC_RE = /[\u0400-\u04FF]/;
const MERGE_LIMIT = 24;

export function hasCyrillic(text: string): boolean {
  return CYRILLIC_RE.test(text);
}

function hitDedupeKey(hit: BookSearchHit): string {
  const isbn = hit.externalIds.isbn_13 ?? hit.externalIds.isbn_10;
  if (isbn) return `isbn:${isbn.replace(/[^0-9Xx]/g, '')}`;
  const title = hit.title.toLowerCase().replace(/\s+/g, ' ').trim();
  const author = (hit.authors[0] ?? '').toLowerCase().replace(/\s+/g, ' ').trim();
  return `ta:${title}|${author}`;
}

/** Prefer earlier hits (Open Library first) when the same book appears in both catalogs. */
export function mergeBookSearchHits(...groups: BookSearchHit[][]): BookSearchHit[] {
  const merged: BookSearchHit[] = [];
  const seen = new Set<string>();

  for (const group of groups) {
    for (const hit of group) {
      const key = hitDedupeKey(hit);
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(hit);
      if (merged.length >= MERGE_LIMIT) return merged;
    }
  }

  return merged;
}

export interface BookSearchResult {
  hits: BookSearchHit[];
  sources: BookSearchHit['source'][];
}

async function fetchOpenLibraryHits(query: string, preferUkrainian = false): Promise<BookSearchHit[]> {
  try {
    return (await searchOpenLibrary(query, { preferUkrainian })).map(openLibraryHitToSearchHit);
  } catch {
    return [];
  }
}

async function fetchGoogleBooksHits(
  query: string,
  options?: { isbn?: string | null; preferUkrainian?: boolean },
): Promise<BookSearchHit[]> {
  try {
    return await searchGoogleBooks(query, options);
  } catch {
    return [];
  }
}

export async function searchBooksCombined(query: string): Promise<BookSearchResult> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return { hits: [], sources: [] };

  const isbn = normalizeIsbnQuery(trimmed);
  const preferUkrainian = hasCyrillic(trimmed);

  if (isbn) {
    const [olHits, gbHits] = await Promise.all([
      fetchOpenLibraryHits(trimmed),
      fetchGoogleBooksHits(trimmed, { isbn, preferUkrainian }),
    ]);
    const hits = mergeBookSearchHits(olHits, gbHits);
    return { hits, sources: [...new Set(hits.map((h) => h.source))] };
  }

  const tasks: Promise<BookSearchHit[]>[] = [
    fetchOpenLibraryHits(trimmed),
    fetchGoogleBooksHits(trimmed),
  ];

  if (preferUkrainian) {
    tasks.push(fetchOpenLibraryHits(trimmed, true));
    tasks.push(fetchGoogleBooksHits(trimmed, { preferUkrainian: true }));
  }

  const groups = await Promise.all(tasks);
  const hits = mergeBookSearchHits(...groups);
  return { hits, sources: [...new Set(hits.map((h) => h.source))] };
}

export const BOOK_SEARCH_SOURCE_LABELS: Record<BookSearchHit['source'], string> = {
  open_library: 'Open Library',
  google_books: 'Google Books',
};

export function formatBookSearchSources(sources: BookSearchHit['source'][]): string {
  if (!sources.length) return '';
  return `Джерела: ${sources.map((s) => BOOK_SEARCH_SOURCE_LABELS[s]).join(' · ')}`;
}
