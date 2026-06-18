import { useEffect, useState } from 'react';
import { markOnboardingComplete } from '../lib/onboarding';
import { supabase } from '../lib/supabase';
import { BrandMark } from './BrandMark';
import { RoomBackdrop } from './RoomBackdrop';

interface OnboardingWelcomeProps {
  userId: string;
  userEmail: string;
  onComplete: () => void;
}

export function OnboardingWelcome({ userId, userEmail, onComplete }: OnboardingWelcomeProps) {
  const [name, setName] = useState('');
  const [target, setTarget] = useState(24);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase
      .from('profiles')
      .select('display_name')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.display_name) setName(data.display_name);
        else setName(userEmail.split('@')[0] ?? '');
      });
  }, [userId, userEmail]);

  async function handleEnter() {
    setSaving(true);
    setError('');

    const displayName = name.trim() || 'Читач';
    const year = new Date().getFullYear();

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ display_name: displayName })
      .eq('id', userId);

    if (profileError) {
      setError(profileError.message);
      setSaving(false);
      return;
    }

    const { data: existing } = await supabase
      .from('reading_challenges')
      .select('id')
      .eq('user_id', userId)
      .eq('year', year)
      .maybeSingle();

    if (!existing) {
      const { error: challengeError } = await supabase.from('reading_challenges').insert({
        user_id: userId,
        year,
        target_books: target,
      });

      if (challengeError) {
        setError(challengeError.message);
        setSaving(false);
        return;
      }
    }

    try {
      await markOnboardingComplete(userId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося зберегти onboarding');
      setSaving(false);
      return;
    }

    setSaving(false);
    onComplete();
  }

  return (
    <>
      <RoomBackdrop />
      <div className="auth-onboard-wrap">
        <div className="auth-onboard-card">
          <div className="auth-onboard-brand">
            <BrandMark />
            <span>DiLibris</span>
          </div>

          <h1 className="auth-onboard-title">Трохи про тебе</h1>

          <div className="auth-onboard-actions auth-onboard-actions--who">
            <div className="auth-onboard-field-group">
              <label className="auth-onboard-label" htmlFor="onboard-name">
                Ім&apos;я
              </label>
              <input
                id="onboard-name"
                className="auth-onboard-field"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Як до тебе звертатися?"
                autoFocus
              />
            </div>

            <div className="auth-onboard-field-group">
              <label className="auth-onboard-label" htmlFor="onboard-target">
                Ціль на рік ·{' '}
                <strong className="auth-onboard-target-value">{target} книг</strong>
              </label>
              <input
                id="onboard-target"
                type="range"
                className="auth-onboard-range"
                min={6}
                max={60}
                step={1}
                value={target}
                onChange={(e) => setTarget(Number(e.target.value))}
              />
            </div>

            {error && <p className="form-error">{error}</p>}

            <button
              type="button"
              className="dl-primary auth-onboard-btn auth-onboard-btn--enter"
              disabled={saving}
              onClick={handleEnter}
            >
              {saving ? 'Зберігаємо…' : 'Зайти в бібліотеку'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
