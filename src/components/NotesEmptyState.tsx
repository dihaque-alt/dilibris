import { NotesEmptyIllustration } from './NotesEmptyIllustration';

interface NotesEmptyStateProps {
  variant: 'empty' | 'filtered';
}

export function NotesEmptyState({ variant }: NotesEmptyStateProps) {
  const title = variant === 'empty' ? 'Поки без нотаток' : 'Нічого не знайдено';
  const message =
    variant === 'empty'
      ? 'Додай цитату чи думку з картки будь-якої книги — вони зʼявляться тут.'
      : 'Спробуй інший тип нотатки або зміни пошуковий запит.';

  return (
    <div className="dl-panel is-soft notes-empty">
      <NotesEmptyIllustration />
      <h2 className="notes-empty-title">{title}</h2>
      <p className="notes-empty-message">{message}</p>
    </div>
  );
}
