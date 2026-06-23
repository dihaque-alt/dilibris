import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useAppOverlays } from './AppOverlays';
import { NotifBell } from './NotifBell';
import { supabase } from '../lib/supabase';

interface AppNavProps {
  userEmail: string;
  userId: string;
  active: 'library' | 'dashboard' | 'notes' | 'buddy-reads';
  onAddShelf?: () => void;
}

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

export function AppNav({ userEmail, userId, active, onAddShelf }: AppNavProps) {
  const overlays = useAppOverlays();
  const profileRef = useRef<HTMLButtonElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);
  const letter = (userEmail || '?')[0]?.toUpperCase() ?? '?';

  useEffect(() => {
    if (!menuOpen) return;

    function placeMenu() {
      const btn = profileRef.current;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      setMenuPos({
        top: rect.bottom + 8,
        right: Math.max(8, window.innerWidth - rect.right),
      });
    }

    placeMenu();
    window.addEventListener('resize', placeMenu);
    window.addEventListener('scroll', placeMenu, true);
    return () => {
      window.removeEventListener('resize', placeMenu);
      window.removeEventListener('scroll', placeMenu, true);
    };
  }, [menuOpen]);

  function closeMenu() {
    setMenuOpen(false);
    setMenuPos(null);
  }

  const profileMenu =
    menuOpen && menuPos
      ? createPortal(
          <>
            <div
              className="menu-backdrop menu-backdrop--header"
              role="presentation"
              onClick={closeMenu}
            />
            <div
              className="header-menu header-menu--portal"
              style={{ top: menuPos.top, right: menuPos.right }}
            >
              <button
                type="button"
                className="header-menu-item"
                onClick={() => {
                  closeMenu();
                  overlays.openSettings();
                }}
              >
                Профіль і налаштування
              </button>
              <button
                type="button"
                className="header-menu-item"
                onClick={() => {
                  closeMenu();
                  overlays.openGoodreadsImport();
                }}
              >
                Імпорт із Goodreads
              </button>
              <div className="header-menu-divider" />
              <button
                type="button"
                className="header-menu-item header-menu-item--danger"
                onClick={() => {
                  closeMenu();
                  void supabase.auth.signOut();
                }}
              >
                Вийти
              </button>
            </div>
          </>,
          document.body,
        )
      : null;

  const links = [
    { key: 'library' as const, label: 'Бібліотека', to: '/' },
    { key: 'dashboard' as const, label: 'Дашборд', to: '/dashboard' },
    { key: 'notes' as const, label: 'Нотатки', to: '/notes' },
    { key: 'buddy-reads' as const, label: 'Спільночит', to: '/buddy-reads' },
  ];

  return (
    <header className={`app-header${menuOpen ? ' is-menu-open' : ''}`}>
      <div className="app-header-inner">
        <Link to="/" className="app-header-brand">
          <BrandMark />
          <h1>DiLibris</h1>
        </Link>

        <nav className="app-nav" aria-label="Головна навігація">
          {links.map(({ key, label, to }) => (
            <Link
              key={key}
              to={to}
              className={active === key ? 'nav-link active' : 'nav-link'}
            >
              {label}
            </Link>
          ))}
        </nav>

        <span className="app-header-spacer" />

        <NotifBell userId={userId} />

        {onAddShelf && (
          <button type="button" className="dl-primary" onClick={onAddShelf}>
            + Полиця
          </button>
        )}

        <div className="app-header-actions">
          <button
            ref={profileRef}
            type="button"
            className="header-profile"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
          >
            <span className="profile-avatar" aria-hidden="true">
              {letter}
            </span>
            <span className="header-email">{userEmail}</span>
            <span aria-hidden="true">{menuOpen ? '▴' : '▾'}</span>
          </button>
        </div>
      </div>

      {profileMenu}

      <nav className="app-nav-mobile" aria-label="Мобільна навігація">
        {links.map(({ key, label, to }) => (
          <Link
            key={key}
            to={to}
            className={active === key ? 'nav-link active' : 'nav-link'}
          >
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
