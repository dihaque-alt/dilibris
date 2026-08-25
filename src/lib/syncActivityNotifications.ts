import { supabase } from './supabase';
import { addNotificationsBatch, loadExistingNotificationIds } from './notificationsStore';

const RECENT_MS = 7 * 86400000;

function excerpt(text: string, max = 72): string {
  const trimmed = text.trim().replace(/\s+/g, ' ');
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

function isRecent(iso: string, cutoffMs: number): boolean {
  return new Date(iso).getTime() >= cutoffMs;
}

/** Pull recent buddy/challenge activity into the notification feed. */
export async function syncActivityNotifications(userId: string): Promise<void> {
  const existingIds = await loadExistingNotificationIds(userId);
  const cutoffMs = Date.now() - RECENT_MS;
  const batch: Parameters<typeof addNotificationsBatch>[1] = [];

  const { data: memberships, error: memErr } = await supabase
    .from('buddy_read_members')
    .select('buddy_read_id')
    .eq('user_id', userId);

  if (memErr) return;

  const buddyIds = (memberships ?? []).map((m) => m.buddy_read_id as string);

  const [{ data: messages }, { data: notes }, { data: reads }] = await Promise.all([
    buddyIds.length
      ? supabase
          .from('buddy_read_messages')
          .select(
            'id, buddy_read_id, user_id, body, created_at, profile:profiles (display_name), buddy_read:buddy_reads (title)',
          )
          .in('buddy_read_id', buddyIds)
          .neq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(12)
      : Promise.resolve({ data: [] }),
    buddyIds.length
      ? supabase
          .from('notes')
          .select(
            'id, buddy_read_id, user_id, body, created_at, profile:profiles (display_name), buddy_read:buddy_reads (title)',
          )
          .in('buddy_read_id', buddyIds)
          .neq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(12)
      : Promise.resolve({ data: [] }),
    buddyIds.length
      ? supabase
          .from('buddy_reads')
          .select('id, title, target_finish_on, is_archived')
          .in('id', buddyIds)
          .eq('is_archived', false)
      : Promise.resolve({ data: [] }),
  ]);

  for (const msg of messages ?? []) {
    const key = `msg:${msg.id}`;
    if (existingIds.has(key)) continue;
    const createdAt = msg.created_at as string;
    if (!isRecent(createdAt, cutoffMs)) continue;
    existingIds.add(key);
    const title = (msg.buddy_read as { title?: string } | null)?.title ?? 'клуб';
    const author = (msg.profile as { display_name?: string } | null)?.display_name ?? 'Читач';
    const preview = excerpt(String(msg.body ?? ''));
    batch.push({
      id: key,
      kind: 'buddy',
      text: preview
        ? `«${author}» у «${title}»: ${preview}`
        : `Нове повідомлення від «${author}» у «${title}»`,
      createdAt,
      go: { page: 'buddy-reads', buddyReadId: msg.buddy_read_id as string },
    });
  }

  for (const note of notes ?? []) {
    const key = `note:${note.id}`;
    if (existingIds.has(key)) continue;
    const createdAt = note.created_at as string;
    if (!isRecent(createdAt, cutoffMs)) continue;
    existingIds.add(key);
    const title = (note.buddy_read as { title?: string } | null)?.title ?? 'клуб';
    const author = (note.profile as { display_name?: string } | null)?.display_name ?? 'Читач';
    const preview = excerpt(String(note.body ?? ''));
    batch.push({
      id: key,
      kind: 'buddy',
      text: preview
        ? `Нотатка від «${author}» у «${title}»: ${preview}`
        : `Нова нотатка від «${author}» у «${title}»`,
      createdAt,
      go: { page: 'buddy-reads', buddyReadId: note.buddy_read_id as string },
    });
  }

  const now = new Date();
  for (const br of reads ?? []) {
    if (!br.target_finish_on) continue;
    const deadline = new Date(`${br.target_finish_on}T12:00:00`);
    const days = Math.ceil((deadline.getTime() - now.getTime()) / 86400000);
    if (days < 0 || days > 7) continue;
    const key = `deadline:${br.id}:${br.target_finish_on}`;
    if (existingIds.has(key)) continue;
    existingIds.add(key);
    batch.push({
      id: key,
      kind: 'deadline',
      text: `Дедлайн клубу «${br.title}» — через ${days} ${days === 1 ? 'день' : days < 5 ? 'дні' : 'днів'}`,
      createdAt: `${br.target_finish_on}T09:00:00`,
      go: { page: 'buddy-reads', buddyReadId: br.id as string },
    });
  }

  await addNotificationsBatch(userId, batch);
}
