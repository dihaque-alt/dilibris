export type AccentPreset = 'Олива' | 'Шавлія' | 'Теракота';
export type RoomMood = 'evening' | 'day';

export interface AppearancePrefs {
  mood: RoomMood;
  dim: number;
  accent: AccentPreset;
}

export const ACCENT_PRESETS: Record<AccentPreset, Record<string, string>> = {
  Олива: {
    '--accent-lime': '#7E9F70',
    '--accent-lime-deep': '#5F7E54',
    '--accent-lime-light': '#F0F4EE',
  },
  Шавлія: {
    '--accent-lime': '#6FA09A',
    '--accent-lime-deep': '#477E78',
    '--accent-lime-light': '#EAF3F1',
  },
  Теракота: {
    '--accent-lime': '#C07B57',
    '--accent-lime-deep': '#9E5E3D',
    '--accent-lime-light': '#F8EDE5',
  },
};

const STORAGE_KEY = (userId: string) => `dilibris_appearance_${userId}`;

export const APPEARANCE_DEFAULTS: AppearancePrefs = {
  mood: 'evening',
  dim: 0.4,
  accent: 'Олива',
};

export function loadAppearancePrefs(userId: string): AppearancePrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY(userId));
    if (raw) return { ...APPEARANCE_DEFAULTS, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return { ...APPEARANCE_DEFAULTS };
}

export function saveAppearancePrefs(userId: string, prefs: AppearancePrefs) {
  localStorage.setItem(STORAGE_KEY(userId), JSON.stringify(prefs));
  window.dispatchEvent(new CustomEvent('dilibris:appearance'));
}

export function applyAppearancePrefs(prefs: AppearancePrefs) {
  const root = document.documentElement;
  root.setAttribute('data-mood', prefs.mood);
  root.style.setProperty('--dl-dim', String(prefs.dim));

  const preset = ACCENT_PRESETS[prefs.accent] ?? ACCENT_PRESETS.Олива;
  for (const [key, value] of Object.entries(preset)) {
    root.style.setProperty(key, value);
  }
}

/** Apply defaults before user prefs load (login screen, first paint). */
export function applyDefaultAppearance() {
  applyAppearancePrefs(APPEARANCE_DEFAULTS);
}
