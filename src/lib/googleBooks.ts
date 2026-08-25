import { normalizeIsbnQuery } from './openLibrary';
import { pickGoogleBooksLanguage } from './language';

export interface BookSearchHit {
  id: string;
  source: 'open_library' | 'google_books';
  title: string;
  authors: string[];
  coverUrl: string | null;
  pageCount: number | null;
  publishedYear: number | null;
  language: string | null;
  externalIds: Record<string, string>;
}

interface GoogleVolumeItem {
  id: string;
  volumeInfo?: {
    title?: string;
    authors?: string[];
    pageCount?: number;
    publishedDate?: string;
    language?: string;
    industryIdentifiers?: Array<{ type?: string; identifier?: string }>;
    imageLinks?: {
      thumbnail?: string;
      smallThumbnail?: string;
    };
  };
}

const SEARCH_URL = 'https://www.googleapis.com/books/v1/volumes';

function httpsCover(url: string | undefined): string | null {
  if (!url) return null;
  return url.replace(/^http:\/\//i, 'https://');
}

function parsePublishedYear(raw?: string): number | null {
  if (!raw) return null;
  const year = parseInt(raw.slice(0, 4), 10);
  return Number.isFinite(year) ? year : null;
}

function pickGoogleIsbns(identifiers?: Array<{ type?: string; identifier?: string }>): {
  isbn10?: string;
  isbn13?: string;
} {
  let isbn10: string | undefined;
  let isbn13: string | undefined;

  for (const item of identifiers ?? []) {
    const cleaned = item.identifier?.replace(/[^0-9Xx]/g, '') ?? '';
    if (item.type === 'ISBN_13' && cleaned.length === 13 && !isbn13) isbn13 = cleaned;
    if (item.type === 'ISBN_10' && cleaned.length === 10 && !isbn10) isbn10 = cleaned;
  }

  return { isbn10, isbn13 };
}

function mapGoogleItem(item: GoogleVolumeItem): BookSearchHit | null {
  const info = item.volumeInfo;
  const title = info?.title?.trim();
  if (!title || !info) return null;

  const coverUrl =
    httpsCover(info.imageLinks?.thumbnail) ?? httpsCover(info.imageLinks?.smallThumbnail);
  const { isbn10, isbn13 } = pickGoogleIsbns(info.industryIdentifiers);
  const externalIds: Record<string, string> = { google_books: item.id };
  if (isbn13) externalIds.isbn_13 = isbn13;
  if (isbn10) externalIds.isbn_10 = isbn10;

  return {
    id: item.id,
    source: 'google_books',
    title,
    authors: info.authors ?? [],
    coverUrl,
    pageCount: info.pageCount && info.pageCount > 0 ? info.pageCount : null,
    publishedYear: parsePublishedYear(info.publishedDate),
    language: pickGoogleBooksLanguage(info.language),
    externalIds,
  };
}

export async function searchGoogleBooks(
  query: string,
  options?: { isbn?: string | null; preferUkrainian?: boolean },
): Promise<BookSearchHit[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const isbn = options?.isbn ?? normalizeIsbnQuery(trimmed);
  const params = new URLSearchParams({
    q: isbn ? `isbn:${isbn}` : trimmed,
    maxResults: '12',
    printType: 'books',
    projection: 'lite',
  });

  if (options?.preferUkrainian) params.set('langRestrict', 'uk');

  const res = await fetch(`${SEARCH_URL}?${params}`);
  if (!res.ok) throw new Error('Open Library / Google Books тимчасово недоступні');

  const data = (await res.json()) as { items?: GoogleVolumeItem[] };
  return (data.items ?? []).map(mapGoogleItem).filter((hit): hit is BookSearchHit => hit !== null);
}
