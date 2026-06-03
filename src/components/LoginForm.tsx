import { useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setStatus('error');
      setMessage(error.message);
      return;
    }

    setStatus('sent');
    setMessage('Перевір пошту — надіслали magic link для входу.');
  }

  return (
    <div className="login-card">
      <h1>DiLibris</h1>
      <p className="login-tagline">Твоя віртуальна бібліотека</p>

      <form onSubmit={handleSubmit} className="login-form">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === 'loading' || status === 'sent'}
        />
        <button type="submit" disabled={status === 'loading' || status === 'sent'}>
          {status === 'loading' ? 'Надсилаємо…' : 'Увійти по magic link'}
        </button>
      </form>

      {message && <p className={status === 'error' ? 'form-error' : 'form-hint'}>{message}</p>}
    </div>
  );
}
