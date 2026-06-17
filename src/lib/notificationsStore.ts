export type NotificationKind = 'buddy' | 'challenge' | 'deadline' | 'reminder';

export type NotificationPage = 'library' | 'dashboard' | 'notes' | 'buddy-reads';

export interface NotificationGo {
  page: NotificationPage;
  buddyReadId?: string;
  entryId?: string;
}

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  text: string;
  time: string;
  read: boolean;
  createdAt: string;
  go?: NotificationGo;
}

const KEY = (userId: string) => `dilibris_notifs_${userId}`;
const SEEN_KEY = (userId: string) => `dilibris_notif_seen_${userId}`;

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'щойно';
  if (mins < 60) return `${mins} хв тому`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} год тому`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'вчора';
  return `${days} дн тому`;
}

function seed(_userId: string): AppNotification[] {
  const now = Date.now();
  return [
    {
      id: 'n1',
      kind: 'challenge',
      text: 'Ти на півдорозі до річної цілі — ще трохи!',
      time: '2 год тому',
      read: false,
      createdAt: new Date(now - 2 * 3600000).toISOString(),
      go: { page: 'dashboard' },
    },
    {
      id: 'n4',
      kind: 'reminder',
      text: 'Тихий вечір — час для кількох сторінок?',
      time: '3 дні тому',
      read: true,
      createdAt: new Date(now - 3 * 86400000).toISOString(),
      go: { page: 'library' },
    },
  ];
}

export function loadNotifications(userId: string): AppNotification[] {
  try {
    const raw = localStorage.getItem(KEY(userId));
    if (raw) {
      const items = (JSON.parse(raw) as AppNotification[]).map((n, i) => ({
        ...n,
        createdAt: n.createdAt ?? new Date(Date.now() - i * 3600000).toISOString(),
      }));
      return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
  } catch {
    /* ignore */
  }
  const initial = seed(userId);
  saveNotifications(userId, initial);
  return initial;
}

export function saveNotifications(userId: string, items: AppNotification[]) {
  localStorage.setItem(KEY(userId), JSON.stringify(items));
}

export function markNotifRead(userId: string, id: string): AppNotification[] {
  const items = loadNotifications(userId).map((n) =>
    n.id === id ? { ...n, read: true } : n,
  );
  saveNotifications(userId, items);
  return items;
}

export function markAllNotifsRead(userId: string): AppNotification[] {
  const items = loadNotifications(userId).map((n) => ({ ...n, read: true }));
  saveNotifications(userId, items);
  return items;
}

export function notifGlyph(kind: NotificationKind): string {
  return { buddy: '💬', challenge: '✦', deadline: '⏳', reminder: '☾' }[kind] ?? '•';
}

export function addNotification(
  userId: string,
  partial: Omit<AppNotification, 'id' | 'time' | 'read' | 'createdAt'> & {
    id?: string;
    createdAt?: string;
    read?: boolean;
  },
): AppNotification[] {
  const createdAt = partial.createdAt ?? new Date().toISOString();
  const id = partial.id ?? `n-${createdAt}-${Math.random().toString(36).slice(2, 8)}`;
  const next: AppNotification = {
    id,
    kind: partial.kind,
    text: partial.text,
    go: partial.go,
    read: partial.read ?? false,
    createdAt,
    time: relTime(createdAt),
  };

  const items = loadNotifications(userId).filter((n) => n.id !== id);
  items.unshift(next);
  saveNotifications(userId, items.slice(0, 40));
  window.dispatchEvent(new CustomEvent('dilibris:notifications'));
  return items;
}

export function loadNotifSeen(userId: string): Record<string, string> {
  try {
    const raw = localStorage.getItem(SEEN_KEY(userId));
    if (raw) return JSON.parse(raw) as Record<string, string>;
  } catch {
    /* ignore */
  }
  return {};
}

export function saveNotifSeen(userId: string, seen: Record<string, string>) {
  localStorage.setItem(SEEN_KEY(userId), JSON.stringify(seen));
}

/** Refresh relative time labels after load. */
export function hydrateNotificationTimes(items: AppNotification[]): AppNotification[] {
  return items.map((n) => ({ ...n, time: relTime(n.createdAt) }));
}
