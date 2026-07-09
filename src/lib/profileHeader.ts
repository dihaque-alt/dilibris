import { supabase } from './supabase';

export const PROFILE_UPDATED_EVENT = 'dilibris:profile-updated';

export interface ProfileHeader {
  displayName: string | null;
  avatarUrl: string | null;
}

export function notifyProfileUpdated(): void {
  window.dispatchEvent(new Event(PROFILE_UPDATED_EVENT));
}

export function displayAvatarUrl(url: string | null, cacheBust?: number): string | null {
  if (!url) return null;
  const base = url.split('?')[0];
  return cacheBust ? `${base}?v=${cacheBust}` : base;
}

export async function fetchProfileHeader(userId: string): Promise<ProfileHeader> {
  const { data, error } = await supabase
    .from('profiles')
    .select('display_name, avatar_url')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;

  return {
    displayName: data?.display_name ?? null,
    avatarUrl: data?.avatar_url ?? null,
  };
}
