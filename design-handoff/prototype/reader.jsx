/* DiLibris — Reader (e-book screen) + SessionTimer (paper reading clock).
   Both log a real session into the store on finish, advancing the book's
   progress / pages / minutes. Placeholder prose is original neutral text. */

/* a small pool of original, neutral literary-flavoured paragraphs */
const READER_PROSE = [
  'Вечір опускався на місто повільно, наче хтось притишував світло долонею. Вона відклала ложку, прислухалась до того, як унизу хтось наспівує, і подумала, що тиша теж буває різна.',
  'Дорога вела попід горою, і кожен крок віддавав у грудях глухим стуком. Він не поспішав. Поспіх — це коли тікаєш; а він просто йшов туди, де його ще пам’ятали.',
  'У кімнаті пахло яблуками й старим папером. Книжки стояли так щільно, що між ними не пролізла б і думка, та все одно знаходилося місце для ще однієї.',
  'Зранку випав перший сніг, тонкий, як цукрова пудра. Діти вибігли надвір без шапок, і матері кричали їм услід щось ласкаве й безнадійне.',
  'Лист лежав на столі три дні. Вона знала кожне слово напам’ять, ще не розгорнувши конверта, — так буває, коли довго на щось чекаєш і боїшся водночас.',
  'Поїзд рушив без попередження, м’яко, ніби й не їхав, а лише місто почало відсуватися назад. За вікном пропливали садки, паркани, чиєсь життя, в яке вже не зайти.',
  'Старий мовчав довго, потім сказав тільки: «Море нічого не забирає назад». І більше про це не говорили — кожен залишився при своєму морі.',
  'Кав’ярня на розі відчинялася о сьомій. До восьмої тут було тихо, як у бібліотеці, і саме за цю годину він платив усім своїм ранкам.',
];

function pagesFor(book, totalScreens) {
  return Math.max(1, Math.round((book.pages || 320) / totalScreens));
}

function ReaderView({ book, onClose }) {
  const dl = useDL();
  const mobile = useIsMobile();
  const TOTAL = 14;
  const startScreen = Math.min(TOTAL - 1, Math.floor(((book.progress || 0) / 100) * TOTAL));
  const [screen, setScreen] = React.useState(startScreen);
  const [maxReached, setMaxReached] = React.useState(startScreen);
  const [fs, setFs] = React.useState(mobile ? 1.12 : 1.22);
  const start = React.useRef(Date.now());

  const perScreen = pagesFor(book, TOTAL);
  const go = (d) => {
    setScreen((s) => {
      const n = Math.max(0, Math.min(TOTAL - 1, s + d));
      setMaxReached((m) => Math.max(m, n));
      return n;
    });
  };

  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1); if (e.key === 'Escape') finish(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const finish = () => {
    const minutes = Math.max(1, Math.round((Date.now() - start.current) / 60000));
    const screensRead = Math.max(0, maxReached - startScreen);
    const pages = screensRead * perScreen;
    if (pages > 0 || minutes >= 1) dl.logReadingSession(book.id, { minutes, pages, note: '' });
    onClose();
  };

  // build this screen's prose deterministically
  const paras = [];
  for (let i = 0; i < 3; i++) paras.push(READER_PROSE[(screen * 3 + i) % READER_PROSE.length]);
  const pageNum = (screen + 1) * perScreen;
  const totalPages = book.pages || 320;
  const progress = Math.round(((screen + 1) / TOTAL) * 100);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'linear-gradient(180deg, #F7EEDE 0%, #F1E6CF 100%)', display: 'flex', flexDirection: 'column', animation: 'dl-fade var(--dur-base) ease' }}>
      {/* top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: mobile ? '14px 16px' : '18px 26px', borderBottom: '1px solid rgba(120,90,50,0.16)' }}>
        <button onClick={finish} className="dl-ghost" style={{ flex: '0 0 auto' }}>‹ Назад</button>
        <div style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 'var(--fs-body)', color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{book.title}</div>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>{book.author}</div>
        </div>
        <div style={{ display: 'flex', gap: 4, flex: '0 0 auto' }}>
          <button onClick={() => setFs((v) => Math.max(0.9, v - 0.08))} className="dl-close" style={{ fontFamily: 'var(--font-serif)', fontSize: 13 }}>A−</button>
          <button onClick={() => setFs((v) => Math.min(1.6, v + 0.08))} className="dl-close" style={{ fontFamily: 'var(--font-serif)', fontSize: 16 }}>A+</button>
        </div>
      </div>

      {/* page */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', justifyContent: 'center' }}>
        <div style={{ maxWidth: 640, width: '100%', padding: mobile ? '28px 22px 60px' : '52px 40px 80px' }}>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-xs)', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-faint)', marginBottom: 22 }}>Розділ {Math.floor(screen / 4) + 1}</div>
          {paras.map((p, i) => (
            <p key={i} style={{ fontFamily: 'var(--font-serif)', fontSize: `${fs}rem`, lineHeight: 1.75, color: '#33271A', margin: '0 0 1.1em', textIndent: '1.4em', textWrap: 'pretty' }}>{p}</p>
          ))}
        </div>
      </div>

      {/* tap zones for flipping */}
      <button onClick={() => go(-1)} aria-label="Попередня" style={{ position: 'absolute', left: 0, top: 64, bottom: 64, width: '22%', border: 'none', background: 'transparent', cursor: screen > 0 ? 'w-resize' : 'default' }} />
      <button onClick={() => go(1)} aria-label="Наступна" style={{ position: 'absolute', right: 0, top: 64, bottom: 64, width: '22%', border: 'none', background: 'transparent', cursor: screen < TOTAL - 1 ? 'e-resize' : 'default' }} />

      {/* bottom bar */}
      <div style={{ padding: mobile ? '12px 16px calc(14px + env(safe-area-inset-bottom))' : '16px 26px', borderTop: '1px solid rgba(120,90,50,0.16)', display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={() => go(-1)} className="dl-ghost" disabled={screen === 0} style={{ opacity: screen === 0 ? 0.4 : 1, flex: '0 0 auto' }}>‹</button>
        <div style={{ flex: 1 }}>
          <div style={{ height: 6, borderRadius: 999, background: 'rgba(120,90,50,0.18)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: progress + '%', borderRadius: 999, background: 'var(--accent-lime)', transition: 'width var(--dur-fast) ease' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
            <span>с. {Math.min(pageNum, totalPages)} з {totalPages}</span>
            <span>{progress}%</span>
          </div>
        </div>
        <button onClick={() => go(1)} className="dl-ghost" disabled={screen === TOTAL - 1} style={{ opacity: screen === TOTAL - 1 ? 0.4 : 1, flex: '0 0 auto' }}>›</button>
      </div>
    </div>
  );
}

/* paper-book reading clock */
function SessionTimer({ book, onClose }) {
  const dl = useDL();
  const mobile = useIsMobile();
  const [sec, setSec] = React.useState(0);
  const [running, setRunning] = React.useState(true);
  const [pages, setPages] = React.useState('');
  const [note, setNote] = React.useState('');

  React.useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setSec((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [running]);

  const mm = String(Math.floor(sec / 60)).padStart(2, '0');
  const ss = String(sec % 60).padStart(2, '0');
  const finish = () => {
    dl.logReadingSession(book.id, { minutes: Math.max(1, Math.round(sec / 60)), pages: parseInt(pages, 10) || 0, note });
    onClose();
  };

  const shell = mobile
    ? { position: 'fixed', left: 0, right: 0, bottom: 0, borderRadius: 'var(--r-xl) var(--r-xl) 0 0', maxHeight: '92vh', animation: 'dl-sheet-up var(--dur-base) var(--ease-warm)' }
    : { width: 'min(440px, 94vw)', borderRadius: 'var(--r-xl)', animation: 'dl-card-in var(--dur-base) var(--ease-warm)' };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'radial-gradient(56% 46% at 50% 42%, rgba(255,180,92,0.16), rgba(255,176,86,0) 62%), var(--bg-overlay)', display: 'flex', alignItems: mobile ? 'flex-end' : 'center', justifyContent: 'center', backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)', animation: 'dl-fade var(--dur-base) ease' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: 'radial-gradient(130% 55% at 50% 0%, rgba(255,238,202,0.5), rgba(255,238,202,0) 58%), linear-gradient(180deg, #FBF5E9 0%, #F5EDDB 100%)', boxShadow: '0 34px 80px rgba(0,0,0,0.52)', padding: mobile ? '16px 20px calc(22px + env(safe-area-inset-bottom))' : 30, position: 'relative', textAlign: 'center', ...shell }}>
        {mobile && <div style={{ width: 40, height: 4, borderRadius: 999, background: 'var(--line-strong)', margin: '0 auto 16px' }} />}
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-xs)', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-faint)' }}>Сесія читання</div>
        <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 'var(--fs-title)', color: 'var(--text-main)', margin: '4px 0 18px' }}>{book.title}</div>

        <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 'clamp(3.4rem, 16vw, 5rem)', color: 'var(--text-main)', lineHeight: 1, fontVariantNumeric: 'tabular-nums', letterSpacing: '1px' }}>{mm}:{ss}</div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', margin: '20px 0 22px' }}>
          <button className="dl-ghost" onClick={() => setRunning((r) => !r)}>{running ? '❚❚ Пауза' : '▷ Далі'}</button>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
          <div style={{ flex: 1 }}><Field label="Сторінок"><MiniInput value={pages} onChange={(v) => setPages(v.replace(/[^0-9]/g, ''))} placeholder="0" /></Field></div>
          <div style={{ flex: 2 }}><Field label="Нотатка"><MiniInput value={note} onChange={setNote} placeholder="думка на полях…" /></Field></div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="dl-ghost" onClick={onClose} style={{ flex: '0 0 auto' }}>Скасувати</button>
          <button className="dl-primary" style={{ flex: 1 }} onClick={finish}>Завершити й записати</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ReaderView, SessionTimer });
