import { useRef, useState, type KeyboardEvent } from 'react';
import { STATUS_CSS_VAR } from '../lib/labels';
import type { BookViewMode } from '../lib/libraryDisplayPrefs';
import type { UserBookEntry } from '../types/database';
import { bookVisualFromEntry } from '../lib/bookVisual';
import { BookCover } from './BookCover';
import { BookSpine, formatAuthorsShort } from './BookSpine';

interface ShelfBookTileProps {
  entry: UserBookEntry;
  bookWidth: number;
  progress: number;
  view: BookViewMode;
  showTip: boolean;
  realCovers: boolean;
  onPick: (entry: UserBookEntry, rect: DOMRect) => void;
}

export function ShelfBookTile({
  entry,
  bookWidth,
  progress,
  view,
  showTip,
  realCovers,
  onPick,
}: ShelfBookTileProps) {
  const [hover, setHover] = useState(false);
  const tileRef = useRef<HTMLDivElement>(null);
  const visual = bookVisualFromEntry(entry);
  const statusKey = STATUS_CSS_VAR[entry.status];
  const isSpine = view === 'spine';
  const tipVisible = showTip && hover;

  function handlePick(e: { stopPropagation: () => void }) {
    e.stopPropagation();
    const cv = tileRef.current?.querySelector('.dl-cv');
    if (!cv) return;
    onPick(entry, cv.getBoundingClientRect());
  }

  return (
    <div
      ref={tileRef}
      className={`dl-tile${isSpine ? ' is-spine' : ''}`}
      style={{ zIndex: hover ? 8 : 1 }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={handlePick}
      onKeyDown={(e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          const cv = tileRef.current?.querySelector('.dl-cv');
          if (cv) onPick(entry, cv.getBoundingClientRect());
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`${visual.title}, ${formatAuthorsShort(visual.authors)}`}
    >
      {showTip && (
        <div className="dl-tip" style={{ opacity: tipVisible ? 1 : 0 }} aria-hidden={!tipVisible}>
          <span className="t">{visual.title}</span>
          <span className="a">{formatAuthorsShort(visual.authors)}</span>
        </div>
      )}

      <div
        className="dl-cv"
        style={{
          transform: hover ? 'translateY(-12px)' : 'none',
        }}
      >
        {isSpine ? (
          <BookSpine book={visual} width={bookWidth} hover={hover} />
        ) : (
          <div
            style={{
              boxShadow: hover ? 'var(--shadow-book-hover)' : 'var(--shadow-book)',
              borderRadius: 4,
            }}
          >
            <BookCover
              title={visual.title}
              authors={visual.authors}
              coverUrl={realCovers ? visual.coverUrl : null}
              entryId={visual.entryId}
              width={bookWidth}
              size="shelf"
            />
          </div>
        )}

        {entry.status !== 'want_to_read' && (
          <span className="dl-tile-dot" style={{ background: `var(--status-${statusKey})` }} />
        )}
        {progress > 0 && progress < 100 && (
          <span className="dl-tile-prog">
            <i style={{ width: `${progress}%` }} />
          </span>
        )}
      </div>
    </div>
  );
}
