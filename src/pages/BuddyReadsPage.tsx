import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppNav } from '../components/AppNav';
import { BookCover } from '../components/BookCover';
import { BuddyCreateSheet } from '../components/BuddyCreateSheet';
import { BuddyJoinSheet } from '../components/BuddyJoinSheet';
import { PageHead } from '../components/PageHead';
import { RoomBackdrop } from '../components/RoomBackdrop';
import { useIsMobile } from '../hooks/useIsMobile';
import { averageMemberProgress, formatMemberCount, newInviteToken, parseInviteToken } from '../lib/buddyRead';
import { formatDateUk } from '../lib/dates';
import { supabase } from '../lib/supabase';
import type { BuddyReadListItem, UserBookEntry } from '../types/database';
import '../styles/library.css';
import '../styles/screens-ui.css';

interface BuddyReadsPageProps {
  userId: string;
  userEmail: string;
}

type BookEntryRow = {
  id: string;
  user_id: string;
  book_id: string;
  status: UserBookEntry['status'];
  current_page: number;
  total_pages: number | null;
  rating: number | null;
  finished_on: string | null;
  updated_at: string;
};

export function BuddyReadsPage({ userId, userEmail }: BuddyReadsPageProps) {
  const wide = !useIsMobile(760);
  const navigate = useNavigate();
  const [items, setItems] = useState<BuddyReadListItem[]>([]);
  const [memberRows, setMemberRows] = useState<{ buddy_read_id: string; user_id: string }[]>([]);
  const [bookEntries, setBookEntries] = useState<BookEntryRow[]>([]);
  const [libraryBooks, setLibraryBooks] = useState<UserBookEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

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

    const brIds = list.map(({ buddy_read: br }) => br.id);
    const bookIds = [...new Set(list.map(({ buddy_read: br }) => br.book_id))];

    if (brIds.length === 0) {
      setMemberRows([]);
      setBookEntries([]);
      return;
    }

    const [allMembers, allEntries] = await Promise.all([
      supabase.from('buddy_read_members').select('buddy_read_id, user_id').in('buddy_read_id', brIds),
      supabase
        .from('user_book_entries')
        .select('id, user_id, book_id, status, current_page, total_pages, rating, finished_on, updated_at')
        .in('book_id', bookIds),
    ]);

    if (allMembers.error) throw allMembers.error;
    if (allEntries.error) throw allEntries.error;

    setMemberRows((allMembers.data as { buddy_read_id: string; user_id: string }[]) ?? []);
    setBookEntries((allEntries.data as BookEntryRow[]) ?? []);
  }, [userId]);

  useEffect(() => {
    loadData()
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Не вдалося завантажити Спільночит');
      })
      .finally(() => setLoading(false));
  }, [loadData]);

  const visibleItems = items.filter((item) => showArchived || !item.buddy_read.is_archived);

  const progressByRead = useMemo(() => {
    const map = new Map<string, { count: number; pct: number }>();
    for (const { buddy_read: br } of items) {
      const memberIds = memberRows.filter((m) => m.buddy_read_id === br.id).map((m) => m.user_id);
      const entries = bookEntries.filter((e) => e.book_id === br.book_id);
      map.set(br.id, {
        count: memberIds.length,
        pct: averageMemberProgress(memberIds, entries),
      });
    }
    return map;
  }, [items, memberRows, bookEntries]);

  async function handleCreate(payload: {
    bookId: string;
    title: string;
    description: string;
    deadline: string;
  }) {
    const selected = libraryBooks.find((entry) => entry.book_id === payload.bookId);
    const clubId = crypto.randomUUID();
    const { error: insertError } = await supabase.from('buddy_reads').insert({
      id: clubId,
      owner_id: userId,
      book_id: payload.bookId,
      title: payload.title.trim() || selected?.book?.title || 'Клуб',
      description: payload.description.trim() || null,
      target_finish_on: payload.deadline || null,
      invite_token: newInviteToken(),
    });

    if (insertError) throw insertError;
    setShowCreate(false);
    navigate(`/buddy-reads/${clubId}`);
  }

  async function handleJoin(rawToken: string) {
    const token = parseInviteToken(rawToken);
    if (!token) throw new Error('Невірний лінк або token');

    const { data, error: joinError } = await supabase.rpc('join_buddy_read', { p_token: token });
    if (joinError) throw joinError;

    setShowJoin(false);
    navigate(`/buddy-reads/${data}`);
  }

  if (loading) {
    return (
      <div className="app-shell">
        <RoomBackdrop />
        <AppNav userEmail={userEmail} userId={userId} active="buddy-reads" />
        <div className="center-page" style={{ color: 'var(--ink-room-soft)' }}>
          Завантажуємо спільночит…
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <RoomBackdrop />
      <AppNav userEmail={userEmail} userId={userId} active="buddy-reads" />

      <main className="dl-page buddy-reads-page">
        <PageHead
          eyebrow="Читаємо разом"
          title="Спільночит"
          sub="Спільночати й нотатки на полях для друганів-читунів"
        >
          <button type="button" className="dl-primary" onClick={() => setShowCreate(true)}>
            + Створити
          </button>
        </PageHead>

        {error && <p className="banner-error">{error}</p>}

        {visibleItems.length === 0 ? (
          <section className="dl-panel is-soft dl-buddy-empty">
            <h2 className="dl-buddy-empty-title">Ще немає жодного клубу</h2>
            <p className="dl-buddy-empty-sub">
              Створи свій або долучися за лінком-запрошенням
            </p>
            <button type="button" className="dl-primary" onClick={() => setShowCreate(true)}>
              Створити клуб
            </button>
          </section>
        ) : (
          <div className={`dl-buddy-grid${wide ? ' is-wide' : ''}`}>
            {visibleItems.map(({ buddy_read: br }) => {
              const meta = progressByRead.get(br.id) ?? { count: 0, pct: 0 };
              const bookTitle = br.book?.title ?? 'Книга';
              const deadline = br.target_finish_on ? formatDateUk(br.target_finish_on) : null;
              return (
                <Link
                  key={br.id}
                  to={`/buddy-reads/${br.id}`}
                  className={`dl-panel dl-buddy-card is-clickable${br.is_archived ? ' is-archived' : ''}`}
                >
                  <div className="dl-buddy-card-head">
                    <BookCover
                      title={bookTitle}
                      authors={br.book?.authors}
                      coverUrl={br.book?.cover_url}
                      entryId={br.book_id}
                      width={44}
                    />
                    <div className="dl-buddy-card-meta">
                      <h3 className="dl-buddy-card-title">{br.title}</h3>
                      <p className="dl-buddy-card-sub">
                        {formatMemberCount(meta.count)} · «{bookTitle}»
                      </p>
                    </div>
                    <span className="dl-buddy-card-chevron" aria-hidden="true">
                      ›
                    </span>
                  </div>

                  {br.is_archived && (
                    <span className="dl-buddy-archived-badge">Архів</span>
                  )}

                  <div className="dl-buddy-progress-row">
                    <div className="dl-buddy-progress">
                      <div className="dl-buddy-progress-fill" style={{ width: `${meta.pct}%` }} />
                    </div>
                    <span className="dl-buddy-progress-pct">{meta.pct}%</span>
                  </div>

                  {deadline && (
                    <p className="dl-buddy-card-deadline">до {deadline}</p>
                  )}
                </Link>
              );
            })}
          </div>
        )}

        <section className="dl-panel is-soft dl-buddy-join">
          <p className="dl-buddy-join-text">Маєш запрошення? Долучайся за лінком.</p>
          <button type="button" className="dl-ghost" onClick={() => setShowJoin(true)}>
            Долучитися за лінком
          </button>
        </section>

        {visibleItems.length > 0 && (
          <label className="checkbox-label" style={{ marginTop: 14, display: 'inline-flex' }}>
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
            />
            Показати архів
          </label>
        )}
      </main>

      {showCreate && (
        <BuddyCreateSheet
          libraryBooks={libraryBooks}
          onClose={() => setShowCreate(false)}
          onSubmit={handleCreate}
        />
      )}

      {showJoin && (
        <BuddyJoinSheet onClose={() => setShowJoin(false)} onSubmit={handleJoin} />
      )}
    </div>
  );
}
