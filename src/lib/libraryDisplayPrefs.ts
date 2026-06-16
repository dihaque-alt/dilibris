export type BookViewMode = 'spine' | 'cover';
export type BookSizePreset = 'compact' | 'cozy' | 'grand';

export interface LibraryDisplayPrefs {
  bookView: BookViewMode;
  bookSize: BookSizePreset;
  hoverTitles: boolean;
  realCovers: boolean;
}

const STORAGE_KEY = (userId: string) => `dilibris_library_display_${userId}`;

export const BOOK_WIDTH_BY_SIZE: Record<BookSizePreset, number> = {
  compact: 78,
  cozy: 100,
  grand: 124,
};

const DEFAULTS: LibraryDisplayPrefs = {
  bookView: 'spine',
  bookSize: 'cozy',
  hoverTitles: true,
  realCovers: true,
};

export function loadLibraryDisplayPrefs(userId: string): LibraryDisplayPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY(userId));
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return { ...DEFAULTS };
}

export function saveLibraryDisplayPrefs(userId: string, prefs: LibraryDisplayPrefs) {
  localStorage.setItem(STORAGE_KEY(userId), JSON.stringify(prefs));
  window.dispatchEvent(new CustomEvent('dilibris:library-display'));
}

export function bookWidthForPrefs(prefs: LibraryDisplayPrefs): number {
  return BOOK_WIDTH_BY_SIZE[prefs.bookSize];
}
