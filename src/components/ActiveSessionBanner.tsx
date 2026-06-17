import { createPortal } from 'react-dom';

interface ActiveSessionBannerProps {
  title: string;
  clock: string;
  isRunning: boolean;
  onContinue: () => void;
  onDiscard: () => void;
}

export function ActiveSessionBanner({
  title,
  clock,
  isRunning,
  onContinue,
  onDiscard,
}: ActiveSessionBannerProps) {
  return createPortal(
    <div className="active-session-banner" role="status" aria-live="polite">
      <div className="active-session-banner-text">
        <span className="active-session-banner-kicker">
          {isRunning ? 'Сесія читання' : 'Сесія на паузі'}
        </span>
        <span className="active-session-banner-title">
          {title} · {clock}
        </span>
      </div>
      <div className="active-session-banner-actions">
        <button type="button" className="dl-ghost" onClick={onDiscard}>
          Скинути
        </button>
        <button type="button" className="dl-primary" onClick={onContinue}>
          Продовжити
        </button>
      </div>
    </div>,
    document.body,
  );
}
