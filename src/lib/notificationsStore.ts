export type NotificationKind = 'buddy' | 'challenge' | 'deadline' | 'reminder';

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  text: string;
  time: string;
  read: boolean;
  go?: { page: 'library' | 'dashboard' | 'notes' | 'buddy-reads' };
}

const KEY = (userId: string) => `dilibris_notifs_${userId}`;

function seed(_userId: string): AppNotification[] {
  return [
    {
      id: 'n1',
      kind: 'challenge',
      text: 'Ти на півдорозі до річної цілі — ще трохи!',
      time: '2 год тому',
      read: false,
      go: { page: 'dashboard' },
    },
    {
      id: 'n2',
      kind: 'buddy',
      text: 'Нова нотатка у спільному читанні «Вечірні читання»',
      time: 'вчора',
      read: false,
      go: { page: 'buddy-reads' },
    },
    {
      id: 'n3',
      kind: 'deadline',
      text: 'Дедлайн клубу «Жадан-клуб» — через 5 днів',
      time: '2 дні тому',
      read: false,
      go: { page: 'buddy-reads' },
    },
    {
      id: 'n4',
      kind: 'reminder',
      text: 'Тихий вечір — час для кількох сторінок?',
      time: '3 дні тому',
      read: true,
      go: { page: 'library' },
    },
  ];
}

export function loadNotifications(userId: string): AppNotification[] {
  try {
    const raw = localStorage.getItem(KEY(userId));
    if (raw) return JSON.parse(raw) as AppNotification[];
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
