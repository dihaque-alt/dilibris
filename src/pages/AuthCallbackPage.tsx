import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

type CallbackState = 'loading' | 'done' | 'error';

export function AuthCallbackPage() {
  const [state, setState] = useState<CallbackState>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function finishSession() {
      const params = new URLSearchParams(window.location.search);
      const oauthError =
        params.get('error_description') ?? params.get('error');

      if (oauthError) {
        if (!cancelled) {
          setError(oauthError);
          setState('error');
        }
        return;
      }

      const code = params.get('code');

      if (code) {
        const { error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(code);
        if (cancelled) return;

        if (exchangeError) {
          setError(exchangeError.message);
          setState('error');
          return;
        }

        setState('done');
        return;
      }

      const { data, error: sessionError } = await supabase.auth.getSession();
      if (cancelled) return;

      if (sessionError) {
        setError(sessionError.message);
        setState('error');
        return;
      }

      if (data.session) {
        setState('done');
        return;
      }

      setError('Не вдалося увійти. Спробуй ще раз.');
      setState('error');
    }

    void finishSession();

    return () => {
      cancelled = true;
    };
  }, []);

  if (state === 'loading') {
    return (
      <div className="center-page center-page--auth">
        <p>Завершуємо вхід…</p>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="center-page center-page--auth">
        <div className="login-card">
          <p className="form-error">Помилка входу: {error}</p>
          <Link to="/" className="login-retry-link">
            Спробувати знову
          </Link>
        </div>
      </div>
    );
  }

  return <Navigate to="/" replace />;
}
