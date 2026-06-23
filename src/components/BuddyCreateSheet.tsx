import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { errorMessage } from '../lib/buddyRead';
import { BuddySheet } from './BuddySheet';
import type { UserBookEntry } from '../types/database';

interface BuddyCreateSheetProps {
  libraryBooks: UserBookEntry[];
  onClose: () => void;
  onSubmit: (payload: {
    bookId: string;
    title: string;
    description: string;
    deadline: string;
  }) => Promise<void>;
}

export function BuddyCreateSheet({ libraryBooks, onClose, onSubmit }: BuddyCreateSheetProps) {
  const [bookId, setBookId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!bookId) {
      setError('Обери книгу з бібліотеки');
      return;
    }
    setCreating(true);
    setError('');
    try {
      await onSubmit({ bookId, title, description, deadline });
    } catch (err) {
      setError(errorMessage(err, 'Не вдалося створити клуб'));
      setCreating(false);
    }
  }

  return (
    <BuddySheet title="Новий клуб" onClose={onClose}>
      {libraryBooks.length === 0 ? (
        <p className="empty-hint">
          Спочатку додай книгу в <Link to="/">бібліотеку</Link>.
        </p>
      ) : (
        <form className="buddy-sheet-form" onSubmit={handleSubmit}>
          <label className="dl-field">
            <span className="dl-field-label">Книга</span>
            <select
              className="dl-field-input"
              value={bookId}
              onChange={(e) => {
                setBookId(e.target.value);
                const entry = libraryBooks.find((b) => b.book_id === e.target.value);
                if (entry?.book?.title && !title) setTitle(entry.book.title);
              }}
              required
            >
              <option value="">Обери книгу…</option>
              {libraryBooks.map((entry) => (
                <option key={entry.id} value={entry.book_id}>
                  {entry.book?.title ?? 'Книга'}
                </option>
              ))}
            </select>
          </label>
          <label className="dl-field">
            <span className="dl-field-label">Назва клубу</span>
            <input
              className="dl-field-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="напр. Вечірні читання"
            />
          </label>
          <label className="dl-field">
            <span className="dl-field-label">Опис (необов&apos;язково)</span>
            <input
              className="dl-field-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
          <label className="dl-field">
            <span className="dl-field-label">Дедлайн (необов&apos;язково)</span>
            <input
              type="date"
              className="dl-field-input"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </label>
          {error && <p className="banner-error">{error}</p>}
          <footer className="buddy-sheet-foot">
            <button type="button" className="dl-ghost" onClick={onClose}>
              Скасувати
            </button>
            <button type="submit" className="dl-primary" disabled={creating}>
              {creating ? 'Створюємо…' : 'Створити клуб'}
            </button>
          </footer>
        </form>
      )}
    </BuddySheet>
  );
}
