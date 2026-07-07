import { useEffect, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { useIsMobile } from '../hooks/useIsMobile';
import { type BookSearchHit, searchGoogleBooks } from '../lib/googleBooks';
import { errorMessage } from '../lib/buddyRead';
import { openLibraryHitToSearchHit, searchOpenLibrary } from '../lib/openLibrary';
import { BOOK_LANGUAGE_OPTIONS } from '../lib/language';
import { formatAuthors, STATUS_LABELS } from '../lib/labels';
import type { BookEntryStatus } from '../types/database';
import { BookCover } from './BookCover';

interface AddBookModalProps {
  shelfId: string | null;
  shelfName?: string;
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
    language?: string | null;
  }) => Promise<void>;
}

type Tab = 'search' | 'manual';
type SearchSource = BookSearchHit['source'] | null;

async function searchBooks(query: string): Promise<{ hits: BookSearchHit[]; source: SearchSource }> {
  try {
    const olHits = await searchOpenLibrary(query);
    if (olHits.length > 0) {
      return { hits: olHits.map(openLibraryHitToSearchHit), source: 'open_library' };
    }
  } catch {
    // fall through to Google Books
  }

  const gbHits = await searchGoogleBooks(query);
  return { hits: gbHits, source: gbHits.length > 0 ? 'google_books' : null };
}

const SOURCE_LABELS: Record<NonNullable<SearchSource>, string> = {
  open_library: 'Результати з Open Library',
  google_books: 'Результати з Google Books',
};

export function AddBookModal({
  shelfId,
  shelfName,
  defaultStatus,
  onClose,
  onAdd,
  searchEnabled = true,
}: AddBookModalProps) {
  const mobile = useIsMobile();
  const [tab, setTab] = useState<Tab>(searchEnabled ? 'search' : 'manual');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<BookSearchHit[]>([]);
  const [searchSource, setSearchSource] = useState<SearchSource>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  const [title, setTitle] = useState('');
  const [authors, setAuthors] = useState('');
  const [pages, setPages] = useState('');
  const [language, setLanguage] = useState('');
  const [status, setStatus] = useState<BookEntryStatus>(defaultStatus);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setStatus(defaultStatus);
  }, [defaultStatus]);

  useEffect(() => {
    if (tab !== 'search' || !searchEnabled) return;
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearchSource(null);
      return;
    }

    const timer = window.setTimeout(async () => {
      setSearching(true);
      setSearchError('');
      try {
        const { hits, source } = await searchBooks(q);
        setResults(hits);
        setSearchSource(source);
      } catch {
        setSearchError('Пошук невдалий — спробуй вручну');
        setResults([]);
        setSearchSource(null);
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => window.clearTimeout(timer);
  }, [query, tab, searchEnabled]);

  async function pickHit(hit: BookSearchHit) {
    if (!shelfId) return;
    setSaving(true);
    setError('');
    try {
      await onAdd({
        title: hit.title,
        authors: hit.authors,
        coverUrl: hit.coverUrl,
        pageCount: hit.pageCount,
        publishedYear: hit.publishedYear,
        externalIds: hit.externalIds,
        language: hit.language,
        status,
      });
      onClose();
    } catch (err) {
      setError(errorMessage(err, 'Не вдалося додати книгу'));
    } finally {
      setSaving(false);
    }
  }

  async function submitManual() {
    if (!title.trim() || !shelfId) return;
    setSaving(true);
    setError('');
    const pageCount = pages.trim() ? parseInt(pages, 10) : null;
    try {
      await onAdd({
        title: title.trim(),
        authors: authors
          .split(',')
          .map((a) => a.trim())
          .filter(Boolean),
        coverUrl: null,
        pageCount: pageCount && pageCount > 0 ? pageCount : null,
        publishedYear: null,
        externalIds: {},
        language: language || null,
        status,
      });
      onClose();
    } catch (err) {
      setError(errorMessage(err, 'Не вдалося додати книгу'));
    } finally {
      setSaving(false);
    }
  }

  function handleManualSubmit(e: FormEvent) {
    e.preventDefault();
    void submitManual();
  }

  const showSearch = searchEnabled;
  const queryReady = query.trim().length >= 2;

  return createPortal(
    <div
      className={`dl-modal-backdrop${mobile ? ' is-sheet-backdrop' : ''}`}
      onClick={onClose}
      role="presentation"
    >
      <div className="dl-modal-backdrop-inner">
        <div
          className={`dl-detailcard add-book-sheet ${mobile ? 'is-sheet' : 'is-modal'}`}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-book-title"
        >
        {mobile && <div className="dl-sheet-handle" aria-hidden="true" />}
        <header className="add-book-head">
          <div>
            <h2 id="add-book-title">Додати книгу</h2>
            {shelfName && <p className="add-book-shelf">на полицю «{shelfName}»</p>}
          </div>
          <button type="button" className="dl-close" onClick={onClose} aria-label="Закрити">
            ✕
          </button>
        </header>

        {!shelfId && (
          <p className="add-book-hint">Спочатку обери або створи полицю</p>
        )}

        <div className="add-book-body">
          {showSearch ? (
            <div className="dl-segmented" role="tablist" aria-label="Спосіб додавання">
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'search'}
                className={`dl-segmented-btn${tab === 'search' ? ' is-active' : ''}`}
                onClick={() => setTab('search')}
              >
                Пошук
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'manual'}
                className={`dl-segmented-btn${tab === 'manual' ? ' is-active' : ''}`}
                onClick={() => setTab('manual')}
              >
                Вручну
              </button>
            </div>
          ) : (
            <p className="add-book-hint">Офлайн — лише ручне додавання</p>
          )}

          <label className="dl-field">
            <span className="dl-field-label">Статус</span>
            <select
              className="dl-field-input"
              value={status}
              onChange={(e) => setStatus(e.target.value as BookEntryStatus)}
            >
              {(Object.entries(STATUS_LABELS) as [BookEntryStatus, string][]).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          {tab === 'search' && showSearch ? (
            <>
              <div className="dl-inline-field">
                <span className="dl-inline-field-icon" aria-hidden="true">
                  ⌕
                </span>
                <input
                  className="dl-inline-field-input"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Назва, автор або ISBN…"
                  autoFocus
                />
              </div>

              {searching && <p className="add-book-hint">Шукаємо…</p>}
              {searchError && <p className="form-error">{searchError}</p>}

              <div className="add-book-results">
                {!searching && queryReady && results.length === 0 && !searchError && (
                  <p className="add-book-empty">Нічого не знайдено — спробуй додати вручну</p>
                )}
                {results.map((hit) => (
                  <div key={`${hit.source}:${hit.id}`} className="add-book-hit">
                    <BookCover
                      title={hit.title}
                      authors={hit.authors}
                      coverUrl={hit.coverUrl}
                      size="sm"
                    />
                    <div className="add-book-hit-text">
                      <div className="add-book-hit-title">{hit.title}</div>
                      <div className="add-book-hit-author">{formatAuthors(hit.authors)}</div>
                    </div>
                    <button
                      type="button"
                      className="dl-ghost"
                      disabled={saving || !shelfId}
                      onClick={() => void pickHit(hit)}
                    >
                      Додати
                    </button>
                  </div>
                ))}
              </div>

              {searchSource && (
                <p className="add-book-source">{SOURCE_LABELS[searchSource]}</p>
              )}
            </>
          ) : (
            <form className="add-book-manual" onSubmit={handleManualSubmit}>
              <label className="dl-field">
                <span className="dl-field-label">Назва</span>
                <input
                  className="dl-field-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Назва книги"
                  required
                  autoFocus={!showSearch}
                />
              </label>
              <label className="dl-field">
                <span className="dl-field-label">Автор</span>
                <input
                  className="dl-field-input"
                  value={authors}
                  onChange={(e) => setAuthors(e.target.value)}
                  placeholder="Ім&apos;я автора"
                />
              </label>
              <label className="dl-field">
                <span className="dl-field-label">Сторінок (необов&apos;язково)</span>
                <input
                  className="dl-field-input"
                  inputMode="numeric"
                  value={pages}
                  onChange={(e) => setPages(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="320"
                />
              </label>
              <label className="dl-field">
                <span className="dl-field-label">Мова (необов&apos;язково)</span>
                <select
                  className="dl-field-input"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  <option value="">Не вказано</option>
                  {BOOK_LANGUAGE_OPTIONS.map(({ code, label }) => (
                    <option key={code} value={code}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </form>
          )}

          {error && <p className="form-error">{error}</p>}
        </div>

        <footer className="add-book-foot">
          <button type="button" className="dl-ghost" onClick={onClose}>
            Скасувати
          </button>
          {tab === 'search' && showSearch ? (
            <button type="button" className="dl-primary" onClick={onClose}>
              Готово
            </button>
          ) : (
            <button
              type="button"
              className="dl-primary"
              disabled={saving || !shelfId || !title.trim()}
              onClick={() => void submitManual()}
            >
              {saving ? 'Додаємо…' : 'Додати'}
            </button>
          )}
        </footer>
        </div>
      </div>
    </div>,
    document.body,
  );
}
