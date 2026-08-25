import { useEffect, useRef, useState, type MutableRefObject } from 'react';
import { createPortal } from 'react-dom';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { useDialogA11y } from '../hooks/useDialogA11y';
import { useIsMobile } from '../hooks/useIsMobile';
import {
  clearActiveSession,
  elapsedSeconds,
  fetchActiveSession,
  formatSessionClock,
  saveActiveSession,
  snapshotSession,
  startActiveSession,
} from '../lib/offline/activeSessionSync';
import { entryProgressMode } from '../lib/sessionProgress';
import type { ActiveReadingSession, UserBookEntry } from '../types/database';

interface SessionTimerProps {
  entry: UserBookEntry;
  userId: string;
  syncedSession?: ActiveReadingSession | null;
  onDismiss: () => void;
  onDiscard: () => void;
  onFinish: (payload: {
    minutes: number;
    note: string | null;
    pages?: number;
    percent?: number;
  }) => void | Promise<void>;
}

function applyRemoteSession(
  remote: ActiveReadingSession,
  setSession: (s: ActiveReadingSession) => void,
  setSec: (n: number) => void,
  setRunning: (r: boolean) => void,
  setPages: (p: string) => void,
  setNote: (n: string) => void,
  sessionRef: MutableRefObject<ActiveReadingSession | null>,
) {
  const editingField =
    document.activeElement instanceof HTMLInputElement &&
    document.activeElement.closest('.session-fields');

  sessionRef.current = remote;
  setSession(remote);
  setSec(elapsedSeconds(remote));
  setRunning(remote.is_running);

  if (!editingField) {
    setPages(remote.pages_draft);
    setNote(remote.note_draft);
  }
}

export function SessionTimer({
  entry,
  userId,
  syncedSession,
  onDismiss,
  onDiscard,
  onFinish,
}: SessionTimerProps) {
  const mobile = useIsMobile();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeDialogRef = useRef<() => void>(() => {});
  useDialogA11y(dialogRef, () => closeDialogRef.current());
  useBodyScrollLock();
  const [session, setSession] = useState<ActiveReadingSession | null>(null);
  const [sec, setSec] = useState(0);
  const [running, setRunning] = useState(true);
  const [pages, setPages] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const sessionRef = useRef<ActiveReadingSession | null>(null);
  const runningRef = useRef(true);
  const pagesRef = useRef('');
  const noteRef = useRef('');

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);
  useEffect(() => {
    runningRef.current = running;
  }, [running]);
  useEffect(() => {
    pagesRef.current = pages;
  }, [pages]);
  useEffect(() => {
    noteRef.current = note;
  }, [note]);

  async function persist() {
    const current = sessionRef.current;
    if (!current) return;
    const next = snapshotSession(current, {
      is_running: runningRef.current,
      pages_draft: pagesRef.current,
      note_draft: noteRef.current,
    });
    sessionRef.current = next;
    setSession(next);
    await saveActiveSession(next);
  }

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError('');
      try {
        const existing = await fetchActiveSession(userId);
        if (cancelled) return;

        const active =
          existing?.entry_id === entry.id
            ? existing
            : await startActiveSession(userId, entry.id);

        if (cancelled) return;
        sessionRef.current = active;
        setSession(active);
        setSec(elapsedSeconds(active));
        setRunning(active.is_running);
        setPages(active.pages_draft);
        setNote(active.note_draft);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Не вдалося запустити сесію');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, entry.id]);

  useEffect(() => {
    if (!syncedSession || syncedSession.entry_id !== entry.id) return;
    applyRemoteSession(syncedSession, setSession, setSec, setRunning, setPages, setNote, sessionRef);
  }, [syncedSession, entry.id]);

  useEffect(() => {
    if (!running || !session) return;
    const t = setInterval(() => {
      setSec(elapsedSeconds(sessionRef.current ?? session));
    }, 1000);
    return () => clearInterval(t);
  }, [running, session]);

  useEffect(() => {
    if (!session || loading) return;
    const interval = setInterval(() => {
      void persist();
    }, 5000);
    return () => clearInterval(interval);
  }, [session, loading]);

  useEffect(() => {
    const onVisibility = () => {
      const current = sessionRef.current;
      if (document.visibilityState === 'hidden') {
        void persist();
        return;
      }
      if (document.visibilityState === 'visible' && current) {
        setSec(elapsedSeconds(current));
        void persist();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  async function togglePause() {
    const current = sessionRef.current;
    if (!current) return;

    const nextRunning = !runningRef.current;
    const next = snapshotSession(current, { is_running: nextRunning });
    if (!nextRunning) {
      setSec(elapsedSeconds(next));
    }
    sessionRef.current = next;
    setSession(next);
    setRunning(nextRunning);
    await saveActiveSession(next);
  }

  async function handleDismiss() {
    await persist();
    onDismiss();
  }

  async function handleDiscard() {
    if (!window.confirm('Скинути сесію без запису в журнал?')) return;
    await clearActiveSession(userId);
    onDiscard();
  }

  async function finish() {
    const current = sessionRef.current;
    if (!current) {
      setError('Сесію не запущено — спробуй закрити й відкрити знову');
      return;
    }

    const snap = snapshotSession(current, { is_running: false });
    sessionRef.current = snap;
    setSession(snap);
    setRunning(false);
    setSec(elapsedSeconds(snap));

    const minutes = Math.max(1, Math.round(elapsedSeconds(snap) / 60));
    const progressRaw = parseInt(pagesRef.current, 10) || 0;
    const noteText = noteRef.current.trim() || null;
    const mode = entryProgressMode(entry);

    setError('');
    try {
      await saveActiveSession(snap);
      await onFinish(
        mode === 'percent'
          ? { minutes, percent: Math.min(100, progressRaw), note: noteText }
          : { minutes, pages: progressRaw, note: noteText },
      );
      onDismiss();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося записати сесію');
    }
  }

  const clock = formatSessionClock(sec);
  const canUseSession = !loading && session != null;
  const progressMode = entryProgressMode(entry);
  const progressIsPercent = progressMode === 'percent';

  closeDialogRef.current = () => {
    void handleDismiss();
  };

  return createPortal(
    <div
      className={`dl-modal-backdrop${mobile ? ' is-sheet-backdrop' : ''}`}
      onClick={() => void handleDismiss()}
      role="presentation"
    >
      <div className="dl-modal-backdrop-inner">
        <div
          ref={dialogRef}
          className={`dl-detailcard session-timer ${mobile ? 'is-sheet' : 'is-modal is-narrow'}`}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="session-title"
        >
          <button
            type="button"
            className="dl-close session-timer-close"
            onClick={() => void handleDismiss()}
            aria-label="Закрити"
          >
            ×
          </button>
          {mobile && <div className="dl-sheet-handle" aria-hidden="true" />}
          {loading ? (
            <p className="session-kicker">Завантаження сесії…</p>
          ) : (
            <>
              <p className="session-kicker">Сесія читання</p>
              <h2 id="session-title" className="session-book-title">
                {entry.book?.title ?? 'Книга'}
              </h2>

              <div className="session-clock">{clock}</div>
              <button
                type="button"
                className="dl-ghost session-pause"
                disabled={!canUseSession}
                onClick={() => void togglePause()}
              >
                {running ? '❚❚ Пауза' : '▷ Далі'}
              </button>

              <div className="session-fields">
                <label className="dl-field">
                  <span className="dl-field-label">{progressIsPercent ? 'Відсотків' : 'Сторінок'}</span>
                  <input
                    className="dl-field-input"
                    value={pages}
                    disabled={!canUseSession}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9]/g, '');
                      if (progressIsPercent && raw) {
                        const n = Math.min(100, parseInt(raw, 10) || 0);
                        setPages(String(n));
                      } else {
                        setPages(raw);
                      }
                    }}
                    onBlur={() => void persist()}
                    placeholder={progressIsPercent ? '0–100' : '0'}
                    inputMode="numeric"
                    max={progressIsPercent ? 100 : undefined}
                  />
                </label>
                <label className="dl-field session-note-field">
                  <span className="dl-field-label">Нотатка</span>
                  <input
                    className="dl-field-input"
                    value={note}
                    disabled={!canUseSession}
                    onChange={(e) => setNote(e.target.value)}
                    onBlur={() => void persist()}
                    placeholder="думка на полях…"
                  />
                </label>
              </div>

              <footer className="session-foot">
                <button type="button" className="dl-ghost" onClick={() => void handleDismiss()}>
                  Згорнути
                </button>
                <button
                  type="button"
                  className="dl-ghost session-foot-discard"
                  disabled={!canUseSession}
                  onClick={() => void handleDiscard()}
                >
                  Скинути
                </button>
                <button
                  type="button"
                  className="dl-primary"
                  disabled={!canUseSession}
                  onClick={() => void finish()}
                >
                  Завершити й записати
                </button>
              </footer>
              {error && <p className="form-error session-error">{error}</p>}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
