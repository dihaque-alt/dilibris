import { useEffect } from 'react';
import { syncAppPrefs } from '../lib/appPrefs';
import { applyAppearancePrefs, loadAppearancePrefs } from '../lib/appearancePrefs';

interface AppPrefsSyncEffectProps {
  userId: string;
}

/** Pull prefs from Supabase on login; migrate legacy localStorage once. */
export function AppPrefsSyncEffect({ userId }: AppPrefsSyncEffectProps) {
  useEffect(() => {
    let cancelled = false;

    void syncAppPrefs(userId)
      .then(() => {
        if (cancelled) return;
        applyAppearancePrefs(loadAppearancePrefs(userId));
        window.dispatchEvent(new CustomEvent('dilibris:appearance'));
        window.dispatchEvent(new CustomEvent('dilibris:library-display'));
      })
      .catch(() => {
        /* keep local cache */
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return null;
}
