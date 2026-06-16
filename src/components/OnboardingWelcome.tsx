import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { RoomBackdrop } from './RoomBackdrop';

const onboardKey = (userId: string) => `dilibris_onboarded_${userId}`;

export function hasCompletedOnboarding(userId: string): boolean {
  return localStorage.getItem(onboardKey(userId)) === '1';
}

export function markOnboardingComplete(userId: string) {
  localStorage.setItem(onboardKey(userId), '1');
}

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

    markOnboardingComplete(userId);
    setSaving(false);
    onComplete();
  }

  return (
    <>
      <RoomBackdrop />
      <div className="auth-onboard-wrap">
        <div className="auth-onboard-card">
          <h1 className="auth-onboard-title">Трохи про тебе</h1>
          <p className="auth-onboard-sub" style={{ marginBottom: 24 }}>
            Це налаштуємо зараз — зміниш будь-коли в профілі.
          </p>

          <div className="auth-onboard-actions">
            <div>
              <label className="dl-field-label" htmlFor="onboard-name">
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

            <div>
              <label className="dl-field-label" htmlFor="onboard-target">
                Ціль на рік ·{' '}
                <strong style={{ color: 'var(--accent-lime-deep)', textTransform: 'none' }}>
                  {target} книг
                </strong>
              </label>
              <input
                id="onboard-target"
                type="range"
                min={6}
                max={60}
                step={1}
                value={target}
                onChange={(e) => setTarget(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent-lime)' }}
              />
            </div>

            {error && <p className="form-error">{error}</p>}

            <button
              type="button"
              className="dl-primary"
              style={{ width: '100%', padding: '13px', marginTop: 4 }}
              disabled={saving}
              onClick={handleEnter}
            >
              {saving ? 'Зберігаємо…' : 'Зайти в бібліотеку'}
            </button>
          </div>

          <div className="auth-onboard-foot">Безкоштовно назавжди · без реклами</div>
        </div>
      </div>
    </>
  );
}
