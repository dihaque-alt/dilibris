import { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useIsMobile } from '../hooks/useIsMobile';
import { formatAuthors } from '../lib/labels';
import type { UserBookEntry } from '../types/database';
import { BookCover } from './BookCover';
import { StatusPill } from './StatusPill';

interface BookFlyoutProps {
  entry: UserBookEntry;
  fromRect: DOMRect | null;
  onClose: () => void;
  onOpenDetail: () => void;
}

export function BookFlyout({ entry, fromRect, onClose, onOpenDetail }: BookFlyoutProps) {
  const mobile = useIsMobile();
  const book = entry.book;
  const coverRef = useRef<HTMLButtonElement>(null);
  const [metaVisible, setMetaVisible] = useState(false);

  useLayoutEffect(() => {
    const el = coverRef.current;
    if (!el) return;

    setMetaVisible(false);
    el.style.transition = 'none';
    el.style.transform = 'none';
    el.style.opacity = '0';

    if (!fromRect || fromRect.width <= 0 || fromRect.height <= 0) {
      el.style.opacity = '1';
      setMetaVisible(true);
      return;
    }

    const target = el.getBoundingClientRect();
    if (target.width <= 0 || target.height <= 0) {
      el.style.opacity = '1';
      setMetaVisible(true);
      return;
    }

    const sx = fromRect.width / target.width;
    const dx = fromRect.left + fromRect.width / 2 - (target.left + target.width / 2);
    const dy = fromRect.top + fromRect.height / 2 - (target.top + target.height / 2);

    el.style.transform = `translate(${dx}px, ${dy}px) scale(${sx})`;
    el.style.opacity = '1';

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.transition = 'transform var(--dur-fly) var(--ease-back)';
        el.style.transform = 'translate(0, 0) scale(1)';
        setMetaVisible(true);
      });
    });
  }, [fromRect]);

  const flyoutWidth = mobile ? 200 : 264;

  const ui = (
    <div className="flyout-backdrop" onClick={onClose} role="presentation">
      <button
        type="button"
        className="btn-icon flyout-close"
        onClick={onClose}
        aria-label="Закрити"
      >
        ×
      </button>

      <div className="flyout-stage" onClick={(e) => e.stopPropagation()} role="dialog">
        <button
          ref={coverRef}
          type="button"
          className="flyout-cover-wrap"
          onClick={onOpenDetail}
          aria-label={`Відкрити картку: ${book?.title ?? 'Книга'}`}
        >
          <BookCover
            title={book?.title ?? 'Книга'}
            authors={book?.authors}
            coverUrl={book?.cover_url}
            entryId={entry.id}
            width={flyoutWidth}
            size="flyout"
            hero
          />
        </button>

        <div className={`flyout-meta${metaVisible ? ' is-visible' : ''}`}>
          <h2>{book?.title}</h2>
          <p className="flyout-author">{formatAuthors(book?.authors)}</p>
          <StatusPill status={entry.status} />
          <p className="flyout-hint">Тицьни обкладинку, щоб відкрити книгу</p>
        </div>
      </div>
    </div>
  );

  return createPortal(ui, document.body);
}
