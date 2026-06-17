import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { formatDateTimeUk } from '../lib/dates';
import { NOTE_TYPE_LABELS, NOTE_VISIBILITY_LABELS } from '../lib/labels';
import { loadLocalPrefs } from '../lib/userSettings';
import type { Note, NoteType, NoteVisibility } from '../types/database';

interface BookNotesSectionProps {
  bookId: string;
  entryId: string;
  userId: string;
  embedded?: boolean;
}

function NoteBody({ body, containsSpoilers }: { body: string; containsSpoilers: boolean }) {
  const [revealed, setRevealed] = useState(!containsSpoilers);

  if (!body.trim()) return null;

  if (!revealed) {
    return (
      <div className="review-spoiler">
        <p className="form-hint">Містить спойлери</p>
        <button type="button" className="btn-small btn-secondary" onClick={() => setRevealed(true)}>
          Показати нотатку
        </button>
      </div>
    );
  }

  return <p className="review-body">{body}</p>;
}

function emptyForm() {
  return {
    noteType: 'general' as NoteType,
    visibility: 'private' as NoteVisibility,
    body: '',
    pageNumber: '',
    chapter: '',
    containsSpoilers: false,
  };
}

export function BookNotesSection({ bookId, entryId, userId, embedded }: BookNotesSectionProps) {
  const [ownNotes, setOwnNotes] = useState<Note[]>([]);
  const [publicNotes, setPublicNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [noteType, setNoteType] = useState<NoteType>('general');
  const [visibility, setVisibility] = useState<NoteVisibility>('private');
  const [body, setBody] = useState('');
  const [pageNumber, setPageNumber] = useState('');
  const [chapter, setChapter] = useState('');
  const [containsSpoilers, setContainsSpoilers] = useState(false);

  const loadNotes = useCallback(async () => {
    const [ownResult, publicResult] = await Promise.all([
      supabase
        .from('notes')
        .select('*')
        .eq('entry_id', entryId)
        .is('buddy_read_id', null)
        .order('created_at', { ascending: false }),
      supabase
        .from('notes')
        .select(`
          *,
          profile:profiles (display_name, avatar_url)
        `)
        .eq('book_id', bookId)
        .eq('visibility', 'public')
        .neq('user_id', userId)
        .is('buddy_read_id', null)
        .order('created_at', { ascending: false }),
    ]);

    if (ownResult.error) throw ownResult.error;
    if (publicResult.error) throw publicResult.error;

    setOwnNotes((ownResult.data as Note[]) ?? []);
    setPublicNotes((publicResult.data as Note[]) ?? []);
  }, [bookId, entryId, userId]);

  useEffect(() => {
    loadNotes()
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Не вдалося завантажити нотатки');
      })
      .finally(() => setLoading(false));
  }, [loadNotes]);

  function openCreateForm() {
    const defaults = emptyForm();
    const prefs = loadLocalPrefs(userId);
    setNoteType(defaults.noteType);
    setVisibility(prefs.defaultPrivate === false ? 'public' : 'private');
    setBody(defaults.body);
    setPageNumber(defaults.pageNumber);
    setChapter(defaults.chapter);
    setContainsSpoilers(defaults.containsSpoilers);
    setEditingId(null);
    setShowForm(true);
    setError('');
  }

  function openEditForm(note: Note) {
    setNoteType(note.note_type);
    setVisibility(note.visibility);
    setBody(note.body);
    setPageNumber(note.page_number ? String(note.page_number) : '');
    setChapter(note.chapter ?? '');
    setContainsSpoilers(note.contains_spoilers);
    setEditingId(note.id);
    setShowForm(true);
    setError('');
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setError('');
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!body.trim()) {
      setError('Напиши текст нотатки');
      return;
    }

    setSaving(true);
    setError('');

    const payload = {
      note_type: noteType,
      visibility,
      body: body.trim(),
      page_number: pageNumber ? Number(pageNumber) : null,
      chapter: chapter.trim() || null,
      contains_spoilers: containsSpoilers,
    };

    const { error: saveError } = editingId
      ? await supabase.from('notes').update(payload).eq('id', editingId)
      : await supabase.from('notes').insert({
          ...payload,
          user_id: userId,
          entry_id: entryId,
          book_id: bookId,
        });

    if (saveError) {
      setError(saveError.message);
      setSaving(false);
      return;
    }

    await loadNotes();
    closeForm();
    setSaving(false);
  }

  async function handleDelete(noteId: string) {
    if (!window.confirm('Видалити нотатку?')) return;
    setError('');

    const { error: deleteError } = await supabase.from('notes').delete().eq('id', noteId);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    if (editingId === noteId) closeForm();
    await loadNotes();
  }

  function renderNoteMeta(note: Note) {
    const parts: string[] = [];
    if (note.page_number) parts.push(`стор. ${note.page_number}`);
    if (note.chapter) parts.push(note.chapter);
    return parts.length ? parts.join(' · ') : null;
  }

  return (
    <section className={embedded ? 'notes-section notes-section--embedded' : 'notes-section'}>
      {!embedded && (
        <div className="panel-head">
          <h3>Нотатки</h3>
          {!showForm && (
            <button type="button" className="btn-small" onClick={openCreateForm}>
              + Нотатка
            </button>
          )}
        </div>
      )}

      {embedded && (
        <div className="dl-panel-title-row">
          {!showForm && (
            <button type="button" className="dl-ghost" onClick={openCreateForm}>
              + Нотатка
            </button>
          )}
          {showForm && (
            <button type="button" className="dl-ghost" onClick={closeForm}>
              Згорнути
            </button>
          )}
        </div>
      )}

      {!embedded && (
        <p className="form-hint reviews-public-note">
          За замовчуванням особисті. Публічні нотатки бачать інші читачі цієї книги.
        </p>
      )}

      {showForm && (
        <form className="inline-form note-form" onSubmit={handleSave}>
          <h4>{editingId ? 'Редагувати нотатку' : 'Нова нотатка'}</h4>
          <div className="form-row">
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
          <div className="form-row">
            <label>
              Сторінка
              <input
                type="number"
                min={1}
                value={pageNumber}
                onChange={(e) => setPageNumber(e.target.value)}
                placeholder="42"
              />
            </label>
            <label>
              Розділ / глава
              <input value={chapter} onChange={(e) => setChapter(e.target.value)} placeholder="Глава 3" />
            </label>
          </div>
          <label>
            Текст
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              required
              placeholder="Цитата, думка або спостереження…"
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
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={closeForm}>
              Скасувати
            </button>
            {editingId && (
              <button type="button" className="btn-danger" onClick={() => handleDelete(editingId)}>
                Видалити
              </button>
            )}
            <button type="submit" disabled={saving}>
              {saving ? 'Зберігаємо…' : editingId ? 'Зберегти' : 'Додати'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="form-hint">Завантажуємо нотатки…</p>
      ) : ownNotes.length === 0 && !showForm ? (
        <p className="empty-hint">Ще немає нотаток. Зберігай цитати, думки або спостереження під час читання.</p>
      ) : (
        <ul className="note-list">
          {ownNotes.map((note) => (
            <li key={note.id}>
              <article className="note-card">
                <header className="note-header">
                  <div className="note-badges">
                    <span className="status-pill">{NOTE_TYPE_LABELS[note.note_type]}</span>
                    <span
                      className={
                        note.visibility === 'public' ? 'status-pill status-pill--public' : 'status-pill'
                      }
                    >
                      {NOTE_VISIBILITY_LABELS[note.visibility]}
                    </span>
                  </div>
                  <button type="button" className="btn-small btn-secondary" onClick={() => openEditForm(note)}>
                    Редагувати
                  </button>
                </header>
                {renderNoteMeta(note) && <p className="note-meta">{renderNoteMeta(note)}</p>}
                <NoteBody body={note.body} containsSpoilers={note.contains_spoilers} />
                <time className="review-date">{formatDateTimeUk(note.updated_at)}</time>
              </article>
            </li>
          ))}
        </ul>
      )}

      {publicNotes.length > 0 && (
        <>
          <h4 className="reviews-others-title">Публічні нотатки інших ({publicNotes.length})</h4>
          <ul className="note-list">
            {publicNotes.map((note) => (
              <li key={note.id}>
                <article className="note-card note-card--other">
                  <header className="review-header">
                    <strong>{note.profile?.display_name || 'Читач'}</strong>
                    <span className="status-pill">{NOTE_TYPE_LABELS[note.note_type]}</span>
                  </header>
                  {renderNoteMeta(note) && <p className="note-meta">{renderNoteMeta(note)}</p>}
                  <NoteBody body={note.body} containsSpoilers={note.contains_spoilers} />
                  <time className="review-date">{formatDateTimeUk(note.created_at)}</time>
                </article>
              </li>
            ))}
          </ul>
        </>
      )}

      {error && <p className="form-error">{error}</p>}
    </section>
  );
}
