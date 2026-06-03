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
    <form className="inline-form" onSubmit={handleSubmit}>
      <h3>Нова полиця</h3>
      <label>
        Назва
        <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} />
      </label>
      <label>
        Статус (опційно)
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as BookEntryStatus | '')}>
          <option value="">Будь-який</option>
          {(Object.entries(STATUS_LABELS) as [BookEntryStatus, string][]).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      {error && <p className="form-error">{error}</p>}
      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Скасувати
        </button>
        <button type="submit" disabled={saving}>
          {saving ? 'Зберігаємо…' : 'Створити'}
        </button>
      </div>
    </form>
  );
}
