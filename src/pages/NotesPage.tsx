import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AppNav } from '../components/AppNav';
import { NotesByBook } from '../components/NotesByBook';
import { NoteDetailModal } from '../components/NoteDetailModal';
import { NotesEmptyState } from '../components/NotesEmptyState';
import { PageHead } from '../components/PageHead';
import { RoomBackdrop } from '../components/RoomBackdrop';
import { useAppOverlays } from '../components/AppOverlays';
import { fetchAllUserNotes, type NoteFeedItem } from '../lib/notesFeed';
import { groupNotesByBook } from '../lib/groupNotesByBook';
import { fetchEntry } from '../lib/offline/librarySync';
import { BookDetailModal } from '../components/BookDetailModal';
import type { NoteType, UserBookEntry } from '../types/database';
import '../styles/library.css';
import '../styles/screens-ui.css';

type KindFilter = 'all' | NoteType;

const KIND_CHIPS: { key: KindFilter; label: string }[] = [
  { key: 'all', label: 'Усі' },
  { key: 'quote', label: 'Цитата' },
  { key: 'thought', label: 'Думка' },
  { key: 'general', label: 'Спостереження' },
];

interface NotesPageProps {
  userId: string;
  userEmail: string;
}

export function NotesPage({ userId, userEmail }: NotesPageProps) {
  const overlays = useAppOverlays();
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<NoteFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [kind, setKind] = useState<KindFilter>('all');
  const [q, setQ] = useState('');
  const [selectedNote, setSelectedNote] = useState<NoteFeedItem | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<UserBookEntry | null>(null);

  const refreshNotes = useCallback(async () => {
    const notes = await fetchAllUserNotes(userId);
    setItems(notes);
  }, [userId]);

  useEffect(() => {
    setLoading(true);
    setError('');
    refreshNotes()
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Не вдалося завантажити нотатки');
      })
      .finally(() => setLoading(false));
  }, [refreshNotes]);

  useEffect(() => {
    const entryId = searchParams.get('entry');
    if (!entryId || loading) return;

    void fetchEntry(entryId).then((entry) => {
      if (entry) setSelectedEntry(entry);
      const next = new URLSearchParams(searchParams);
      next.delete('entry');
      setSearchParams(next, { replace: true });
    });
  }, [loading, searchParams, setSearchParams]);

  const counts = useMemo(() => {
    const base = { all: items.length, quote: 0, thought: 0, general: 0 };
    for (const { note } of items) {
      base[note.note_type] += 1;
    }
    return base;
  }, [items]);

  const term = q.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      items.filter(({ note, entry }) => {
        if (kind !== 'all' && note.note_type !== kind) return false;
        if (!term) return true;
        const book = entry.book;
        const haystack = [note.body, book?.title ?? '', book?.authors?.join(' ') ?? '']
          .join(' ')
          .toLowerCase();
        return haystack.includes(term);
      }),
    [items, kind, term],
  );

  const groups = useMemo(() => groupNotesByBook(filtered), [filtered]);

  const emptyVariant = items.length === 0 ? 'empty' : 'filtered';

  function openNote(item: NoteFeedItem) {
    setSelectedNote(item);
  }

  function openBook(item: NoteFeedItem) {
    setSelectedEntry(item.entry);
  }

  function openBookFromNote() {
    if (!selectedNote) return;
    setSelectedEntry(selectedNote.entry);
    setSelectedNote(null);
  }

  return (
    <div className="app-shell">
      <RoomBackdrop />
      <AppNav userEmail={userEmail} userId={userId} active="notes" />

      <main className="dl-page notes-page" style={{ maxWidth: 900 }}>
        <PageHead
          eyebrow="На полях"
          title="Нотатки"
          sub="Згруповано за книгами — цитати й думки з полів"
        />

        {error && <p className="banner-error">{error}</p>}

        <div className="notes-toolbar">
          <div className="notes-filters">
            {KIND_CHIPS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                className="dl-notefilter"
                data-active={kind === key}
                onClick={() => setKind(key)}
              >
                {label}
                <span className="notes-filter-count">{counts[key]}</span>
              </button>
            ))}
          </div>
          <div className="dl-libsearch notes-search">
            <span aria-hidden="true">⌕</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Шукати в нотатках…"
            />
          </div>
        </div>

        {loading ? (
          <p className="notes-loading">Завантажуємо нотатки…</p>
        ) : filtered.length === 0 ? (
          <NotesEmptyState variant={emptyVariant} />
        ) : (
          <NotesByBook groups={groups} onOpenNote={openNote} onOpenBook={openBook} />
        )}
      </main>

      {selectedNote && (
        <NoteDetailModal
          item={selectedNote}
          userId={userId}
          onClose={() => setSelectedNote(null)}
          onOpenBook={openBookFromNote}
          onUpdated={refreshNotes}
        />
      )}

      {selectedEntry && (
        <BookDetailModal
          entry={selectedEntry}
          userId={userId}
          initialTab="notes"
          onClose={() => setSelectedEntry(null)}
          onUpdated={async () => {
            await refreshNotes();
            setSelectedEntry((current) => {
              if (!current) return null;
              void fetchEntry(current.id).then((updated) => {
                if (updated) {
                  setSelectedEntry((open) => (open?.id === updated.id ? updated : open));
                }
              });
              return current;
            });
          }}
          onDeleted={async () => {
            setSelectedEntry(null);
            await refreshNotes();
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
