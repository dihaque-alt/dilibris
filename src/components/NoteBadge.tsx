interface NoteBadgeProps {
  children: string;
  tone: 'quote' | 'thought' | 'general' | 'pub' | 'priv';
}

const STYLES: Record<NoteBadgeProps['tone'], { color: string; bg: string }> = {
  quote: { color: 'var(--status-want)', bg: 'var(--status-want-bg)' },
  thought: { color: 'var(--accent-lime-deep)', bg: 'var(--accent-lime-light)' },
  general: { color: 'var(--status-done)', bg: 'var(--status-done-bg)' },
  pub: { color: 'var(--status-done)', bg: 'var(--status-done-bg)' },
  priv: { color: 'var(--text-muted)', bg: 'var(--bg-card-soft)' },
};

export function NoteBadge({ children, tone }: NoteBadgeProps) {
  const s = STYLES[tone];
  return (
    <span
      className="dl-note-badge"
      style={{ color: s.color, background: s.bg, borderColor: `${s.color}22` }}
    >
      {children}
    </span>
  );
}
