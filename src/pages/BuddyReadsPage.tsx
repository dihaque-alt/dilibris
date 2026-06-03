import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppNav } from '../components/AppNav';
import { BookCover } from '../components/BookCover';
import { supabase } from '../lib/supabase';
import { parseInviteToken } from '../lib/buddyRead';
import { formatAuthors } from '../lib/labels';
import type { BuddyReadListItem, UserBookEntry } from '../types/database';

interface BuddyReadsPageProps {
  userId: string;
  userEmail: string;
}

export function BuddyReadsPage({ userId, userEmail }: BuddyReadsPageProps) {
  const navigate = useNavigate();
  const [items, setItems] = useState<BuddyReadListItem[]>([]);
  const [libraryBooks, setLibraryBooks] = useState<UserBookEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const [bookId, setBookId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [creating, setCreating] = useState(false);

  const [joinToken, setJoinToken] = useState('');
  const [joining, setJoining] = useState(false);

  const loadData = useCallback(async () => {
    const [membersResult, entriesResult] = await Promise.all([
      supabase
        .from('buddy_read_members')
        .select(`
          role,
          buddy_read:buddy_reads (
            id, owner_id, book_id, title, description, invite_token,
            target_finish_on, is_archived, created_at, updated_at,
            book:books (id, title, authors, cover_url)
          )
        `)
        .eq('user_id', userId)
        .order('joined_at', { ascending: false }),
      supabase
        .from('user_book_entries')
        .select(`
          id, book_id,
          book:books (id, title, authors, cover_url)
        `)
        .eq('user_id', userId)
        .order('updated_at', { ascending: false }),
    ]);

    if (membersResult.error) throw membersResult.error;
    if (entriesResult.error) throw entriesResult.error;

    const list = (membersResult.data ?? [])
      .filter((row) => row.buddy_read)
      .map((row) => ({
        role: row.role as BuddyReadListItem['role'],
        buddy_read: row.buddy_read as unknown as BuddyReadListItem['buddy_read'],
      }));

    setItems(list);
    setLibraryBooks((entriesResult.data as unknown as UserBookEntry[]) ?? []);
  }, [userId]);

  useEffect(() => {
    loadData()
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Не вдалося завантажити buddy reads');
      })
      .finally(() => setLoading(false));
  }, [loadData]);

  const visibleItems = items.filter((item) => showArchived || !item.buddy_read.is_archived);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!bookId) {
      setError('Обери книгу з бібліотеки');
      return;
    }

    setCreating(true);
    setError('');

    const selected = libraryBooks.find((entry) => entry.book_id === bookId);
    const { data, error: insertError } = await supabase
      .from('buddy_reads')
      .insert({
        owner_id: userId,
        book_id: bookId,
        title: title.trim() || selected?.book?.title || 'Buddy read',
        description: description.trim() || null,
        target_finish_on: deadline || null,
      })
      .select('id')
      .single();

    if (insertError) {
      setError(insertError.message);
      setCreating(false);
      return;
    }

    navigate(`/buddy-reads/${data.id}`);
  }

  async function handleJoin(e: FormEvent) {
    e.preventDefault();
    const token = parseInviteToken(joinToken);
    if (!token) return;

    setJoining(true);
    setError('');

    const { data, error: joinError } = await supabase.rpc('join_buddy_read', { p_token: token });
    if (joinError) {
      setError(joinError.message);
      setJoining(false);
      return;
    }

    navigate(`/buddy-reads/${data}`);
  }

  if (loading) {
    return (
      <div className="app-shell app-shell--room">
        <AppNav userEmail={userEmail} active="buddy-reads" />
        <div className="center-page">Завантажуємо спільне читання…</div>
      </div>
    );
  }

  return (
    <div className="app-shell app-shell--room">
      <AppNav userEmail={userEmail} active="buddy-reads" />

      <main className="buddy-reads-page">
        <div className="dashboard-toolbar">
          <h2>Спільне читання</h2>
          <div className="toolbar-actions">
            <button type="button" className="btn-small" onClick={() => setShowCreate((v) => !v)}>
              + Створити
            </button>
          </div>
        </div>

        {error && <p className="banner-error">{error}</p>}

        <section className="dashboard-card">
          <h3>Приєднатися по лінку</h3>
          <form className="join-form" onSubmit={handleJoin}>
            <input
              value={joinToken}
              onChange={(e) => setJoinToken(e.target.value)}
              placeholder="Встав invite token або останню частину URL"
            />
            <button type="submit" disabled={joining}>
              {joining ? 'Приєднуємось…' : 'Приєднатися'}
            </button>
          </form>
        </section>

        {showCreate && (
          <section className="dashboard-card">
            <h3>Новий buddy read</h3>
            {libraryBooks.length === 0 ? (
              <p className="empty-hint">
                Спочатку додай книгу в{' '}
                <Link to="/">бібліотеку</Link>.
              </p>
            ) : (
              <form className="inline-form" onSubmit={handleCreate}>
                <label>
                  Книга
                  <select
                    value={bookId}
                    onChange={(e) => {
                      setBookId(e.target.value);
                      const entry = libraryBooks.find((b) => b.book_id === e.target.value);
                      if (entry?.book?.title && !title) setTitle(entry.book.title);
                    }}
                    required
                  >
                    <option value="">Обери книгу…</option>
                    {libraryBooks.map((entry) => (
                      <option key={entry.id} value={entry.book_id}>
                        {entry.book?.title ?? 'Книга'}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Назва групи
                  <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Спільне читання…" />
                </label>
                <label>
                  Опис (опційно)
                  <input value={description} onChange={(e) => setDescription(e.target.value)} />
                </label>
                <label>
                  Дедлайн (опційно)
                  <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
                </label>
                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)}>
                    Скасувати
                  </button>
                  <button type="submit" disabled={creating}>
                    {creating ? 'Створюємо…' : 'Створити'}
                  </button>
                </div>
              </form>
            )}
          </section>
        )}

        <div className="panel-head">
          <h3>Мої buddy reads</h3>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
            />
            Показати архів
          </label>
        </div>

        {visibleItems.length === 0 ? (
          <p className="empty-hint">Ще немає buddy reads. Створи групове читання або приєднайся по лінку.</p>
        ) : (
          <ul className="buddy-read-list">
            {visibleItems.map(({ role, buddy_read: br }) => (
              <li key={br.id}>
                <Link to={`/buddy-reads/${br.id}`} className="buddy-read-card">
                  <BookCover title={br.book?.title ?? br.title} coverUrl={br.book?.cover_url} size="sm" />
                  <div>
                    <strong>{br.title}</strong>
                    <p>{formatAuthors(br.book?.authors)}</p>
                    <span className="status-pill">
                      {role === 'owner' ? 'Організатор' : 'Учасник'}
                      {br.is_archived && ' · Архів'}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
