import { formatAuthors, STATUS_LABELS } from '../lib/labels';
import type { UserBookEntry } from '../types/database';
import { BookCover } from './BookCover';

interface BookFlyoutProps {
  entry: UserBookEntry;
  onClose: () => void;
  onOpenDetail: () => void;
}

export function BookFlyout({ entry, onClose, onOpenDetail }: BookFlyoutProps) {
  const book = entry.book;

  return (
    <div className="flyout-backdrop" onClick={onClose} role="presentation">
      <div className="flyout-card" onClick={(e) => e.stopPropagation()} role="dialog">
        <button type="button" className="btn-icon flyout-close" onClick={onClose} aria-label="Закрити">
          ×
        </button>
        <div className="flyout-cover-wrap">
          <BookCover title={book?.title ?? 'Книга'} coverUrl={book?.cover_url} size="flyout" />
        </div>
        <h3>{book?.title}</h3>
        <p className="flyout-author">{formatAuthors(book?.authors)}</p>
        <span className="status-pill">{STATUS_LABELS[entry.status]}</span>
        <button type="button" className="flyout-open-btn" onClick={onOpenDetail}>
          Відкрити картку
        </button>
      </div>
    </div>
  );
}
