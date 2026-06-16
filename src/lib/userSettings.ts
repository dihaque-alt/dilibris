import { supabase } from './supabase';

export interface UserSettings {
  name: string;
  email: string;
  city: string;
  yearTarget: number;
  defaultPrivate: boolean;
  weeklyDigest: boolean;
  reminders: boolean;
}

const PREFS_KEY = (userId: string) => `dilibris_prefs_${userId}`;

const DEFAULT_PREFS = {
  city: '',
  defaultPrivate: true,
  weeklyDigest: false,
  reminders: true,
};

export function loadLocalPrefs(userId: string): Partial<UserSettings> {
  try {
    const raw = localStorage.getItem(PREFS_KEY(userId));
    if (raw) return JSON.parse(raw) as Partial<UserSettings>;
  } catch {
    /* ignore */
  }
  return { ...DEFAULT_PREFS };
}

export function saveLocalPrefs(userId: string, prefs: Partial<UserSettings>) {
  const { name, email, yearTarget, ...rest } = prefs;
  localStorage.setItem(PREFS_KEY(userId), JSON.stringify(rest));
}

export async function loadUserSettings(userId: string, email: string): Promise<UserSettings> {
  const prefs = loadLocalPrefs(userId);
  const year = new Date().getFullYear();

  const [{ data: profile }, { data: challenge }] = await Promise.all([
    supabase.from('profiles').select('display_name').eq('id', userId).maybeSingle(),
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
    city: prefs.city ?? '',
    yearTarget: challenge?.target_books ?? 24,
    defaultPrivate: prefs.defaultPrivate ?? true,
    weeklyDigest: prefs.weeklyDigest ?? false,
    reminders: prefs.reminders ?? true,
  };
}

export async function saveUserSettings(userId: string, settings: UserSettings): Promise<void> {
  const year = new Date().getFullYear();

  await supabase.from('profiles').update({ display_name: settings.name.trim() || null }).eq('id', userId);

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

  saveLocalPrefs(userId, settings);
}
