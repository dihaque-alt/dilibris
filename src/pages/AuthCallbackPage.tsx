import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { BrandMark } from '../components/BrandMark';
import { RoomBackdrop } from '../components/RoomBackdrop';
import { supabase } from '../lib/supabase';

type CallbackState = 'loading' | 'done' | 'error';

export function AuthCallbackPage() {
  const [state, setState] = useState<CallbackState>('loading');

  useEffect(() => {
    let cancelled = false;

    async function finishSession() {
      const params = new URLSearchParams(window.location.search);
      const oauthError = params.get('error_description') ?? params.get('error');

      if (oauthError) {
        if (!cancelled) setState('error');
        return;
      }

      const code = params.get('code');

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (cancelled) return;

        if (exchangeError) {
          setState('error');
          return;
        }

        setState('done');
        return;
      }

      const { data, error: sessionError } = await supabase.auth.getSession();
      if (cancelled) return;

      if (sessionError) {
        setState('error');
        return;
      }

      if (data.session) {
        setState('done');
        return;
      }

      setState('error');
    }

    void finishSession();

    return () => {
      cancelled = true;
    };
  }, []);

  if (state === 'loading') {
    return (
      <>
        <RoomBackdrop />
        <div className="auth-onboard-wrap">
          <p className="auth-onboard-loading">Завершуємо вхід…</p>
        </div>
      </>
    );
  }

  if (state === 'error') {
    return (
      <>
        <RoomBackdrop />
        <div className="auth-onboard-wrap">
          <div className="auth-onboard-card">
            <div className="auth-onboard-brand">
              <BrandMark />
              <span>DiLibris</span>
            </div>
            <h1 className="auth-onboard-title">Не вдалося увійти</h1>
            <div className="auth-onboard-actions">
              <Link to="/" className="dl-primary auth-onboard-btn">
                Спробувати знову
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  return <Navigate to="/" replace />;
}
