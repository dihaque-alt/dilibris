import { Link } from 'react-router-dom';

interface ProfileLinkProps {
  userId: string;
  viewerId: string;
  name: string;
  className?: string;
}

export function ProfileLink({ userId, viewerId, name, className }: ProfileLinkProps) {
  if (userId === viewerId) {
    return <strong className={className}>{name}</strong>;
  }

  return (
    <Link to={`/u/${userId}`} className={className ?? 'profile-link'}>
      {name}
    </Link>
  );
}
