interface ProfileAvatarProps {
  name?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  size?: 'sm' | 'lg';
  className?: string;
}

export function ProfileAvatar({
  name,
  email,
  avatarUrl,
  size,
  className = '',
}: ProfileAvatarProps) {
  const letter = (name?.trim() || email || '?')[0]?.toUpperCase() ?? '?';
  const sizeClass = size === 'lg' ? ' profile-avatar--lg' : '';

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt=""
        className={`profile-avatar profile-avatar--img${sizeClass} ${className}`.trim()}
      />
    );
  }

  return (
    <span className={`profile-avatar${sizeClass} ${className}`.trim()} aria-hidden="true">
      {letter}
    </span>
  );
}
