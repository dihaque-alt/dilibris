import { useEffect, useRef, useState } from 'react';
import { resolveOpenLibraryCoverUrl } from '../lib/openLibrary';
import { persistOpenLibraryCover } from '../lib/offline/librarySync';
import { CoverArt } from './CoverArt';
import {
  bookArt,
  bookRatio,
  coverPalette,
  type BookVisualMeta,
} from '../lib/bookVisual';

interface BookCoverProps {
  title: string;
  authors?: string[];
  coverUrl?: string | null;
  externalIds?: Record<string, string>;
  openLibraryLookup?: boolean;
  /** When set, resolved OL cover is written to books.cover_url */
  persistCover?: { userId: string; bookId: string };
  entryId?: string;
  width?: number;
  hero?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'shelf' | 'flyout';
  className?: string;
  /** Pass full visual meta to use deterministic art/ratio from handoff */
  visual?: BookVisualMeta;
}

export function BookCover({
  title,
  authors = [],
  coverUrl,
  externalIds,
  openLibraryLookup = false,
  entryId = title,
  width,
  hero = false,
  size = 'md',
  className = '',
  visual,
  persistCover,
}: BookCoverProps) {
  const [olCoverUrl, setOlCoverUrl] = useState<string | null>(null);
  const [olFailed, setOlFailed] = useState(false);
  const [lookupDone, setLookupDone] = useState(!openLibraryLookup);
  const persistedRef = useRef(false);

  const presetWidths: Record<string, number> = {
    sm: 64,
    md: 92,
    lg: 120,
    shelf: 100,
    flyout: 264,
  };
  const w = width ?? presetWidths[size] ?? 92;
  const ratio = visual?.ratio ?? bookRatio(entryId, title);
  const h = Math.round(w * (hero && size !== 'flyout' ? 1.5 : ratio));
  const palette = visual?.cover ?? coverPalette(entryId, title);
  const art = visual?.art ?? bookArt(entryId, title);
  const coverSize = hero || size === 'flyout' ? 'L' : 'M';

  useEffect(() => {
    setOlFailed(false);
    setLookupDone(!openLibraryLookup);
    persistedRef.current = false;

    if (coverUrl || !openLibraryLookup) {
      setOlCoverUrl(null);
      return;
    }

    let cancelled = false;
    void resolveOpenLibraryCoverUrl({ title, authors, externalIds }, coverSize)
      .then((url) => {
        if (cancelled) return;
        setOlCoverUrl(url);
        if (!url) setOlFailed(true);
      })
      .catch(() => {
        if (!cancelled) setOlFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLookupDone(true);
      });

    return () => {
      cancelled = true;
    };
  }, [coverUrl, openLibraryLookup, title, authors, externalIds, coverSize]);

  useEffect(() => {
    if (!olCoverUrl || coverUrl || !persistCover || persistedRef.current) return;
    persistedRef.current = true;
    void persistOpenLibraryCover(persistCover.userId, persistCover.bookId, olCoverUrl);
  }, [olCoverUrl, coverUrl, persistCover]);

  const displayUrl = coverUrl || olCoverUrl;
  const hasImage = Boolean(displayUrl) && !olFailed;
  const useTypographic = !hasImage && (!openLibraryLookup || lookupDone || olFailed);

  return (
    <div
      className={`dl-cover-frame${hero ? ' is-hero' : ''}${size ? ` dl-cover-frame--${size}` : ''}${useTypographic ? ' is-typographic' : ''}${className ? ` ${className}` : ''}`}
      style={{ width: w, height: h }}
    >
      {useTypographic && (
        <CoverArt
          title={title}
          authors={authors}
          cover={palette}
          art={art}
          width={w}
          entryId={entryId}
        />
      )}

      {hasImage && (
        <img
          className="dl-cover-img"
          src={displayUrl!}
          alt={`Обкладинка: ${title}`}
          loading="lazy"
          onError={() => {
            if (olCoverUrl && !coverUrl) {
              setOlFailed(true);
              setOlCoverUrl(null);
              return;
            }
          }}
        />
      )}

      {hasImage && (
        <>
          <span className="dl-cover-cloth" aria-hidden="true" />
          <span className="dl-cover-mottle" aria-hidden="true" />
          <span className="dl-cover-paper" aria-hidden="true" />
          <span className="dl-cover-vignette" aria-hidden="true" />
          <span className="dl-cover-sheen" aria-hidden="true" />
          <span className="dl-cover-room-light" aria-hidden="true" />
          <span className="dl-cover-spine-edge" aria-hidden="true" />
          <span className="dl-cover-top-pages" aria-hidden="true" />
          <span className="dl-cover-fore-edge" aria-hidden="true" />
        </>
      )}
    </div>
  );
}

export { bookVisualFromEntry } from '../lib/bookVisual';
