/* DiLibris — live prototype views beyond the Library:
   Дашборд (reading year) and Спільне читання (buddy reads).
   These render inside <main>, floating over the evening room photo, so the
   page heads use room-ink (light) type and the content sits on warm paper cards. */

/* ---- shared shell pieces -------------------------------------------- */
function PageHead({ eyebrow, title, sub, children }) {
  return (
    <div className="dl-pagehead">
      <div style={{ minWidth: 0 }}>
        {eyebrow && <div className="dl-pagehead-eyebrow">{eyebrow}</div>}
        <h1 className="dl-pagehead-title">{title}</h1>
        {sub && <div className="dl-pagehead-sub">{sub}</div>}
      </div>
      {children && <div style={{ flex: '0 0 auto', display: 'flex', gap: 10, alignItems: 'center' }}>{children}</div>}
    </div>
  );
}

function Panel({ children, style, soft, onClick, className }) {
  return (
    <div onClick={onClick} className={'dl-panel' + (soft ? ' is-soft' : '') + (onClick ? ' is-clickable' : '') + (className ? ' ' + className : '')} style={style}>
      {children}
    </div>
  );
}

function PanelTitle({ children, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, marginBottom: 16 }}>
      <h3 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 'var(--fs-h3)', color: 'var(--text-main)', letterSpacing: '0.2px' }}>{children}</h3>
      {right}
    </div>
  );
}

function Avatar({ name, color, size = 34 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: color, color: '#fff',
      display: 'grid', placeItems: 'center', fontFamily: 'var(--font-sans)', fontWeight: 700,
      fontSize: size * 0.4, flex: '0 0 auto', boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.22), 0 1px 2px rgba(0,0,0,0.25)',
      letterSpacing: '0.3px',
    }}>{(name[0] || '').toUpperCase()}</div>
  );
}

/* ====================================================================== */
/*  DASHBOARD                                                             */
/* ====================================================================== */
function YearPicker() {
  const [open, setOpen] = React.useState(false);
  const [year, setYear] = React.useState(2026);
  const years = [2026, 2025, 2024];
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen((o) => !o)} className="dl-ghost dl-ghost-room" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        Рік&nbsp;<b style={{ fontFamily: 'var(--font-serif)', fontSize: '1.05em' }}>{year}</b>
        <span style={{ opacity: 0.6, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform var(--dur-fast) ease' }}>▾</span>
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 20, background: 'var(--bg-card)', border: '1px solid var(--line)', borderRadius: 'var(--r-md)', boxShadow: 'var(--shadow-card)', padding: 6, minWidth: 120, animation: 'dl-card-in var(--dur-fast) var(--ease-warm)' }}>
          {years.map((y) => (
            <button key={y} onClick={() => { setYear(y); setOpen(false); }} style={{
              display: 'block', width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer',
              padding: '9px 12px', borderRadius: 'var(--r-sm)', fontFamily: 'var(--font-sans)', fontWeight: 600,
              fontSize: 'var(--fs-sm)', color: y === year ? 'var(--accent-lime-deep)' : 'var(--text-muted)',
              background: y === year ? 'var(--accent-lime-light)' : 'transparent',
            }}>{y}</button>
          ))}
        </div>
      )}
    </div>
  );
}

function DashboardView() {
  const wide = !useIsMobile(860);
  const dl = useDL();
  const { books } = dl;

  // live stats from the real library data
  const done = books.filter((b) => b.status === 'done');
  const target = dl.settings.yearTarget;
  const value = done.length;
  const pct = Math.round((value / target) * 100);
  const pagesRead = books.reduce((s, b) => s + (b.pagesRead || 0), 0);
  const minutes = books.reduce((s, b) => s + (b.minutes || 0), 0);
  const rated = books.filter((b) => b.rating > 0);
  const avg = (rated.reduce((s, b) => s + b.rating, 0) / rated.length).toFixed(1).replace('.0', '');
  const paper = done.filter((b) => b.format === 'Паперова').length;
  const ebook = done.length - paper;
  const paperPct = Math.round((paper / Math.max(1, done.length)) * 100);

  const fmt = (n) => n.toLocaleString('uk-UA').replace(/,/g, ' ');
  const stats = [
    [String(value), 'книг'],
    [fmt(pagesRead), 'сторінок'],
    [Math.round(minutes / 60) + ' год', 'часу читання'],
    [avg, 'сер. оцінка'],
    ['9 днів', 'найдовша пауза'],
  ];

  const months = ['Січ', 'Лют', 'Бер', 'Кві', 'Тра', 'Чер', 'Лип', 'Сер', 'Вер', 'Жов', 'Лис', 'Гру'];
  const monthData = [1, 0, 2, 1, 3, 2, 1, 0, 0, 0, 0, 0];
  const maxM = Math.max(...monthData);

  // top authors among finished + currently-reading + reread
  const counted = books.filter((b) => b.status !== 'want');
  const tally = {};
  counted.forEach((b) => { tally[b.author] = (tally[b.author] || 0) + 1; });
  const authors = Object.entries(tally).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const maxA = authors[0][1];

  const langs = [['Українська', 92], ['Англійська', 6], ['Польська', 2]];

  return (
    <div className="dl-page">
      <PageHead eyebrow="Твій читацький рік" title="Дашборд" sub="Теплі підсумки — без тиску, лише радість від прочитаного">
        <YearPicker />
      </PageHead>

      {/* challenge — the warm gold hero panel */}
      <Panel className="dl-challenge" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-sm)', color: '#8A6D14', fontWeight: 700, letterSpacing: '0.3px' }}>Челендж 2026</div>
            <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 'clamp(1.7rem, 3.4vw, 2.2rem)', color: 'var(--text-main)', marginTop: 4 }}>{value} з {target} книг</div>
          </div>
          <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 'clamp(2.2rem, 5vw, 3rem)', color: 'var(--gold-deep)', lineHeight: 1 }}>{pct}%</div>
        </div>
        <ChallengeBar value={value} target={target} height={16} />
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-sm)', color: '#8A6D14', marginTop: 10, display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ color: 'var(--gold-deep)' }}>✦</span> Ти на 1 книгу попереду графіка — так тримати
        </div>
      </Panel>

      {/* summary stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: wide ? 'repeat(5, 1fr)' : 'repeat(2, 1fr)', gap: 12, marginBottom: 16 }}>
        {stats.map(([v, l]) => (
          <Panel key={l} soft style={{ padding: '16px 18px' }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 'clamp(1.4rem, 2.4vw, 1.7rem)', color: 'var(--text-main)', lineHeight: 1 }}>{v}</div>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', marginTop: 7, letterSpacing: '0.2px' }}>{l}</div>
          </Panel>
        ))}
      </div>

      {/* bar chart + format donut */}
      <div style={{ display: 'grid', gridTemplateColumns: wide ? '1.6fr 1fr' : '1fr', gap: 16, marginBottom: 16 }}>
        <Panel>
          <PanelTitle>Книги за місяць</PanelTitle>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: wide ? 12 : 5, height: 158 }}>
            {monthData.map((d, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 9 }}>
                <div className="dl-bar" style={{ width: '100%', maxWidth: 34, height: Math.max(5, (d / maxM) * 122), background: d ? 'linear-gradient(180deg, var(--accent-lime), var(--accent-lime-deep))' : 'var(--line)' }} title={d + ' книг'} />
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: '10px', color: 'var(--text-faint)' }}>{months[i]}</span>
              </div>
            ))}
          </div>
        </Panel>
        <Panel>
          <PanelTitle>Формат</PanelTitle>
          <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
            <div style={{ width: 104, height: 104, borderRadius: '50%', background: `conic-gradient(var(--accent-lime) 0 ${paperPct}%, var(--status-done) ${paperPct}% 100%)`, display: 'grid', placeItems: 'center', flex: '0 0 auto', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.04)' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--bg-card)', display: 'grid', placeItems: 'center', fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: '1.3rem', color: 'var(--text-main)', boxShadow: 'var(--shadow-book)' }}>{done.length}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-sm)', color: 'var(--text-main)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 9 }}><i style={{ width: 11, height: 11, borderRadius: 3, background: 'var(--accent-lime)' }} />Паперова&nbsp;·&nbsp;<b>{paper}</b></span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 9 }}><i style={{ width: 11, height: 11, borderRadius: 3, background: 'var(--status-done)' }} />Електронна&nbsp;·&nbsp;<b>{ebook}</b></span>
            </div>
          </div>
        </Panel>
      </div>

      {/* top authors + languages */}
      <div style={{ display: 'grid', gridTemplateColumns: wide ? '1fr 1fr' : '1fr', gap: 16 }}>
        <Panel>
          <PanelTitle>Топ авторів</PanelTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            {authors.map(([a, n]) => (
              <BarRow key={a} label={a} note={n} frac={n / maxA} track="var(--accent-lime-light)" fill="var(--accent-lime)" />
            ))}
          </div>
        </Panel>
        <Panel>
          <PanelTitle>Мови</PanelTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            {langs.map(([a, n]) => (
              <BarRow key={a} label={a} note={n + '%'} frac={n / 100} track="var(--gold-light)" fill="var(--gold-highlight)" />
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function BarRow({ label, note, frac, track, fill }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-sm)', color: 'var(--text-main)', marginBottom: 6 }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
        <span style={{ color: 'var(--text-muted)', flex: '0 0 auto', marginLeft: 10 }}>{note}</span>
      </div>
      <div style={{ height: 9, borderRadius: 999, background: track, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: Math.round(frac * 100) + '%', borderRadius: 999, background: fill, transition: 'width var(--dur-base) var(--ease-warm)' }} />
      </div>
    </div>
  );
}

/* ====================================================================== */
/*  СПІЛЬНЕ ЧИТАННЯ — buddy reads (list ↔ detail)                          */
/* ====================================================================== */
function avgPct(g) { return g.members.length ? Math.round(g.members.reduce((s, m) => s + m[2], 0) / g.members.length) : 0; }
function bookByTitle(t) { return window.DILIBRIS.books.find((b) => b.title === t); }

function BuddyView() {
  const dl = useDL();
  const [open, setOpen] = React.useState(null); // group id
  const [modal, setModal] = React.useState(null); // 'create' | 'join'
  const group = dl.groups.find((g) => g.id === open);
  return (
    <>
      {group
        ? <BuddyDetail group={group} onBack={() => setOpen(null)} />
        : <BuddyList groups={dl.groups} onOpen={setOpen} onCreate={() => setModal('create')} onJoin={() => setModal('join')} />}
      {modal === 'create' && <GroupFormSheet onClose={() => setModal(null)} onCreate={(g) => { const id = dl.createGroup(g); setModal(null); setOpen(id); }} />}
      {modal === 'join' && <JoinSheet onClose={() => setModal(null)} />}
    </>
  );
}

function BuddyList({ groups, onOpen, onCreate, onJoin }) {
  const wide = !useIsMobile(720);
  return (
    <div className="dl-page" style={{ maxWidth: 980 }}>
      <PageHead eyebrow="Читаємо разом" title="Спільне читання" sub="Маленькі клуби, спільний дедлайн і нотатки на полях">
        <button className="dl-primary" onClick={onCreate}>+ Створити</button>
      </PageHead>

      {groups.length === 0 ? (
        <Panel soft style={{ textAlign: 'center', padding: '40px 24px' }}>
          <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 'var(--fs-h3)', color: 'var(--text-main)', marginBottom: 6 }}>Ще немає жодного клубу</div>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-sm)', color: 'var(--text-muted)', marginBottom: 18 }}>Створи свій або долучися за лінком-запрошенням</div>
          <button className="dl-primary" onClick={onCreate}>Створити клуб</button>
        </Panel>
      ) : (
      <div style={{ display: 'grid', gridTemplateColumns: wide ? '1fr 1fr' : '1fr', gap: 14 }}>
        {groups.map((g) => {
          const pct = avgPct(g); const book = bookByTitle(g.bookTitle);
          return (
            <Panel key={g.id} onClick={() => onOpen(g.id)} style={{ padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                {book && <BookCover book={book} width={44} />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 'var(--fs-title)', color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.name}</div>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', marginTop: 2 }}>{g.members.length} учасник{g.members.length > 4 ? 'ів' : 'и'}{g.bookTitle ? ' · «' + g.bookTitle + '»' : ''}</div>
                </div>
                <span style={{ color: 'var(--text-faint)', fontSize: '1.3rem', flex: '0 0 auto' }}>›</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16 }}>
                <div style={{ flex: 1, height: 8, borderRadius: 999, background: 'var(--accent-lime-light)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: pct + '%', borderRadius: 999, background: 'var(--accent-lime)', transition: 'width var(--dur-base) var(--ease-warm)' }} />
                </div>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-xs)', fontWeight: 600, color: 'var(--text-muted)', flex: '0 0 auto' }}>{pct}%</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
                <div style={{ display: 'flex' }}>
                  {g.members.slice(0, 4).map((m, i) => (
                    <div key={i} style={{ marginLeft: i ? -8 : 0, borderRadius: '50%', boxShadow: '0 0 0 2px var(--bg-card)' }}><Avatar name={m[0]} color={m[1]} size={26} /></div>
                  ))}
                  {g.members.length > 4 && <div style={{ marginLeft: -8, width: 26, height: 26, borderRadius: '50%', background: 'var(--bg-card-soft)', border: '1px solid var(--line)', display: 'grid', placeItems: 'center', fontFamily: 'var(--font-sans)', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', boxShadow: '0 0 0 2px var(--bg-card)' }}>+{g.members.length - 4}</div>}
                </div>
                <span style={{ flex: 1 }} />
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-xs)', color: 'var(--text-faint)' }}>до {g.deadline}</span>
              </div>
            </Panel>
          );
        })}
      </div>
      )}

      <Panel soft style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 180, fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>Маєш запрошення? Долучайся за лінком.</div>
        <button className="dl-ghost" onClick={onJoin}>Долучитися за лінком</button>
      </Panel>
    </div>
  );
}

/* sheet shell shared by create / join */
function BuddySheet({ title, children, onClose }) {
  const mobile = useIsMobile();
  const shell = mobile
    ? { position: 'fixed', left: 0, right: 0, bottom: 0, borderRadius: 'var(--r-xl) var(--r-xl) 0 0', maxHeight: '88vh', animation: 'dl-sheet-up var(--dur-base) var(--ease-warm)' }
    : { width: 'min(480px, 94vw)', borderRadius: 'var(--r-xl)', animation: 'dl-card-in var(--dur-base) var(--ease-warm)' };
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'radial-gradient(56% 46% at 50% 42%, rgba(255,180,92,0.16), rgba(255,176,86,0) 62%), var(--bg-overlay)', display: 'flex', alignItems: mobile ? 'flex-end' : 'center', justifyContent: 'center', backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)', animation: 'dl-fade var(--dur-base) ease' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: 'radial-gradient(130% 55% at 50% 0%, rgba(255,238,202,0.55), rgba(255,238,202,0) 58%), linear-gradient(180deg, #FBF5E9 0%, #F5EDDB 100%)', boxShadow: mobile ? '0 -16px 50px rgba(0,0,0,0.5)' : '0 34px 80px rgba(0,0,0,0.52), 0 10px 28px rgba(0,0,0,0.34)', padding: mobile ? '14px 18px calc(20px + env(safe-area-inset-bottom))' : 24, position: 'relative', overflow: 'hidden', ...shell }}>
        {mobile && <div style={{ width: 40, height: 4, borderRadius: 999, background: 'var(--line-strong)', margin: '0 auto 14px' }} />}
        <h2 style={{ margin: '0 0 16px', fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 'var(--fs-h2)', color: 'var(--text-main)' }}>{title}</h2>
        {children}
      </div>
    </div>
  );
}

function GroupFormSheet({ onClose, onCreate }) {
  const [name, setName] = React.useState('');
  const [bookTitle, setBookTitle] = React.useState('');
  const [deadline, setDeadline] = React.useState('');
  const submit = () => { if (!name.trim()) return; onCreate({ name: name.trim(), bookTitle: bookTitle.trim(), deadline: deadline.trim() || 'без дедлайну' }); };
  return (
    <BuddySheet title="Новий клуб" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="Назва клубу"><MiniInput value={name} onChange={setName} placeholder="напр. Вечірні читання" autoFocus /></Field>
        <Field label="Книга"><MiniInput value={bookTitle} onChange={setBookTitle} placeholder="Що читаємо разом?" /></Field>
        <Field label="Дедлайн (необов’язково)"><MiniInput value={deadline} onChange={setDeadline} placeholder="напр. 30 червня" /></Field>
        <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
          <button className="dl-ghost" onClick={onClose}>Скасувати</button>
          <button className="dl-primary" style={{ flex: 1 }} onClick={submit}>Створити клуб</button>
        </div>
      </div>
    </BuddySheet>
  );
}

function JoinSheet({ onClose }) {
  const dl = useDL();
  const [link, setLink] = React.useState('');
  const join = () => {
    const me = dl.settings.name.split(' ')[0];
    const target = dl.groups.find((g) => !g.members.some((m) => m[0] === me));
    if (target) { dl.joinGroup(target.id); } else { dl.flash('Ти вже в усіх клубах'); }
    onClose();
  };
  return (
    <BuddySheet title="Долучитися за лінком" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="Лінк-запрошення"><MiniInput value={link} onChange={setLink} placeholder="dilibris.app/join/…" autoFocus /></Field>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>Встав лінк, який надіслав організатор клубу.</div>
        <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
          <button className="dl-ghost" onClick={onClose}>Скасувати</button>
          <button className="dl-primary" style={{ flex: 1 }} onClick={join}>Долучитися</button>
        </div>
      </div>
    </BuddySheet>
  );
}

function SharedNotes({ group, me }) {
  const dl = useDL();
  const [draft, setDraft] = React.useState('');
  const [page, setPage] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const mine = group.members.find((m) => m[0] === me);
  const myColor = mine ? mine[1] : 'var(--accent-lime)';
  const notes = group.notes || [];
  const add = () => {
    const t = draft.trim(); if (!t) return;
    dl.addGroupNote(group.id, { author: me, color: myColor, text: t, page: page.trim() });
    setDraft(''); setPage(''); setOpen(false);
  };
  return (
    <Panel>
      <PanelTitle right={<button className="dl-ghost" onClick={() => setOpen((o) => !o)} style={{ padding: '6px 12px' }}>{open ? 'Згорнути' : '+ Нотатка'}</button>}>Спільні нотатки</PanelTitle>
      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16, padding: 14, background: 'var(--bg-card-soft)', border: '1px solid var(--line)', borderRadius: 'var(--r-md)' }}>
          <textarea autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Думка, цитата, спостереження для клубу…" rows={3}
            style={{ width: '100%', resize: 'vertical', boxSizing: 'border-box', border: '1.5px solid var(--line-strong)', borderRadius: 'var(--r-sm)', padding: '10px 12px', fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-sm)', color: 'var(--text-main)', background: 'var(--bg-card)', outline: 'none', lineHeight: 1.45 }} />
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input value={page} onChange={(e) => setPage(e.target.value.replace(/[^0-9]/g, ''))} placeholder="Сторінка"
              style={{ width: 120, boxSizing: 'border-box', border: '1.5px solid var(--line-strong)', borderRadius: 'var(--r-sm)', padding: '9px 12px', fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-sm)', color: 'var(--text-main)', background: 'var(--bg-card)', outline: 'none' }} />
            <span style={{ flex: 1 }} />
            <button className="dl-primary" onClick={add}>Додати нотатку</button>
          </div>
        </div>
      )}
      {notes.length === 0 ? (
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-sm)', color: 'var(--text-muted)', textAlign: 'center', padding: '14px 0' }}>Ще немає спільних нотаток — поділися першою думкою про книгу</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {notes.map((n) => (
            <div key={n.id} style={{ display: 'flex', gap: 11 }}>
              <Avatar name={n.author} color={n.color} size={30} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 3 }}>
                  <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 'var(--fs-sm)', color: 'var(--text-main)' }}>{n.author}</span>
                  {n.page && <span style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-xs)', fontWeight: 600, color: 'var(--accent-lime-deep)', background: 'var(--accent-lime-light)', borderRadius: 'var(--r-pill)', padding: '1px 9px' }}>с. {n.page}</span>}
                </div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--fs-body)', color: 'var(--text-main)', lineHeight: 1.45 }}>{n.text}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

function BuddyDetail({ group, onBack }) {
  const dl = useDL();
  const wide = !useIsMobile(760);
  const book = bookByTitle(group.bookTitle);
  const me = dl.settings.name.split(' ')[0];
  const [draft, setDraft] = React.useState('');
  const chat = group.chat;
  const send = () => {
    const t = draft.trim(); if (!t) return;
    dl.sendChat(group.id, me, t); setDraft('');
  };
  const copyLink = () => {
    try { navigator.clipboard && navigator.clipboard.writeText('https://dilibris.app/join/' + group.id); } catch (e) {}
    dl.flash('Лінк скопійовано');
  };
  const archive = () => { dl.archiveGroup(group.id); onBack(); };
  return (
    <div className="dl-page" style={{ maxWidth: 1040 }}>
      <button onClick={onBack} className="dl-ghost dl-ghost-room" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, marginBottom: 16 }}>‹ Усі групи</button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        {book && <BookCover book={book} width={58} />}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-sm)', color: 'var(--ink-room-soft)', textShadow: '0 1px 8px rgba(0,0,0,0.6)' }}>{group.name} · «{group.bookTitle}»</div>
          <h1 style={{ margin: '3px 0 0', fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 'var(--fs-h2)', color: 'var(--ink-room)', textShadow: '0 2px 16px rgba(0,0,0,0.55)' }}>Читаємо до {group.deadline}</h1>
        </div>
        {wide && (
          <div style={{ display: 'flex', gap: 8, flex: '0 0 auto' }}>
            <button className="dl-ghost dl-ghost-room" onClick={copyLink}>Копіювати лінк</button>
            <button className="dl-ghost dl-ghost-room" onClick={archive}>Архівувати</button>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: wide ? '1fr 1fr' : '1fr', gap: 16, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Panel>
            <PanelTitle right={<span style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-xs)', fontWeight: 600, color: 'var(--accent-lime-deep)' }}>сер. {avgPct(group)}%</span>}>Прогрес учасників</PanelTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
              {group.members.map(([n, c, p]) => (
                <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Avatar name={n} color={c} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-sm)', marginBottom: 5, color: 'var(--text-main)' }}><span>{n}</span><span style={{ color: 'var(--text-muted)' }}>{p}%</span></div>
                    <div style={{ height: 7, borderRadius: 999, background: 'var(--line)', overflow: 'hidden' }}><div style={{ height: '100%', width: p + '%', borderRadius: 999, background: c, transition: 'width var(--dur-base) var(--ease-warm)' }} /></div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <SharedNotes group={group} me={me} />
        </div>

        <Panel style={{ display: 'flex', flexDirection: 'column' }}>
          <PanelTitle>Чат</PanelTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
            {chat.length === 0 && <div style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-sm)', color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>Ще тихо — напиши першим</div>}
            {chat.map(([n, m], i) => {
              const mine = n === me;
              return (
                <div key={i} style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '86%', background: mine ? 'var(--accent-lime-light)' : 'var(--bg-card-soft)', border: '1px solid ' + (mine ? 'transparent' : 'var(--line)'), borderRadius: 'var(--r-md)', padding: '9px 12px' }}>
                  <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 'var(--fs-xs)', color: mine ? 'var(--accent-lime-deep)' : 'var(--text-muted)' }}>{n}</div>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-sm)', color: 'var(--text-main)', marginTop: 2, lineHeight: 1.4 }}>{m}</div>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <input
              value={draft} onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
              placeholder="Написати повідомлення…"
              style={{ flex: 1, minWidth: 0, padding: '11px 14px', border: '1.5px solid var(--line-strong)', borderRadius: 'var(--r-md)', fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-sm)', color: 'var(--text-main)', background: 'var(--bg-card)', outline: 'none' }}
            />
            <button className="dl-primary" onClick={send} style={{ flex: '0 0 auto' }}>Надіслати</button>
          </div>
        </Panel>
      </div>
    </div>
  );
}

Object.assign(window, { DashboardView, BuddyView, PageHead, Panel, Avatar });
