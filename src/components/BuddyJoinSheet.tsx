import { useState, type FormEvent } from 'react';
import { BuddySheet } from './BuddySheet';

interface BuddyJoinSheetProps {
  onClose: () => void;
  onSubmit: (token: string) => Promise<void>;
}

export function BuddyJoinSheet({ onClose, onSubmit }: BuddyJoinSheetProps) {
  const [joinToken, setJoinToken] = useState('');
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!joinToken.trim()) return;
    setJoining(true);
    setError('');
    try {
      await onSubmit(joinToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося приєднатися');
      setJoining(false);
    }
  }

  return (
    <BuddySheet title="Долучитися за лінком" onClose={onClose}>
      <form className="buddy-sheet-form" onSubmit={handleSubmit}>
        <label className="dl-field">
          <span className="dl-field-label">Лінк-запрошення</span>
          <input
            className="dl-field-input"
            value={joinToken}
            onChange={(e) => setJoinToken(e.target.value)}
            placeholder="dilibris.app/buddy-reads/join/…"
            autoFocus
          />
        </label>
        <p className="buddy-sheet-hint">Встав лінк або token, який надіслав організатор клубу.</p>
        {error && <p className="banner-error">{error}</p>}
        <footer className="buddy-sheet-foot">
          <button type="button" className="dl-ghost" onClick={onClose}>
            Скасувати
          </button>
          <button type="submit" className="dl-primary" disabled={joining}>
            {joining ? 'Приєднуємось…' : 'Долучитися'}
          </button>
        </footer>
      </form>
    </BuddySheet>
  );
}
