import { useEffect, useMemo, useState } from 'react';
import { AppNav } from '../components/AppNav';
import { BookCover } from '../components/BookCover';
import { BookDetailModal } from '../components/BookDetailModal';
import { NoteBadge } from '../components/NoteBadge';
import { RoomBackdrop } from '../components/RoomBackdrop';
import { useAppOverlays } from '../components/AppOverlays';
import { useIsMobile } from '../hooks/useIsMobile';
import { fetchAllUserNotes, type NoteFeedItem } from '../lib/notesFeed';
import { formatAuthors, NOTE_TYPE_LABELS, NOTE_VISIBILITY_LABELS } from '../lib/labels';
import { fetchEntry } from '../lib/offline/librarySync';
import type { NoteType, UserBookEntry } from '../types/database';
import '../styles/library.css';

type KindFilter = 'all' | NoteType;

const KIND_CHIPS: { key: KindFilter; label: string }[] = [
  { key: 'all', label: 'Усі' },
  { key: 'quote', label: 'Цитата' },
  { key: 'thought', label: 'Думка' },
  { key: 'general', label: 'Загальна' },
];

interface NotesPageProps {
  userId: string;
  userEmail: string;
}

function noteBadgeTone(type: NoteType): 'quote' | 'thought' | 'general' {
  if (type === 'quote') return 'quote';
  if (type === 'thought') return 'thought';
  return 'general';
}

export function NotesPage({ userId, userEmail }: NotesPageProps) {
  const wide = !useIsMobile(760);
  const overlays = useAppOverlays();
  const [items, setItems] = useState<NoteFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [kind, setKind] = useState<KindFilter>('all');
  const [q, setQ] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<UserBookEntry | null>(null);

  useEffect(() => {
    setLoading(true);
    setError('');
    fetchAllUserNotes(userId)
      .then(setItems)
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Не вдалося завантажити нотатки');
      })
      .finally(() => setLoading(false));
  }, [userId]);

  const counts = useMemo(() => {
    const base = { all: items.length, quote: 0, thought: 0, general: 0 };
    for (const { note } of items) {
      base[note.note_type] += 1;
    }
    return base;
  }, [items]);

  const term = q.trim().toLowerCase();
  const filtered = items.filter(({ note, entry }) => {
    if (kind !== 'all' && note.note_type !== kind) return false;
    if (!term) return true;
    const book = entry.book;
    const haystack = [
      note.body,
      book?.title ?? '',
      book?.authors?.join(' ') ?? '',
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(term);
  });

  return (
    <div className="app-shell">
      <RoomBackdrop />
      <AppNav userEmail={userEmail} userId={userId} active="notes" />

      <div className="dl-page" style={{ maxWidth: 900 }}>
        <header className="dl-pagehead">
          <div>
            <p className="dl-pagehead-eyebrow">На полях</p>
            <h1 className="dl-pagehead-title">Нотатки</h1>
            <p className="dl-pagehead-sub">Цитати й думки з усіх книг — зібрані в одному місці</p>
          </div>
        </header>

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
          <p className="empty-hint">Завантажуємо нотатки…</p>
        ) : filtered.length === 0 ? (
          <div className="dl-panel is-soft notes-empty">
            Тут поки порожньо — додай нотатку з картки будь-якої книги.
          </div>
        ) : (
          <div
            className="notes-masonry"
            style={{ columns: wide ? '2 320px' : '1', columnGap: 16 }}
          >
            {filtered.map(({ note, entry }) => {
              const book = entry.book;
              return (
                <div key={note.id} className="notes-masonry-item">
                  <button
                    type="button"
                    className="dl-panel is-clickable notes-card"
                    onClick={() => setSelectedEntry(entry)}
                  >
                    <div className="notes-card-badges">
                      <NoteBadge tone={noteBadgeTone(note.note_type)}>
                        {NOTE_TYPE_LABELS[note.note_type]}
                      </NoteBadge>
                      <NoteBadge tone={note.visibility === 'public' ? 'pub' : 'priv'}>
                        {NOTE_VISIBILITY_LABELS[note.visibility]}
                      </NoteBadge>
                    </div>
                    <p
                      className={`notes-card-body${note.note_type === 'quote' ? ' is-quote' : ''}`}
                    >
                      {note.body}
                    </p>
                    <div className="notes-card-foot">
                      <BookCover
                        title={book?.title ?? 'Книга'}
                        authors={book?.authors}
                        coverUrl={book?.cover_url}
                        entryId={entry.id}
                        width={28}
                      />
                      <div className="notes-card-book">
                        <div className="notes-card-title">{book?.title ?? 'Книга'}</div>
                        <div className="notes-card-author">{formatAuthors(book?.authors)}</div>
                      </div>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedEntry && (
        <BookDetailModal
          entry={selectedEntry}
          userId={userId}
          onClose={() => setSelectedEntry(null)}
          onUpdated={async () => {
            const notes = await fetchAllUserNotes(userId);
            setItems(notes);
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
            const next = await fetchAllUserNotes(userId);
            setItems(next);
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
