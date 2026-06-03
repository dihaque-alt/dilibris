import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface AppNavProps {
  userEmail: string;
  active: 'library' | 'dashboard' | 'buddy-reads';
}

export function AppNav({ userEmail, active }: AppNavProps) {
  return (
    <header className="app-header">
      <div className="app-header-start">
        <h1>DiLibris</h1>
        <nav className="app-nav" aria-label="Головна навігація">
          <Link to="/" className={active === 'library' ? 'nav-link active' : 'nav-link'}>
            Бібліотека
          </Link>
          <Link to="/dashboard" className={active === 'dashboard' ? 'nav-link active' : 'nav-link'}>
            Дашборд
          </Link>
          <Link to="/buddy-reads" className={active === 'buddy-reads' ? 'nav-link active' : 'nav-link'}>
            Спільне читання
          </Link>
        </nav>
      </div>
      <div className="app-header-end">
        <p className="header-sub">{userEmail}</p>
        <button type="button" className="btn-secondary" onClick={() => supabase.auth.signOut()}>
          Вийти
        </button>
      </div>
    </header>
  );
}
