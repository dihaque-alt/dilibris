/** Canonical codes stored in `books.language`; labels shown in UI and stats. */
export const BOOK_LANGUAGE_OPTIONS = [
  { code: 'ukr', label: 'Українська' },
  { code: 'eng', label: 'Англійська' },
  { code: 'pol', label: 'Польська' },
  { code: 'deu', label: 'Німецька' },
  { code: 'fra', label: 'Французька' },
  { code: 'rus', label: 'Російська' },
] as const;

const LANGUAGE_LABELS: Record<string, string> = Object.fromEntries(
  BOOK_LANGUAGE_OPTIONS.flatMap(({ code, label }) => [
    [code, label],
    [code.slice(0, 2), label],
  ]),
);

export function normalizeLanguageCode(raw: string): string {
  return raw.trim().toLowerCase().replace(/^\/languages\//, '');
}

export function formatLanguageLabel(raw: string | null | undefined): string {
  if (!raw?.trim()) return 'Мова не вказана';
  const key = normalizeLanguageCode(raw);
  return LANGUAGE_LABELS[key] ?? raw.trim();
}

export function pickOpenLibraryLanguage(codes?: string[]): string | null {
  if (!codes?.length) return null;
  const normalized = codes.map(normalizeLanguageCode);
  if (normalized.includes('ukr') || normalized.includes('uk')) return 'ukr';
  return normalized[0] ?? null;
}

/** ISO 639-1 from Google Books → canonical `books.language` code. */
export function pickGoogleBooksLanguage(code?: string | null): string | null {
  if (!code?.trim()) return null;
  const n = normalizeLanguageCode(code);
  const iso2 = n.length === 2 ? n : n.slice(0, 2);
  const map: Record<string, string> = {
    uk: 'ukr',
    en: 'eng',
    pl: 'pol',
    de: 'deu',
    fr: 'fra',
    ru: 'rus',
  };
  return map[iso2] ?? (BOOK_LANGUAGE_OPTIONS.some((o) => o.code === n) ? n : iso2);
}
