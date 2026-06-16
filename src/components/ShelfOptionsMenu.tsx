import { useState } from 'react';

interface ShelfOptionsMenuProps {
  shelfName: string;
  onRename: () => void;
  onAddBook: () => void;
  onDelete: () => void;
  canReorder?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

export function ShelfOptionsMenu({
  shelfName,
  onRename,
  onAddBook,
  onDelete,
  canReorder = false,
  onMoveUp,
  onMoveDown,
}: ShelfOptionsMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        className="dl-addbook"
        aria-label={`Опції полиці ${shelfName}`}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        style={{ padding: '6px 10px' }}
      >
        ⋯
      </button>
      {open && (
        <>
          <div
            className="dl-menu-backdrop"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="dl-shelf-menu" role="menu">
            {canReorder && (
              <>
                <button
                  type="button"
                  role="menuitem"
                  className="dl-shelf-menu-item"
                  onClick={() => {
                    setOpen(false);
                    onMoveUp?.();
                  }}
                >
                  Перемістити вгору
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="dl-shelf-menu-item"
                  onClick={() => {
                    setOpen(false);
                    onMoveDown?.();
                  }}
                >
                  Перемістити вниз
                </button>
                <div className="dl-shelf-menu-divider" />
              </>
            )}
            <button
              type="button"
              role="menuitem"
              className="dl-shelf-menu-item"
              onClick={() => {
                setOpen(false);
                onRename();
              }}
            >
              Перейменувати
            </button>
            <button
              type="button"
              role="menuitem"
              className="dl-shelf-menu-item"
              onClick={() => {
                setOpen(false);
                onAddBook();
              }}
            >
              Додати книгу
            </button>
            <div className="dl-shelf-menu-divider" />
            <button
              type="button"
              role="menuitem"
              className="dl-shelf-menu-item is-danger"
              onClick={() => {
                setOpen(false);
                onDelete();
              }}
            >
              Видалити полицю
            </button>
          </div>
        </>
      )}
    </div>
  );
}
