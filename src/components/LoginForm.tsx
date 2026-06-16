import { useState, type FormEvent } from 'react';
import { getAuthRedirectUrl } from '../lib/authRedirect';
import { supabase } from '../lib/supabase';

function BrandMark() {
  return (
    <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
      <rect x="3" y="5" width="26" height="22" rx="5" fill="var(--accent-lime)" />
      <rect x="3" y="5" width="13" height="22" rx="5" fill="var(--accent-lime-deep)" />
      <rect x="14.5" y="7" width="3" height="18" rx="1.5" fill="var(--bg-room)" />
      <circle cx="9.5" cy="16" r="2" fill="var(--gold-highlight)" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg className="login-google-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

type Step = 'email' | 'sent';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<Step>('email');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const emailValid = /\S+@\S+\.\S+/.test(email.trim());
  const busy = status === 'loading';

  async function handleGoogleSignIn() {
    setStatus('loading');
    setMessage('');

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: getAuthRedirectUrl() },
    });

    if (error) {
      setStatus('error');
      setMessage(error.message);
    }
  }

  async function handleSendLink(e?: FormEvent) {
    e?.preventDefault();
    if (!emailValid) return;

    setStatus('loading');
    setMessage('');

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: getAuthRedirectUrl() },
    });

    if (error) {
      setStatus('error');
      setMessage(error.message);
      return;
    }

    setStep('sent');
    setStatus('idle');
  }

  async function handleResend() {
    await handleSendLink();
    setMessage('Надіслали ще раз — перевір пошту.');
  }

  return (
    <div className="auth-onboard-wrap">
      <div className="auth-onboard-card">
        <div className="auth-onboard-brand">
          <BrandMark />
          <span>DiLibris</span>
        </div>

        {step === 'email' && (
          <>
            <h1 className="auth-onboard-title">Твоя віртуальна бібліотека</h1>
            <p className="auth-onboard-sub">
              Залиш пошту — надішлемо чарівний лінк для входу. Жодних паролів.
            </p>

            <button
              type="button"
              className="login-google-btn"
              onClick={handleGoogleSignIn}
              disabled={busy}
              style={{ width: '100%', marginBottom: 12 }}
            >
              <GoogleIcon />
              {busy ? 'Перенаправляємо…' : 'Увійти через Google'}
            </button>

            <div className="login-divider" aria-hidden="true" style={{ margin: '1rem 0' }}>
              <span>або email</span>
            </div>

            <form onSubmit={handleSendLink} className="auth-onboard-actions">
              <input
                type="email"
                className="auth-onboard-field"
                placeholder="твоя@пошта.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                disabled={busy}
              />
              <button
                type="submit"
                className="dl-primary"
                disabled={!emailValid || busy}
                style={{ width: '100%', padding: '13px', opacity: emailValid ? 1 : 0.5 }}
              >
                {busy ? 'Надсилаємо…' : 'Надіслати лінк'}
              </button>
              <div className="auth-reassure">
                <span>✦</span>
                <span>Без паролів — лише безпечний лінк на пошту</span>
              </div>
            </form>
          </>
        )}

        {step === 'sent' && (
          <>
            <div className="auth-sent-icon" aria-hidden="true">
              ✉
            </div>
            <h1 className="auth-onboard-title">Перевір пошту</h1>
            <p className="auth-onboard-sub">
              Лінк для входу полетів на <strong>{email.trim()}</strong>. Відкрий лист і тицьни
              «Увійти в DiLibris».
            </p>
            <div className="auth-onboard-actions">
              <button type="button" className="dl-ghost" style={{ width: '100%' }} onClick={handleResend}>
                Надіслати ще раз
              </button>
              <button type="button" className="auth-link-btn" onClick={() => setStep('email')}>
                ‹ Інша пошта
              </button>
            </div>
          </>
        )}

        {message && <p className={status === 'error' ? 'form-error' : 'form-hint'}>{message}</p>}

        <div className="auth-onboard-foot">Безкоштовно назавжди · без реклами</div>
      </div>
    </div>
  );
}
