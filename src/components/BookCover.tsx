import { PLACEHOLDER_COVER } from '../lib/labels';

interface BookCoverProps {
  title: string;
  coverUrl?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'shelf' | 'flyout';
}

export function BookCover({ title, coverUrl, size = 'md' }: BookCoverProps) {
  return (
    <img
      className={`book-cover book-cover--${size}`}
      src={coverUrl || PLACEHOLDER_COVER}
      alt={`Обкладинка: ${title}`}
      loading="lazy"
      onError={(e) => {
        e.currentTarget.src = PLACEHOLDER_COVER;
      }}
    />
  );
}
