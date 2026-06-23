import { useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { useIsMobile } from '../hooks/useIsMobile';
import { formatDateTimeUk } from '../lib/dates';
import { NOTE_TYPE_LABELS, NOTE_VISIBILITY_LABELS, formatAuthors } from '../lib/labels';
import { deleteNote, saveNote, type NoteFeedItem, type NoteWritePayload } from '../lib/offline/notesSync';
import { useOffline } from './OfflineProvider';
import type { NoteType, NoteVisibility } from '../types/database';
import { BookCover } from './BookCover';
import { NoteBadge } from './NoteBadge';
import { NoteBody } from './NoteBody';

interface NoteDetailModalProps {
  item: NoteFeedItem;
  userId: string;
  onClose: () => void;
  onUpdated?: () => void | Promise<void>;
  onOpenBook?: () => void;
}

function noteBadgeTone(type: NoteType): 'quote' | 'thought' | 'general' {
  if (type === 'quote') return 'quote';
  if (type === 'thought') return 'thought';
  return 'general';
}

function parsePageNumber(raw: string): number | null {
  if (!raw.trim()) return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 1) return null;
  return Math.floor(value);
}

export function NoteDetailModal({
  item,
  userId,
  onClose,
  onUpdated,
  onOpenBook,
}: NoteDetailModalProps) {
  const mobile = useIsMobile();
  const { refreshPending } = useOffline();
  const { note, entry } = item;
  const book = entry.book;

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const [noteType, setNoteType] = useState<NoteType>(note.note_type);
  const [visibility, setVisibility] = useState<NoteVisibility>(note.visibility);
  const [body, setBody] = useState(note.body);
  const [pageNumber, setPageNumber] = useState(note.page_number ? String(note.page_number) : '');
  const [chapter, setChapter] = useState(note.chapter ?? '');
  const [containsSpoilers, setContainsSpoilers] = useState(note.contains_spoilers);

  const metaParts: string[] = [];
  if (note.page_number) metaParts.push(`стор. ${note.page_number}`);
  if (note.chapter) metaParts.push(note.chapter);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!body.trim()) {
      setError('Напиши текст нотатки');
      return;
    }

    setSaving(true);
    setError('');

    const payload: NoteWritePayload = {
      note_type: noteType,
      visibility,
      body: body.trim(),
      page_number: parsePageNumber(pageNumber),
      chapter: chapter.trim() || null,
      contains_spoilers: containsSpoilers,
    };

    try {
      await saveNote(userId, entry.id, entry.book_id, note.id, payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося зберегти нотатку');
      setSaving(false);
      return;
    }

    await refreshPending();
    await onUpdated?.();
    setEditing(false);
    setSaving(false);
    onClose();
  }

  async function handleDelete() {
    if (!window.confirm('Видалити нотатку?')) return;
    setDeleting(true);
    setError('');

    try {
      await deleteNote(userId, note.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося видалити нотатку');
      setDeleting(false);
      return;
    }

    await refreshPending();
    await onUpdated?.();
    onClose();
  }

  return createPortal(
    <div
      className={`dl-modal-backdrop${mobile ? ' is-sheet-backdrop' : ''}`}
      onClick={onClose}
      role="presentation"
    >
      <div className="dl-modal-backdrop-inner">
        <div
          className={`dl-detailcard note-detail-card ${mobile ? 'is-sheet' : 'is-modal'}`}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="note-detail-title"
        >
          {mobile && <div className="dl-sheet-handle" aria-hidden="true" />}

          <header className="note-detail-header">
            <div className="notes-card-badges">
              <NoteBadge tone={noteBadgeTone(note.note_type)}>
                {NOTE_TYPE_LABELS[note.note_type]}
              </NoteBadge>
              <NoteBadge tone={note.visibility === 'public' ? 'pub' : 'priv'}>
                {NOTE_VISIBILITY_LABELS[note.visibility]}
              </NoteBadge>
            </div>
            <button type="button" className="dl-close" onClick={onClose} aria-label="Закрити">
              ×
            </button>
          </header>

          <div className="dl-detail-body note-detail-body">
            {editing ? (
              <form id="note-detail-form" className="inline-form note-form" onSubmit={handleSave}>
                <div className="dl-form-row">
                  <label>
                    Тип
                    <select value={noteType} onChange={(e) => setNoteType(e.target.value as NoteType)}>
                      {(Object.entries(NOTE_TYPE_LABELS) as [NoteType, string][]).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Видимість
                    <select
                      value={visibility}
                      onChange={(e) => setVisibility(e.target.value as NoteVisibility)}
                    >
                      {(Object.entries(NOTE_VISIBILITY_LABELS) as [NoteVisibility, string][]).map(
                        ([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ),
                      )}
                    </select>
                  </label>
                </div>
                <div className="dl-form-row">
                  <label>
                    Сторінка
                    <input
                      type="number"
                      min={1}
                      value={pageNumber}
                      onChange={(e) => setPageNumber(e.target.value)}
                    />
                  </label>
                  <label>
                    Розділ / глава
                    <input value={chapter} onChange={(e) => setChapter(e.target.value)} />
                  </label>
                </div>
                <label>
                  Текст
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={6}
                    required
                  />
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={containsSpoilers}
                    onChange={(e) => setContainsSpoilers(e.target.checked)}
                  />
                  Містить спойлери
                </label>
              </form>
            ) : (
              <>
                <div
                  id="note-detail-title"
                  className={`note-detail-text${note.note_type === 'quote' ? ' is-quote' : ''}`}
                >
                  <NoteBody
                    body={note.body}
                    containsSpoilers={note.contains_spoilers}
                    className="note-detail-text-inner"
                  />
                </div>
                {metaParts.length > 0 && <p className="note-detail-meta">{metaParts.join(' · ')}</p>}
                <time className="note-detail-date">{formatDateTimeUk(note.updated_at)}</time>
              </>
            )}

            <button type="button" className="note-detail-book-link" onClick={onOpenBook}>
              <BookCover
                title={book?.title ?? 'Книга'}
                authors={book?.authors}
                coverUrl={book?.cover_url}
                entryId={entry.id}
                width={36}
              />
              <div className="notes-card-book">
                <div className="notes-card-title">{book?.title ?? 'Книга'}</div>
                <div className="notes-card-author">{formatAuthors(book?.authors)}</div>
              </div>
              <span className="note-detail-book-cta">Книга →</span>
            </button>

            {error && <p className="form-error">{error}</p>}
          </div>

          <footer className="dl-detail-footer">
            {editing ? (
              <>
                <button
                  type="button"
                  className="dl-danger"
                  disabled={saving || deleting}
                  onClick={() => void handleDelete()}
                >
                  {deleting ? 'Видаляємо…' : 'Видалити'}
                </button>
                <button type="button" className="dl-ghost" disabled={saving} onClick={() => setEditing(false)}>
                  Скасувати
                </button>
                <button type="submit" form="note-detail-form" className="dl-primary" disabled={saving || deleting}>
                  {saving ? 'Зберігаємо…' : 'Зберегти'}
                </button>
              </>
            ) : (
              <>
                <button type="button" className="dl-ghost" onClick={onClose}>
                  Закрити
                </button>
                <button type="button" className="dl-primary" onClick={() => setEditing(true)}>
                  Редагувати
                </button>
              </>
            )}
          </footer>
        </div>
      </div>
    </div>,
    document.body,
  );
}
