import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useOffline } from './OfflineProvider';
import { DetailTabs, type DetailTab } from './DetailTabs';
import { daysBetween, formatDateTimeUk, todayIsoDate } from '../lib/dates';
import {
  addSession,
  deleteSession,
  fetchSessions,
  updateEntry,
} from '../lib/offline/librarySync';
import { formatAuthors, STATUS_LABELS } from '../lib/labels';
import { formatMinutes, parseRating, RATING_OPTIONS } from '../lib/rating';
import type { BookEntryStatus, ReadingFormat, ReadingSession, UserBookEntry } from '../types/database';
import { BookCover } from './BookCover';
import { BookNotesSection } from './BookNotesSection';
import { BookReviewsSection } from './BookReviewsSection';

interface BookDetailModalProps {
  entry: UserBookEntry;
  userId: string;
  onClose: () => void;
  onUpdated: () => void;
}

const FORMAT_LABELS: Record<ReadingFormat, string> = {
  paper: 'Паперова',
  ebook: 'Електронна',
};

export function BookDetailModal({ entry, userId, onClose, onUpdated }: BookDetailModalProps) {
  const { refreshPending } = useOffline();
  const book = entry.book;
  const [tab, setTab] = useState<DetailTab>('progress');

  const [status, setStatus] = useState<BookEntryStatus>(entry.status);
  const [format, setFormat] = useState<ReadingFormat | ''>(entry.format ?? '');
  const [rating, setRating] = useState(String(entry.rating ?? ''));
  const [startedOn, setStartedOn] = useState(entry.started_on ?? '');
  const [finishedOn, setFinishedOn] = useState(entry.finished_on ?? '');
  const [currentPage, setCurrentPage] = useState(String(entry.current_page));
  const [totalPages, setTotalPages] = useState(String(entry.total_pages ?? book?.page_count ?? ''));
  const [countsTowardStats, setCountsTowardStats] = useState(entry.counts_toward_stats);
  const [totalMinutes, setTotalMinutes] = useState(entry.total_minutes);

  const [sessions, setSessions] = useState<ReadingSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showSessionForm, setShowSessionForm] = useState(false);

  const [sessionDate, setSessionDate] = useState(todayIsoDate());
  const [sessionPages, setSessionPages] = useState('');
  const [sessionMinutes, setSessionMinutes] = useState('');
  const [sessionNote, setSessionNote] = useState('');
  const [sessionSaving, setSessionSaving] = useState(false);

  const loadSessions = useCallback(async () => {
    setLoadingSessions(true);
    const data = await fetchSessions(entry.id);
    setSessions(data);
  }, [entry.id]);

  useEffect(() => {
    loadSessions()
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Не вдалося завантажити сесії');
      })
      .finally(() => setLoadingSessions(false));
  }, [loadSessions]);

  const totalPagesNum = totalPages ? Number(totalPages) : null;
  const currentPageNum = Number(currentPage) || 0;
  const progressPct =
    totalPagesNum && totalPagesNum > 0
      ? Math.min(100, Math.round((currentPageNum / totalPagesNum) * 100))
      : null;
  const readingDays = daysBetween(startedOn || null, finishedOn || null);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');

    let nextStarted = startedOn || null;
    let nextFinished = finishedOn || null;

    if (status === 'reading' || status === 're_reading') {
      if (!nextStarted) nextStarted = todayIsoDate();
    }
    if (status === 'finished') {
      if (!nextStarted) nextStarted = todayIsoDate();
      if (!nextFinished) nextFinished = todayIsoDate();
    }

    try {
      await updateEntry(userId, entry.id, {
        status,
        format: format || null,
        rating: parseRating(rating),
        started_on: nextStarted,
        finished_on: status === 'finished' || status === 'dnf' ? nextFinished : null,
        current_page: currentPageNum,
        total_pages: totalPagesNum,
        counts_toward_stats: countsTowardStats,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося зберегти');
      setSaving(false);
      return;
    }

    const cached = await fetchSessions(entry.id);
    setTotalMinutes(cached.reduce((s, r) => s + r.minutes, 0));
    setStartedOn(nextStarted ?? '');
    setFinishedOn(nextFinished ?? '');
    await refreshPending();
    onUpdated();
    setSaving(false);
  }

  async function handleAddSession(e: FormEvent) {
    e.preventDefault();
    setSessionSaving(true);
    setError('');

    const pages = Number(sessionPages) || 0;
    const minutes = Number(sessionMinutes) || 0;

    try {
      await addSession(userId, entry.id, {
        sessionDate,
        pages,
        minutes,
        note: sessionNote.trim() || null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося додати сесію');
      setSessionSaving(false);
      return;
    }

    const cached = await fetchSessions(entry.id);
    setTotalMinutes(cached.reduce((s, r) => s + r.minutes, 0));
    if (pages > 0) {
      setCurrentPage(String(currentPageNum + pages));
    }

    setSessionPages('');
    setSessionMinutes('');
    setSessionNote('');
    setShowSessionForm(false);
    await loadSessions();
    await refreshPending();
    onUpdated();
    setSessionSaving(false);
  }

  async function handleDeleteSession(sessionId: string) {
    if (!window.confirm('Видалити цю сесію?')) return;
    setError('');

    try {
      await deleteSession(userId, sessionId, entry.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося видалити сесію');
      return;
    }

    const cached = await fetchSessions(entry.id);
    setTotalMinutes(cached.reduce((s, r) => s + r.minutes, 0));
    await loadSessions();
    await refreshPending();
    onUpdated();
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal modal--detail modal--sheet"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="book-detail-title"
      >
        <header className="modal-header">
          <div className="book-detail-hero book-detail-hero--compact">
            <BookCover title={book?.title ?? 'Книга'} coverUrl={book?.cover_url} size="md" />
            <div className="book-detail-meta">
              <h2 id="book-detail-title">{book?.title}</h2>
              <p>{formatAuthors(book?.authors)}</p>
              <span className="status-pill">{STATUS_LABELS[status]}</span>
            </div>
          </div>
          <button type="button" className="btn-icon" onClick={onClose} aria-label="Закрити">
            ×
          </button>
        </header>

        <div className="stats-row stats-row--compact">
          {progressPct !== null && (
            <div className="stat-chip">
              <span className="stat-label">Прогрес</span>
              <strong>{progressPct}%</strong>
            </div>
          )}
          {readingDays !== null && (
            <div className="stat-chip">
              <span className="stat-label">Днів</span>
              <strong>{readingDays}</strong>
            </div>
          )}
          <div className="stat-chip">
            <span className="stat-label">Час</span>
            <strong>{formatMinutes(totalMinutes)}</strong>
          </div>
        </div>

        <DetailTabs active={tab} onChange={setTab} />

        {tab === 'progress' && (
          <form className="book-detail-form" onSubmit={handleSave}>
            <div className="form-row">
              <label>
                Статус
                <select value={status} onChange={(e) => setStatus(e.target.value as BookEntryStatus)}>
                  {(Object.entries(STATUS_LABELS) as [BookEntryStatus, string][]).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Формат
                <select value={format} onChange={(e) => setFormat(e.target.value as ReadingFormat | '')}>
                  <option value="">Не вказано</option>
                  {(Object.entries(FORMAT_LABELS) as [ReadingFormat, string][]).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label>
              Особиста оцінка
              <select value={rating} onChange={(e) => setRating(e.target.value)}>
                {RATING_OPTIONS.map((opt) => (
                  <option key={opt.value || 'none'} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="form-row">
              <label>
                Початок
                <input type="date" value={startedOn} onChange={(e) => setStartedOn(e.target.value)} />
              </label>
              <label>
                Завершення
                <input
                  type="date"
                  value={finishedOn}
                  onChange={(e) => setFinishedOn(e.target.value)}
                  disabled={status !== 'finished' && status !== 'dnf'}
                />
              </label>
            </div>

            <div className="form-row">
              <label>
                Поточна сторінка
                <input
                  type="number"
                  min={0}
                  value={currentPage}
                  onChange={(e) => setCurrentPage(e.target.value)}
                />
              </label>
              <label>
                Всього сторінок
                <input
                  type="number"
                  min={1}
                  value={totalPages}
                  onChange={(e) => setTotalPages(e.target.value)}
                />
              </label>
            </div>

            {(status === 'finished' || status === 're_reading') && (
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={countsTowardStats}
                  onChange={(e) => setCountsTowardStats(e.target.checked)}
                />
                Рахувати в challenge
              </label>
            )}

            <button type="submit" disabled={saving}>
              {saving ? 'Зберігаємо…' : 'Зберегти'}
            </button>
          </form>
        )}

        {tab === 'review' && book && (
          <BookReviewsSection
            embedded
            bookId={book.id}
            entryId={entry.id}
            userId={userId}
            entryRating={parseRating(rating)}
          />
        )}

        {tab === 'notes' && book && (
          <BookNotesSection embedded bookId={book.id} entryId={entry.id} userId={userId} />
        )}

        {tab === 'sessions' && (
          <section className="sessions-section sessions-section--embedded">
            <div className="embedded-actions">
              <button type="button" className="btn-small" onClick={() => setShowSessionForm((v) => !v)}>
                + Сесія
              </button>
            </div>

            {showSessionForm && (
              <form className="inline-form session-form" onSubmit={handleAddSession}>
                <div className="form-row">
                  <label>
                    Дата
                    <input
                      type="date"
                      value={sessionDate}
                      onChange={(e) => setSessionDate(e.target.value)}
                      required
                    />
                  </label>
                  <label>
                    Сторінок
                    <input
                      type="number"
                      min={0}
                      value={sessionPages}
                      onChange={(e) => setSessionPages(e.target.value)}
                    />
                  </label>
                  <label>
                    Хвилин
                    <input
                      type="number"
                      min={0}
                      value={sessionMinutes}
                      onChange={(e) => setSessionMinutes(e.target.value)}
                    />
                  </label>
                </div>
                <label>
                  Нотатка
                  <input value={sessionNote} onChange={(e) => setSessionNote(e.target.value)} />
                </label>
                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={() => setShowSessionForm(false)}>
                    Скасувати
                  </button>
                  <button type="submit" disabled={sessionSaving}>
                    {sessionSaving ? 'Додаємо…' : 'Додати'}
                  </button>
                </div>
              </form>
            )}

            {loadingSessions ? (
              <p className="form-hint">Завантажуємо…</p>
            ) : sessions.length === 0 ? (
              <p className="empty-hint">Ще немає сесій читання.</p>
            ) : (
              <ul className="session-list">
                {sessions.map((session) => (
                  <li key={session.id} className="session-item">
                    <div>
                      <strong>{formatDateTimeUk(session.started_at)}</strong>
                      <span>
                        {session.pages_read > 0 && `${session.pages_read} стор. · `}
                        {formatMinutes(session.minutes)}
                      </span>
                      {session.note && <p className="session-note">{session.note}</p>}
                    </div>
                    <button
                      type="button"
                      className="shelf-delete"
                      aria-label="Видалити"
                      onClick={() => handleDeleteSession(session.id)}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {error && <p className="form-error">{error}</p>}
      </div>
    </div>
  );
}
