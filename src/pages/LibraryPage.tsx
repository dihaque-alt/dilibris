import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppNav } from '../components/AppNav';
import { useAppOverlays } from '../components/AppOverlays';
import { useOffline } from '../components/OfflineProvider';
import { AddShelfSheet } from '../components/AddShelfSheet';
import { AddBookModal } from '../components/AddBookModal';
import { BookDetailModal } from '../components/BookDetailModal';
import { BookFlyout } from '../components/BookFlyout';
import { RoomBackdrop } from '../components/RoomBackdrop';
import { ShelfBookTile } from '../components/ShelfBookTile';
import { EmptyRoom } from '../components/EmptyRoom';
import { EmptyShelfButton } from '../components/EmptyShelfButton';
import { ShelfOptionsMenu } from '../components/ShelfOptionsMenu';
import { ShelfReorderGrip } from '../components/ShelfReorderGrip';
import { StatusPill } from '../components/StatusPill';
import {
  addBook,
  createShelf,
  deleteShelf,
  fetchEntry,
  fetchLibrary,
  renameShelf,
  reorderShelves,
} from '../lib/offline/librarySync';
import { useShelfDragReorder } from '../hooks/useShelfDragReorder';
import { reorganizeLibraryByStatus } from '../lib/goodreads/reorganizeLibrary';
import { STATUS_LABELS } from '../lib/labels';
import { shelvesForLibraryView } from '../lib/libraryDisplay';
import {
  bookWidthForPrefs,
  loadLibraryDisplayPrefs,
  type LibraryDisplayPrefs,
} from '../lib/libraryDisplayPrefs';
import type { BookEntryStatus, UserBookEntry, UserShelf } from '../types/database';
import '../styles/library.css';
import '../styles/library-overrides.css';

interface LibraryPageProps {
  userId: string;
  userEmail: string;
}

type SortMode = 'shelf' | 'title' | 'progress';

function entryProgress(entry: UserBookEntry): number {
  const total = entry.total_pages ?? entry.book?.page_count;
  if (!total || total <= 0) return 0;
  return Math.min(100, Math.round((entry.current_page / total) * 100));
}

export function LibraryPage({ userId, userEmail }: LibraryPageProps) {
  const { online, refreshPending } = useOffline();
  const overlays = useAppOverlays();
  const [shelves, setShelves] = useState<UserShelf[]>([]);
  const [entries, setEntries] = useState<UserBookEntry[]>([]);
  const [fromCache, setFromCache] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddShelf, setShowAddShelf] = useState(false);
  const [editingShelfId, setEditingShelfId] = useState<string | null>(null);
  const [editingShelfName, setEditingShelfName] = useState('');
  const [addBookShelfId, setAddBookShelfId] = useState<string | null>(null);
  const [previewEntry, setPreviewEntry] = useState<UserBookEntry | null>(null);
  const [previewRect, setPreviewRect] = useState<DOMRect | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<UserBookEntry | null>(null);
  const [filter, setFilter] = useState('');
  const [sort, setSort] = useState<SortMode>('shelf');
  const [display, setDisplay] = useState<LibraryDisplayPrefs>(() => loadLibraryDisplayPrefs(userId));

  const bookWidth = bookWidthForPrefs(display);
  const totalBooks = entries.length;

  useEffect(() => {
    const refresh = () => setDisplay(loadLibraryDisplayPrefs(userId));
    window.addEventListener('dilibris:library-display', refresh);
    return () => window.removeEventListener('dilibris:library-display', refresh);
  }, [userId]);

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

  useEffect(() => {
    const onImported = () => {
      void loadLibrary();
    };
    window.addEventListener('dilibris:library-imported', onImported);
    return () => window.removeEventListener('dilibris:library-imported', onImported);
  }, [loadLibrary]);

  useEffect(() => {
    if (loading || entries.length === 0) return;

    const storageKey = `dilibris-shelf-layout-${userId}`;
    if (sessionStorage.getItem(storageKey)) return;

    const needsLayout = entries.some((entry) => {
      const shelf = shelves.find((s) => s.id === entry.shelf_id);
      return !shelf || shelf.status_filter !== entry.status;
    });

    if (!needsLayout) {
      sessionStorage.setItem(storageKey, '1');
      return;
    }

    reorganizeLibraryByStatus(userId)
      .then(() => {
        sessionStorage.setItem(storageKey, '1');
        return loadLibrary();
      })
      .catch(() => {
        /* leave shelves as-is if reorganize fails */
      });
  }, [loading, entries, shelves, userId, loadLibrary]);

  const filterTerm = filter.trim().toLowerCase();

  const filteredShelves = useMemo(() => {
    const base = shelvesForLibraryView(shelves, entries, Boolean(filterTerm));
    if (!filterTerm) return base;
    return base.filter((shelf) => {
      const shelfEntries = entries.filter((e) => e.shelf_id === shelf.id);
      return shelfEntries.some((entry) => {
        const title = entry.book?.title ?? '';
        const authors = entry.book?.authors?.join(' ') ?? '';
        return (title + authors).toLowerCase().includes(filterTerm);
      });
    });
  }, [shelves, entries, filterTerm]);

  const canReorderShelves = sort === 'shelf' && !filterTerm;
  const shelfOrderIds = useMemo(() => filteredShelves.map((s) => s.id), [filteredShelves]);
  const shelfById = useMemo(() => new Map(filteredShelves.map((s) => [s.id, s])), [filteredShelves]);

  const commitShelfOrder = useCallback(
    async (orderedVisibleIds: string[]) => {
      const visibleSet = new Set(orderedVisibleIds);
      const hidden = [...shelves]
        .filter((s) => !visibleSet.has(s.id))
        .sort((a, b) => a.sort_order - b.sort_order);
      const fullOrder = [...orderedVisibleIds, ...hidden.map((s) => s.id)];
      await reorderShelves(userId, fullOrder);
      setShelves((prev) => {
        const map = new Map(prev.map((s) => [s.id, s]));
        return fullOrder.map((id, i) => ({ ...map.get(id)!, sort_order: i }));
      });
      await refreshPending();
    },
    [shelves, userId, refreshPending],
  );

  const {
    displayIds: shelfDisplayIds,
    draggingId: draggingShelfId,
    onGripPointerDown,
    onGripPointerMove,
    onGripPointerUp,
    moveShelf,
  } = useShelfDragReorder(shelfOrderIds, canReorderShelves, (ids) => {
    void commitShelfOrder(ids);
  });

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

  async function commitShelfRename(shelfId: string) {
    const trimmed = editingShelfName.trim();
    const shelf = shelves.find((s) => s.id === shelfId);
    setEditingShelfId(null);
    if (!trimmed || !shelf || trimmed === shelf.name) return;
    await renameShelf(userId, shelfId, trimmed);
    await loadLibrary();
    await refreshPending();
  }

  function startShelfRename(shelf: UserShelf) {
    setEditingShelfId(shelf.id);
    setEditingShelfName(shelf.name);
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

  function openFlyout(entry: UserBookEntry, rect: DOMRect) {
    setPreviewEntry(entry);
    setPreviewRect(rect);
  }

  if (loading) {
    return (
      <div className="app-shell">
        <RoomBackdrop />
        <AppNav userEmail={userEmail} userId={userId} active="library" />
        <div className="center-page" style={{ color: 'var(--ink-room-soft)' }}>
          Відчиняємо бібліотеку…
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <RoomBackdrop />
      <AppNav
        userEmail={userEmail}
        userId={userId}
        active="library"
        onAddShelf={() => setShowAddShelf(true)}
      />

      {fromCache && !online && (
        <p className="offline-hint">
          Показано збережену копію — сервер тимчасово недоступний.
        </p>
      )}

      {error && <p className="banner-error">{error}</p>}

      <div className="dl-hero">
        <div className="dl-hero-inner">
          <p className="eyebrow">
            Твоя бібліотека{totalBooks > 0 ? ` · ${totalBooks} ${totalBooks === 1 ? 'книга' : totalBooks < 5 ? 'книги' : 'книг'}` : ''}
          </p>
          <h1>Вечір удома з книгами</h1>
        </div>
      </div>

      <div className="dl-library">
        {shelves.length === 0 ? (
          <EmptyRoom onCreateShelf={() => setShowAddShelf(true)} />
        ) : (
          <>
        <div className="dl-libbar">
          <div className="dl-libsearch">
            <span aria-hidden="true">⌕</span>
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Шукати книгу або автора…"
            />
            {filter && (
              <button type="button" onClick={() => setFilter('')} aria-label="Очистити">
                ✕
              </button>
            )}
          </div>
          <div className="dl-libsort">
            {(
              [
                ['shelf', 'За полицею'],
                ['title', 'Назва'],
                ['progress', 'Прогрес'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={sort === key ? 'is-active' : ''}
                onClick={() => setSort(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {filteredShelves.length === 0 ? (
          <div className="dl-empty">Нічого не знайдено за запитом «{filter}»</div>
        ) : (
          shelfDisplayIds.map((shelfId) => {
            const shelf = shelfById.get(shelfId);
            if (!shelf) return null;
            const shelfEntries = entries.filter((e) => e.shelf_id === shelf.id);
            const visibleEntries = (() => {
              let list = filterTerm
                ? shelfEntries.filter((entry) => {
                    const title = entry.book?.title ?? '';
                    const authors = entry.book?.authors?.join(' ') ?? '';
                    return (title + authors).toLowerCase().includes(filterTerm);
                  })
                : [...shelfEntries];

              if (sort === 'title') {
                list.sort((a, b) =>
                  (a.book?.title ?? '').localeCompare(b.book?.title ?? '', 'uk'),
                );
              } else if (sort === 'progress') {
                list.sort((a, b) => entryProgress(b) - entryProgress(a));
              }

              return list;
            })();
            const showStatus =
              shelf.status_filter && STATUS_LABELS[shelf.status_filter] !== shelf.name;

            return (
              <section
                key={shelf.id}
                className={`dl-shelf${draggingShelfId === shelf.id ? ' is-dragging' : ''}`}
                data-shelf-id={shelf.id}
              >
                <div className="dl-shelf-head">
                  <div className="dl-shelf-titles">
                    <ShelfReorderGrip
                      enabled={canReorderShelves}
                      active={draggingShelfId === shelf.id}
                      onPointerDown={(e) => onGripPointerDown(shelf.id, e)}
                      onPointerMove={onGripPointerMove}
                      onPointerUp={onGripPointerUp}
                    />
                    {editingShelfId === shelf.id ? (
                      <input
                        className="dl-shelf-rename"
                        autoFocus
                        value={editingShelfName}
                        onChange={(e) => setEditingShelfName(e.target.value)}
                        onBlur={() => void commitShelfRename(shelf.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') void commitShelfRename(shelf.id);
                          if (e.key === 'Escape') {
                            setEditingShelfName(shelf.name);
                            setEditingShelfId(null);
                          }
                        }}
                      />
                    ) : (
                      <h2
                        onDoubleClick={() => startShelfRename(shelf)}
                        title="Подвійний клік — перейменувати"
                      >
                        {shelf.name}
                      </h2>
                    )}
                    <span className="dl-count">{visibleEntries.length}</span>
                    {showStatus && shelf.status_filter && (
                      <StatusPill status={shelf.status_filter} size="sm" />
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                      type="button"
                      className="dl-addbook"
                      onClick={() => setAddBookShelfId(shelf.id)}
                    >
                      + Книга
                    </button>
                    <ShelfOptionsMenu
                      shelfName={shelf.name}
                      onRename={() => startShelfRename(shelf)}
                      onAddBook={() => setAddBookShelfId(shelf.id)}
                      onDelete={() => handleDeleteShelf(shelf.id)}
                      canReorder={canReorderShelves}
                      onMoveUp={() => moveShelf(shelf.id, -1)}
                      onMoveDown={() => moveShelf(shelf.id, 1)}
                    />
                  </div>
                </div>

                <div className="dl-stage">
                  <div className="dl-back" aria-hidden="true" />
                  <div className={`dl-rail dl-shelf-scroll${display.bookView === 'spine' ? ' is-spine' : ''}`}>
                    {visibleEntries.length === 0 ? (
                      <EmptyShelfButton onClick={() => setAddBookShelfId(shelf.id)} />
                    ) : (
                      visibleEntries.map((entry) => (
                        <ShelfBookTile
                          key={entry.id}
                          entry={entry}
                          bookWidth={bookWidth}
                          view={display.bookView}
                          showTip={display.hoverTitles}
                          realCovers={display.realCovers}
                          progress={entryProgress(entry)}
                          onPick={openFlyout}
                        />
                      ))
                    )}
                  </div>
                  <div className="dl-board" aria-hidden="true">
                    <span className="lip" />
                  </div>
                </div>
              </section>
            );
          })
        )}
          </>
        )}
      </div>

      {showAddShelf && (
        <AddShelfSheet onClose={() => setShowAddShelf(false)} onSubmit={handleCreateShelf} />
      )}

      {addBookShelfId && (
        <AddBookModal
          shelfId={addBookShelfId}
          shelfName={shelves.find((s) => s.id === addBookShelfId)?.name}
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
          fromRect={previewRect}
          onClose={() => {
            setPreviewEntry(null);
            setPreviewRect(null);
          }}
          onOpenDetail={() => {
            setSelectedEntry(previewEntry);
            setPreviewEntry(null);
            setPreviewRect(null);
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
          onSession={() => {
            const e = selectedEntry;
            setSelectedEntry(null);
            overlays.openSession(e);
          }}
        />
      )}
    </div>
  );
}
