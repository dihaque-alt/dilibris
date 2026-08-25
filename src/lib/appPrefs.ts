import { supabase } from './supabase';
import type { AppearancePrefs } from './appearancePrefs';
import { isOnline } from './offline/db';
import type { LibraryDisplayPrefs } from './libraryDisplayPrefs';

const LEGACY_PREFS_KEY = (userId: string) => `dilibris_prefs_${userId}`;
const LEGACY_APPEARANCE_KEY = (userId: string) => `dilibris_appearance_${userId}`;
const LEGACY_LIBRARY_KEY = (userId: string) => `dilibris_library_display_${userId}`;
const CACHE_KEY = (userId: string) => `dilibris_app_prefs_${userId}`;

const APPEARANCE_DEFAULTS: AppearancePrefs = {
  mood: 'evening',
  dim: 0.4,
  accent: 'Олива',
};

const LIBRARY_DEFAULTS: LibraryDisplayPrefs = {
  bookView: 'cover',
  bookSize: 'cozy',
  realCovers: true,
};

export interface StoredAppPrefs {
  city: string;
  defaultPrivate: boolean;
  weeklyDigest: boolean;
  reminders: boolean;
  appearance: AppearancePrefs;
  libraryDisplay: LibraryDisplayPrefs;
}

export const APP_PREFS_DEFAULTS: StoredAppPrefs = {
  city: '',
  defaultPrivate: true,
  weeklyDigest: false,
  reminders: true,
  appearance: APPEARANCE_DEFAULTS,
  libraryDisplay: LIBRARY_DEFAULTS,
};

export type AppPrefsPatch = Partial<Omit<StoredAppPrefs, 'appearance' | 'libraryDisplay'>> & {
  appearance?: Partial<AppearancePrefs>;
  libraryDisplay?: Partial<LibraryDisplayPrefs>;
};

function normalize(raw: Partial<StoredAppPrefs> | null | undefined): StoredAppPrefs {
  return {
    city: raw?.city ?? APP_PREFS_DEFAULTS.city,
    defaultPrivate: raw?.defaultPrivate ?? APP_PREFS_DEFAULTS.defaultPrivate,
    weeklyDigest: raw?.weeklyDigest ?? APP_PREFS_DEFAULTS.weeklyDigest,
    reminders: raw?.reminders ?? APP_PREFS_DEFAULTS.reminders,
    appearance: { ...APPEARANCE_DEFAULTS, ...raw?.appearance },
    libraryDisplay: { ...LIBRARY_DEFAULTS, ...raw?.libraryDisplay },
  };
}

function isServerPrefsEmpty(raw: unknown): boolean {
  if (raw == null || typeof raw !== 'object') return true;
  return Object.keys(raw as object).length === 0;
}

function readLegacyPrefs(userId: string): Partial<StoredAppPrefs> {
  const legacy: Partial<StoredAppPrefs> = {};

  try {
    const prefsRaw = localStorage.getItem(LEGACY_PREFS_KEY(userId));
    if (prefsRaw) {
      const parsed = JSON.parse(prefsRaw) as Partial<StoredAppPrefs>;
      legacy.city = parsed.city;
      legacy.defaultPrivate = parsed.defaultPrivate;
      legacy.weeklyDigest = parsed.weeklyDigest;
      legacy.reminders = parsed.reminders;
    }
  } catch {
    /* ignore */
  }

  try {
    const appearanceRaw = localStorage.getItem(LEGACY_APPEARANCE_KEY(userId));
    if (appearanceRaw) {
      legacy.appearance = { ...APPEARANCE_DEFAULTS, ...JSON.parse(appearanceRaw) };
    }
  } catch {
    /* ignore */
  }

  try {
    const libraryRaw = localStorage.getItem(LEGACY_LIBRARY_KEY(userId));
    if (libraryRaw) {
      legacy.libraryDisplay = { ...LIBRARY_DEFAULTS, ...JSON.parse(libraryRaw) };
    }
  } catch {
    /* ignore */
  }

  return legacy;
}

function clearLegacyPrefs(userId: string) {
  localStorage.removeItem(LEGACY_PREFS_KEY(userId));
  localStorage.removeItem(LEGACY_APPEARANCE_KEY(userId));
  localStorage.removeItem(LEGACY_LIBRARY_KEY(userId));
}

export function loadCachedAppPrefs(userId: string): StoredAppPrefs {
  try {
    const raw = localStorage.getItem(CACHE_KEY(userId));
    if (raw) return normalize(JSON.parse(raw));
  } catch {
    /* ignore */
  }
  return normalize(readLegacyPrefs(userId));
}

function cacheAppPrefs(userId: string, prefs: StoredAppPrefs) {
  localStorage.setItem(CACHE_KEY(userId), JSON.stringify(prefs));
}

function mergePatch(current: StoredAppPrefs, patch: AppPrefsPatch): StoredAppPrefs {
  return normalize({
    ...current,
    ...patch,
    appearance: patch.appearance ? { ...current.appearance, ...patch.appearance } : current.appearance,
    libraryDisplay: patch.libraryDisplay
      ? { ...current.libraryDisplay, ...patch.libraryDisplay }
      : current.libraryDisplay,
  });
}

export async function syncAppPrefs(userId: string): Promise<StoredAppPrefs> {
  const legacy = readLegacyPrefs(userId);
  const cached = loadCachedAppPrefs(userId);
  const local = normalize({ ...legacy, ...cached });

  if (!isOnline()) {
    cacheAppPrefs(userId, local);
    return local;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('app_prefs')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;

  const serverRaw = data?.app_prefs as Partial<StoredAppPrefs> | null;

  if (isServerPrefsEmpty(serverRaw)) {
    const { error: migrateError } = await supabase
      .from('profiles')
      .update({ app_prefs: local })
      .eq('id', userId);
    if (migrateError) throw migrateError;
    cacheAppPrefs(userId, local);
    clearLegacyPrefs(userId);
    return local;
  }

  const server = normalize(serverRaw);
  cacheAppPrefs(userId, server);
  clearLegacyPrefs(userId);
  return server;
}

export async function saveAppPrefs(userId: string, patch: AppPrefsPatch): Promise<StoredAppPrefs> {
  const next = mergePatch(loadCachedAppPrefs(userId), patch);
  cacheAppPrefs(userId, next);

  if (isOnline()) {
    const { error } = await supabase.from('profiles').update({ app_prefs: next }).eq('id', userId);
    if (error) throw error;
    clearLegacyPrefs(userId);
  }

  return next;
}
