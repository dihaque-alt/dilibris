import type { OpenLibraryHit } from '../types/database';

const SEARCH_URL = 'https://openlibrary.org/search.json';

export async function searchOpenLibrary(query: string): Promise<OpenLibraryHit[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const params = new URLSearchParams({
    q: trimmed,
    limit: '12',
    fields: 'key,title,author_name,cover_i,first_publish_year,number_of_pages_median,language',
  });

  const res = await fetch(`${SEARCH_URL}?${params}`);
  if (!res.ok) throw new Error('Open Library тимчасово недоступна');

  const data = (await res.json()) as { docs?: OpenLibraryHit[] };
  return data.docs ?? [];
}

export function openLibraryCoverUrl(coverId?: number, size: 'S' | 'M' | 'L' = 'M'): string | null {
  if (!coverId) return null;
  return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`;
}

export function openLibraryWorkId(key: string): string {
  return key.replace(/^\//, '');
}
