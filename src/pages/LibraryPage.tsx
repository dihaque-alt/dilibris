import { useCallback, useEffect, useState } from 'react';
import { AppNav } from '../components/AppNav';
import { useOffline } from '../components/OfflineProvider';
import { AddBookModal } from '../components/AddBookModal';
import { AddShelfForm } from '../components/AddShelfForm';
import { BookCover } from '../components/BookCover';
import { BookDetailModal } from '../components/BookDetailModal';
import { BookFlyout } from '../components/BookFlyout';
import {
  addBook,
  createShelf,
  deleteShelf,
  fetchEntry,
  fetchLibrary,
} from '../lib/offline/librarySync';
import { STATUS_LABELS } from '../lib/labels';
import type { BookEntryStatus, UserBookEntry, UserShelf } from '../types/database';

interface LibraryPageProps {
  userId: string;
  userEmail: string;
}

export function LibraryPage({ userId, userEmail }: LibraryPageProps) {
  const { online, refreshPending } = useOffline();
  const [shelves, setShelves] = useState<UserShelf[]>([]);
  const [entries, setEntries] = useState<UserBookEntry[]>([]);
  const [fromCache, setFromCache] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddShelf, setShowAddShelf] = useState(false);
  const [addBookShelfId, setAddBookShelfId] = useState<string | null>(null);
  const [previewEntry, setPreviewEntry] = useState<UserBookEntry | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<UserBookEntry | null>(null);

  const loadLibrary = useCallback(async () => {
    const data = await fetchLibrary(userId);
    setShelves(data.shelves);
    setEntries(data.entries);
    setFromCache(data.fromCache);
  }, [userId]);

  useEffect(() => {
    setLoading(true);
    setError('');
    loadLibrary()
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Не вдалося завантажити бібліотеку');
      })
      .finally(() => setLoading(false));
  }, [loadLibrary, online]);

  async function handleCreateShelf(name: string, statusFilter: BookEntryStatus | null) {
    const shelf = await createShelf(userId, name, statusFilter, shelves.length);
    setShelves((prev) => [...prev, shelf]);
    setShowAddShelf(false);
    await refreshPending();
  }

  async function handleDeleteShelf(shelfId: string) {
    if (!window.confirm('Видалити полицю? Книги залишаться без полиці.')) return;
    await deleteShelf(userId, shelfId);
    await loadLibrary();
    await refreshPending();
  }

  async function handleAddBook(payload: {
    title: string;
    authors: string[];
    coverUrl: string | null;
    pageCount: number | null;
    publishedYear: number | null;
    externalIds: Record<string, string>;
    status: BookEntryStatus;
  }) {
    if (!addBookShelfId) throw new Error('Обери полицю');
    await addBook(userId, addBookShelfId, payload);
    setAddBookShelfId(null);
    await loadLibrary();
    await refreshPending();
  }

  if (loading) {
    return (
      <div className="app-shell app-shell--room">
        <AppNav userEmail={userEmail} active="library" />
        <div className="center-page">Відчиняємо бібліотеку…</div>
      </div>
    );
  }

  return (
    <div className="app-shell app-shell--room">
      <AppNav userEmail={userEmail} active="library" />

      {fromCache && online && (
        <p className="offline-hint">Показано збережену копію — сервер тимчасово недоступний.</p>
      )}

      {error && <p className="banner-error">{error}</p>}

      <main className="library-room">
        <header className="library-room-head">
          <div>
            <h2>Моя бібліотека</h2>
            <p className="library-room-sub">Тицьни на книгу — вона «вилетить» з полиці</p>
          </div>
          <button type="button" className="btn-small" onClick={() => setShowAddShelf((v) => !v)}>
            + Полиця
          </button>
        </header>

        {showAddShelf && (
          <div className="dashboard-card library-inline-form">
            <AddShelfForm onSubmit={handleCreateShelf} onCancel={() => setShowAddShelf(false)} />
          </div>
        )}

        {shelves.length === 0 ? (
          <div className="library-empty dashboard-card">
            <p className="empty-hint">Створи першу полицю — тут з’явиться твоя кімната з книгами.</p>
          </div>
        ) : (
          <div className="shelf-stack">
            {shelves.map((shelf) => {
              const shelfEntries = entries.filter((e) => e.shelf_id === shelf.id);
              return (
                <section key={shelf.id} className="shelf-unit">
                  <div className="shelf-unit-head">
                    <div>
                      <h3>{shelf.name}</h3>
                      {shelf.status_filter && (
                        <span className="shelf-meta">{STATUS_LABELS[shelf.status_filter]}</span>
                      )}
                    </div>
                    <div className="shelf-unit-actions">
                      <button type="button" className="btn-small" onClick={() => setAddBookShelfId(shelf.id)}>
                        + Книга
                      </button>
                      <button
                        type="button"
                        className="shelf-delete"
                        aria-label={`Видалити ${shelf.name}`}
                        onClick={() => handleDeleteShelf(shelf.id)}
                      >
                        ×
                      </button>
                    </div>
                  </div>

                  <div className="shelf-plank">
                    {shelfEntries.length === 0 ? (
                      <p className="shelf-empty">Порожня полиця</p>
                    ) : (
                      <div className="shelf-books">
                        {shelfEntries.map((entry) => (
                          <button
                            key={entry.id}
                            type="button"
                            className="shelf-book"
                            title={entry.book?.title}
                            onClick={() => setPreviewEntry(entry)}
                          >
                            <BookCover
                              title={entry.book?.title ?? 'Книга'}
                              coverUrl={entry.book?.cover_url}
                              size="shelf"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </main>

      {addBookShelfId && (
        <AddBookModal
          shelfId={addBookShelfId}
          defaultStatus={
            shelves.find((s) => s.id === addBookShelfId)?.status_filter ?? 'want_to_read'
          }
          onClose={() => setAddBookShelfId(null)}
          onAdd={handleAddBook}
          searchEnabled={online}
        />
      )}

      {previewEntry && (
        <BookFlyout
          entry={previewEntry}
          onClose={() => setPreviewEntry(null)}
          onOpenDetail={() => {
            setSelectedEntry(previewEntry);
            setPreviewEntry(null);
          }}
        />
      )}

      {selectedEntry && (
        <BookDetailModal
          entry={selectedEntry}
          userId={userId}
          onClose={() => setSelectedEntry(null)}
          onUpdated={async () => {
            await loadLibrary();
            await refreshPending();
            const updated = await fetchEntry(selectedEntry.id);
            if (updated) setSelectedEntry(updated);
          }}
        />
      )}
    </div>
  );
}
