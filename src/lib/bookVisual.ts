/** Deterministic visual variation per book (matches handoff prototype/data.js). */

export interface CoverPalette {
  bg: string;
  ink: string;
  rule: string;
}

export interface BookVisualMeta {
  title: string;
  authors: string[];
  pageCount?: number | null;
  coverUrl?: string | null;
  entryId: string;
  cover: CoverPalette;
  ratio: number;
  scale: number;
  art: string;
  placeholder: boolean;
}

function hashSeed(input: string): number {
  let s = 0;
  for (let i = 0; i < input.length; i++) {
    s = (s * 131 + input.charCodeAt(i)) >>> 0;
  }
  return s || 1;
}

export function makeRng(seed: string): () => number {
  let s = hashSeed(seed);
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const RATIOS = [1.46, 1.52, 1.58, 1.42, 1.55, 1.48, 1.6, 1.5];
const SCALES = [1, 0.96, 1.04, 0.94, 1, 1.02, 0.98, 1];
const ART = ['split', 'band', 'arc', 'type', 'frame', 'band', 'split', 'arc'];

const COVER_PALETTE: CoverPalette[] = [
  { bg: '#5E4A63', ink: '#F4EEF1', rule: '#B59CBA' },
  { bg: '#3D5244', ink: '#ECF1EB', rule: '#9DB69B' },
  { bg: '#9A5A41', ink: '#F8EFE8', rule: '#DEB199' },
  { bg: '#33455A', ink: '#E9EEF4', rule: '#9AAEC4' },
  { bg: '#B68C39', ink: '#2C2410', rule: '#7C611C' },
  { bg: '#326562', ink: '#E7F0EF', rule: '#97C0BC' },
  { bg: '#A95E47', ink: '#F8EDE7', rule: '#E0A98F' },
  { bg: '#2E2D31', ink: '#EFEBE5', rule: '#928C84' },
  { bg: '#8F5060', ink: '#F6E9EC', rule: '#CFA0AD' },
  { bg: '#76825A', ink: '#F2F3E8', rule: '#BBC499' },
  { bg: '#5A4634', ink: '#F2E8DA', rule: '#BBA088' },
];

export function coverPalette(entryId: string, title: string): CoverPalette {
  const idx = hashSeed(`${entryId}|${title}|palette`) % COVER_PALETTE.length;
  return COVER_PALETTE[idx];
}

export function bookRatio(entryId: string, title: string): number {
  const idx = hashSeed(`${entryId}|${title}|ratio`) % RATIOS.length;
  return RATIOS[idx];
}

export function bookScale(entryId: string, title: string): number {
  const idx = hashSeed(`${entryId}|${title}|scale`) % SCALES.length;
  return SCALES[idx];
}

export function bookArt(entryId: string, title: string): string {
  const idx = hashSeed(`${entryId}|${title}|art`) % ART.length;
  return ART[idx];
}

export function spineLuminance(hex: string): number {
  const m = hex.replace('#', '');
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

export function formatAuthorsShort(authors: string[] | null | undefined): string {
  if (!authors?.length) return 'Невідомий автор';
  return authors.join(', ');
}

export function authorLine(authors: string[] | null | undefined): string {
  if (!authors?.length) return 'Невідомий автор';
  return authors[0];
}

export function bookVisualFromEntry(entry: {
  id: string;
  book?: { title: string; authors: string[]; cover_url: string | null; page_count: number | null } | null;
  total_pages: number | null;
}): BookVisualMeta {
  const title = entry.book?.title ?? 'Книга';
  const entryId = entry.id;
  const coverUrl = entry.book?.cover_url;
  return {
    entryId,
    title,
    authors: entry.book?.authors ?? [],
    coverUrl,
    pageCount: entry.total_pages ?? entry.book?.page_count,
    cover: coverPalette(entryId, title),
    ratio: bookRatio(entryId, title),
    scale: bookScale(entryId, title),
    art: bookArt(entryId, title),
    placeholder: !coverUrl,
  };
}
