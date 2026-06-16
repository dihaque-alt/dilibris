import { useState, type FormEvent } from 'react';
import type { BookEntryStatus } from '../types/database';
import { STATUS_LABELS } from '../lib/labels';

interface AddShelfFormProps {
  onSubmit: (name: string, statusFilter: BookEntryStatus | null) => Promise<void>;
  onCancel: () => void;
}

export function AddShelfForm({ onSubmit, onCancel }: AddShelfFormProps) {
  const [name, setName] = useState('');
  const [statusFilter, setStatusFilter] = useState<BookEntryStatus | ''>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError('');
    try {
      await onSubmit(name.trim(), statusFilter || null);
      setName('');
      setStatusFilter('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося створити полицю');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="add-shelf-form" onSubmit={handleSubmit}>
      <label className="dl-field">
        <span className="dl-field-label">Назва полиці</span>
        <input
          className="dl-field-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="напр. Літо 2026"
          required
          maxLength={80}
          autoFocus
        />
      </label>
      <label className="dl-field">
        <span className="dl-field-label">Статус (необов&apos;язково)</span>
        <select
          className="dl-field-input"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as BookEntryStatus | '')}
        >
          <option value="">Будь-який</option>
          {(Object.entries(STATUS_LABELS) as [BookEntryStatus, string][]).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      {error && <p className="form-error">{error}</p>}
      <div className="add-shelf-actions">
        <button type="button" className="dl-ghost" onClick={onCancel}>
          Скасувати
        </button>
        <button type="submit" className="dl-primary" disabled={saving || !name.trim()}>
          {saving ? 'Зберігаємо…' : 'Створити полицю'}
        </button>
      </div>
    </form>
  );
}
