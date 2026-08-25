import { isOnline } from './offline/db';
import { supabase } from './supabase';

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

interface NotificationRow {
  user_id: string;
  id: string;
  kind: NotificationKind;
  body: string;
  read: boolean;
  created_at: string;
  go_page: NotificationPage | null;
  go_buddy_read_id: string | null;
  go_entry_id: string | null;
}

const CACHE_KEY = (userId: string) => `dilibris_notifs_${userId}`;
const DISMISSED_KEY = (userId: string) => `dilibris_notifs_dismissed_${userId}`;
const LEGACY_SEED_IDS = new Set(['n1', 'n4']);
export const NOTIFICATION_TTL_MS = 7 * 86400000;

function loadDismissedNotificationIds(userId: string): Set<string> {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY(userId));
    if (raw) return new Set(JSON.parse(raw) as string[]);
  } catch {
    /* ignore */
  }
  return new Set();
}

function rememberDismissedNotification(userId: string, id: string) {
  const dismissed = loadDismissedNotificationIds(userId);
  dismissed.add(id);
  localStorage.setItem(DISMISSED_KEY(userId), JSON.stringify([...dismissed].slice(-80)));
}

function rememberDismissedNotifications(userId: string, ids: string[]) {
  if (!ids.length) return;
  const dismissed = loadDismissedNotificationIds(userId);
  ids.forEach((id) => dismissed.add(id));
  localStorage.setItem(DISMISSED_KEY(userId), JSON.stringify([...dismissed].slice(-80)));
}

function withoutDismissed(userId: string, items: AppNotification[]): AppNotification[] {
  const dismissed = loadDismissedNotificationIds(userId);
  if (!dismissed.size) return items;
  return items.filter((n) => !dismissed.has(n.id));
}

function isFreshNotification(n: AppNotification, now = Date.now()): boolean {
  const ts = new Date(n.createdAt).getTime();
  return Number.isFinite(ts) && now - ts < NOTIFICATION_TTL_MS;
}

function filterFreshNotifications(items: AppNotification[]): AppNotification[] {
  return items.filter((n) => isFreshNotification(n));
}

async function purgeStaleNotificationsRemote(userId: string): Promise<void> {
  if (!isOnline()) return;
  const cutoff = new Date(Date.now() - NOTIFICATION_TTL_MS).toISOString();
  await supabase.from('user_notifications').delete().eq('user_id', userId).lt('created_at', cutoff);
}

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

function rowToNotification(row: NotificationRow): AppNotification {
  return {
    id: row.id,
    kind: row.kind,
    text: row.body,
    read: row.read,
    createdAt: row.created_at,
    time: relTime(row.created_at),
    go: row.go_page
      ? {
          page: row.go_page,
          buddyReadId: row.go_buddy_read_id ?? undefined,
          entryId: row.go_entry_id ?? undefined,
        }
      : undefined,
  };
}

function notificationToRow(userId: string, notification: AppNotification): NotificationRow {
  return {
    user_id: userId,
    id: notification.id,
    kind: notification.kind,
    body: notification.text,
    read: notification.read,
    created_at: notification.createdAt,
    go_page: notification.go?.page ?? null,
    go_buddy_read_id: notification.go?.buddyReadId ?? null,
    go_entry_id: notification.go?.entryId ?? null,
  };
}

function withoutLegacySeed(items: AppNotification[]): AppNotification[] {
  return items.filter((n) => !LEGACY_SEED_IDS.has(n.id));
}

function loadCachedNotifications(userId: string): AppNotification[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY(userId));
    if (raw) {
      const items = withoutLegacySeed(JSON.parse(raw) as AppNotification[]).map((n, i) => ({
        ...n,
        createdAt: n.createdAt ?? new Date(Date.now() - i * 3600000).toISOString(),
      }));
      return filterFreshNotifications(items).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
  } catch {
    /* ignore */
  }
  return [];
}

function cacheNotifications(userId: string, items: AppNotification[]) {
  localStorage.setItem(CACHE_KEY(userId), JSON.stringify(withoutLegacySeed(items).slice(0, 40)));
}

function emitNotificationsChanged() {
  window.dispatchEvent(new CustomEvent('dilibris:notifications'));
}

export async function dismissNotification(userId: string, id: string): Promise<AppNotification[]> {
  rememberDismissedNotification(userId, id);
  const items = loadCachedNotifications(userId).filter((n) => n.id !== id);
  cacheNotifications(userId, items);

  if (isOnline()) {
    await supabase.from('user_notifications').delete().eq('user_id', userId).eq('id', id);
  }

  emitNotificationsChanged();
  return hydrateNotificationTimes(items);
}

export async function dismissAllNotifications(userId: string): Promise<AppNotification[]> {
  rememberDismissedNotifications(
    userId,
    loadCachedNotifications(userId).map((n) => n.id),
  );
  cacheNotifications(userId, []);

  if (isOnline()) {
    await supabase.from('user_notifications').delete().eq('user_id', userId);
  }

  emitNotificationsChanged();
  return [];
}

async function fetchRemoteNotifications(userId: string): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from('user_notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(40);

  if (error) throw error;
  return (data as NotificationRow[]).map(rowToNotification);
}

async function upsertNotifications(userId: string, items: AppNotification[]): Promise<void> {
  if (!items.length) return;
  const rows = items.map((item) => notificationToRow(userId, item));
  const { error } = await supabase.from('user_notifications').upsert(rows, {
    onConflict: 'user_id,id',
    ignoreDuplicates: true,
  });
  if (error) throw error;
}

async function flushCachedReadState(userId: string, remote: AppNotification[]): Promise<void> {
  const cached = loadCachedNotifications(userId);
  await Promise.all(
    cached
      .filter((item) => item.read && !remote.find((row) => row.id === item.id)?.read)
      .map((item) =>
        supabase
          .from('user_notifications')
          .update({ read: true })
          .eq('user_id', userId)
          .eq('id', item.id),
      ),
  );
}

export function loadNotifications(userId: string): AppNotification[] {
  const cached = loadCachedNotifications(userId);
  const fresh = withoutDismissed(userId, filterFreshNotifications(cached));
  if (fresh.length !== cached.length) {
    cacheNotifications(userId, fresh);
  }
  return hydrateNotificationTimes(fresh);
}

export async function syncNotifications(userId: string): Promise<AppNotification[]> {
  const cached = withoutDismissed(userId, filterFreshNotifications(loadCachedNotifications(userId)));

  if (!isOnline()) {
    cacheNotifications(userId, cached);
    return hydrateNotificationTimes(cached);
  }

  try {
    await purgeStaleNotificationsRemote(userId);
    let remote = filterFreshNotifications(await fetchRemoteNotifications(userId));

    if (remote.length === 0 && cached.length > 0) {
      await upsertNotifications(userId, cached);
      remote = filterFreshNotifications(await fetchRemoteNotifications(userId));
    } else if (remote.length > 0) {
      await flushCachedReadState(userId, remote);
      remote = filterFreshNotifications(await fetchRemoteNotifications(userId));
    }

    cacheNotifications(userId, remote);
    return hydrateNotificationTimes(withoutDismissed(userId, remote));
  } catch {
    cacheNotifications(userId, cached);
    return hydrateNotificationTimes(cached);
  }
}

export function markNotifRead(userId: string, id: string): AppNotification[] {
  const items = loadCachedNotifications(userId).map((n) =>
    n.id === id ? { ...n, read: true } : n,
  );
  cacheNotifications(userId, items);

  if (isOnline()) {
    void supabase
      .from('user_notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('id', id);
  }

  emitNotificationsChanged();
  return hydrateNotificationTimes(items);
}

export function markAllNotifsRead(userId: string): AppNotification[] {
  const items = loadCachedNotifications(userId).map((n) => ({ ...n, read: true }));
  cacheNotifications(userId, items);

  if (isOnline()) {
    void supabase.from('user_notifications').update({ read: true }).eq('user_id', userId);
  }

  emitNotificationsChanged();
  return hydrateNotificationTimes(items);
}

export function notifGlyph(kind: NotificationKind): string {
  return { buddy: '💬', challenge: '✦', deadline: '⏳', reminder: '☾' }[kind] ?? '•';
}

export async function addNotification(
  userId: string,
  partial: Omit<AppNotification, 'id' | 'time' | 'read' | 'createdAt'> & {
    id?: string;
    createdAt?: string;
    read?: boolean;
  },
  options?: { silent?: boolean },
): Promise<AppNotification[]> {
  const createdAt = partial.createdAt ?? new Date().toISOString();
  const id = partial.id ?? `n-${createdAt}-${Math.random().toString(36).slice(2, 8)}`;

  if (loadCachedNotifications(userId).some((n) => n.id === id)) {
    return hydrateNotificationTimes(loadCachedNotifications(userId));
  }

  const next: AppNotification = {
    id,
    kind: partial.kind,
    text: partial.text,
    go: partial.go,
    read: partial.read ?? false,
    createdAt,
    time: relTime(createdAt),
  };

  const items = [next, ...loadCachedNotifications(userId)].slice(0, 40);
  cacheNotifications(userId, items);

  if (isOnline()) {
    const { error } = await supabase.from('user_notifications').upsert(notificationToRow(userId, next), {
      onConflict: 'user_id,id',
      ignoreDuplicates: true,
    });
    if (error) throw error;
  }

  if (!options?.silent) emitNotificationsChanged();
  return hydrateNotificationTimes(items);
}

export async function addNotificationsBatch(
  userId: string,
  partials: Array<
    Omit<AppNotification, 'id' | 'time' | 'read' | 'createdAt'> & {
      id?: string;
      createdAt?: string;
      read?: boolean;
    }
  >,
): Promise<AppNotification[]> {
  if (!partials.length) return hydrateNotificationTimes(loadCachedNotifications(userId));

  const existing = loadCachedNotifications(userId);
  const existingIds = new Set(existing.map((n) => n.id));
  const fresh: AppNotification[] = [];

  for (const partial of partials) {
    const createdAt = partial.createdAt ?? new Date().toISOString();
    const id = partial.id ?? `n-${createdAt}-${Math.random().toString(36).slice(2, 8)}`;
    if (existingIds.has(id)) continue;
    existingIds.add(id);
    fresh.push({
      id,
      kind: partial.kind,
      text: partial.text,
      go: partial.go,
      read: partial.read ?? false,
      createdAt,
      time: relTime(createdAt),
    });
  }

  if (!fresh.length) return hydrateNotificationTimes(existing);

  const items = [...fresh, ...existing].slice(0, 40);
  cacheNotifications(userId, items);

  if (isOnline()) {
    await upsertNotifications(userId, fresh);
  }

  emitNotificationsChanged();
  return hydrateNotificationTimes(items);
}

/** Refresh relative time labels after load. */
export function hydrateNotificationTimes(items: AppNotification[]): AppNotification[] {
  return items.map((n) => ({ ...n, time: relTime(n.createdAt) }));
}

export async function loadExistingNotificationIds(userId: string): Promise<Set<string>> {
  const dismissed = loadDismissedNotificationIds(userId);
  if (isOnline()) {
    try {
      const remote = withoutDismissed(userId, await fetchRemoteNotifications(userId));
      cacheNotifications(userId, remote);
      return new Set([...remote.map((n) => n.id), ...dismissed]);
    } catch {
      /* fall through */
    }
  }
  return new Set([...loadCachedNotifications(userId).map((n) => n.id), ...dismissed]);
}
