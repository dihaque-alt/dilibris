import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
import type { ActiveReadingSession, UserBookEntry } from '../types/database';

interface SessionTimerProps {
  entry: UserBookEntry;
  userId: string;
  onDismiss: () => void;
  onDiscard: () => void;
  onFinish: (payload: { minutes: number; pages: number; note: string | null }) => void;
}

export function SessionTimer({ entry, userId, onDismiss, onDiscard, onFinish }: SessionTimerProps) {
  const mobile = useIsMobile();
  const [session, setSession] = useState<ActiveReadingSession | null>(null);
  const [sec, setSec] = useState(0);
  const [running, setRunning] = useState(true);
  const [pages, setPages] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);

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

  const persist = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const existing = await fetchActiveSession(userId);
        if (cancelled) return;

        let active: ActiveReadingSession;
        if (existing?.entry_id === entry.id) {
          active = existing;
        } else {
          active = await startActiveSession(userId, entry.id);
        }

        if (cancelled) return;
        sessionRef.current = active;
        setSession(active);
        setSec(elapsedSeconds(active));
        setRunning(active.is_running);
        setPages(active.pages_draft);
        setNote(active.note_draft);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, entry.id]);

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
  }, [session, loading, persist]);

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden') {
        void persist();
      }
    };
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, [persist]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  async function togglePause() {
    const current = sessionRef.current;
    if (!current) return;

    const nextRunning = !runningRef.current;
    let next = snapshotSession(current, { is_running: nextRunning });
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
    await clearActiveSession(userId);
    onDiscard();
  }

  async function finish() {
    const current = sessionRef.current;
    const source = current ?? sessionRef.current;
    const minutes = Math.max(1, Math.round(elapsedSeconds(source) / 60));
    const pagesNum = parseInt(pagesRef.current, 10) || 0;
    const noteText = noteRef.current.trim() || null;

    await clearActiveSession(userId);
    onFinish({ minutes, pages: pagesNum, note: noteText });
    onDismiss();
  }

  const clock = formatSessionClock(sec);

  return createPortal(
    <div className="dl-modal-backdrop" onClick={() => void handleDismiss()} role="presentation">
      <div
        className={`dl-detailcard session-timer ${mobile ? 'is-sheet' : 'is-modal is-narrow'}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="session-title"
      >
        {mobile && <div className="dl-sheet-handle" aria-hidden="true" />}
        {loading ? (
          <p className="session-kicker">Завантаження сесії…</p>
        ) : (
          <>
            <p className="session-kicker">Сесія читання</p>
            <h2 id="session-title" className="session-book-title">
              {entry.book?.title ?? 'Книга'}
            </h2>

            <div className="session-clock">
              {clock}
            </div>
            <button type="button" className="dl-ghost session-pause" onClick={() => void togglePause()}>
              {running ? '❚❚ Пауза' : '▷ Далі'}
            </button>

            <div className="session-fields">
              <label className="dl-field">
                <span className="dl-field-label">Сторінок</span>
                <input
                  className="dl-field-input"
                  value={pages}
                  onChange={(e) => setPages(e.target.value.replace(/[^0-9]/g, ''))}
                  onBlur={() => void persist()}
                  placeholder="0"
                  inputMode="numeric"
                />
              </label>
              <label className="dl-field session-note-field">
                <span className="dl-field-label">Нотатка</span>
                <input
                  className="dl-field-input"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  onBlur={() => void persist()}
                  placeholder="думка на полях…"
                />
              </label>
            </div>

            <footer className="session-foot">
              <button type="button" className="dl-ghost" onClick={() => void handleDiscard()}>
                Скасувати
              </button>
              <button type="button" className="dl-primary" onClick={() => void finish()}>
                Завершити й записати
              </button>
            </footer>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
