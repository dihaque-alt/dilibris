import { createPortal } from 'react-dom';

interface ActiveSessionBannerProps {
  title: string;
  clock: string;
  isRunning: boolean;
  onOpen: () => void;
  onTogglePause: () => void;
  onFinish: () => void;
  onDiscard: () => void;
}

export function ActiveSessionBanner({
  title,
  clock,
  isRunning,
  onOpen,
  onTogglePause,
  onFinish,
  onDiscard,
}: ActiveSessionBannerProps) {
  return createPortal(
    <div className="active-session-banner" role="status" aria-live="polite">
      <button
        type="button"
        className="active-session-banner-text"
        onClick={onOpen}
        aria-label={`Відкрити сесію: ${title}`}
      >
        <span className="active-session-banner-kicker">
          {isRunning ? 'Сесія читання' : 'Сесія на паузі'}
        </span>
        <span className="active-session-banner-title">
          {title} · {clock}
        </span>
      </button>
      <div className="active-session-banner-actions">
        <button type="button" className="dl-ghost" onClick={onDiscard}>
          Скинути
        </button>
        <button type="button" className="dl-ghost" onClick={onTogglePause}>
          {isRunning ? 'Пауза' : 'Відновити'}
        </button>
        <button type="button" className="dl-primary" onClick={onFinish}>
          Завершити
        </button>
      </div>
    </div>,
    document.body,
  );
}
