const RATING_STARS: { value: string; label: string }[] = Array.from({ length: 10 }, (_, i) => {
  const value = (i + 1) / 2;
  return { value: String(value), label: `${value} ★` };
});

export const RATING_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Без оцінки' },
  ...RATING_STARS,
];

export const REVIEW_RATING_OPTIONS = RATING_STARS;

export function parseRating(value: string): number | null {
  if (!value) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function formatStarRating(rating: number): string {
  return `${rating} ★`;
}

export function formatMinutes(total: number): string {
  if (total < 60) return `${total} хв`;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return m ? `${h} год ${m} хв` : `${h} год`;
}
