import { loadCachedAppPrefs, saveAppPrefs, syncAppPrefs } from './appPrefs';
import { isOnline } from './offline/db';
import { supabase } from './supabase';

export interface UserSettings {
  name: string;
  email: string;
  city: string;
  yearTarget: number;
  defaultPrivate: boolean;
  weeklyDigest: boolean;
  reminders: boolean;
  avatarUrl: string | null;
  isProfilePublic: boolean;
  bio: string;
}

export function loadLocalPrefs(userId: string): Partial<UserSettings> {
  const prefs = loadCachedAppPrefs(userId);
  return {
    city: prefs.city,
    defaultPrivate: prefs.defaultPrivate,
    weeklyDigest: prefs.weeklyDigest,
    reminders: prefs.reminders,
  };
}

export async function loadUserSettings(userId: string, email: string): Promise<UserSettings> {
  const prefs = await syncAppPrefs(userId);
  const year = new Date().getFullYear();

  if (isOnline()) {
    try {
      const [{ data: profile }, { data: challenge }] = await Promise.all([
        supabase
          .from('profiles')
          .select('display_name, avatar_url, is_profile_public, bio')
          .eq('id', userId)
          .maybeSingle(),
        supabase
          .from('reading_challenges')
          .select('target_books')
          .eq('user_id', userId)
          .eq('year', year)
          .maybeSingle(),
      ]);

      return {
        name: profile?.display_name ?? '',
        email,
        city: prefs.city,
        yearTarget: challenge?.target_books ?? 24,
        defaultPrivate: prefs.defaultPrivate,
        weeklyDigest: prefs.weeklyDigest,
        reminders: prefs.reminders,
        avatarUrl: profile?.avatar_url ?? null,
        isProfilePublic: profile?.is_profile_public ?? true,
        bio: profile?.bio ?? '',
      };
    } catch {
      /* fall through to cached prefs */
    }
  }

  return {
    name: '',
    email,
    city: prefs.city,
    yearTarget: 24,
    defaultPrivate: prefs.defaultPrivate,
    weeklyDigest: prefs.weeklyDigest,
    reminders: prefs.reminders,
    avatarUrl: null,
    isProfilePublic: true,
    bio: '',
  };
}

export async function saveUserSettings(userId: string, settings: UserSettings): Promise<void> {
  await saveAppPrefs(userId, {
    city: settings.city,
    defaultPrivate: settings.defaultPrivate,
    weeklyDigest: settings.weeklyDigest,
    reminders: settings.reminders,
  });

  if (!isOnline()) return;

  const year = new Date().getFullYear();

  await supabase
    .from('profiles')
    .update({
      display_name: settings.name.trim() || null,
      is_profile_public: settings.isProfilePublic,
      bio: settings.bio.trim() || null,
    })
    .eq('id', userId);

  const { data: existing } = await supabase
    .from('reading_challenges')
    .select('id')
    .eq('user_id', userId)
    .eq('year', year)
    .maybeSingle();

  if (existing?.id) {
    await supabase
      .from('reading_challenges')
      .update({ target_books: settings.yearTarget })
      .eq('id', existing.id);
  } else {
    await supabase.from('reading_challenges').insert({
      user_id: userId,
      year,
      target_books: settings.yearTarget,
    });
  }
}
