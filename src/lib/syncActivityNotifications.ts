import { supabase } from './supabase';
import { addNotification, loadExistingNotificationIds } from './notificationsStore';

/** Pull recent buddy/challenge activity into the notification feed. */
export async function syncActivityNotifications(userId: string): Promise<void> {
  const existingIds = await loadExistingNotificationIds(userId);

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
          .select('id, buddy_read_id, user_id, body, created_at, buddy_read:buddy_reads (title)')
          .in('buddy_read_id', buddyIds)
          .neq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(20)
      : Promise.resolve({ data: [] }),
    buddyIds.length
      ? supabase
          .from('notes')
          .select('id, buddy_read_id, user_id, body, created_at, buddy_read:buddy_reads (title)')
          .in('buddy_read_id', buddyIds)
          .neq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(20)
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
    existingIds.add(key);
    const title = (msg.buddy_read as { title?: string } | null)?.title ?? 'клуб';
    await addNotification(userId, {
      id: key,
      kind: 'buddy',
      text: `Нове повідомлення у «${title}»`,
      createdAt: msg.created_at as string,
      go: { page: 'buddy-reads', buddyReadId: msg.buddy_read_id as string },
    });
  }

  for (const note of notes ?? []) {
    const key = `note:${note.id}`;
    if (existingIds.has(key)) continue;
    existingIds.add(key);
    const title = (note.buddy_read as { title?: string } | null)?.title ?? 'клуб';
    await addNotification(userId, {
      id: key,
      kind: 'buddy',
      text: `Нова спільна нотатка у «${title}»`,
      createdAt: note.created_at as string,
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
    await addNotification(userId, {
      id: key,
      kind: 'deadline',
      text: `Дедлайн клубу «${br.title}» — через ${days} ${days === 1 ? 'день' : days < 5 ? 'дні' : 'днів'}`,
      createdAt: now.toISOString(),
      go: { page: 'buddy-reads', buddyReadId: br.id as string },
    });
  }

  const year = now.getFullYear();
  const { data: challenge } = await supabase
    .from('reading_challenges')
    .select('target_books')
    .eq('user_id', userId)
    .eq('year', year)
    .maybeSingle();

  if (challenge?.target_books) {
    const { count } = await supabase
      .from('user_book_entries')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'finished')
      .gte('finished_on', `${year}-01-01`)
      .lte('finished_on', `${year}-12-31`);

    const finished = count ?? 0;
    const target = challenge.target_books as number;
    const halfKey = `challenge-half:${year}`;
    if (finished >= Math.ceil(target / 2) && finished < target && !existingIds.has(halfKey)) {
      await addNotification(userId, {
        id: halfKey,
        kind: 'challenge',
        text: 'Ти на півдорозі до річної цілі — ще трохи!',
        createdAt: now.toISOString(),
        go: { page: 'dashboard' },
      });
    }
  }
}
