import { useEffect, useState } from 'react';
import { useIsMobile } from '../hooks/useIsMobile';
import type { UserBookEntry } from '../types/database';

interface SessionTimerProps {
  entry: UserBookEntry;
  onClose: () => void;
  onFinish: (payload: { minutes: number; pages: number; note: string | null }) => void;
}

export function SessionTimer({ entry, onClose, onFinish }: SessionTimerProps) {
  const mobile = useIsMobile();
  const [sec, setSec] = useState(0);
  const [running, setRunning] = useState(true);
  const [pages, setPages] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setSec((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [running]);

  const mm = String(Math.floor(sec / 60)).padStart(2, '0');
  const ss = String(sec % 60).padStart(2, '0');

  function finish() {
    onFinish({
      minutes: Math.max(1, Math.round(sec / 60)),
      pages: parseInt(pages, 10) || 0,
      note: note.trim() || null,
    });
    onClose();
  }

  return (
    <div className="dl-modal-backdrop" onClick={onClose} role="presentation">
      <div
        className={`dl-detailcard session-timer ${mobile ? 'is-sheet' : 'is-modal is-narrow'}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="session-title"
      >
        {mobile && <div className="dl-sheet-handle" aria-hidden="true" />}
        <p className="session-kicker">Сесія читання</p>
        <h2 id="session-title" className="session-book-title">
          {entry.book?.title ?? 'Книга'}
        </h2>

        <div className="session-clock">
          {mm}:{ss}
        </div>
        <button type="button" className="dl-ghost session-pause" onClick={() => setRunning((r) => !r)}>
          {running ? '❚❚ Пауза' : '▷ Далі'}
        </button>

        <div className="session-fields">
          <label className="dl-field">
            <span className="dl-field-label">Сторінок</span>
            <input
              className="dl-field-input"
              value={pages}
              onChange={(e) => setPages(e.target.value.replace(/[^0-9]/g, ''))}
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
              placeholder="думка на полях…"
            />
          </label>
        </div>

        <footer className="session-foot">
          <button type="button" className="dl-ghost" onClick={onClose}>
            Скасувати
          </button>
          <button type="button" className="dl-primary" onClick={finish}>
            Завершити й записати
          </button>
        </footer>
      </div>
    </div>
  );
}
