import type { AppNotification, NotificationPage } from './notificationsStore';

const PAGE_ROUTES: Record<NotificationPage, string> = {
  library: '/',
  dashboard: '/dashboard',
  notes: '/notes',
  'buddy-reads': '/buddy-reads',
};

/** Hash anchor for buddy-read sections, inferred from stable notification ids. */
function buddySectionHash(n: AppNotification): string {
  if (n.id.startsWith('msg:')) return '#chat';
  if (n.id.startsWith('note:')) return '#notes';
  return '';
}

/** Resolve in-app path for a notification deep link. */
export function notificationRoute(n: AppNotification): string | null {
  if (!n.go?.page) return null;

  if (n.go.buddyReadId) {
    return `/buddy-reads/${n.go.buddyReadId}${buddySectionHash(n)}`;
  }

  if (n.go.entryId) {
    const base = PAGE_ROUTES[n.go.page];
    if (base && (n.go.page === 'library' || n.go.page === 'notes')) {
      return `${base}?entry=${encodeURIComponent(n.go.entryId)}`;
    }
  }

  return PAGE_ROUTES[n.go.page] ?? null;
}
