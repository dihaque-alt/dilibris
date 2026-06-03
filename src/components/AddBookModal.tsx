import { useEffect, useState, type FormEvent } from 'react';
import { openLibraryCoverUrl, openLibraryWorkId, searchOpenLibrary } from '../lib/openLibrary';
import { formatAuthors } from '../lib/labels';
import type { BookEntryStatus, OpenLibraryHit } from '../types/database';
import { BookCover } from './BookCover';

interface AddBookModalProps {
  shelfId: string | null;
  defaultStatus: BookEntryStatus;
  onClose: () => void;
  searchEnabled?: boolean;
  onAdd: (payload: {
    title: string;
    authors: string[];
    coverUrl: string | null;
    pageCount: number | null;
    publishedYear: number | null;
    externalIds: Record<string, string>;
    status: BookEntryStatus;
  }) => Promise<void>;
}

export function AddBookModal({ shelfId, defaultStatus, onClose, onAdd, searchEnabled = true }: AddBookModalProps) {
  const [mode, setMode] = useState<'search' | 'manual'>(searchEnabled ? 'search' : 'manual');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<OpenLibraryHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  const [title, setTitle] = useState('');
  const [authors, setAuthors] = useState('');
  const [status, setStatus] = useState<BookEntryStatus>(defaultStatus);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (mode !== 'search') return;
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }

    const timer = window.setTimeout(async () => {
      setSearching(true);
      setSearchError('');
      try {
        setResults(await searchOpenLibrary(q));
      } catch {
        setSearchError('Пошук не вдався');
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => window.clearTimeout(timer);
  }, [query, mode]);

  async function pickHit(hit: OpenLibraryHit) {
    setSaving(true);
    setError('');
    try {
      await onAdd({
        title: hit.title,
        authors: hit.author_name ?? [],
        coverUrl: openLibraryCoverUrl(hit.cover_i, 'L'),
        pageCount: hit.number_of_pages_median ?? null,
        publishedYear: hit.first_publish_year ?? null,
        externalIds: { open_library: openLibraryWorkId(hit.key) },
        status,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося додати книгу');
    } finally {
      setSaving(false);
    }
  }

  async function handleManualSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onAdd({
        title: title.trim(),
        authors: authors
          .split(',')
          .map((a) => a.trim())
          .filter(Boolean),
        coverUrl: null,
        pageCount: null,
        publishedYear: null,
        externalIds: {},
        status,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося додати книгу');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="add-book-title">
        <header className="modal-header">
          <h2 id="add-book-title">Додати книгу</h2>
          <button type="button" className="btn-icon" onClick={onClose} aria-label="Закрити">
            ×
          </button>
        </header>

        {!shelfId && (
          <p className="form-hint">Спочатку обери або створи полицю.</p>
        )}

        {searchEnabled ? (
          <div className="tabs">
            <button type="button" className={mode === 'search' ? 'tab active' : 'tab'} onClick={() => setMode('search')}>
              Пошук
            </button>
            <button type="button" className={mode === 'manual' ? 'tab active' : 'tab'} onClick={() => setMode('manual')}>
              Вручну
            </button>
          </div>
        ) : (
          <p className="form-hint">Offline — лише ручне додавання.</p>
        )}

        <label>
          Статус
          <select value={status} onChange={(e) => setStatus(e.target.value as BookEntryStatus)}>
            <option value="want_to_read">Хочу прочитати</option>
            <option value="reading">Читаю зараз</option>
            <option value="finished">Прочитано</option>
            <option value="dnf">Не дочитала</option>
            <option value="re_reading">Перечитую</option>
          </select>
        </label>

        {mode === 'search' ? (
          <>
            <label>
              Назва або автор
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="1984, Оруелл…"
                autoFocus
              />
            </label>
            {searching && <p className="form-hint">Шукаємо…</p>}
            {searchError && <p className="form-error">{searchError}</p>}
            <ul className="search-results">
              {results.map((hit) => (
                <li key={hit.key}>
                  <button type="button" className="search-hit" disabled={saving || !shelfId} onClick={() => pickHit(hit)}>
                    <BookCover title={hit.title} coverUrl={openLibraryCoverUrl(hit.cover_i, 'S')} size="sm" />
                    <span>
                      <strong>{hit.title}</strong>
                      <small>{formatAuthors(hit.author_name)}</small>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <form onSubmit={handleManualSubmit} className="manual-form">
            <label>
              Назва
              <input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </label>
            <label>
              Автори (через кому)
              <input value={authors} onChange={(e) => setAuthors(e.target.value)} placeholder="Джордж Оруелл" />
            </label>
            <button type="submit" disabled={saving || !shelfId}>
              {saving ? 'Додаємо…' : 'Додати'}
            </button>
          </form>
        )}

        {error && <p className="form-error">{error}</p>}
      </div>
    </div>
  );
}
