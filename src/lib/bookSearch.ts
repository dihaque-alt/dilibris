import { type BookSearchHit, searchGoogleBooks } from './googleBooks';
import { normalizeIsbnQuery, openLibraryHitToSearchHit, searchOpenLibrary } from './openLibrary';

const CYRILLIC_RE = /[\u0400-\u04FF]/;
const MERGE_LIMIT = 16;

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

/** Prefer Open Library hits when the same book appears in both catalogs. */
export function mergeBookSearchHits(
  primary: BookSearchHit[],
  secondary: BookSearchHit[],
): BookSearchHit[] {
  const merged: BookSearchHit[] = [];
  const seen = new Set<string>();

  for (const hit of [...primary, ...secondary]) {
    const key = hitDedupeKey(hit);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(hit);
    if (merged.length >= MERGE_LIMIT) break;
  }

  return merged;
}

export interface BookSearchResult {
  hits: BookSearchHit[];
  sources: BookSearchHit['source'][];
}

export async function searchBooksCombined(query: string): Promise<BookSearchResult> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return { hits: [], sources: [] };

  const isbn = normalizeIsbnQuery(trimmed);
  const preferUkrainian = hasCyrillic(trimmed);

  if (isbn) {
    const [olHits, gbHits] = await Promise.all([
      searchOpenLibrary(trimmed, { preferUkrainian })
        .then((hits) => hits.map(openLibraryHitToSearchHit))
        .catch(() => [] as BookSearchHit[]),
      searchGoogleBooks(trimmed, { isbn, preferUkrainian }).catch(() => [] as BookSearchHit[]),
    ]);
    const hits = mergeBookSearchHits(olHits, gbHits);
    return { hits, sources: [...new Set(hits.map((h) => h.source))] };
  }

  let olHits: BookSearchHit[] = [];
  try {
    olHits = (await searchOpenLibrary(trimmed, { preferUkrainian })).map(openLibraryHitToSearchHit);
  } catch {
    /* fall through */
  }

  let gbHits: BookSearchHit[] = [];
  if (olHits.length < 3 || preferUkrainian) {
    try {
      gbHits = await searchGoogleBooks(trimmed, { preferUkrainian });
    } catch {
      /* ignore */
    }
  }

  const hits = mergeBookSearchHits(olHits, gbHits);
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
