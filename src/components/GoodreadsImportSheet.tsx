import { useRef, useState } from 'react';
import { useIsMobile } from '../hooks/useIsMobile';
import { parseGoodreadsCsv, type GoodreadsCsvRow } from '../lib/goodreads/parseCsv';
import { importGoodreadsLibrary, type ImportResult } from '../lib/goodreads/importGoodreads';

interface GoodreadsImportSheetProps {
  userId: string;
  onClose: () => void;
}

type Step = 'pick' | 'preview' | 'importing' | 'done';

export function GoodreadsImportSheet({ userId, onClose }: GoodreadsImportSheetProps) {
  const mobile = useIsMobile();
  const inputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>('pick');
  const [rows, setRows] = useState<GoodreadsCsvRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [progress, setProgress] = useState({ done: 0, total: 0, currentTitle: '' });
  const [result, setResult] = useState<ImportResult | null>(null);

  async function handleFile(file: File) {
    setError('');
    try {
      const text = await file.text();
      const parsed = parseGoodreadsCsv(text);
      if (!parsed.length) {
        setError('У файлі не знайдено жодної книги.');
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
    <div className="dl-modal-backdrop" onClick={onClose} role="presentation">
      <div
        className={`dl-detailcard gr-import ${mobile ? 'is-sheet' : 'is-modal'}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
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
          {step === 'pick' && (
            <>
              <ol className="gr-import-steps">
                <li>
                  У Goodreads відкрий <strong>My Books</strong> → <strong>Import and export</strong>
                </li>
                <li>Натисни <strong>Export Library</strong> — завантажиться файл <code>goodreads_export.csv</code></li>
                <li>Завантаж його сюди — ми створимо полиці за статусами й перенесемо книги, оцінки та відгуки</li>
              </ol>

              <input
                ref={inputRef}
                type="file"
                accept=".csv,text/csv"
                className="gr-import-file-input"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleFile(file);
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
                {rows.length === 1 ? 'книгу' : rows.length < 5 ? 'книги' : 'книг'}.
                Книги, які вже є в бібліотеці (за Goodreads ID), будуть пропущені.
              </p>
              <div className="gr-import-preview-list">
                {rows.slice(0, 6).map((row) => (
                  <div key={row.bookId || row.title} className="gr-import-preview-item">
                    <span className="gr-import-preview-title">{row.title}</span>
                    <span className="gr-import-preview-meta">{row.author || '—'}</span>
                  </div>
                ))}
                {rows.length > 6 && (
                  <p className="gr-import-more">…і ще {rows.length - 6}</p>
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
                Готово! Додано <strong>{result.imported}</strong>
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
                <ul className="gr-import-errors">
                  {result.errors.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              )}
              <p className="gr-import-hint">Перейди в бібліотеку — там уже мають бути твої полиці з книгами.</p>
            </div>
          )}

          {error && <p className="banner-error">{error}</p>}
        </div>

        <footer className="gr-import-foot">
          {step === 'preview' && (
            <>
              <button type="button" className="dl-ghost" onClick={() => setStep('pick')}>
                Назад
              </button>
              <button type="button" className="dl-primary" onClick={() => void startImport()}>
                Імпортувати {rows.length} {rows.length === 1 ? 'книгу' : rows.length < 5 ? 'книги' : 'книг'}
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
    </div>
  );
}
