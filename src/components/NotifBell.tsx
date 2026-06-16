import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  loadNotifications,
  markAllNotifsRead,
  markNotifRead,
  notifGlyph,
  type AppNotification,
} from '../lib/notificationsStore';

interface NotifBellProps {
  userId: string;
}

const PAGE_ROUTES: Record<string, string> = {
  library: '/',
  dashboard: '/dashboard',
  notes: '/notes',
  'buddy-reads': '/buddy-reads',
};

export function NotifBell({ userId }: NotifBellProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>(() => loadNotifications(userId));
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setItems(loadNotifications(userId));
  }, [userId]);

  const unread = items.filter((n) => !n.read).length;

  function handleOpen(id: string, n: AppNotification) {
    setItems(markNotifRead(userId, id));
    setOpen(false);
    if (n.go?.page && PAGE_ROUTES[n.go.page]) {
      navigate(PAGE_ROUTES[n.go.page]);
    }
  }

  return (
    <div className="notif-bell-wrap" ref={ref}>
      <button
        type="button"
        className={`notif-bell-btn${open ? ' is-open' : ''}`}
        aria-label="Сповіщення"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M6 9a6 6 0 1 1 12 0c0 4 1.2 5.2 2 6H4c.8-.8 2-2 2-6Z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <path d="M10 19a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
        {unread > 0 && <span className="notif-bell-badge">{unread}</span>}
      </button>

      {open && (
        <>
          <div className="menu-backdrop menu-backdrop--header" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="notif-panel" role="dialog" aria-label="Сповіщення">
            <div className="notif-panel-head">
              <span className="notif-panel-title">Сповіщення</span>
              {unread > 0 && (
                <button
                  type="button"
                  className="notif-mark-all"
                  onClick={() => setItems(markAllNotifsRead(userId))}
                >
                  Прочитати всі
                </button>
              )}
            </div>
            <div className="notif-list">
              {items.length === 0 ? (
                <p className="notif-empty">Поки тихо 🌙</p>
              ) : (
                items.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    className={`notif-item${n.read ? '' : ' is-unread'}`}
                    onClick={() => handleOpen(n.id, n)}
                  >
                    <span className="notif-glyph">{notifGlyph(n.kind)}</span>
                    <span className="notif-body">
                      <span className="notif-text">{n.text}</span>
                      <span className="notif-time">{n.time}</span>
                    </span>
                    {!n.read && <span className="notif-dot" aria-hidden="true" />}
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
