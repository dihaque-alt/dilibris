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
  entryId = title,
  width,
  hero = false,
  size = 'md',
  className = '',
  visual,
}: BookCoverProps) {
  const presetWidths: Record<string, number> = {
    sm: 64,
    md: 92,
    lg: 120,
    shelf: 100,
    flyout: 264,
  };
  const w = width ?? presetWidths[size] ?? 92;
  const ratio = visual?.ratio ?? bookRatio(entryId, title);
  const h = Math.round(w * (hero ? 1.5 : ratio));
  const palette = visual?.cover ?? coverPalette(entryId, title);
  const art = visual?.art ?? bookArt(entryId, title);
  const hasImage = Boolean(coverUrl);
  const placeholder = visual?.placeholder ?? !hasImage;

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
          src={coverUrl!}
          alt={`Обкладинка: ${title}`}
          loading="lazy"
          onError={(e) => {
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
