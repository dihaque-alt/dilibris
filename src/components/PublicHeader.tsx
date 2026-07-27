import { Link } from 'react-router-dom';

function BrandMark() {
  return (
    <svg className="brand-mark" width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
      <rect x="3" y="5" width="26" height="22" rx="5" fill="var(--accent-lime)" />
      <rect x="3" y="5" width="13" height="22" rx="5" fill="var(--accent-lime-deep)" />
      <rect x="14.5" y="7" width="3" height="18" rx="1.5" fill="var(--bg-room)" />
      <circle cx="9.5" cy="16" r="2" fill="var(--gold-highlight)" />
    </svg>
  );
}

export function PublicHeader() {
  return (
    <header className="app-header public-header">
      <div className="app-header-inner public-header-inner">
        <Link to="/" className="app-header-brand">
          <BrandMark />
          <span className="brand-word">DiLibris</span>
        </Link>
        <Link to="/" className="dl-primary public-header-login">
          Увійти
        </Link>
      </div>
    </header>
  );
}
