export function formatDateUk(isoDate: string | null | undefined): string {
  if (!isoDate) return '—';
  const [y, m, d] = isoDate.slice(0, 10).split('-');
  if (!y || !m || !d) return isoDate;
  return `${d}.${m}.${y}`;
}

export function formatDateTimeUk(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function daysBetween(start: string | null, end: string | null): number | null {
  if (!start) return null;
  const startDate = new Date(`${start.slice(0, 10)}T00:00:00`);
  const endDate = end ? new Date(`${end.slice(0, 10)}T00:00:00`) : new Date();
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return null;
  const diff = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

/** Calendar days spanned, inclusive (day 1 on start date). */
export function readingDaysSpan(start: string | null, finishedOn: string | null): number | null {
  if (!start) return null;
  const startDate = new Date(`${start.slice(0, 10)}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = finishedOn ? new Date(`${finishedOn.slice(0, 10)}T00:00:00`) : today;
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return null;
  const diff = Math.round((endDate.getTime() - startDate.getTime()) / 86400000);
  return Math.max(1, diff + 1);
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}
