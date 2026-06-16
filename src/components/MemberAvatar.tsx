const AVATAR_COLORS = [
  'var(--status-reading)',
  'var(--status-dnf)',
  'var(--status-done)',
  'var(--accent-lime)',
  'var(--status-reread)',
  'var(--gold-deep)',
];

function colorForSeed(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

interface MemberAvatarProps {
  name: string;
  size?: number;
}

export function MemberAvatar({ name, size = 34 }: MemberAvatarProps) {
  const initial = (name.trim()[0] || '?').toUpperCase();

  return (
    <div
      className="dl-member-avatar"
      style={{ width: size, height: size, background: colorForSeed(name) }}
      aria-hidden="true"
    >
      {initial}
    </div>
  );
}
