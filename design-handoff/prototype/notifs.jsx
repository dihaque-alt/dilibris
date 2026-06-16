/* DiLibris — notifications bell + dropdown panel. Reads store notifications,
   shows an unread dot, marks read on open/click, and can jump to a page. */

function notifGlyph(kind) {
  return { buddy: '💬', challenge: '✦', deadline: '⏳', reminder: '☾' }[kind] || '•';
}

function NotifBell({ onNav }) {
  const dl = useDL();
  const [open, setOpen] = React.useState(false);
  const mobile = useIsMobile(820);
  const unread = dl.notifications.filter((n) => !n.read).length;

  const panel = (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--line)', borderRadius: 'var(--r-lg)',
      boxShadow: 'var(--shadow-card)', overflow: 'hidden', width: mobile ? 'min(360px, 92vw)' : 340,
      animation: 'dl-card-in var(--dur-fast) var(--ease-warm)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--line)' }}>
        <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 'var(--fs-title)', color: 'var(--text-main)' }}>Сповіщення</span>
        {unread > 0 && <button onClick={() => dl.markAllNotifsRead()} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-xs)', fontWeight: 600, color: 'var(--accent-lime-deep)' }}>Прочитати всі</button>}
      </div>
      <div style={{ maxHeight: 380, overflowY: 'auto' }}>
        {dl.notifications.length === 0 ? (
          <div style={{ padding: '28px 16px', textAlign: 'center', fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>Поки тихо 🌙</div>
        ) : dl.notifications.map((n) => (
          <button key={n.id} onClick={() => { dl.markNotifRead(n.id); setOpen(false); if (n.go && n.go.page) onNav(n.go.page); }}
            style={{ display: 'flex', gap: 12, width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer', padding: '13px 16px', background: n.read ? 'transparent' : 'var(--accent-lime-light)', borderBottom: '1px solid var(--line)' }}>
            <span style={{ fontSize: '1.1rem', flex: '0 0 auto', lineHeight: 1.3 }}>{notifGlyph(n.kind)}</span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'block', fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-sm)', color: 'var(--text-main)', lineHeight: 1.4 }}>{n.text}</span>
              <span style={{ display: 'block', fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-xs)', color: 'var(--text-faint)', marginTop: 3 }}>{n.time}</span>
            </span>
            {!n.read && <span style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--accent-lime)', flex: '0 0 auto', marginTop: 5 }} />}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ position: 'relative', flex: '0 0 auto' }}>
      <button onClick={() => setOpen((o) => !o)} aria-label="Сповіщення" style={{
        position: 'relative', border: 'none', background: open ? 'var(--nav-active-bg)' : 'transparent', cursor: 'pointer',
        width: 38, height: 38, borderRadius: 999, display: 'grid', placeItems: 'center', color: 'var(--ink-room)', fontSize: '1.15rem',
        transition: 'background var(--dur-fast) ease',
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M6 9a6 6 0 1 1 12 0c0 4 1.2 5.2 2 6H4c.8-.8 2-2 2-6Z" stroke="var(--ink-room)" strokeWidth="1.7" strokeLinejoin="round" fill="none" />
          <path d="M10 19a2 2 0 0 0 4 0" stroke="var(--ink-room)" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
        {unread > 0 && <span style={{ position: 'absolute', top: 6, right: 6, minWidth: 16, height: 16, padding: '0 4px', borderRadius: 999, background: 'var(--status-dnf)', color: '#fff', fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 10, display: 'grid', placeItems: 'center', boxShadow: '0 0 0 2px var(--header-bg)' }}>{unread}</span>}
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 44 }} />
          <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 45 }}>{panel}</div>
        </>
      )}
    </div>
  );
}

Object.assign(window, { NotifBell });
