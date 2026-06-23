import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { useOffline } from './OfflineProvider';
import { DetailTabs, type DetailTab } from './DetailTabs';
import { StatChip } from './StatChip';
import { StatusPill } from './StatusPill';
import { readingDaysSpan, todayIsoDate } from '../lib/dates';
import { defaultProgressMode, resolveProgressPercent } from '../lib/progress';
import {
  addSession,
  createRereadEntry,
  deleteEntry,
  deleteSession,
  fetchEntry,
  fetchSessions,
  updateEntry,
} from '../lib/offline/librarySync';
import { formatAuthors, STATUS_LABELS } from '../lib/labels';
import { formatMinutes, parseRating, snapRating } from '../lib/rating';
import { useIsMobile } from '../hooks/useIsMobile';
import type { BookEntryStatus, ProgressMode, ReadingFormat, ReadingSession, UserBookEntry } from '../types/database';
import { BookCover } from './BookCover';
import { BookNotesSection } from './BookNotesSection';
import { BookReviewsSection } from './BookReviewsSection';
import { StarRating } from './StarRating';

interface BookDetailModalProps {
  entry: UserBookEntry;
  userId: string;
  onClose: () => void;
  onUpdated: () => void;
  onDeleted?: () => void;
  onSession?: () => void;
}

const FORMAT_LABELS: Record<ReadingFormat, string> = {
  paper: 'Паперова',
  ebook: 'Електронна',
  audiobook: 'Аудіо',
};

const PROGRESS_MODE_LABELS: Record<ProgressMode, string> = {
  pages: 'Сторінки',
  percent: 'Відсотки',
};

const STATUS_KEYS = Object.keys(STATUS_LABELS) as BookEntryStatus[];

export function BookDetailModal({
  entry,
  userId,
  onClose,
  onUpdated,
  onDeleted,
  onSession,
}: BookDetailModalProps) {
  const mobile = useIsMobile();
  const { refreshPending } = useOffline();
  const book = entry.book;
  const [tab, setTab] = useState<DetailTab>('progress');

  const [status, setStatus] = useState<BookEntryStatus>(entry.status);
  const [format, setFormat] = useState<ReadingFormat | ''>(entry.format ?? '');
  const [progressMode, setProgressMode] = useState<ProgressMode>(
    entry.progress_mode ?? defaultProgressMode(entry.format),
  );
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
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [showSessionForm, setShowSessionForm] = useState(false);

  const [sessionDate, setSessionDate] = useState(todayIsoDate());
  const [sessionPages, setSessionPages] = useState('');
  const [sessionMinutes, setSessionMinutes] = useState('');
  const [sessionNote, setSessionNote] = useState('');
  const [sessionSaving, setSessionSaving] = useState(false);

  const [notesFormOpen, setNotesFormOpen] = useState(false);
  const [notesSaving, setNotesSaving] = useState(false);
  const [reviewFormOpen, setReviewFormOpen] = useState(false);
  const [reviewSaving, setReviewSaving] = useState(false);

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

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    if (status === 'reading' || status === 're_reading' || status === 'finished' || status === 'dnf') {
      setStartedOn((prev) => prev || todayIsoDate());
    }
    if (status === 'finished' || status === 'dnf') {
      setFinishedOn((prev) => prev || todayIsoDate());
    } else {
      setFinishedOn('');
    }
  }, [status]);

  const applyEntrySnapshot = useCallback(async () => {
    const refreshed = await fetchEntry(entry.id);
    if (!refreshed) return;
    setCurrentPage(String(refreshed.current_page));
    setTotalMinutes(refreshed.total_minutes);
    setStartedOn(refreshed.started_on ?? '');
    setFinishedOn(refreshed.finished_on ?? '');
    setCountsTowardStats(refreshed.counts_toward_stats);
    if (refreshed.progress_mode) {
      setProgressMode(refreshed.progress_mode);
    }
    if (refreshed.rating != null) {
      setRating(String(refreshed.rating));
    }
  }, [entry.id]);

  const totalPagesNum = totalPages ? Number(totalPages) : null;
  const currentPageNum = Number(currentPage) || 0;
  const progressPct = resolveProgressPercent(progressMode, currentPageNum, totalPagesNum);
  const effectiveStart = startedOn || entry.started_on || null;
  const effectiveFinished =
    status === 'finished' || status === 'dnf' ? finishedOn || entry.finished_on || null : null;
  const readingDays =
    status !== 'want_to_read' ? readingDaysSpan(effectiveStart, effectiveFinished) : null;

  function handleFormatChange(next: ReadingFormat | '') {
    setFormat(next);
    if (next === 'audiobook' && progressMode === 'pages') {
      setProgressMode('percent');
    }
  }
  const showReadingActions =
    status !== 'want_to_read' && status !== 'finished' && onSession;

  const footerSubmitFormId =
    tab === 'progress'
      ? 'book-progress-form'
      : tab === 'notes' && notesFormOpen
        ? 'book-notes-form'
        : tab === 'review' && reviewFormOpen
          ? 'book-review-form'
          : tab === 'sessions' && showSessionForm
            ? 'book-session-form'
            : null;

  const footerSaving =
    tab === 'progress'
      ? saving
      : tab === 'notes'
        ? notesSaving
        : tab === 'review'
          ? reviewSaving
          : tab === 'sessions'
            ? sessionSaving
            : false;

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');

    const startingReread =
      status === 're_reading' &&
      entry.status !== 're_reading' &&
      !entry.parent_entry_id &&
      entry.status === 'finished';

    if (startingReread) {
      if (
        !window.confirm(
          'Почати новий прохід? Попереднє прочитання збережеться окремо — зʼявиться новий запис на полиці.',
        )
      ) {
        setStatus(entry.status);
        setSaving(false);
        return;
      }

      try {
        await createRereadEntry(userId, entry, {
          countsTowardStats: countsTowardStats,
          format: format || null,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Не вдалося створити перечитання');
        setSaving(false);
        return;
      }

      await refreshPending();
      onUpdated();
      setSaving(false);
      onClose();
      return;
    }

    let nextStarted = startedOn || null;
    let nextFinished = finishedOn || null;

    if (status === 'reading' || status === 're_reading') {
      if (!nextStarted) nextStarted = todayIsoDate();
    }
    if (status === 'finished' || status === 'dnf') {
      if (!nextStarted) nextStarted = todayIsoDate();
      if (!nextFinished) nextFinished = todayIsoDate();
    }

    const savedRating = snapRating(parseRating(rating));

    try {
      await updateEntry(userId, entry.id, {
        status,
        format: format || null,
        progress_mode: progressMode,
        rating: savedRating,
        started_on: nextStarted,
        finished_on: status === 'finished' || status === 'dnf' ? nextFinished : null,
        current_page: progressMode === 'percent' ? Math.min(100, Math.max(0, currentPageNum)) : currentPageNum,
        total_pages: progressMode === 'percent' ? null : totalPagesNum,
        counts_toward_stats: countsTowardStats,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося зберегти');
      setSaving(false);
      return;
    }

    await applyEntrySnapshot();
    await refreshPending();
    onUpdated();
    setSaving(false);
    onClose();
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

    await applyEntrySnapshot();
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

    await applyEntrySnapshot();
    await loadSessions();
    await refreshPending();
    onUpdated();
  }

  async function handleDeleteEntry() {
    const title = book?.title ?? 'Книга';
    if (
      !window.confirm(
        `Видалити «${title}» з бібліотеки? Сесії та нотатки до цієї книги теж зникнуть.`,
      )
    ) {
      return;
    }

    setDeleting(true);
    setError('');

    try {
      await deleteEntry(userId, entry.id);
      await refreshPending();
      onDeleted?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося видалити книгу');
      setDeleting(false);
    }
  }

  return createPortal(
    <div
      className={`dl-modal-backdrop${mobile ? ' is-sheet-backdrop' : ''}`}
      onClick={onClose}
      role="presentation"
    >
      <div className="dl-modal-backdrop-inner">
        <div
          className={`dl-detailcard ${mobile ? 'is-sheet' : 'is-modal'}`}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="book-detail-title"
        >
        {mobile && <div className="dl-sheet-handle" aria-hidden="true" />}

        <header className="dl-detail-header">
          <div className="dl-detail-cover-wrap">
            <BookCover
              title={book?.title ?? 'Книга'}
              authors={book?.authors}
              coverUrl={book?.cover_url}
              entryId={entry.id}
              size="md"
            />
            <span className="dl-detail-cover-shadow" aria-hidden="true" />
          </div>
          <div className="dl-detail-meta">
            <h2 id="book-detail-title">{book?.title}</h2>
            <p>{formatAuthors(book?.authors)}</p>
            <StatusPill status={status} size="sm" />
            {entry.parent_entry_id && (
              <p className="form-hint" style={{ marginTop: 6 }}>
                Перечитання · попередній прохід збережено
              </p>
            )}
          </div>
          <button type="button" className="dl-close" onClick={onClose} aria-label="Закрити">
            ×
          </button>
        </header>

        <div className="dl-detail-stats">
          <StatChip
            label="прогрес"
            value={progressPct !== null ? `${progressPct}%` : '—'}
            accent="var(--accent-lime-deep)"
          />
          <StatChip label="днів читання" value={readingDays !== null ? String(readingDays) : '—'} />
          <StatChip
            label="загалом"
            value={totalMinutes > 0 ? formatMinutes(totalMinutes) : '—'}
            accent="var(--gold-deep)"
          />
        </div>

        {showReadingActions && (
          <div className="dl-detail-reading-actions">
            <button type="button" className="dl-primary dl-detail-read-primary" onClick={onSession}>
              ⏱ Почати сесію
            </button>
          </div>
        )}

        <div className="dl-detail-tabs-wrap">
          <DetailTabs active={tab} onChange={setTab} />
        </div>

        <div className="dl-detail-body">
          {tab === 'progress' && (
            <form id="book-progress-form" className="dl-detail-form-stack" onSubmit={handleSave}>
              <div className="dl-field">
                <span className="dl-field-label">Статус</span>
                <div className="dl-choice-row">
                  {STATUS_KEYS.map((key) => (
                    <button
                      key={key}
                      type="button"
                      className={status === key ? 'dl-choice is-active' : 'dl-choice'}
                      onClick={() => setStatus(key)}
                    >
                      {STATUS_LABELS[key]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="dl-field">
                <span className="dl-field-label">Формат</span>
                <div className="dl-choice-row">
                  <button
                    type="button"
                    className={format === '' ? 'dl-choice is-active' : 'dl-choice'}
                    onClick={() => handleFormatChange('')}
                  >
                    Не вказано
                  </button>
                  {(Object.entries(FORMAT_LABELS) as [ReadingFormat, string][]).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      className={format === value ? 'dl-choice is-active' : 'dl-choice'}
                      onClick={() => handleFormatChange(value)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="dl-field">
                <span className="dl-field-label">Оцінка</span>
                <StarRating
                  value={snapRating(parseRating(rating)) ?? 0}
                  size={28}
                  onChange={(v) => setRating(v > 0 ? String(snapRating(v) ?? v) : '')}
                />
              </div>

              <div className="dl-form-row">
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

              <div className="dl-field">
                <span className="dl-field-label">Прогрес</span>
                <div className="dl-choice-row">
                  {(Object.entries(PROGRESS_MODE_LABELS) as [ProgressMode, string][]).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      className={progressMode === value ? 'dl-choice is-active' : 'dl-choice'}
                      onClick={() => setProgressMode(value)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {progressMode === 'pages' ? (
                <div className="dl-form-row">
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
              ) : (
                <label>
                  Прогрес, %
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={currentPage}
                    onChange={(e) => setCurrentPage(e.target.value)}
                  />
                </label>
              )}

              {(status === 'finished' || status === 're_reading') && (
                <div
                  className="dl-toggle-row"
                  role="button"
                  tabIndex={0}
                  onClick={() => setCountsTowardStats((v) => !v)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setCountsTowardStats((v) => !v);
                    }
                  }}
                >
                  <div className={`dl-toggle-track${countsTowardStats ? ' is-on' : ''}`}>
                    <div className="dl-toggle-thumb" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 'var(--fs-body)' }}>Рахувати в challenge</div>
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', marginTop: 2 }}>
                      Книга зараховується у твою річну ціль
                    </div>
                  </div>
                </div>
              )}
            </form>
          )}

          {tab === 'review' && book && (
            <BookReviewsSection
              embedded
              bookId={book.id}
              entryId={entry.id}
              userId={userId}
              entryRating={parseRating(rating)}
              onFormOpenChange={setReviewFormOpen}
              onSavingChange={setReviewSaving}
            />
          )}

          {tab === 'notes' && book && (
            <BookNotesSection
              embedded
              bookId={book.id}
              entryId={entry.id}
              userId={userId}
              onFormOpenChange={setNotesFormOpen}
              onSavingChange={setNotesSaving}
            />
          )}

          {tab === 'sessions' && (
            <section>
              {!showSessionForm && (
                <button
                  type="button"
                  className="dl-ghost"
                  style={{ marginBottom: 12 }}
                  onClick={() => setShowSessionForm(true)}
                >
                  + Сесія
                </button>
              )}

              {showSessionForm && (
                <>
                  <div className="dl-panel-title-row" style={{ marginBottom: 12 }}>
                    <span className="dl-field-label">Нова сесія</span>
                    <button type="button" className="dl-ghost" onClick={() => setShowSessionForm(false)}>
                      Згорнути
                    </button>
                  </div>
                </>
              )}

              {showSessionForm && (
                <form
                  id="book-session-form"
                  className="inline-form session-form"
                  onSubmit={handleAddSession}
                  style={{ marginBottom: 16 }}
                >
                  <div className="dl-form-row">
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
                    <button type="button" className="dl-ghost" onClick={() => setShowSessionForm(false)}>
                      Скасувати
                    </button>
                    <button type="submit" className="dl-primary" disabled={sessionSaving}>
                      {sessionSaving ? 'Додаємо…' : 'Записати'}
                    </button>
                  </div>
                </form>
              )}

              {loadingSessions ? (
                <p className="form-hint">Завантажуємо…</p>
              ) : sessions.length === 0 ? (
                <p className="empty-hint">Ще немає сесій читання.</p>
              ) : (
                <ul className="dl-session-list">
                  {sessions.map((session) => (
                    <li key={session.id} className="dl-session-item">
                      <div className="dl-session-date">
                        {new Date(session.started_at).toLocaleDateString('uk-UA', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 'var(--fs-sm)' }}>
                          {session.pages_read > 0 && `${session.pages_read} стор. · `}
                          {formatMinutes(session.minutes)}
                        </div>
                        {session.note && (
                          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', marginTop: 2 }}>
                            {session.note}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        className="dl-close"
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

        <footer className="dl-detail-footer">
          <button
            type="button"
            className="dl-danger dl-detail-footer-delete"
            disabled={deleting || saving}
            onClick={() => void handleDeleteEntry()}
          >
            {deleting ? 'Видаляємо…' : 'Видалити'}
          </button>
          <button type="button" className="dl-ghost" disabled={deleting} onClick={onClose}>
            Скасувати
          </button>
          {footerSubmitFormId ? (
            <button
              type="submit"
              form={footerSubmitFormId}
              className="dl-primary"
              disabled={footerSaving || deleting}
            >
              {footerSaving ? 'Зберігаємо…' : 'Зберегти'}
            </button>
          ) : (
            <button type="button" className="dl-primary" disabled={deleting} onClick={onClose}>
              Готово
            </button>
          )}
        </footer>
        </div>
      </div>
    </div>,
    document.body,
  );
}
