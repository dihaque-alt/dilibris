import { useEffect, useState } from 'react';
import { displayAvatarUrl } from '../lib/profileHeader';

interface ProfileAvatarProps {
  name?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  size?: 'sm' | 'lg';
  className?: string;
  cacheBust?: number;
}

export function ProfileAvatar({
  name,
  email,
  avatarUrl,
  size,
  className = '',
  cacheBust,
}: ProfileAvatarProps) {
  const [broken, setBroken] = useState(false);
  const letter = (name?.trim() || email || '?')[0]?.toUpperCase() ?? '?';
  const sizeClass = size === 'lg' ? ' profile-avatar--lg' : '';
  const src = !broken ? displayAvatarUrl(avatarUrl ?? null, cacheBust) : null;

  useEffect(() => {
    setBroken(false);
  }, [avatarUrl, cacheBust]);

  if (src) {
    return (
      <img
        src={src}
        alt=""
        className={`profile-avatar profile-avatar--img${sizeClass} ${className}`.trim()}
        onError={() => setBroken(true)}
      />
    );
  }

  return (
    <span className={`profile-avatar${sizeClass} ${className}`.trim()} aria-hidden="true">
      {letter}
    </span>
  );
}
