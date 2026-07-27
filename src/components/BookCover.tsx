import { useEffect, useRef, useState } from 'react';
import { resolveOpenLibraryCoverUrl } from '../lib/openLibrary';
import { persistOpenLibraryCover } from '../lib/offline/librarySync';
import { CoverArt } from './CoverArt';
import { CatKnifeArt } from './CatKnifeArt';
import {
  bookArt,
  bookRatio,
  coverPalette,
  formatAuthorsShort,
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
    persistedRef.current = false;
    if (coverUrl || !openLibraryLookup || olFailed) {
      setOlCoverUrl(null);
      return;
    }

    let cancelled = false;
    void resolveOpenLibraryCoverUrl({ title, authors, externalIds }, coverSize).then((url) => {
      if (!cancelled) setOlCoverUrl(url);
    });

    return () => {
      cancelled = true;
    };
  }, [coverUrl, openLibraryLookup, title, authors, externalIds, coverSize, olFailed]);

  useEffect(() => {
    if (!olCoverUrl || coverUrl || !persistCover || persistedRef.current) return;
    persistedRef.current = true;
    void persistOpenLibraryCover(persistCover.userId, persistCover.bookId, olCoverUrl);
  }, [olCoverUrl, coverUrl, persistCover]);

  const displayUrl = coverUrl || olCoverUrl;
  const hasImage = Boolean(displayUrl);
  const placeholder = visual?.placeholder ?? (!hasImage && !openLibraryLookup);

  return (
    <div
      className={`dl-cover-frame${hero ? ' is-hero' : ''}${size ? ` dl-cover-frame--${size}` : ''}${className ? ` ${className}` : ''}`}
      style={{ width: w, height: h }}
    >
      {placeholder ? (
        <div
          className="dl-cover-art dl-cover-art--placeholder"
          style={{ background: 'linear-gradient(165deg, #FBF3E5, #EFE2CC)' }}
        >
          <div className="dl-cover-cat-wrap">
            <CatKnifeArt />
          </div>
          <div className="dl-cover-plate dl-cover-plate--cat">
            <span className="dl-cover-plate-title">{title}</span>
            <span className="dl-cover-plate-author">{formatAuthorsShort(authors)}</span>
          </div>
        </div>
      ) : (
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
          onError={(e) => {
            if (olCoverUrl && !coverUrl) {
              setOlFailed(true);
              setOlCoverUrl(null);
              return;
            }
            e.currentTarget.style.display = 'none';
          }}
        />
      )}

      <span className="dl-cover-cloth" aria-hidden="true" />
      <span className="dl-cover-mottle" aria-hidden="true" />
      <span className="dl-cover-paper" aria-hidden="true" />
      <span className="dl-cover-vignette" aria-hidden="true" />
      <span className="dl-cover-sheen" aria-hidden="true" />
      <span className="dl-cover-room-light" aria-hidden="true" />
      <span className="dl-cover-spine-edge" aria-hidden="true" />
      <span className="dl-cover-top-pages" aria-hidden="true" />
      <span className="dl-cover-fore-edge" aria-hidden="true" />
    </div>
  );
}

export { bookVisualFromEntry } from '../lib/bookVisual';
