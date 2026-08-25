import type { OpenLibraryHit } from '../types/database';
import type { BookSearchHit } from './googleBooks';
import { pickOpenLibraryLanguage } from './language';

const SEARCH_URL = 'https://openlibrary.org/search.json';
const COVER_CACHE_PREFIX = 'dl-ol-cover:v1:';

const coverMem = new Map<string, number | null>();
const coverInflight = new Map<string, Promise<number | null>>();

export function normalizeIsbnQuery(raw: string): string | null {
  const cleaned = raw.replace(/[^0-9Xx]/g, '');
  if (cleaned.length === 10 || cleaned.length === 13) return cleaned;
  return null;
}

function coverLookupKey(title: string, author: string): string {
  return `${title}|${author}`.toLowerCase();
}

function readCoverCache(key: string): number | null | undefined {
  if (coverMem.has(key)) return coverMem.get(key)!;
  try {
    const raw = sessionStorage.getItem(`${COVER_CACHE_PREFIX}${key}`);
    if (raw === null) return undefined;
    if (raw === '') return null;
    const id = Number(raw);
    coverMem.set(key, Number.isFinite(id) ? id : null);
    return coverMem.get(key)!;
  } catch {
    return undefined;
  }
}

function writeCoverCache(key: string, coverId: number | null) {
  coverMem.set(key, coverId);
  try {
    sessionStorage.setItem(`${COVER_CACHE_PREFIX}${key}`, coverId == null ? '' : String(coverId));
  } catch {
    /* ignore quota */
  }
}

export async function searchOpenLibrary(
  query: string,
  options?: { preferUkrainian?: boolean },
): Promise<OpenLibraryHit[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const isbn = normalizeIsbnQuery(trimmed);
  const params = new URLSearchParams({
    limit: '12',
    fields:
      'key,title,author_name,cover_i,first_publish_year,number_of_pages_median,language,isbn',
  });

  if (isbn) params.set('isbn', isbn);
  else {
    const q = options?.preferUkrainian ? `${trimmed} language:ukr` : trimmed;
    params.set('q', q);
  }

  const res = await fetch(`${SEARCH_URL}?${params}`);
  if (!res.ok) throw new Error('Open Library / Google Books тимчасово недоступні');

  const data = (await res.json()) as { docs?: OpenLibraryHit[] };
  return data.docs ?? [];
}

export async function findOpenLibraryCoverId(
  title: string,
  authors: string[],
): Promise<number | null> {
  const author = authors[0]?.trim() ?? '';
  if (!title.trim()) return null;

  const key = coverLookupKey(title, author);
  const cached = readCoverCache(key);
  if (cached !== undefined) return cached;

  if (coverInflight.has(key)) return coverInflight.get(key)!;

  const params = new URLSearchParams({
    title: title.trim(),
    limit: '1',
    fields: 'cover_i',
  });
  if (author) params.set('author', author);

  const task = fetch(`${SEARCH_URL}?${params}`)
    .then((res) => (res.ok ? res.json() : null))
    .then((data: { docs?: { cover_i?: number }[] } | null) => {
      const coverId = data?.docs?.[0]?.cover_i ?? null;
      writeCoverCache(key, coverId);
      return coverId;
    })
    .catch(() => {
      writeCoverCache(key, null);
      return null;
    })
    .finally(() => {
      coverInflight.delete(key);
    });

  coverInflight.set(key, task);
  return task;
}

export function openLibraryCoverUrl(coverId?: number, size: 'S' | 'M' | 'L' = 'M'): string | null {
  if (!coverId) return null;
  return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`;
}

export function openLibraryIsbnCoverUrl(isbn: string, size: 'S' | 'M' | 'L' = 'M'): string {
  const raw = isbn.replace(/[^0-9Xx]/g, '');
  return `https://covers.openlibrary.org/b/isbn/${raw}-${size}.jpg`;
}

export async function resolveOpenLibraryCoverUrl(
  meta: {
    title: string;
    authors: string[];
    externalIds?: Record<string, string>;
  },
  size: 'S' | 'M' | 'L' = 'M',
): Promise<string | null> {
  const isbn = meta.externalIds?.isbn_13 || meta.externalIds?.isbn_10;
  if (isbn) return openLibraryIsbnCoverUrl(isbn, size);

  const coverId = await findOpenLibraryCoverId(meta.title, meta.authors);
  return openLibraryCoverUrl(coverId ?? undefined, size);
}

export function openLibraryWorkId(key: string): string {
  return key.replace(/^\//, '');
}

function pickIsbnValues(hit: OpenLibraryHit): { isbn10?: string; isbn13?: string } {
  const values = hit.isbn ?? [];
  let isbn10: string | undefined;
  let isbn13: string | undefined;

  for (const raw of values) {
    const cleaned = raw.replace(/[^0-9Xx]/g, '');
    if (cleaned.length === 13 && !isbn13) isbn13 = cleaned;
    if (cleaned.length === 10 && !isbn10) isbn10 = cleaned;
  }

  return { isbn10, isbn13 };
}

export function openLibraryHitToSearchHit(hit: OpenLibraryHit): BookSearchHit {
  const { isbn10, isbn13 } = pickIsbnValues(hit);
  const externalIds: Record<string, string> = {
    open_library: openLibraryWorkId(hit.key),
  };
  if (isbn13) externalIds.isbn_13 = isbn13;
  if (isbn10) externalIds.isbn_10 = isbn10;

  return {
    id: hit.key,
    source: 'open_library',
    title: hit.title,
    authors: hit.author_name ?? [],
    coverUrl: openLibraryCoverUrl(hit.cover_i, 'L'),
    pageCount: hit.number_of_pages_median ?? null,
    publishedYear: hit.first_publish_year ?? null,
    language: pickOpenLibraryLanguage(hit.language),
    externalIds,
  };
}

export function metadataSourceFromExternalIds(
  externalIds: Record<string, string>,
): 'open_library' | 'google_books' | 'goodreads' | 'manual' {
  if (externalIds.open_library) return 'open_library';
  if (externalIds.google_books) return 'google_books';
  if (externalIds.goodreads) return 'goodreads';
  return Object.keys(externalIds).length ? 'manual' : 'manual';
}
