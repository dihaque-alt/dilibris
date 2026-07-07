import { useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { useDialogA11y } from '../hooks/useDialogA11y';
import { useIsMobile } from '../hooks/useIsMobile';

interface BuddySheetProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function BuddySheet({ title, onClose, children }: BuddySheetProps) {
  const mobile = useIsMobile();
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogA11y(dialogRef, onClose);
  useBodyScrollLock();

  return createPortal(
    <div
      className={`dl-modal-backdrop${mobile ? ' is-sheet-backdrop' : ''}`}
      onClick={onClose}
      role="presentation"
    >
      <div className="dl-modal-backdrop-inner">
        <div
          ref={dialogRef}
          className={`dl-detailcard buddy-sheet ${mobile ? 'is-sheet' : 'is-modal is-narrow'}`}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="buddy-sheet-title"
        >
          {mobile && <div className="dl-sheet-handle" aria-hidden="true" />}
          <header className="buddy-sheet-head">
            <h2 id="buddy-sheet-title" className="buddy-sheet-title">
              {title}
            </h2>
            <button type="button" className="dl-close" onClick={onClose} aria-label="Закрити">
              ×
            </button>
          </header>
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
