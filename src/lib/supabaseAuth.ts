import { supabase } from './supabase';
import { isOnline } from './offline/db';

/** Refresh Supabase auth after background / screen lock so writes do not fail spuriously. */
export async function ensureSupabaseReady(): Promise<void> {
  if (!isOnline()) return;

  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) return;

  const expiresAt = data.session.expires_at ?? 0;
  const nowSec = Math.floor(Date.now() / 1000);
  if (expiresAt - nowSec < 120) {
    await supabase.auth.refreshSession();
  }
}
