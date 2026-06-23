interface InfoTooltipProps {
  /** Short label for screen readers (e.g. «Як рахуються мови»). */
  label: string;
  text: string;
  /** Where the popover opens relative to the icon. */
  placement?: 'top' | 'bottom';
}

export function InfoTooltip({ label, text, placement = 'bottom' }: InfoTooltipProps) {
  return (
    <span className={`dl-info-tip${placement === 'top' ? ' is-tip-top' : ''}`}>
      <button type="button" className="dl-info-tip-btn" aria-label={label}>
        <svg className="dl-info-tip-icon" viewBox="0 0 16 16" aria-hidden="true">
          <circle cx="8" cy="8" r="6.25" fill="none" stroke="currentColor" strokeWidth="1.25" />
          <rect x="7.25" y="6.75" width="1.5" height="5" rx="0.75" fill="currentColor" />
          <rect x="7.25" y="4.25" width="1.5" height="1.5" rx="0.75" fill="currentColor" />
        </svg>
      </button>
      <span className="dl-info-tip-popover" role="tooltip">
        {text}
      </span>
    </span>
  );
}

interface PanelTitleProps {
  title: string;
  tipLabel: string;
  tip: string;
}

export function PanelTitle({ title, tipLabel, tip }: PanelTitleProps) {
  return (
    <div className="dl-panel-title-row is-with-tip">
      <h2 className="dl-panel-title">{title}</h2>
      <InfoTooltip label={tipLabel} text={tip} />
    </div>
  );
}
