import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
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
  const coverRef = useRef<HTMLDivElement>(null);
  const [metaVisible, setMetaVisible] = useState(false);
  const flyoutWidth = mobile ? 200 : 264;

  useLayoutEffect(() => {
    const el = coverRef.current;
    if (!el) return;

    let cancelled = false;
    setMetaVisible(false);
    el.style.transition = 'none';
    el.style.transform = 'translate(0, 0) scale(1)';
    el.style.opacity = '0';

    const runFlip = () => {
      if (cancelled || !coverRef.current) return;
      const node = coverRef.current;

      if (!fromRect || fromRect.width <= 0 || fromRect.height <= 0) {
        node.style.opacity = '1';
        setMetaVisible(true);
        return;
      }

      const target = node.getBoundingClientRect();
      if (target.width <= 0 || target.height <= 0) {
        node.style.opacity = '1';
        setMetaVisible(true);
        return;
      }

      const sx = fromRect.width / target.width;
      const dx = fromRect.left + fromRect.width / 2 - (target.left + target.width / 2);
      const dy = fromRect.top + fromRect.height / 2 - (target.top + target.height / 2);

      node.style.transform = `translate(${dx}px, ${dy}px) scale(${sx})`;
      node.style.opacity = '1';

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (cancelled || !coverRef.current) return;
          coverRef.current.style.transition =
            'transform var(--dur-fly) var(--ease-back), opacity var(--dur-base) ease';
          coverRef.current.style.transform = 'translate(0, 0) scale(1)';
          setMetaVisible(true);
        });
      });
    };

    requestAnimationFrame(runFlip);

    return () => {
      cancelled = true;
    };
  }, [fromRect, entry.id]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  function onCoverKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpenDetail();
    }
  }

  const book = entry.book;

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

      <div className="flyout-center" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div
          ref={coverRef}
          className="flyout-hero"
          role="button"
          tabIndex={0}
          onClick={onOpenDetail}
          onKeyDown={onCoverKeyDown}
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
        </div>

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
