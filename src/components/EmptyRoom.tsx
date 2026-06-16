import { EmptyShelfGlyph } from './EmptyShelfButton';

interface EmptyRoomProps {
  onCreateShelf: () => void;
}

export function EmptyRoom({ onCreateShelf }: EmptyRoomProps) {
  return (
    <div className="dl-empty-room">
      <EmptyShelfGlyph width={160} height={106} />
      <h2 className="dl-empty-room-title">Тут з&apos;явиться твоя кімната з книгами</h2>
      <p className="dl-empty-room-sub">
        Створи першу полицю — і почни розставляти улюблені книжки.
      </p>
      <button type="button" className="dl-primary dl-empty-room-cta" onClick={onCreateShelf}>
        + Створити полицю
      </button>
    </div>
  );
}
