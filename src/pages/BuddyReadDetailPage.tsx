import { useCallback, useEffect, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { AppNav } from '../components/AppNav';
import { BookCover } from '../components/BookCover';
import { MemberAvatar } from '../components/MemberAvatar';
import { RoomBackdrop } from '../components/RoomBackdrop';
import { useIsMobile } from '../hooks/useIsMobile';
import {
  averageMemberProgress,
  inviteUrl,
  pickMemberProgress,
  progressPercent,
} from '../lib/buddyRead';
import { formatDateUk } from '../lib/dates';
import { supabase } from '../lib/supabase';
import type {
  BookEntryStatus,
  BuddyRead,
  BuddyReadMember,
  BuddyReadMessage,
  Note,
} from '../types/database';
import '../styles/library.css';
import '../styles/screens-ui.css';

interface BuddyReadDetailPageProps {
  userId: string;
  userEmail: string;
}

const MEMBER_BAR_COLORS = [
  'var(--status-reading)',
  'var(--status-dnf)',
  'var(--status-done)',
  'var(--accent-lime)',
];

function memberBarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 17 + name.charCodeAt(i)) >>> 0;
  return MEMBER_BAR_COLORS[hash % MEMBER_BAR_COLORS.length];
}

export function BuddyReadDetailPage({ userId, userEmail }: BuddyReadDetailPageProps) {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const wide = !useIsMobile(760);
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
  const [notePage, setNotePage] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteComposerOpen, setNoteComposerOpen] = useState(false);

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
        setError(err instanceof Error ? err.message : 'Не вдалося завантажити клуб');
      })
      .finally(() => setLoading(false));
  }, [loadDetail]);

  useEffect(() => {
    if (loading || !buddyRead) return;
    const hash = location.hash.slice(1);
    if (hash !== 'chat' && hash !== 'notes') return;

    window.requestAnimationFrame(() => {
      const target =
        hash === 'chat'
          ? document.querySelector('.dl-panel--chat')
          : document.getElementById('buddy-shared-notes');
      target?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }, [loading, buddyRead, location.hash]);

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

    const nextArchived = !buddyRead.is_archived;
    const { error: updateError } = await supabase
      .from('buddy_reads')
      .update({ is_archived: nextArchived })
      .eq('id', buddyRead.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    if (nextArchived) {
      navigate('/buddy-reads');
      return;
    }

    await loadDetail();
  }

  async function handleSendMessage(e?: FormEvent) {
    e?.preventDefault();
    if (!id || !chatBody.trim() || chatSaving) return;

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

  function handleChatKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSendMessage();
    }
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
      note_type: 'thought',
      visibility: 'private',
      body: noteBody.trim(),
      page_number: notePage ? Number(notePage) : null,
      chapter: null,
      contains_spoilers: false,
    });

    if (insertError) {
      setError(insertError.message);
      setNoteSaving(false);
      return;
    }

    setNoteBody('');
    setNotePage('');
    setNoteComposerOpen(false);
    await loadDetail();
    setNoteSaving(false);
  }

  if (loading) {
    return (
      <div className="app-shell">
        <RoomBackdrop />
        <AppNav userEmail={userEmail} userId={userId} active="buddy-reads" />
        <div className="center-page" style={{ color: 'var(--ink-room-soft)' }}>
          Завантажуємо клуб…
        </div>
      </div>
    );
  }

  if (!buddyRead) {
    return (
      <div className="app-shell">
        <RoomBackdrop />
        <AppNav userEmail={userEmail} userId={userId} active="buddy-reads" />
        <div className="center-page">
          <p className="form-error">Клуб не знайдено</p>
          <Link to="/buddy-reads" className="dl-back-link">
            ‹ Усі клуби
          </Link>
        </div>
      </div>
    );
  }

  const bookTitle = buddyRead.book?.title ?? 'Книга';
  const deadlineLabel = buddyRead.target_finish_on
    ? `Читаємо до ${formatDateUk(buddyRead.target_finish_on)}`
    : buddyRead.title;
  const avgPct = averageMemberProgress(
    members.map((m) => m.user_id),
    bookEntries,
  );

  return (
    <div className="app-shell">
      <RoomBackdrop />
      <AppNav userEmail={userEmail} userId={userId} active="buddy-reads" />

      <main className="dl-page buddy-read-detail">
        <Link to="/buddy-reads" className="dl-back-link">
          ‹ Усі клуби
        </Link>

        {error && <p className="banner-error">{error}</p>}

        <div className="dl-buddy-detail-hero">
          <BookCover
            title={bookTitle}
            authors={buddyRead.book?.authors}
            coverUrl={buddyRead.book?.cover_url}
            entryId={buddyRead.book_id}
            width={58}
          />
          <div className="dl-buddy-detail-head">
            <p className="dl-buddy-detail-kicker">
              {buddyRead.title} · «{bookTitle}»
            </p>
            <h1>{deadlineLabel}</h1>
            {buddyRead.description && (
              <p className="dl-buddy-detail-desc">{buddyRead.description}</p>
            )}
          </div>
          {wide && (
            <div className="dl-buddy-detail-actions">
              <button type="button" className="dl-ghost dl-ghost-room" onClick={copyInviteLink}>
                {copied ? 'Скопійовано!' : 'Копіювати лінк'}
              </button>
              {isOwner && (
                <button type="button" className="dl-ghost dl-ghost-room" onClick={toggleArchive}>
                  {buddyRead.is_archived ? 'Повернути з архіву' : 'Архівувати'}
                </button>
              )}
            </div>
          )}
        </div>

        {!wide && (
          <div className="dl-buddy-detail-actions dl-buddy-detail-actions--mobile">
            <button type="button" className="dl-ghost dl-ghost-room" onClick={copyInviteLink}>
              {copied ? 'Скопійовано!' : 'Копіювати лінк'}
            </button>
            {isOwner && (
              <button type="button" className="dl-ghost dl-ghost-room" onClick={toggleArchive}>
                {buddyRead.is_archived ? 'Повернути з архіву' : 'Архівувати'}
              </button>
            )}
          </div>
        )}

        <div className="dl-buddy-columns">
          <div className="dl-buddy-stack">
            <section className="dl-panel">
              <div className="dl-panel-title-row">
                <h2 className="dl-panel-title">Прогрес учасників</h2>
                <span className="dl-buddy-avg-pct">сер. {avgPct}%</span>
              </div>
              <div className="dl-member-list">
                {members.map((member) => {
                  const name = member.profile?.display_name || 'Читач';
                  const progress = pickMemberProgress(bookEntries, member.user_id);
                  const pct = progressPercent(progress);
                  const barColor = memberBarColor(name);
                  return (
                    <div key={member.id} className="dl-member-row">
                      <MemberAvatar name={name} />
                      <div className="dl-member-row-body">
                        <div className="dl-member-row-head">
                          <span>
                            {name}
                            {member.role === 'owner' && (
                              <span className="dl-member-owner-tag"> · організатор</span>
                            )}
                          </span>
                          <span className="dl-member-row-pct">{pct}%</span>
                        </div>
                        <div className="dl-member-progress-track">
                          <div
                            className="dl-member-progress-fill"
                            style={{ width: `${pct}%`, background: barColor }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="dl-panel" id="buddy-shared-notes">
              <div className="dl-panel-title-row">
                <h2 className="dl-panel-title">Спільні нотатки</h2>
                {myEntryId && (
                  <button
                    type="button"
                    className="dl-ghost dl-ghost-compact"
                    onClick={() => setNoteComposerOpen((o) => !o)}
                  >
                    {noteComposerOpen ? 'Згорнути' : '+ Нотатка'}
                  </button>
                )}
              </div>
              {!myEntryId && (
                <p className="empty-hint">
                  Додай «{bookTitle}» в <Link to="/">бібліотеку</Link>, щоб писати нотатки в клубі.
                </p>
              )}
              {noteComposerOpen && myEntryId && (
                <form className="dl-composer-box" onSubmit={handleAddNote}>
                  <textarea
                    value={noteBody}
                    onChange={(e) => setNoteBody(e.target.value)}
                    rows={3}
                    required
                    autoFocus
                    placeholder="Думка, цитата, спостереження для клубу…"
                    className="dl-composer-textarea"
                  />
                  <div className="dl-composer-actions">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={notePage}
                      onChange={(e) => setNotePage(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="Сторінка"
                      className="dl-composer-page"
                    />
                    <button type="submit" className="dl-primary" disabled={noteSaving}>
                      {noteSaving ? 'Додаємо…' : 'Додати нотатку'}
                    </button>
                  </div>
                </form>
              )}

              <ul className="note-list dl-shared-notes-list">
                {sharedNotes.length === 0 ? (
                  <li className="empty-hint dl-shared-notes-empty">
                    Ще немає спільних нотаток — поділися першою думкою про книгу
                  </li>
                ) : (
                  sharedNotes.map((note) => {
                    const name = note.user_id === userId ? 'Ти' : note.profile?.display_name || 'Читач';
                    return (
                      <li key={note.id} className="dl-shared-note-item">
                        <MemberAvatar name={name} size={30} />
                        <div className="dl-shared-note-body">
                          <div className="dl-shared-note-head">
                            <span className="dl-shared-note-author">{name}</span>
                            {note.page_number != null && (
                              <span className="dl-page-badge">с. {note.page_number}</span>
                            )}
                          </div>
                          <p className="dl-shared-note-text">
                            {note.contains_spoilers ? '⚠️ ' : ''}
                            {note.body}
                          </p>
                        </div>
                      </li>
                    );
                  })
                )}
              </ul>
            </section>
          </div>

          <section className="dl-panel dl-panel--chat">
            <h2 className="dl-panel-title">Спільночат</h2>
            <div className="dl-chat-feed">
              {messages.length === 0 ? (
                <p className="empty-hint dl-chat-empty">Ще тихо — напиши першим</p>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`dl-chat-bubble${msg.user_id === userId ? ' is-mine' : ''}`}
                  >
                    <div className="dl-chat-author">
                      {msg.user_id === userId ? 'Ти' : msg.profile?.display_name || 'Читач'}
                    </div>
                    <div className="dl-chat-body">{msg.body}</div>
                  </div>
                ))
              )}
            </div>
            <form className="dl-chat-compose" onSubmit={handleSendMessage}>
              <input
                value={chatBody}
                onChange={(e) => setChatBody(e.target.value)}
                onKeyDown={handleChatKeyDown}
                placeholder="Написати повідомлення…"
              />
              <button type="submit" className="dl-primary dl-chat-send" disabled={chatSaving}>
                {chatSaving ? '…' : 'Надіслати'}
              </button>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}
