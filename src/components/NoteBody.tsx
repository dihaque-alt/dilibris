import { useState } from 'react';

interface NoteBodyProps {
  body: string;
  containsSpoilers: boolean;
  className?: string;
}

export function NoteBody({ body, containsSpoilers, className = 'review-body' }: NoteBodyProps) {
  const [revealed, setRevealed] = useState(!containsSpoilers);

  if (!body.trim()) return null;

  if (!revealed) {
    return (
      <div className="review-spoiler">
        <p className="form-hint">Містить спойлери</p>
        <button type="button" className="dl-ghost" onClick={() => setRevealed(true)}>
          Показати нотатку
        </button>
      </div>
    );
  }

  return <p className={className}>{body}</p>;
}
