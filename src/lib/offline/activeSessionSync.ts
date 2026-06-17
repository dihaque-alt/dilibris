import { supabase } from '../supabase';
import type { ActiveReadingSession } from '../../types/database';
import { offlineDb, isOnline, nowIso, type ActiveReadingSessionLocal } from './db';

export function elapsedSeconds(
  session: ActiveReadingSession | null | undefined,
  at = Date.now(),
): number {
  if (!session) return 0;
  let sec = session.accumulated_seconds;
  if (session.is_running && session.last_tick_at) {
    sec += Math.floor((at - new Date(session.last_tick_at).getTime()) / 1000);
  }
  return Math.max(0, sec);
}

export function formatSessionClock(totalSec: number): string {
  const mm = String(Math.floor(totalSec / 60)).padStart(2, '0');
  const ss = String(totalSec % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

/** Merge running elapsed time into accumulated_seconds for persistence. */
export function snapshotSession(
  session: ActiveReadingSession,
  patch: Partial<ActiveReadingSession> = {},
  at = Date.now(),
): ActiveReadingSession {
  const merged = { ...session, ...patch };
  if (merged.is_running) {
    const elapsed = elapsedSeconds(merged, at);
    return {
      ...merged,
      accumulated_seconds: elapsed,
      last_tick_at: new Date(at).toISOString(),
      updated_at: new Date(at).toISOString(),
    };
  }
  return {
    ...merged,
    updated_at: new Date(at).toISOString(),
  };
}

async function saveLocal(session: ActiveReadingSession, dirty: boolean) {
  const row: ActiveReadingSessionLocal = { ...session, dirty };
  await offlineDb.activeSessions.put(row);
}

async function fetchRemote(userId: string): Promise<ActiveReadingSession | null> {
  const { data, error } = await supabase
    .from('active_reading_sessions')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return (data as ActiveReadingSession | null) ?? null;
}

function pickNewer(
  a: ActiveReadingSession | null,
  b: ActiveReadingSession | null,
): ActiveReadingSession | null {
  if (!a) return b;
  if (!b) return a;
  return new Date(a.updated_at) >= new Date(b.updated_at) ? a : b;
}

async function pushToServer(session: ActiveReadingSession): Promise<void> {
  if (!isOnline()) {
    await saveLocal(session, true);
    return;
  }

  const { error } = await supabase.from('active_reading_sessions').upsert(session, {
    onConflict: 'user_id',
  });
  if (error) throw error;
  await saveLocal(session, false);
}

export async function fetchActiveSession(userId: string): Promise<ActiveReadingSession | null> {
  const local = await offlineDb.activeSessions.get(userId);

  if (isOnline()) {
    try {
      const remote = await fetchRemote(userId);
      const chosen = pickNewer(remote, local ?? null);
      if (chosen) {
        await saveLocal(chosen, local?.dirty ?? false);
      } else if (local?.dirty) {
        await pushToServer(local);
        return local;
      }
      return chosen;
    } catch {
      return local ?? null;
    }
  }

  return local ?? null;
}

export async function startActiveSession(
  userId: string,
  entryId: string,
): Promise<ActiveReadingSession> {
  const now = nowIso();
  const session: ActiveReadingSession = {
    user_id: userId,
    entry_id: entryId,
    accumulated_seconds: 0,
    is_running: true,
    last_tick_at: now,
    pages_draft: '',
    note_draft: '',
    updated_at: now,
  };
  await pushToServer(session);
  return session;
}

export async function saveActiveSession(session: ActiveReadingSession): Promise<void> {
  const snap = snapshotSession(session);
  await pushToServer(snap);
}

export async function clearActiveSession(userId: string): Promise<void> {
  await offlineDb.activeSessions.delete(userId);

  if (isOnline()) {
    const { error } = await supabase
      .from('active_reading_sessions')
      .delete()
      .eq('user_id', userId);
    if (error) throw error;
    return;
  }

  await offlineDb.pendingOps.add({
    id: crypto.randomUUID(),
    userId,
    table: 'active_reading_sessions',
    operation: 'delete',
    payload: { user_id: userId },
    createdAt: Date.now(),
  });
}

/** Push dirty local draft or pending delete after reconnect. */
export async function flushActiveSession(userId: string): Promise<void> {
  const local = await offlineDb.activeSessions.get(userId);
  if (!isOnline()) return;

  if (local?.dirty) {
    await pushToServer(local);
  }
}

export function subscribeActiveSession(
  userId: string,
  onChange: (session: ActiveReadingSession | null) => void,
): () => void {
  const channel = supabase
    .channel(`active-session-${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'active_reading_sessions',
        filter: `user_id=eq.${userId}`,
      },
      async (payload) => {
        if (payload.eventType === 'DELETE') {
          await offlineDb.activeSessions.delete(userId);
          onChange(null);
          return;
        }
        const session = payload.new as ActiveReadingSession;
        await saveLocal(session, false);
        onChange(session);
      },
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
