import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDialogA11y } from '../hooks/useDialogA11y';
import { notificationRoute } from '../lib/notificationRoutes';
import { syncActivityNotifications } from '../lib/syncActivityNotifications';
import {
  dismissAllNotifications,
  dismissNotification,
  hydrateNotificationTimes,
  loadNotifications,
  markAllNotifsRead,
  markNotifRead,
  notifGlyph,
  syncNotifications,
  type AppNotification,
} from '../lib/notificationsStore';

interface NotifBellProps {
  userId: string;
}

export function NotifBell({ userId }: NotifBellProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [items, setItems] = useState<AppNotification[]>(() =>
    hydrateNotificationTimes(loadNotifications(userId)),
  );
  const ref = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  useDialogA11y(panelRef, () => setOpen(false), open);

  function refresh() {
    setItems(hydrateNotificationTimes(loadNotifications(userId)));
  }

  useEffect(() => {
    refresh();
    const onChange = () => refresh();
    window.addEventListener('dilibris:notifications', onChange);
    return () => window.removeEventListener('dilibris:notifications', onChange);
  }, [userId]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setSyncing(true);

    void (async () => {
      try {
        await syncNotifications(userId);
        if (cancelled) return;
        await syncActivityNotifications(userId);
        if (cancelled) return;
        await syncNotifications(userId);
        if (cancelled) return;
        refresh();
      } finally {
        if (!cancelled) setSyncing(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, userId]);

  const unread = items.filter((n) => !n.read).length;

  function handleOpen(id: string, n: AppNotification) {
    setItems(markNotifRead(userId, id));
    setOpen(false);
    const path = notificationRoute(n);
    if (path) navigate(path);
  }

  function handleDismiss(id: string, e: MouseEvent) {
    e.stopPropagation();
    void dismissNotification(userId, id).then(setItems);
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
          <div
            ref={panelRef}
            className="notif-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Сповіщення"
          >
            <div className="notif-panel-head">
              <span className="notif-panel-title">Сповіщення</span>
              <div className="notif-panel-actions">
                {items.length > 0 && (
                  <button
                    type="button"
                    className="notif-mark-all"
                    onClick={() => void dismissAllNotifications(userId).then(setItems)}
                  >
                    Прибрати всі
                  </button>
                )}
                {unread > 0 && (
                  <button
                    type="button"
                    className="notif-mark-all"
                    onClick={() => setItems(markAllNotifsRead(userId))}
                  >
                    Прочитати всі
                  </button>
                )}
                <button
                  type="button"
                  className="notif-panel-close"
                  onClick={() => setOpen(false)}
                  aria-label="Закрити"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="notif-list">
              {syncing && items.length === 0 ? (
                <div className="notif-empty">Оновлюємо…</div>
              ) : items.length === 0 ? (
                <div className="notif-empty">Поки тихо 🌙</div>
              ) : (
                items.map((n) => (
                  <div key={n.id} className={`notif-item-wrap${n.read ? '' : ' is-unread'}`}>
                    <button
                      type="button"
                      className="notif-item"
                      onClick={() => handleOpen(n.id, n)}
                    >
                      <span className="notif-glyph">{notifGlyph(n.kind)}</span>
                      <span className="notif-body">
                        <span className="notif-text">{n.text}</span>
                        <span className="notif-time">{n.time}</span>
                      </span>
                      {!n.read && <span className="notif-dot" aria-hidden="true" />}
                    </button>
                    <button
                      type="button"
                      className="notif-dismiss"
                      aria-label="Прибрати сповіщення"
                      onClick={(e) => handleDismiss(n.id, e)}
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
