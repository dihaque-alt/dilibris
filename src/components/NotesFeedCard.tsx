import { BookCover } from './BookCover';
import { NoteBadge } from './NoteBadge';
import type { NoteFeedItem } from '../lib/notesFeed';
import { formatAuthors, NOTE_TYPE_LABELS, NOTE_VISIBILITY_LABELS } from '../lib/labels';
import type { NoteType } from '../types/database';

function noteBadgeTone(type: NoteType): 'quote' | 'thought' | 'general' {
  if (type === 'quote') return 'quote';
  if (type === 'thought') return 'thought';
  return 'general';
}

interface NotesFeedCardProps {
  item: NoteFeedItem;
  showBookFoot?: boolean;
  onOpen: (item: NoteFeedItem) => void;
}

export function NotesFeedCard({ item, showBookFoot = true, onOpen }: NotesFeedCardProps) {
  const { note, entry } = item;
  const book = entry.book;

  return (
    <article
      className="dl-panel notes-card"
      role="button"
      tabIndex={0}
      onClick={() => onOpen(item)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen(item);
        }
      }}
    >
      <div className="notes-card-badges">
        <NoteBadge tone={noteBadgeTone(note.note_type)}>
          {NOTE_TYPE_LABELS[note.note_type]}
        </NoteBadge>
        <NoteBadge tone={note.visibility === 'public' ? 'pub' : 'priv'}>
          {NOTE_VISIBILITY_LABELS[note.visibility]}
        </NoteBadge>
      </div>
      <p className={`notes-card-body${note.note_type === 'quote' ? ' is-quote' : ''}`}>{note.body}</p>
      {showBookFoot && (
        <div className="notes-card-foot">
          <BookCover
            title={book?.title ?? 'Книга'}
            authors={book?.authors}
            coverUrl={book?.cover_url}
            entryId={entry.id}
            width={28}
          />
          <div className="notes-card-book">
            <div className="notes-card-title">{book?.title ?? 'Книга'}</div>
            <div className="notes-card-author">{formatAuthors(book?.authors)}</div>
          </div>
          {note.page_number != null && note.page_number > 0 && (
            <span className="notes-card-page">стор. {note.page_number}</span>
          )}
        </div>
      )}
      {!showBookFoot && note.page_number != null && note.page_number > 0 && (
        <div className="notes-card-meta">
          <span className="notes-card-page">стор. {note.page_number}</span>
        </div>
      )}
    </article>
  );
}
