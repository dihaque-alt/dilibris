import { useState } from 'react';
import { BookCover } from './BookCover';
import { NotesFeedCard } from './NotesFeedCard';
import type { BookNotesGroup } from '../lib/groupNotesByBook';
import { noteCountLabel } from '../lib/groupNotesByBook';
import type { NoteFeedItem } from '../lib/notesFeed';
import { formatAuthors } from '../lib/labels';

interface NotesByBookProps {
  groups: BookNotesGroup[];
  onOpenNote: (item: NoteFeedItem) => void;
  onOpenBook: (item: NoteFeedItem) => void;
}

export function NotesByBook({ groups, onOpenNote, onOpenBook }: NotesByBookProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());

  function toggleGroup(bookId: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(bookId)) next.delete(bookId);
      else next.add(bookId);
      return next;
    });
  }

  return (
    <div className="notes-book-groups">
      {groups.map((group) => {
        const isCollapsed = collapsed.has(group.bookId);
        return (
          <section
            key={group.bookId}
            className={`notes-book-group dl-panel${isCollapsed ? ' is-collapsed' : ''}`}
          >
            <div className="notes-book-group-head">
              <button
                type="button"
                className="notes-book-group-toggle"
                aria-expanded={!isCollapsed}
                onClick={() => toggleGroup(group.bookId)}
              >
                <BookCover
                  title={group.book.title}
                  authors={group.book.authors}
                  coverUrl={group.book.cover_url}
                  entryId={group.entry.id}
                  width={44}
                />
                <span className="notes-book-group-copy">
                  <span className="notes-book-group-title">{group.book.title}</span>
                  <span className="notes-book-group-author">{formatAuthors(group.book.authors)}</span>
                  <span className="notes-book-group-count">{noteCountLabel(group.notes.length)}</span>
                </span>
                <span className="notes-book-group-chevron" aria-hidden="true">
                  {isCollapsed ? '▸' : '▾'}
                </span>
              </button>
              <button
                type="button"
                className="dl-ghost notes-book-group-open"
                onClick={() => onOpenBook(group.notes[0]!)}
              >
                Книга
              </button>
            </div>
            {!isCollapsed && (
              <div className="notes-book-group-body">
                {group.notes.map((item) => (
                  <NotesFeedCard
                    key={item.note.id}
                    item={item}
                    showBookFoot={false}
                    onOpen={onOpenNote}
                  />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
