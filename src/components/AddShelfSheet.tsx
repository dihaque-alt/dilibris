import { createPortal } from 'react-dom';
import { useIsMobile } from '../hooks/useIsMobile';
import { AddShelfForm } from './AddShelfForm';
import type { BookEntryStatus } from '../types/database';

interface AddShelfSheetProps {
  onClose: () => void;
  onSubmit: (name: string, statusFilter: BookEntryStatus | null) => Promise<void>;
}

export function AddShelfSheet({ onClose, onSubmit }: AddShelfSheetProps) {
  const mobile = useIsMobile();

  return createPortal(
    <div
      className={`dl-modal-backdrop${mobile ? ' is-sheet-backdrop' : ''}`}
      onClick={onClose}
      role="presentation"
    >
      <div className="dl-modal-backdrop-inner">
        <div
          className={`dl-detailcard add-shelf-sheet ${mobile ? 'is-sheet' : 'is-modal'}`}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-shelf-title"
        >
          {mobile && <div className="dl-sheet-handle" aria-hidden="true" />}
          <header className="add-shelf-head">
            <h2 id="add-shelf-title">Додати полицю</h2>
            <button type="button" className="dl-close" onClick={onClose} aria-label="Закрити">
              ✕
            </button>
          </header>
          <AddShelfForm onSubmit={onSubmit} onCancel={onClose} />
        </div>
      </div>
    </div>,
    document.body,
  );
}
