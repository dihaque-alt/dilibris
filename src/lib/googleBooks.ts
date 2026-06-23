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

function mapGoogleItem(item: GoogleVolumeItem): BookSearchHit | null {
  const info = item.volumeInfo;
  const title = info?.title?.trim();
  if (!title || !info) return null;

  const coverUrl =
    httpsCover(info.imageLinks?.thumbnail) ?? httpsCover(info.imageLinks?.smallThumbnail);

  return {
    id: item.id,
    source: 'google_books',
    title,
    authors: info.authors ?? [],
    coverUrl,
    pageCount: info.pageCount && info.pageCount > 0 ? info.pageCount : null,
    publishedYear: parsePublishedYear(info.publishedDate),
    language: pickGoogleBooksLanguage(info.language),
    externalIds: { google_books: item.id },
  };
}

export async function searchGoogleBooks(query: string): Promise<BookSearchHit[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const params = new URLSearchParams({
    q: trimmed,
    maxResults: '12',
    printType: 'books',
    projection: 'lite',
  });

  const res = await fetch(`${SEARCH_URL}?${params}`);
  if (!res.ok) throw new Error('Google Books тимчасово недоступний');

  const data = (await res.json()) as { items?: GoogleVolumeItem[] };
  return (data.items ?? []).map(mapGoogleItem).filter((hit): hit is BookSearchHit => hit !== null);
}
