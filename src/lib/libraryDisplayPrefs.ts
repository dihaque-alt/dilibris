import { loadCachedAppPrefs, saveAppPrefs } from './appPrefs';

export type BookViewMode = 'spine' | 'cover';
export type BookSizePreset = 'compact' | 'cozy' | 'grand';

export interface LibraryDisplayPrefs {
  bookView: BookViewMode;
  bookSize: BookSizePreset;
  hoverTitles: boolean;
  realCovers: boolean;
}

export const BOOK_WIDTH_BY_SIZE: Record<BookSizePreset, number> = {
  compact: 78,
  cozy: 100,
  grand: 124,
};

export const BOOK_SIZE_LABELS: Record<BookSizePreset, string> = {
  compact: 'Компактно',
  cozy: 'Затишно',
  grand: 'Велично',
};

export function loadLibraryDisplayPrefs(userId: string): LibraryDisplayPrefs {
  return loadCachedAppPrefs(userId).libraryDisplay;
}

export async function saveLibraryDisplayPrefs(userId: string, prefs: LibraryDisplayPrefs): Promise<void> {
  await saveAppPrefs(userId, { libraryDisplay: prefs });
  window.dispatchEvent(new CustomEvent('dilibris:library-display'));
}

export function bookWidthForPrefs(prefs: LibraryDisplayPrefs): number {
  return BOOK_WIDTH_BY_SIZE[prefs.bookSize];
}
