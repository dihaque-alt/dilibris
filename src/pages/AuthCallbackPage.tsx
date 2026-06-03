import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export function AuthCallbackPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ error: sessionError }) => {
      if (sessionError) setError(sessionError.message);
    });
  }, []);

  if (error) {
    return (
      <div className="center-page">
        <p className="form-error">Помилка входу: {error}</p>
        <a href="/">Спробувати знову</a>
      </div>
    );
  }

  return <Navigate to="/" replace />;
}
