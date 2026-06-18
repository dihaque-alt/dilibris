import { supabase } from './supabase';

const onboardKey = (userId: string) => `dilibris_onboarded_${userId}`;

function cacheOnboardingComplete(userId: string) {
  localStorage.setItem(onboardKey(userId), '1');
}

/** Server truth with localStorage fallback + one-way migrate to Supabase. */
export async function resolveOnboardingStatus(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('onboarded_at')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;

  if (data?.onboarded_at) {
    cacheOnboardingComplete(userId);
    return true;
  }

  if (localStorage.getItem(onboardKey(userId)) === '1') {
    const now = new Date().toISOString();
    const { error: migrateError } = await supabase
      .from('profiles')
      .update({ onboarded_at: now })
      .eq('id', userId);

    if (migrateError) throw migrateError;
    return true;
  }

  return false;
}

export async function markOnboardingComplete(userId: string, at = new Date()): Promise<void> {
  const onboardedAt = at.toISOString();
  const { error } = await supabase
    .from('profiles')
    .update({ onboarded_at: onboardedAt })
    .eq('id', userId);

  if (error) throw error;
  cacheOnboardingComplete(userId);
}
