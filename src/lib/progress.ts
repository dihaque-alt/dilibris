export type ProgressMode = 'pages' | 'percent';

export function resolveProgressPercent(
  mode: ProgressMode,
  current: number,
  total: number | null,
): number | null {
  if (mode === 'percent') {
    return Math.min(100, Math.max(0, Math.round(current)));
  }
  if (!total || total <= 0) return null;
  return Math.min(100, Math.round((current / total) * 100));
}

export function defaultProgressMode(format: string | null | undefined): ProgressMode {
  return format === 'audiobook' ? 'percent' : 'pages';
}
