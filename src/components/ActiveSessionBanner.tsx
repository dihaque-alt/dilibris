interface ActiveSessionBannerProps {
  title: string;
  clock: string;
  onContinue: () => void;
  onDiscard: () => void;
}

export function ActiveSessionBanner({
  title,
  clock,
  onContinue,
  onDiscard,
}: ActiveSessionBannerProps) {
  return (
    <div className="active-session-banner" role="status">
      <div className="active-session-banner-text">
        <span className="active-session-banner-kicker">Сесія читання</span>
        <span className="active-session-banner-title">
          {title} · {clock}
        </span>
      </div>
      <div className="active-session-banner-actions">
        <button type="button" className="dl-ghost" onClick={onDiscard}>
          Скасувати
        </button>
        <button type="button" className="dl-primary" onClick={onContinue}>
          Продовжити
        </button>
      </div>
    </div>
  );
}
