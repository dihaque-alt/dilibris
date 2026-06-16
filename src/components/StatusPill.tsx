import { STATUS_CSS_VAR, STATUS_LABELS } from '../lib/labels';
import type { BookEntryStatus } from '../types/database';

interface StatusPillProps {
  status: BookEntryStatus;
  size?: 'sm' | 'md';
}

export function StatusPill({ status, size = 'md' }: StatusPillProps) {
  const cssVar = STATUS_CSS_VAR[status];
  return (
    <span
      className={`status-pill status-pill--${size}`}
      style={{
        color: `var(--status-${cssVar})`,
        background: `var(--status-${cssVar}-bg)`,
      }}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
