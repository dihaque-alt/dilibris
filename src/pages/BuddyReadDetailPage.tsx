import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AppNav } from '../components/AppNav';
import { BookCover } from '../components/BookCover';
import { supabase } from '../lib/supabase';
import { inviteUrl, pickMemberProgress, progressLabel } from '../lib/buddyRead';
import { formatDateUk, formatDateTimeUk } from '../lib/dates';
import { formatAuthors, NOTE_TYPE_LABELS, STATUS_LABELS } from '../lib/labels';
import type {
  BookEntryStatus,
  BuddyRead,
  BuddyReadMember,
  BuddyReadMessage,
  Note,
  NoteType,
} from '../types/database';

interface BuddyReadDetailPageProps {
  userId: string;
  userEmail: string;
}

export function BuddyReadDetailPage({ userId, userEmail }: BuddyReadDetailPageProps) {
  const { id } = useParams<{ id: string }>();
  const [buddyRead, setBuddyRead] = useState<BuddyRead | null>(null);
  const [members, setMembers] = useState<BuddyReadMember[]>([]);
  const [messages, setMessages] = useState<BuddyReadMessage[]>([]);
  const [sharedNotes, setSharedNotes] = useState<Note[]>([]);
  const [bookEntries, setBookEntries] = useState<
    {
      id: string;
      user_id: string;
      status: BookEntryStatus;
      current_page: number;
      total_pages: number | null;
      rating: number | null;
      finished_on: string | null;
      updated_at: string;
    }[]
  >([]);
  const [myEntryId, setMyEntryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const [chatBody, setChatBody] = useState('');
  const [chatSaving, setChatSaving] = useState(false);

  const [noteBody, setNoteBody] = useState('');
  const [noteType, setNoteType] = useState<NoteType>('thought');
  const [notePage, setNotePage] = useState('');
  const [noteChapter, setNoteChapter] = useState('');
  const [noteSpoilers, setNoteSpoilers] = useState(false);
  const [noteSaving, setNoteSaving] = useState(false);

  const loadDetail = useCallback(async () => {
    if (!id) return;

    const { data: br, error: brError } = await supabase
      .from('buddy_reads')
      .select(`
        *,
        book:books (id, title, authors, cover_url)
      `)
      .eq('id', id)
      .single();

    if (brError) throw brError;

    const bookId = (br as BuddyRead).book_id;

    const [membersResult, messagesResult, notesResult, entriesResult] = await Promise.all([
      supabase
        .from('buddy_read_members')
        .select(`
          *,
          profile:profiles (display_name, avatar_url)
        `)
        .eq('buddy_read_id', id)
        .order('joined_at', { ascending: true }),
      supabase
        .from('buddy_read_messages')
        .select(`
          *,
          profile:profiles (display_name)
        `)
        .eq('buddy_read_id', id)
        .order('created_at', { ascending: true }),
      supabase
        .from('notes')
        .select(`
          *,
          profile:profiles (display_name)
        `)
        .eq('buddy_read_id', id)
        .order('created_at', { ascending: false }),
      supabase
        .from('user_book_entries')
        .select('id, user_id, status, current_page, total_pages, rating, finished_on, updated_at')
        .eq('book_id', bookId),
    ]);

    if (membersResult.error) throw membersResult.error;
    if (messagesResult.error) throw messagesResult.error;
    if (notesResult.error) throw notesResult.error;
    if (entriesResult.error) throw entriesResult.error;

    const entries = entriesResult.data ?? [];
    setBuddyRead(br as BuddyRead);
    setMembers((membersResult.data as BuddyReadMember[]) ?? []);
    setMessages((messagesResult.data as BuddyReadMessage[]) ?? []);
    setSharedNotes((notesResult.data as Note[]) ?? []);
    setBookEntries(entries);

    const mine = pickMemberProgress(entries, userId);
    setMyEntryId(mine.entry_id);
  }, [id, userId]);

  useEffect(() => {
    loadDetail()
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Не вдалося завантажити buddy read');
      })
      .finally(() => setLoading(false));
  }, [loadDetail]);

  const isOwner = buddyRead?.owner_id === userId;

  async function copyInviteLink() {
    if (!buddyRead) return;
    await navigator.clipboard.writeText(inviteUrl(buddyRead.invite_token));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  async function toggleArchive() {
    if (!buddyRead || !isOwner) return;
    setError('');

    const { error: updateError } = await supabase
      .from('buddy_reads')
      .update({ is_archived: !buddyRead.is_archived })
      .eq('id', buddyRead.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    await loadDetail();
  }

  async function handleSendMessage(e: FormEvent) {
    e.preventDefault();
    if (!id || !chatBody.trim()) return;

    setChatSaving(true);
    setError('');

    const { error: insertError } = await supabase.from('buddy_read_messages').insert({
      buddy_read_id: id,
      user_id: userId,
      body: chatBody.trim(),
    });

    if (insertError) {
      setError(insertError.message);
      setChatSaving(false);
      return;
    }

    setChatBody('');
    await loadDetail();
    setChatSaving(false);
  }

  async function handleAddNote(e: FormEvent) {
    e.preventDefault();
    if (!id || !buddyRead || !noteBody.trim()) return;

    if (!myEntryId) {
      setError('Додай цю книгу в бібліотеку, щоб писати спільні нотатки');
      return;
    }

    setNoteSaving(true);
    setError('');

    const { error: insertError } = await supabase.from('notes').insert({
      user_id: userId,
      entry_id: myEntryId,
      book_id: buddyRead.book_id,
      buddy_read_id: id,
      note_type: noteType,
      visibility: 'private',
      body: noteBody.trim(),
      page_number: notePage ? Number(notePage) : null,
      chapter: noteChapter.trim() || null,
      contains_spoilers: noteSpoilers,
    });

    if (insertError) {
      setError(insertError.message);
      setNoteSaving(false);
      return;
    }

    setNoteBody('');
    setNotePage('');
    setNoteChapter('');
    setNoteSpoilers(false);
    await loadDetail();
    setNoteSaving(false);
  }

  if (loading) {
    return (
      <div className="app-shell app-shell--room">
        <AppNav userEmail={userEmail} active="buddy-reads" />
        <div className="center-page">Завантажуємо…</div>
      </div>
    );
  }

  if (!buddyRead) {
    return (
      <div className="app-shell app-shell--room">
        <AppNav userEmail={userEmail} active="buddy-reads" />
        <div className="center-page">
          <p className="form-error">Buddy read не знайдено</p>
          <Link to="/buddy-reads">Назад</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell app-shell--room">
      <AppNav userEmail={userEmail} active="buddy-reads" />

      <main className="buddy-read-detail">
        <p className="breadcrumb">
          <Link to="/buddy-reads">Buddy reads</Link> / {buddyRead.title}
        </p>

        {error && <p className="banner-error">{error}</p>}

        <section className="dashboard-card buddy-read-hero">
          <div className="book-detail-hero">
            <BookCover title={buddyRead.book?.title ?? buddyRead.title} coverUrl={buddyRead.book?.cover_url} size="lg" />
            <div className="book-detail-meta">
              <h2>{buddyRead.title}</h2>
              <p>{formatAuthors(buddyRead.book?.authors)}</p>
              {buddyRead.description && <p>{buddyRead.description}</p>}
              {buddyRead.target_finish_on && (
                <p className="form-hint">Дедлайн: {formatDateUk(buddyRead.target_finish_on)}</p>
              )}
              {buddyRead.is_archived && <span className="status-pill">Архів</span>}
            </div>
          </div>

          <div className="invite-row">
            <code className="invite-code">{inviteUrl(buddyRead.invite_token)}</code>
            <button type="button" className="btn-small" onClick={copyInviteLink}>
              {copied ? 'Скопійовано!' : 'Копіювати лінк'}
            </button>
            {isOwner && (
              <button type="button" className="btn-small btn-secondary" onClick={toggleArchive}>
                {buddyRead.is_archived ? 'Повернути з архіву' : 'В архів'}
              </button>
            )}
          </div>
        </section>

        <section className="dashboard-card">
          <h3>Прогрес учасників</h3>
          <ul className="member-progress-list">
            {members.map((member) => {
              const progress = pickMemberProgress(bookEntries, member.user_id);
              return (
                <li key={member.id} className="member-progress-item">
                  <div>
                    <strong>{member.profile?.display_name || 'Читач'}</strong>
                    <span className="status-pill">{member.role === 'owner' ? 'Організатор' : 'Учасник'}</span>
                  </div>
                  <p>
                    {progress.status ? STATUS_LABELS[progress.status] : '—'} · {progressLabel(progress)}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>

        <div className="buddy-read-columns">
          <section className="dashboard-card">
            <h3>Чат</h3>
            <ul className="chat-list">
              {messages.length === 0 ? (
                <li className="empty-hint">Поки тихо. Напиши перше повідомлення.</li>
              ) : (
                messages.map((msg) => (
                  <li key={msg.id} className={msg.user_id === userId ? 'chat-item chat-item--own' : 'chat-item'}>
                    <strong>{msg.user_id === userId ? 'Ти' : msg.profile?.display_name || 'Читач'}</strong>
                    <p>{msg.body}</p>
                    <time>{formatDateTimeUk(msg.created_at)}</time>
                  </li>
                ))
              )}
            </ul>
            <form className="chat-form" onSubmit={handleSendMessage}>
              <input
                value={chatBody}
                onChange={(e) => setChatBody(e.target.value)}
                placeholder="Повідомлення…"
                required
              />
              <button type="submit" disabled={chatSaving}>
                {chatSaving ? '…' : 'Надіслати'}
              </button>
            </form>
          </section>

          <section className="dashboard-card">
            <h3>Спільні нотатки</h3>
            {!myEntryId && (
              <p className="form-hint">
                Додай книгу в <Link to="/">бібліотеку</Link>, щоб писати нотатки в групі.
              </p>
            )}
            <form className="inline-form" onSubmit={handleAddNote}>
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
              <div className="form-row">
                <label>
                  Сторінка
                  <input type="number" min={1} value={notePage} onChange={(e) => setNotePage(e.target.value)} />
                </label>
                <label>
                  Глава
                  <input value={noteChapter} onChange={(e) => setNoteChapter(e.target.value)} />
                </label>
              </div>
              <label>
                Текст
                <textarea
                  value={noteBody}
                  onChange={(e) => setNoteBody(e.target.value)}
                  rows={3}
                  required
                  disabled={!myEntryId}
                />
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={noteSpoilers}
                  onChange={(e) => setNoteSpoilers(e.target.checked)}
                  disabled={!myEntryId}
                />
                Спойлери
              </label>
              <button type="submit" disabled={noteSaving || !myEntryId}>
                {noteSaving ? 'Додаємо…' : 'Додати нотатку'}
              </button>
            </form>

            <ul className="note-list">
              {sharedNotes.length === 0 ? (
                <li className="empty-hint">Спільних нотаток ще немає.</li>
              ) : (
                sharedNotes.map((note) => (
                  <li key={note.id}>
                    <article className="note-card">
                      <header className="review-header">
                        <strong>{note.user_id === userId ? 'Ти' : note.profile?.display_name || 'Читач'}</strong>
                        <span className="status-pill">{NOTE_TYPE_LABELS[note.note_type]}</span>
                      </header>
                      <p className="note-meta">
                        {[note.page_number && `стор. ${note.page_number}`, note.chapter].filter(Boolean).join(' · ')}
                      </p>
                      <p className="review-body">{note.contains_spoilers ? '⚠️ Спойлери — ' : ''}{note.body}</p>
                      <time className="review-date">{formatDateTimeUk(note.created_at)}</time>
                    </article>
                  </li>
                ))
              )}
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}
