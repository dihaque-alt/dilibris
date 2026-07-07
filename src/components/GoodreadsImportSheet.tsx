import { useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { useDialogA11y } from '../hooks/useDialogA11y';
import { useIsMobile } from '../hooks/useIsMobile';
import { isOnline } from '../lib/offline/db';
import { STATUS_LABELS } from '../lib/labels';
import { parseGoodreadsCsv, type GoodreadsCsvRow } from '../lib/goodreads/parseCsv';
import {
  importGoodreadsLibrary,
  mapGoodreadsRowStatus,
  type ImportResult,
} from '../lib/goodreads/importGoodreads';
import { StatusPill } from './StatusPill';
import type { BookEntryStatus } from '../types/database';

interface GoodreadsImportSheetProps {
  userId: string;
  onClose: () => void;
}

type Step = 'pick' | 'preview' | 'importing' | 'done';

const PREVIEW_LIMIT = 8;

function bookCountLabel(n: number): string {
  if (n === 1) return 'книгу';
  if (n < 5) return 'книги';
  return 'книг';
}

function GoodreadsModalShell({
  mobile,
  onClose,
  children,
}: {
  mobile: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  return createPortal(
    <div
      className={`dl-modal-backdrop${mobile ? ' is-sheet-backdrop' : ''}`}
      onClick={onClose}
      role="presentation"
    >
      <div className="dl-modal-backdrop-inner">{children}</div>
    </div>,
    document.body,
  );
}

function ImportAlert({ message }: { message: string }) {
  return (
    <div className="gr-import-alert" role="alert">
      {message}
    </div>
  );
}

export function GoodreadsImportSheet({ userId, onClose }: GoodreadsImportSheetProps) {
  const mobile = useIsMobile();
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  useDialogA11y(dialogRef, onClose);
  useBodyScrollLock();
  const [step, setStep] = useState<Step>('pick');
  const [rows, setRows] = useState<GoodreadsCsvRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [progress, setProgress] = useState({ done: 0, total: 0, currentTitle: '' });
  const [result, setResult] = useState<ImportResult | null>(null);
  const offline = !isOnline();

  const statusCounts = useMemo(() => {
    const counts: Partial<Record<BookEntryStatus, number>> = {};
    for (const row of rows) {
      const status = mapGoodreadsRowStatus(row);
      counts[status] = (counts[status] ?? 0) + 1;
    }
    return counts;
  }, [rows]);

  async function handleFile(file: File) {
    setError('');
    if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv') {
      setError('Потрібен CSV-файл — з Goodreads це goodreads_export.csv.');
      return;
    }
    try {
      const text = await file.text();
      const parsed = parseGoodreadsCsv(text);
      if (!parsed.length) {
        setError('У файлі не знайдено жодної книги — перевір, що це експорт бібліотеки Goodreads.');
        return;
      }
      setRows(parsed);
      setFileName(file.name);
      setStep('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося прочитати файл');
    }
  }

  async function startImport() {
    if (offline) {
      setError('Підключись до інтернету — імпорт працює лише онлайн.');
      return;
    }
    setStep('importing');
    setError('');
    try {
      const res = await importGoodreadsLibrary(userId, rows, setProgress);
      setResult(res);
      setStep('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Імпорт не вдався');
      setStep('preview');
    }
  }

  const pct = progress.total ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <GoodreadsModalShell mobile={mobile} onClose={onClose}>
      <div
        ref={dialogRef}
        className={`dl-detailcard gr-import ${mobile ? 'is-sheet' : 'is-modal'}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="gr-import-title"
      >
        {mobile && <div className="dl-sheet-handle" aria-hidden="true" />}

        <header className="gr-import-head">
          <div>
            <p className="gr-import-kicker">Goodreads → DiLibris</p>
            <h2 id="gr-import-title">Імпорт бібліотеки</h2>
          </div>
          <button type="button" className="dl-close" onClick={onClose} aria-label="Закрити">
            ✕
          </button>
        </header>

        <div className="gr-import-body">
          {offline && step !== 'done' && (
            <ImportAlert message="Зараз офлайн — імпорт працює лише з інтернетом." />
          )}

          {step === 'pick' && (
            <>
              <p className="gr-import-steps">3 кроки (My Books → Export → Upload)</p>

              <input
                ref={inputRef}
                type="file"
                accept=".csv,text/csv"
                className="gr-import-file-input"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleFile(file);
                  e.target.value = '';
                }}
              />
              <button
                type="button"
                className="dl-primary gr-import-pick-btn"
                onClick={() => inputRef.current?.click()}
              >
                Обрати CSV-файл
              </button>
            </>
          )}

          {step === 'preview' && (
            <>
              <p className="gr-import-summary">
                Файл <strong>{fileName}</strong> — знайдено <strong>{rows.length}</strong>{' '}
                {bookCountLabel(rows.length)}. Книги, які вже є в бібліотеці (за Goodreads ID), будуть
                пропущені.
              </p>

              <div className="gr-import-stats">
                {(Object.entries(statusCounts) as [BookEntryStatus, number][]).map(([status, count]) => (
                  <span key={status} className="gr-import-stat-chip">
                    {STATUS_LABELS[status]} · {count}
                  </span>
                ))}
              </div>

              <div className="gr-import-preview-list">
                {rows.slice(0, PREVIEW_LIMIT).map((row) => (
                  <div key={row.bookId || row.title} className="gr-import-preview-item">
                    <div className="gr-import-preview-copy">
                      <span className="gr-import-preview-title">{row.title}</span>
                      <span className="gr-import-preview-meta">
                        {row.author || '—'}
                        {row.myRating > 0 ? ` · ★ ${row.myRating}` : ''}
                      </span>
                    </div>
                    <StatusPill status={mapGoodreadsRowStatus(row)} size="sm" />
                  </div>
                ))}
                {rows.length > PREVIEW_LIMIT && (
                  <p className="gr-import-more">…і ще {rows.length - PREVIEW_LIMIT}</p>
                )}
              </div>
            </>
          )}

          {step === 'importing' && (
            <div className="gr-import-progress">
              <p>Імпортуємо… {progress.done} з {progress.total}</p>
              {progress.currentTitle && (
                <p className="gr-import-current">{progress.currentTitle}</p>
              )}
              <div className="gr-import-bar-track">
                <div className="gr-import-bar-fill" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )}

          {step === 'done' && result && (
            <div className="gr-import-result">
              <p className="gr-import-result-main">
                {result.failed === 0 ? 'Готово!' : 'Імпорт завершено з помилками.'} Додано{' '}
                <strong>{result.imported}</strong>
                {result.skipped > 0 && (
                  <>
                    , пропущено <strong>{result.skipped}</strong> (вже були)
                  </>
                )}
                {result.failed > 0 && (
                  <>
                    , помилок <strong>{result.failed}</strong>
                  </>
                )}
                .
              </p>
              {result.errors.length > 0 && (
                <div className="gr-import-errors-panel" role="alert">
                  <p className="gr-import-errors-title">Не вдалося імпортувати:</p>
                  <ul className="gr-import-errors">
                    {result.errors.map((e) => (
                      <li key={e}>{e}</li>
                    ))}
                  </ul>
                  {result.failed > result.errors.length && (
                    <p className="gr-import-errors-more">
                      …і ще {result.failed - result.errors.length} помилок
                    </p>
                  )}
                </div>
              )}
              <p className="gr-import-hint">
                Перейди в бібліотеку — там уже мають бути твої полиці з книгами.
              </p>
            </div>
          )}

          {error && <ImportAlert message={error} />}
        </div>

        <footer className="gr-import-foot">
          {step === 'preview' && (
            <>
              <button type="button" className="dl-ghost" onClick={() => { setStep('pick'); setError(''); }}>
                Назад
              </button>
              <button
                type="button"
                className="dl-primary"
                disabled={offline}
                onClick={() => void startImport()}
              >
                Імпортувати {rows.length} {bookCountLabel(rows.length)}
              </button>
            </>
          )}
          {step === 'done' && (
            <button type="button" className="dl-primary" style={{ flex: 1 }} onClick={onClose}>
              Закрити
            </button>
          )}
          {(step === 'pick' || step === 'importing') && (
            <button type="button" className="dl-ghost" onClick={onClose} disabled={step === 'importing'}>
              Скасувати
            </button>
          )}
        </footer>
      </div>
    </GoodreadsModalShell>
  );
}
