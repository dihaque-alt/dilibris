/* DiLibris — book detail card (one cohesive object; sheet on mobile, modal on desktop) */

function useIsMobile(bp = 720) {
  const [m, setM] = React.useState(typeof window !== 'undefined' && window.innerWidth < bp);
  React.useEffect(() => {
    const f = () => setM(window.innerWidth < bp);
    window.addEventListener('resize', f); return () => window.removeEventListener('resize', f);
  }, [bp]);
  return m;
}

function Segmented({ tabs, active, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 4, padding: 4, background: 'var(--bg-card-soft)', border: '1px solid var(--line)', borderRadius: 'var(--r-pill)' }}>
      {tabs.map((t) => (
        <button key={t} onClick={() => onChange(t)} style={{
          flex: 1, border: 'none', cursor: 'pointer', padding: '8px 6px', borderRadius: 'var(--r-pill)',
          fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 'var(--fs-sm)',
          color: active === t ? 'var(--text-main)' : 'var(--text-muted)',
          background: active === t ? 'var(--bg-card)' : 'transparent',
          boxShadow: active === t ? 'var(--shadow-book)' : 'none',
          transition: 'all var(--dur-fast) ease',
        }}>{t}</button>
      ))}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-xs)', fontWeight: 600, letterSpacing: '0.4px', textTransform: 'uppercase', color: 'var(--text-faint)' }}>{label}</span>
      {children}
    </div>
  );
}

function Choice({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {options.map((o) => (
        <button key={o} onClick={() => onChange(o)} style={{
          padding: '8px 14px', borderRadius: 'var(--r-md)', cursor: 'pointer',
          fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: 'var(--fs-sm)',
          border: '1.5px solid ' + (value === o ? 'var(--accent-lime)' : 'var(--line-strong)'),
          background: value === o ? 'var(--accent-lime-light)' : 'var(--bg-card)',
          color: value === o ? 'var(--accent-lime-deep)' : 'var(--text-muted)',
          transition: 'all var(--dur-fast) ease',
        }}>{o}</button>
      ))}
    </div>
  );
}

function NoteBadge({ children, tone }) {
  const map = {
    quote: { c: 'var(--status-want)', bg: 'var(--status-want-bg)' },
    thought: { c: 'var(--accent-lime-deep)', bg: 'var(--accent-lime-light)' },
    general: { c: 'var(--status-done)', bg: 'var(--status-done-bg)' },
    pub: { c: 'var(--status-done)', bg: 'var(--status-done-bg)' },
    priv: { c: 'var(--text-muted)', bg: 'var(--bg-card-soft)' },
  };
  const s = map[tone] || map.priv;
  return <span style={{ padding: '2px 9px', borderRadius: 'var(--r-pill)', fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 'var(--fs-xs)', color: s.c, background: s.bg, border: '1px solid ' + s.c + '22' }}>{children}</span>;
}

function BookDetailCard({ book, onClose, onRead, onSession }) {
  const dl = useDL();
  const mobile = useIsMobile();
  const [tab, setTab] = React.useState('Прогрес');
  const [status, setStatus] = React.useState(book.status);
  const [format, setFormat] = React.useState(book.format || 'Паперова');
  const [rating, setRating] = React.useState(book.rating || 0);
  const [countChallenge, setCountChallenge] = React.useState(true);
  const [showReview, setShowReview] = React.useState(false);
  const [spoiler, setSpoiler] = React.useState(true);
  const notes = dl.notes[book.id] || dl.notes.bk1 || [];
  const sessions = dl.sessions[book.id] || dl.sessions.bk1 || [];

  // inline composers
  const [noteOpen, setNoteOpen] = React.useState(false);
  const [noteDraft, setNoteDraft] = React.useState({ type: 'Цитата', vis: 'Особиста', text: '' });
  const [sessOpen, setSessOpen] = React.useState(false);
  const [sessDraft, setSessDraft] = React.useState({ pages: '', minutes: '', note: '' });

  const saveNote = () => {
    if (!noteDraft.text.trim()) return;
    dl.addNote(book.id, { type: noteDraft.type, vis: noteDraft.vis, text: noteDraft.text.trim() });
    setNoteDraft({ type: 'Цитата', vis: 'Особиста', text: '' }); setNoteOpen(false);
  };
  const saveSession = () => {
    if (!sessDraft.pages && !sessDraft.minutes) return;
    const now = new Date();
    const months = ['січ', 'лют', 'бер', 'кві', 'тра', 'чер', 'лип', 'сер', 'вер', 'жов', 'лис', 'гру'];
    dl.addSession(book.id, { date: `${now.getDate()} ${months[now.getMonth()]}`, pages: parseInt(sessDraft.pages, 10) || 0, minutes: parseInt(sessDraft.minutes, 10) || 0, note: sessDraft.note.trim() });
    setSessDraft({ pages: '', minutes: '', note: '' }); setSessOpen(false);
  };
  const save = () => { dl.updateBook(book.id, { status, format, rating }); dl.flash('Зміни збережено'); onClose(); };

  const hms = (m) => `${Math.floor(m / 60)} год ${m % 60} хв`;

  const shell = mobile ? {
    position: 'fixed', left: 0, right: 0, bottom: 0, top: 'auto',
    borderRadius: 'var(--r-xl) var(--r-xl) 0 0', maxHeight: '92vh',
    animation: 'dl-sheet-up var(--dur-base) var(--ease-warm)',
  } : {
    position: 'relative', width: 'min(680px, 94vw)', maxHeight: '90vh',
    borderRadius: 'var(--r-xl)', animation: 'dl-card-in var(--dur-base) var(--ease-warm)',
  };

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 60,
      background: 'radial-gradient(58% 48% at 50% 40%, rgba(255,180,92,0.17), rgba(255,176,86,0) 62%), var(--bg-overlay)',
      display: 'flex', alignItems: mobile ? 'flex-end' : 'center', justifyContent: 'center',
      backdropFilter: 'blur(3px)', animation: 'dl-fade var(--dur-base) ease',
    }}>
      <div onClick={(e) => e.stopPropagation()} className="dl-detailcard" style={{
        background: 'radial-gradient(130% 55% at 50% 0%, rgba(255,238,202,0.55), rgba(255,238,202,0) 58%), linear-gradient(180deg, #FBF5E9 0%, #F5EDDB 100%)',
        boxShadow: mobile
          ? '0 -16px 50px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.7)'
          : '0 34px 80px rgba(0,0,0,0.52), 0 10px 28px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.85), inset 0 0 0 1px rgba(120,90,50,0.1)',
        overflow: 'hidden', display: 'flex', flexDirection: 'column', ...shell,
      }}>
        {mobile && <div style={{ width: 40, height: 4, borderRadius: 999, background: 'var(--line-strong)', margin: '10px auto 0' }} />}

        {/* header band */}
        <div style={{ display: 'flex', gap: 16, padding: mobile ? '16px 18px 14px' : '24px 28px 18px', alignItems: 'flex-start' }}>
          <div style={{ position: 'relative', flex: '0 0 auto' }}>
            <BookCover book={book} width={mobile ? 72 : 92} />
            <span style={{ position: 'absolute', left: '5%', right: '5%', bottom: -7, height: 11, background: 'radial-gradient(50% 100% at 50% 0%, rgba(58,40,20,0.3), rgba(0,0,0,0) 76%)', filter: 'blur(1.5px)', pointerEvents: 'none' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0, paddingTop: 4 }}>
            <h2 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 'var(--fs-h2)', lineHeight: 'var(--lh-tight)', color: 'var(--text-main)' }}>{book.title}</h2>
            <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 'var(--fs-body)', color: 'var(--text-muted)', margin: '4px 0 10px' }}>{book.author}</div>
            <StatusPill status={status} size="sm" />
          </div>
          <button onClick={onClose} aria-label="Закрити" className="dl-close">✕</button>
        </div>

        {/* stat chips */}
        <div style={{ display: 'flex', gap: 8, padding: mobile ? '0 18px 14px' : '0 28px 16px' }}>
          <StatChip label="прогрес" value={book.progress + '%'} accent="var(--accent-lime-deep)" />
          <StatChip label="днів читання" value={book.days || '—'} />
          <StatChip label="загалом" value={book.minutes ? Math.round(book.minutes / 60) + ' год' : '—'} accent="var(--gold-deep)" />
        </div>

        {/* primary reading action */}
        {book.status !== 'want' && book.status !== 'done' && (onRead || onSession) && (
          <div style={{ display: 'flex', gap: 10, padding: mobile ? '0 18px 14px' : '0 28px 16px' }}>
            {format === 'Електронна'
              ? <button className="dl-primary" style={{ flex: 1, padding: '12px' }} onClick={() => onRead && onRead(book)}>▷ Читати далі</button>
              : <button className="dl-primary" style={{ flex: 1, padding: '12px' }} onClick={() => onSession && onSession(book)}>⏱ Почати сесію</button>}
            {format === 'Електронна'
              ? <button className="dl-ghost" onClick={() => onSession && onSession(book)}>⏱ Сесія</button>
              : <button className="dl-ghost" onClick={() => onRead && onRead(book)}>▷ Уривок</button>}
          </div>
        )}

        {/* tabs */}
        <div style={{ padding: mobile ? '0 18px' : '0 28px' }}>
          <Segmented tabs={['Прогрес', 'Відгук', 'Нотатки', 'Сесії']} active={tab} onChange={setTab} />
        </div>

        {/* scroll body */}
        <div style={{ overflowY: 'auto', padding: mobile ? '16px 18px 8px' : '20px 28px 8px', flex: 1 }}>
          {tab === 'Прогрес' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <Field label="Статус"><Choice options={Object.values(window.DILIBRIS.STATUS).map((s) => s.label)} value={window.DILIBRIS.STATUS[status].label} onChange={(lbl) => { const k = Object.values(window.DILIBRIS.STATUS).find((s) => s.label === lbl).key; setStatus(k); }} /></Field>
              <Field label="Формат"><Choice options={['Паперова', 'Електронна']} value={format} onChange={setFormat} /></Field>
              <Field label="Оцінка"><StarRating value={rating} size={28} onChange={setRating} /></Field>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}><Field label="Сторінок прочитано"><Input value={`${book.pagesRead} / ${book.pages}`} /></Field></div>
                <div style={{ flex: 1 }}><Field label="Почато"><Input value="29 трав" /></Field></div>
              </div>
              <Toggle checked={countChallenge} onChange={setCountChallenge} label="Рахувати в challenge" hint="Книга зараховується у твою річну ціль" />
            </div>
          )}

          {tab === 'Відгук' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Field label="Оцінка"><StarRating value={rating} size={26} onChange={setRating} /></Field>
              <Toggle checked={spoiler} onChange={setSpoiler} label="Містить спойлери" hint="Сховаємо текст за кнопкою для інших" />
              <div style={{
                position: 'relative', background: 'var(--bg-card-soft)', border: '1px solid var(--line)',
                borderRadius: 'var(--r-lg)', padding: 18, fontFamily: 'var(--font-serif)', fontSize: '1.05rem',
                lineHeight: 'var(--lh-body)', color: 'var(--text-main)',
              }}>
                {spoiler && !showReview ? (
                  <div style={{ textAlign: 'center', padding: '8px 0' }}>
                    <button className="dl-ghost" onClick={() => setShowReview(true)}>Показати відгук</button>
                  </div>
                ) : (
                  <p style={{ margin: 0 }}>«Книга, яку хочеться читати повільно. Багряний пише втечу як молитву — і десь на середині я зрозуміла, що читаю про свободу, а не про погоню.»</p>
                )}
              </div>
              <NoteBadge tone="pub">Публічний відгук</NoteBadge>
            </div>
          )}

          {tab === 'Нотатки' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {noteOpen && (
                <div style={{ background: 'var(--bg-card)', border: '1.5px solid var(--accent-lime)', borderRadius: 'var(--r-lg)', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <Choice options={['Цитата', 'Думка', 'Загальна']} value={noteDraft.type} onChange={(v) => setNoteDraft((d) => ({ ...d, type: v }))} />
                  <textarea autoFocus value={noteDraft.text} onChange={(e) => setNoteDraft((d) => ({ ...d, text: e.target.value }))} placeholder="Що зачепило?…" rows={3}
                    style={{ width: '100%', resize: 'vertical', border: '1.5px solid var(--line-strong)', borderRadius: 'var(--r-md)', padding: '10px 12px', fontFamily: noteDraft.type === 'Цитата' ? 'var(--font-serif)' : 'var(--font-sans)', fontStyle: noteDraft.type === 'Цитата' ? 'italic' : 'normal', fontSize: 'var(--fs-body)', color: 'var(--text-main)', background: 'var(--bg-card)', outline: 'none' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Choice options={['Особиста', 'Публічна']} value={noteDraft.vis} onChange={(v) => setNoteDraft((d) => ({ ...d, vis: v }))} />
                    <span style={{ flex: 1 }} />
                    <button className="dl-ghost" onClick={() => setNoteOpen(false)}>Скасувати</button>
                    <button className="dl-primary" onClick={saveNote}>Зберегти</button>
                  </div>
                </div>
              )}
              {notes.map((n) => (
                <div key={n.id} style={{ background: 'var(--bg-card-soft)', border: '1px solid var(--line)', borderRadius: 'var(--r-lg)', padding: 16 }}>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                    <NoteBadge tone={n.type === 'Цитата' ? 'quote' : n.type === 'Думка' ? 'thought' : 'general'}>{n.type}</NoteBadge>
                    <NoteBadge tone={n.vis === 'Публічна' ? 'pub' : 'priv'}>{n.vis}</NoteBadge>
                  </div>
                  <p style={{ margin: 0, fontFamily: n.type === 'Цитата' ? 'var(--font-serif)' : 'var(--font-sans)', fontStyle: n.type === 'Цитата' ? 'italic' : 'normal', fontSize: 'var(--fs-body)', lineHeight: 'var(--lh-body)', color: 'var(--text-main)' }}>{n.text}</p>
                </div>
              ))}
              {!noteOpen && <button className="dl-ghost" style={{ alignSelf: 'flex-start' }} onClick={() => setNoteOpen(true)}>+ Нотатка</button>}
            </div>
          )}

          {tab === 'Сесії' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {sessOpen && (
                <div style={{ background: 'var(--bg-card)', border: '1.5px solid var(--accent-lime)', borderRadius: 'var(--r-lg)', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ flex: 1 }}><Field label="Сторінок"><MiniInput value={sessDraft.pages} onChange={(v) => setSessDraft((d) => ({ ...d, pages: v.replace(/[^0-9]/g, '') }))} placeholder="24" autoFocus /></Field></div>
                    <div style={{ flex: 1 }}><Field label="Хвилин"><MiniInput value={sessDraft.minutes} onChange={(v) => setSessDraft((d) => ({ ...d, minutes: v.replace(/[^0-9]/g, '') }))} placeholder="55" /></Field></div>
                  </div>
                  <Field label="Нотатка (необов’язково)"><MiniInput value={sessDraft.note} onChange={(v) => setSessDraft((d) => ({ ...d, note: v }))} placeholder="напр. Перевал, ніч у лісі" /></Field>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <span style={{ flex: 1 }} />
                    <button className="dl-ghost" onClick={() => setSessOpen(false)}>Скасувати</button>
                    <button className="dl-primary" onClick={saveSession}>Записати</button>
                  </div>
                </div>
              )}
              {sessions.map((s) => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--bg-card-soft)', border: '1px solid var(--line)', borderRadius: 'var(--r-md)' }}>
                  <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 'var(--fs-body)', color: 'var(--text-main)', width: 52 }}>{s.date}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-sm)', color: 'var(--text-main)' }}>{s.pages} стор · {s.minutes} хв</div>
                    {s.note && <div style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', marginTop: 2 }}>{s.note}</div>}
                  </div>
                </div>
              ))}
              {!sessOpen && <button className="dl-ghost" style={{ alignSelf: 'flex-start' }} onClick={() => setSessOpen(true)}>+ Сесія</button>}
            </div>
          )}
        </div>

        {/* footer */}
        <div style={{ padding: mobile ? '12px 18px calc(16px + env(safe-area-inset-bottom))' : '16px 28px 22px', borderTop: '1px solid var(--line)', display: 'flex', gap: 12 }}>
          <button className="dl-ghost" onClick={onClose} style={{ flex: '0 0 auto' }}>Скасувати</button>
          <button className="dl-primary" style={{ flex: 1 }} onClick={save}>Зберегти</button>
        </div>
      </div>
    </div>
  );
}

function Input({ value }) {
  return <div style={{ padding: '11px 14px', border: '1.5px solid var(--line-strong)', borderRadius: 'var(--r-md)', background: 'var(--bg-card)', fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-body)', color: 'var(--text-main)' }}>{value}</div>;
}

function MiniInput({ value, onChange, placeholder, autoFocus }) {
  return (
    <input autoFocus={autoFocus} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)}
      style={{ width: '100%', padding: '11px 14px', border: '1.5px solid var(--line-strong)', borderRadius: 'var(--r-md)', background: 'var(--bg-card)', fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-body)', color: 'var(--text-main)', outline: 'none' }} />
  );
}

function Toggle({ checked, onChange, label, hint }) {
  return (
    <div onClick={() => onChange(!checked)} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
      <div style={{ width: 46, height: 28, borderRadius: 999, padding: 3, background: checked ? 'var(--accent-lime)' : 'var(--line-strong)', transition: 'background var(--dur-fast) ease', flex: '0 0 auto' }}>
        <div style={{ width: 22, height: 22, borderRadius: 999, background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transform: checked ? 'translateX(18px)' : 'translateX(0)', transition: 'transform var(--dur-fast) var(--ease-warm)' }} />
      </div>
      <div>
        <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 'var(--fs-body)', color: 'var(--text-main)' }}>{label}</div>
        {hint && <div style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', marginTop: 2 }}>{hint}</div>}
      </div>
    </div>
  );
}

Object.assign(window, { BookDetailCard, useIsMobile, Segmented, Field, Choice, Toggle, Input, MiniInput, NoteBadge });
