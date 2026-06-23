import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import { useIsMobile } from '../hooks/useIsMobile';

interface BuddySheetProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function BuddySheet({ title, onClose, children }: BuddySheetProps) {
  const mobile = useIsMobile();

  return createPortal(
    <div
      className={`dl-modal-backdrop${mobile ? ' is-sheet-backdrop' : ''}`}
      onClick={onClose}
      role="presentation"
    >
      <div className="dl-modal-backdrop-inner">
        <div
          className={`dl-detailcard buddy-sheet ${mobile ? 'is-sheet' : 'is-modal is-narrow'}`}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="buddy-sheet-title"
        >
          {mobile && <div className="dl-sheet-handle" aria-hidden="true" />}
          <h2 id="buddy-sheet-title" className="buddy-sheet-title">
            {title}
          </h2>
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
