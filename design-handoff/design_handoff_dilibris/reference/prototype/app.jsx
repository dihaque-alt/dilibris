/* DiLibris — app shell: header, fly-out hero, sheets, tweaks */

const ACCENT_PRESETS = {
  'Олива': { '--accent-lime': '#7E9F70', '--accent-lime-deep': '#5F7E54', '--accent-lime-light': '#F0F4EE' },
  'Шавлія': { '--accent-lime': '#6FA09A', '--accent-lime-deep': '#477E78', '--accent-lime-light': '#EAF3F1' },
  'Теракота': { '--accent-lime': '#C07B57', '--accent-lime-deep': '#9E5E3D', '--accent-lime-light': '#F8EDE5' },
};

function Header({ email, onAddShelf, active, onNav, onProfile, onLogout }) {
  const mobile = useIsMobile(820);
  const [menu, setMenu] = React.useState(false);
  const links = ['Бібліотека', 'Дашборд', 'Нотатки', 'Спільне читання'];
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 40, background: 'var(--header-bg)',
      backdropFilter: 'var(--header-blur)', WebkitBackdropFilter: 'var(--header-blur)',
      borderBottom: '1px solid var(--header-line)', transition: 'background var(--dur-base) ease',
    }}>
      <div style={{ maxWidth: 'var(--maxw)', margin: '0 auto', height: 'var(--header-h)', padding: '0 var(--sp-5)', display: 'flex', alignItems: 'center', gap: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <BrandMark />
          <span style={{ fontFamily: 'var(--font-brand)', fontWeight: 700, fontSize: '1.35rem', color: 'var(--ink-room)', letterSpacing: '0.3px' }}>DiLibris</span>
        </div>
        {!mobile && (
          <nav style={{ display: 'flex', gap: 4, marginLeft: 10 }}>
            {links.map((l) => (
              <button key={l} onClick={() => onNav(l)} style={{
                border: 'none', background: active === l ? 'var(--nav-active-bg)' : 'transparent', cursor: 'pointer',
                padding: '8px 14px', borderRadius: 'var(--r-pill)', fontFamily: 'var(--font-sans)', fontWeight: 600,
                fontSize: 'var(--fs-sm)', color: active === l ? 'var(--ink-room)' : 'var(--ink-room-soft)',
                boxShadow: active === l ? 'var(--nav-active-shadow)' : 'none', transition: 'color var(--dur-fast) ease',
              }}>{l}</button>
            ))}
          </nav>
        )}
        <span style={{ flex: 1 }} />
        <NotifBell onNav={onNav} />
        <button className="dl-primary" onClick={onAddShelf}>+ Полиця</button>
        {!mobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingLeft: 6, position: 'relative' }}>
            <button onClick={() => setMenu((m) => !m)} style={{
              display: 'flex', alignItems: 'center', gap: 9, border: 'none', cursor: 'pointer', background: 'transparent', padding: '4px 6px 4px 4px', borderRadius: 'var(--r-pill)',
            }}>
              <ProfileAvatar email={email} />
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-sm)', color: 'var(--ink-room-soft)' }}>{email}</span>
              <span style={{ color: 'var(--ink-room-soft)', fontSize: '0.7rem', transform: menu ? 'rotate(180deg)' : 'none', transition: 'transform var(--dur-fast) ease' }}>▾</span>
            </button>
            {menu && (
              <>
                <div onClick={() => setMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 30 }} />
                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 31, background: 'var(--bg-card)', border: '1px solid var(--line)', borderRadius: 'var(--r-md)', boxShadow: 'var(--shadow-card)', padding: 6, minWidth: 190, animation: 'dl-card-in var(--dur-fast) var(--ease-warm)' }}>
                  <MenuItem onClick={() => { setMenu(false); onProfile(); }}>Профіль і налаштування</MenuItem>
                  <MenuItem onClick={() => setMenu(false)}>Імпорт із Goodreads</MenuItem>
                  <div style={{ height: 1, background: 'var(--line)', margin: '6px 4px' }} />
                  <MenuItem onClick={() => { setMenu(false); onLogout(); }} danger>Вийти</MenuItem>
                </div>
              </>
            )}
          </div>
        )}
      </div>
      {mobile && (
        <div style={{ display: 'flex', gap: 4, padding: '0 var(--sp-4) 10px', overflowX: 'auto' }}>
          {links.map((l) => (
            <button key={l} onClick={() => onNav(l)} style={{
              border: 'none', background: active === l ? 'var(--nav-active-bg)' : 'transparent', cursor: 'pointer',
              padding: '7px 14px', borderRadius: 'var(--r-pill)', fontFamily: 'var(--font-sans)', fontWeight: 600,
              fontSize: 'var(--fs-sm)', color: active === l ? 'var(--ink-room)' : 'var(--ink-room-soft)', whiteSpace: 'nowrap',
              boxShadow: active === l ? 'var(--nav-active-shadow)' : 'none',
            }}>{l}</button>
          ))}
        </div>
      )}
    </header>
  );
}

function BrandMark() {
  return (
    <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
      <rect x="3" y="5" width="26" height="22" rx="5" fill="var(--accent-lime)" />
      <rect x="3" y="5" width="13" height="22" rx="5" fill="var(--accent-lime-deep)" />
      <rect x="14.5" y="7" width="3" height="18" rx="1.5" fill="var(--bg-room)" />
      <circle cx="9.5" cy="16" r="2" fill="var(--gold-highlight)" />
    </svg>
  );
}

function ProfileAvatar({ email, size = 30 }) {
  const letter = (email || '?')[0].toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flex: '0 0 auto',
      background: 'linear-gradient(150deg, var(--accent-lime), var(--accent-lime-deep))', color: '#fff',
      display: 'grid', placeItems: 'center', fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: size * 0.42,
      boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.22), 0 1px 2px rgba(0,0,0,0.3)',
    }}>{letter}</div>
  );
}

function MenuItem({ children, onClick, danger }) {
  return (
    <button onClick={onClick} style={{
      display: 'block', width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer', background: 'transparent',
      padding: '10px 12px', borderRadius: 'var(--r-sm)', fontFamily: 'var(--font-sans)', fontWeight: 600,
      fontSize: 'var(--fs-sm)', color: danger ? 'var(--status-dnf)' : 'var(--text-main)',
      transition: 'background var(--dur-fast) ease',
    }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card-soft)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >{children}</button>
  );
}

/* ---- Fly-out hero (FLIP from shelf rect → centered enlarged cover) ---- */
function FlyOut({ book, rect, real, onOpen, onClose }) {
  const ref = React.useRef(null);
  const [t, setT] = React.useState('init');
  React.useLayoutEffect(() => {
    const el = ref.current; if (!el) return;
    const target = el.getBoundingClientRect();
    const sx = rect.width / target.width;
    const dx = (rect.left + rect.width / 2) - (target.left + target.width / 2);
    const dy = (rect.top + rect.height / 2) - (target.top + target.height / 2);
    el.style.transform = `translate(${dx}px, ${dy}px) scale(${sx})`;
    el.style.opacity = '1';
    requestAnimationFrame(() => requestAnimationFrame(() => {
      el.style.transition = 'transform var(--dur-fly) var(--ease-back)';
      el.style.transform = 'translate(0,0) scale(1)';
      setT('open');
    }));
  }, []);
  const target = useIsMobile() ? 200 : 264;
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 50, background: 'var(--bg-overlay)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 22,
      backdropFilter: 'blur(3px)', animation: 'dl-fade var(--dur-base) ease', padding: 24,
    }}>
      <div ref={ref} onClick={(e) => { e.stopPropagation(); onOpen(book); }} style={{ transformOrigin: 'center', cursor: 'pointer', opacity: 0 }}>
        <BookCover book={book} width={target} real={real} hero />
      </div>
      <div style={{ textAlign: 'center', opacity: t === 'open' ? 1 : 0, transform: t === 'open' ? 'translateY(0)' : 'translateY(10px)', transition: 'all var(--dur-base) var(--ease-warm) 120ms', maxWidth: 420 }}>
        <h2 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 'var(--fs-h1)', color: 'var(--text-on-dark)' }}>{book.title}</h2>
        <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '1.15rem', color: 'rgba(251,247,240,0.78)', margin: '6px 0 14px' }}>{book.author}</div>
        <StatusPill status={book.status} />
        <div style={{ marginTop: 18, fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-sm)', color: 'rgba(251,247,240,0.62)' }}>Тицьни обкладинку, щоб відкрити книгу</div>
      </div>
    </div>
  );
}

/* ---- Add sheet (book / shelf) — fully working ----------------------- */
function TextField({ value, onChange, placeholder, icon, type, onEnter, autoFocus }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 14px', border: '1.5px solid var(--line-strong)', borderRadius: 'var(--r-md)', background: 'var(--bg-card)' }}>
      {icon && <span style={{ color: 'var(--text-faint)', fontSize: '1.1rem', flex: '0 0 auto' }}>{icon}</span>}
      <input
        autoFocus={autoFocus} type={type || 'text'} value={value} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && onEnter) onEnter(); }}
        style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-body)', color: 'var(--text-main)' }}
      />
    </div>
  );
}

function AddSheet({ kind, shelf, onClose }) {
  const dl = useDL();
  const mobile = useIsMobile();
  const [tab, setTab] = React.useState('Пошук');
  const [q, setQ] = React.useState('');
  const [form, setForm] = React.useState({ title: '', author: '', pages: '', format: 'Паперова' });
  const [shelfForm, setShelfForm] = React.useState({ label: '', statusLabel: '' });

  const statusList = Object.values(window.DILIBRIS.STATUS);
  const results = React.useMemo(() => {
    const all = dl.books;
    const term = q.trim().toLowerCase();
    const pool = term ? all.filter((b) => (b.title + ' ' + b.author).toLowerCase().includes(term)) : all.slice(9, 12);
    return pool.slice(0, 4);
  }, [q, dl.books]);

  const quickAdd = (b) => { dl.addBook({ title: b.title, author: b.author, pages: b.pages, format: b.format, cover: b.cover, art: b.art, placeholder: b.placeholder }, shelf && shelf.id); onClose(); };
  const submitBook = () => {
    if (!form.title.trim()) return;
    dl.addBook({ title: form.title.trim(), author: form.author.trim() || 'Невідомий автор', pages: parseInt(form.pages, 10) || 320, format: form.format }, shelf && shelf.id);
    onClose();
  };
  const submitShelf = () => {
    const st = statusList.find((s) => s.label === shelfForm.statusLabel);
    dl.addShelf({ label: shelfForm.label.trim() || 'Нова полиця', status: st ? st.key : null });
    onClose();
  };

  const shell = mobile
    ? { position: 'fixed', left: 0, right: 0, bottom: 0, borderRadius: 'var(--r-xl) var(--r-xl) 0 0', maxHeight: '88vh', animation: 'dl-sheet-up var(--dur-base) var(--ease-warm)' }
    : { width: 'min(520px, 94vw)', borderRadius: 'var(--r-xl)', animation: 'dl-card-in var(--dur-base) var(--ease-warm)' };
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'radial-gradient(56% 46% at 50% 42%, rgba(255,180,92,0.16), rgba(255,176,86,0) 62%), var(--bg-overlay)', display: 'flex', alignItems: mobile ? 'flex-end' : 'center', justifyContent: 'center', backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)', animation: 'dl-fade var(--dur-base) ease' }}>
      <div onClick={(e) => e.stopPropagation()} className="dl-detailcard" style={{ background: 'radial-gradient(130% 55% at 50% 0%, rgba(255,238,202,0.55), rgba(255,238,202,0) 58%), linear-gradient(180deg, #FBF5E9 0%, #F5EDDB 100%)', boxShadow: mobile ? '0 -16px 50px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.7)' : '0 34px 80px rgba(0,0,0,0.52), 0 10px 28px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.85), inset 0 0 0 1px rgba(120,90,50,0.1)', padding: mobile ? '14px 18px calc(20px + env(safe-area-inset-bottom))' : 24, position: 'relative', overflow: 'hidden', ...shell }}>
        {mobile && <div style={{ width: 40, height: 4, borderRadius: 999, background: 'var(--line-strong)', margin: '0 auto 14px' }} />}
        <h2 style={{ margin: '0 0 4px', fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 'var(--fs-h2)', color: 'var(--text-main)' }}>{kind === 'book' ? 'Додати книгу' : 'Додати полицю'}</h2>
        {kind === 'book' && shelf && <div style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', marginBottom: 14 }}>на полицю «{shelf.label}»</div>}
        {(kind !== 'book' || !shelf) && <div style={{ height: 12 }} />}
        {kind === 'book' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Segmented tabs={['Пошук', 'Вручну']} active={tab} onChange={setTab} />
            {tab === 'Пошук' ? (
              <>
                <TextField value={q} onChange={setQ} placeholder="Назва, автор або ISBN…" icon="⌕" autoFocus />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {results.length === 0 ? (
                    <div style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-sm)', color: 'var(--text-muted)', textAlign: 'center', padding: '14px 0' }}>Нічого не знайдено — спробуй додати вручну</div>
                  ) : results.map((b) => (
                    <div key={b.id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 10, border: '1px solid var(--line)', borderRadius: 'var(--r-md)' }}>
                      <BookCover book={b} width={40} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 'var(--fs-body)', color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.title}</div>
                        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>{b.author}</div>
                      </div>
                      <button className="dl-ghost" onClick={() => quickAdd(b)}>Додати</button>
                    </div>
                  ))}
                </div>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-xs)', color: 'var(--text-faint)', textAlign: 'center' }}>Результати з Open Library</div>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <Field label="Назва"><TextField value={form.title} onChange={(v) => setForm((f) => ({ ...f, title: v }))} placeholder="Назва книги" onEnter={submitBook} autoFocus /></Field>
                <Field label="Автор"><TextField value={form.author} onChange={(v) => setForm((f) => ({ ...f, author: v }))} placeholder="Ім’я автора" onEnter={submitBook} /></Field>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ flex: 1 }}><Field label="Сторінок"><TextField value={form.pages} onChange={(v) => setForm((f) => ({ ...f, pages: v.replace(/[^0-9]/g, '') }))} placeholder="320" type="text" /></Field></div>
                  <div style={{ flex: 1 }}><Field label="Формат"><Choice options={['Паперова', 'Електронна']} value={form.format} onChange={(v) => setForm((f) => ({ ...f, format: v }))} /></Field></div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Field label="Назва полиці"><TextField value={shelfForm.label} onChange={(v) => setShelfForm((f) => ({ ...f, label: v }))} placeholder="напр. Літо 2026" onEnter={submitShelf} autoFocus /></Field>
            <Field label="Статус (необов’язково)">
              <Choice options={statusList.map((s) => s.label)} value={shelfForm.statusLabel} onChange={(v) => setShelfForm((f) => ({ ...f, statusLabel: f.statusLabel === v ? '' : v }))} />
            </Field>
          </div>
        )}
        <div style={{ display: 'flex', gap: 12, marginTop: 22 }}>
          <button className="dl-ghost" onClick={onClose}>Скасувати</button>
          {kind === 'book' && tab === 'Пошук'
            ? <button className="dl-primary" style={{ flex: 1 }} onClick={onClose}>Готово</button>
            : <button className="dl-primary" style={{ flex: 1 }} onClick={kind === 'book' ? submitBook : submitShelf}>{kind === 'book' ? 'Додати' : 'Створити полицю'}</button>}
        </div>
      </div>
    </div>
  );
}

function OfflineBanner() {
  return (
    <div style={{ maxWidth: 'var(--maxw)', margin: '0 auto', padding: '0 var(--sp-5)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--gold-light)', border: '1px solid #F0E4BE', borderRadius: 'var(--r-md)', padding: '10px 14px', margin: '14px 0 0', fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-sm)', color: '#8A6D14' }}>
        <span style={{ fontSize: '1.05rem' }}>⌂</span>
        Показано збережену копію — сервер тимчасово недоступний
      </div>
    </div>
  );
}

/* ---- Profile & settings sheet --------------------------------------- */
function SettingsSheet({ onClose }) {
  const dl = useDL();
  const mobile = useIsMobile();
  const s = dl.settings;
  const [form, setForm] = React.useState(s);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const save = () => { dl.setSettings(form); dl.flash('Налаштування збережено'); onClose(); };

  const shell = mobile
    ? { position: 'fixed', left: 0, right: 0, bottom: 0, borderRadius: 'var(--r-xl) var(--r-xl) 0 0', maxHeight: '92vh', animation: 'dl-sheet-up var(--dur-base) var(--ease-warm)' }
    : { width: 'min(560px, 94vw)', maxHeight: '90vh', borderRadius: 'var(--r-xl)', animation: 'dl-card-in var(--dur-base) var(--ease-warm)' };
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'radial-gradient(56% 46% at 50% 42%, rgba(255,180,92,0.16), rgba(255,176,86,0) 62%), var(--bg-overlay)', display: 'flex', alignItems: mobile ? 'flex-end' : 'center', justifyContent: 'center', backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)', animation: 'dl-fade var(--dur-base) ease' }}>
      <div onClick={(e) => e.stopPropagation()} className="dl-detailcard" style={{ background: 'radial-gradient(130% 55% at 50% 0%, rgba(255,238,202,0.55), rgba(255,238,202,0) 58%), linear-gradient(180deg, #FBF5E9 0%, #F5EDDB 100%)', boxShadow: mobile ? '0 -16px 50px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.7)' : '0 34px 80px rgba(0,0,0,0.52), 0 10px 28px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.85), inset 0 0 0 1px rgba(120,90,50,0.1)', display: 'flex', flexDirection: 'column', overflow: 'hidden', ...shell }}>
        {mobile && <div style={{ width: 40, height: 4, borderRadius: 999, background: 'var(--line-strong)', margin: '10px auto 0' }} />}
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', padding: mobile ? '16px 18px 14px' : '24px 28px 16px' }}>
          <ProfileAvatar email={form.email} size={52} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 'var(--fs-h2)', color: 'var(--text-main)' }}>Профіль</h2>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>{form.email}</div>
          </div>
          <button onClick={onClose} aria-label="Закрити" className="dl-close">✕</button>
        </div>
        <div style={{ overflowY: 'auto', padding: mobile ? '0 18px 8px' : '0 28px 8px', display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
          <Field label="Ім’я"><TextField value={form.name} onChange={(v) => set('name', v)} placeholder="Твоє ім’я" /></Field>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}><Field label="Пошта"><TextField value={form.email} onChange={(v) => set('email', v)} /></Field></div>
            <div style={{ flex: 1 }}><Field label="Місто"><TextField value={form.city} onChange={(v) => set('city', v)} /></Field></div>
          </div>
          <Field label={`Ціль на рік · ${form.yearTarget} книг`}>
            <input type="range" min="6" max="60" step="1" value={form.yearTarget} onChange={(e) => set('yearTarget', +e.target.value)} style={{ width: '100%', accentColor: 'var(--accent-lime)' }} />
          </Field>
          <div style={{ height: 1, background: 'var(--line)' }} />
          <Toggle checked={form.defaultPrivate} onChange={(v) => set('defaultPrivate', v)} label="Нові нотатки — особисті" hint="За замовчуванням ховати нотатки від інших" />
          <Toggle checked={form.weeklyDigest} onChange={(v) => set('weeklyDigest', v)} label="Тижневий дайджест" hint="Лист щонеділі з підсумком читання" />
          <Toggle checked={form.reminders} onChange={(v) => set('reminders', v)} label="Нагадування читати" hint="Делікатний поштовх у тихий вечір" />
        </div>
        <div style={{ padding: mobile ? '12px 18px calc(16px + env(safe-area-inset-bottom))' : '16px 28px 22px', borderTop: '1px solid var(--line)', display: 'flex', gap: 12 }}>
          <button className="dl-ghost" onClick={onClose} style={{ flex: '0 0 auto' }}>Скасувати</button>
          <button className="dl-primary" style={{ flex: 1 }} onClick={save}>Зберегти</button>
        </div>
      </div>
    </div>
  );
}

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "bookView": "Корінці",
  "covers": "Справжні",
  "dim": 0.4,
  "bookSize": "Затишно",
  "hoverTitles": true,
  "accent": "Олива",
  "offline": false
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const dl = useDL();
  const { books, shelves, settings } = dl;
  const [page, setPage] = React.useState('Бібліотека');
  const [fly, setFly] = React.useState(null);     // {book, rect}
  const [detail, setDetail] = React.useState(null); // book id
  const [sheet, setSheet] = React.useState(null);   // { kind, shelf }
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [reader, setReader] = React.useState(null);  // book id
  const [session, setSession] = React.useState(null); // book id

  // live book object for the open detail card (so edits reflect immediately)
  const detailBook = detail ? books.find((b) => b.id === detail) || null : null;
  const readerBook = reader ? books.find((b) => b.id === reader) || null : null;
  const sessionBook = session ? books.find((b) => b.id === session) || null : null;

  // apply token tweaks to :root
  React.useEffect(() => {
    const r = document.documentElement;
    r.setAttribute('data-mood', 'evening');   // the room photo is an evening scene
    Object.entries(ACCENT_PRESETS[t.accent] || {}).forEach(([k, v]) => r.style.setProperty(k, v));
    r.style.setProperty('--dl-dim', String(t.dim));
    window.DILIBRIS_REAL_COVERS = t.covers !== 'Типографічні';
  }, [t.accent, t.dim, t.covers]);

  const realCovers = t.covers !== 'Типографічні';
  const view = t.bookView === 'Обкладинки' ? 'cover' : 'spine';
  const bookWidth = { 'Компактно': 96, 'Затишно': 124, 'Велично': 156 }[t.bookSize] || 124;
  const totalBooks = books.length;

  if (!dl.onboarded) return <Onboarding />;

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      <Room />
      <div className="dl-grade" aria-hidden="true"></div>
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Header email={settings.email} active={page} onNav={setPage} onAddShelf={() => setSheet({ kind: 'shelf' })} onProfile={() => setSettingsOpen(true)} onLogout={() => dl.logout()} />
        {t.offline && <OfflineBanner />}
        <main>
          {page === 'Бібліотека' && (
            <React.Fragment>
              <div className="dl-hero">
                <div className="dl-hero-inner">
                  <div className="eyebrow">Твоя бібліотека · {totalBooks} книг</div>
                  <h1>Вечір удома з книгами</h1>
                </div>
              </div>
              <Library shelves={shelves} books={books} bookWidth={bookWidth} showTitles={t.hoverTitles}
                real={realCovers} view={view}
                onPick={(book, rect) => setFly({ book, rect })}
                onAddBook={(shelf) => setSheet({ kind: 'book', shelf })} />
            </React.Fragment>
          )}
          {page === 'Дашборд' && <DashboardView />}
          {page === 'Нотатки' && <NotesFeed onOpenBook={(b) => setDetail(b.id)} />}
          {page === 'Спільне читання' && <BuddyView />}
        </main>
      </div>

      {fly && <FlyOut book={fly.book} rect={fly.rect} real={realCovers} onClose={() => setFly(null)} onOpen={(b) => { setDetail(b.id); setFly(null); }} />}
      {detailBook && <BookDetailCard book={detailBook} onClose={() => setDetail(null)}
        onRead={(b) => { setDetail(null); setReader(b.id); }}
        onSession={(b) => { setDetail(null); setSession(b.id); }} />}
      {sheet && <AddSheet kind={sheet.kind} shelf={sheet.shelf} onClose={() => setSheet(null)} />}
      {settingsOpen && <SettingsSheet onClose={() => setSettingsOpen(false)} />}
      {readerBook && <ReaderView book={readerBook} onClose={() => setReader(null)} />}
      {sessionBook && <SessionTimer book={sessionBook} onClose={() => setSession(null)} />}
      <DLToast />

      <TweaksPanel>
        <TweakSection label="Книги" />
        <TweakRadio label="На полиці" value={t.bookView} options={['Корінці', 'Обкладинки']} onChange={(v) => setTweak('bookView', v)} />
        <TweakRadio label="Джерело обкладинок" value={t.covers} options={['Справжні', 'Типографічні']} onChange={(v) => setTweak('covers', v)} />
        <TweakRadio label="Розмір" value={t.bookSize} options={['Компактно', 'Затишно', 'Велично']} onChange={(v) => setTweak('bookSize', v)} />
        <TweakToggle label="Підпис при наведенні" value={t.hoverTitles} onChange={(v) => setTweak('hoverTitles', v)} />
        <TweakSection label="Атмосфера" />
        <TweakSlider label="Затемнення фону" value={t.dim} min={0} max={0.85} step={0.05} onChange={(v) => setTweak('dim', v)} />
        <TweakRadio label="Колір акценту" value={t.accent} options={Object.keys(ACCENT_PRESETS)} onChange={(v) => setTweak('accent', v)} />
        <TweakSection label="Стан" />
        <TweakToggle label="Офлайн-банер" value={t.offline} onChange={(v) => setTweak('offline', v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <DLProvider><App /></DLProvider>
);
