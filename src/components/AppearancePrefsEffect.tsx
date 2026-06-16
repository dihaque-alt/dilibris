import { useEffect } from 'react';
import {
  applyAppearancePrefs,
  loadAppearancePrefs,
} from '../lib/appearancePrefs';

interface AppearancePrefsEffectProps {
  userId: string;
}

export function AppearancePrefsEffect({ userId }: AppearancePrefsEffectProps) {
  useEffect(() => {
    applyAppearancePrefs(loadAppearancePrefs(userId));

    const onChange = () => applyAppearancePrefs(loadAppearancePrefs(userId));
    window.addEventListener('dilibris:appearance', onChange);
    return () => window.removeEventListener('dilibris:appearance', onChange);
  }, [userId]);

  return null;
}
