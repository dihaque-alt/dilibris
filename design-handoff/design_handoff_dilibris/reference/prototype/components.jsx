/* DiLibris — shared visual components. Exports to window for cross-file use. */

/* ---------- Book cover (front-facing, generative or placeholder) ------ */
const lighten = (col, p) => `color-mix(in oklab, ${col} ${100 - p}%, #fff)`;
const darken = (col, p) => `color-mix(in oklab, ${col} ${100 - p}%, #000)`;

/* ---------- Real cover lookup (Open Library, best-effort, cached) ----- */
const _coverMem = {};        // key -> coverId | null
const _coverInflight = {};   // key -> Promise
function findCoverId(book) {
  const key = (book.title + '|' + book.author).toLowerCase();
  if (key in _coverMem) return Promise.resolve(_coverMem[key]);
  try {
    const ss = sessionStorage.getItem('dl-cover:' + key);
    if (ss !== null) { _coverMem[key] = ss === '' ? null : +ss; return Promise.resolve(_coverMem[key]); }
  } catch (e) {}
  if (_coverInflight[key]) return _coverInflight[key];
  const url = 'https://openlibrary.org/search.json?' + new URLSearchParams({
    title: book.title, author: book.author, limit: '1', fields: 'cover_i',
  });
  _coverInflight[key] = fetch(url)
    .then((r) => r.json())
    .then((j) => {
      const id = j && j.docs && j.docs[0] && j.docs[0].cover_i ? j.docs[0].cover_i : null;
      _coverMem[key] = id;
      try { sessionStorage.setItem('dl-cover:' + key, id == null ? '' : String(id)); } catch (e) {}
      return id;
    })
    .catch(() => { _coverMem[key] = null; return null; })
    .finally(() => { delete _coverInflight[key]; });
  return _coverInflight[key];
}

/* Per-style generative cover art — composed from simple shapes + type,
   mimicking the variety of real printed covers (no two look the same). */
function CoverArt({ book, width }) {
  const c = book.cover;
  const title = (sz, col, align = 'left') => ({
    fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: Math.max(11, Math.round(width * sz)),
    lineHeight: 1.08, color: col, textAlign: align, letterSpacing: '0.1px', textWrap: 'balance',
  });
  const author = (col, align = 'left') => ({
    fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: Math.max(8, Math.round(width * 0.075)),
    color: col, textTransform: 'uppercase', letterSpacing: '0.8px', textAlign: align, opacity: 0.9,
  });
  const pad = Math.round(width * 0.11);

  switch (book.art) {
    case 'type': // bold typographic, full-bleed
      return (
        <div style={{ position: 'absolute', inset: 0, padding: pad, display: 'flex', flexDirection: 'column', background: `linear-gradient(160deg, ${lighten(c.bg, 8)}, ${darken(c.bg, 12)})` }}>
          <div style={{ width: '40%', height: 3, background: c.rule, marginBottom: pad * 0.6 }} />
          <div style={title(0.165, c.ink)}>{book.title}</div>
          <div style={{ flex: 1 }} />
          <div style={author(c.ink)}>{book.author}</div>
        </div>
      );
    case 'band': // classic centered band
      return (
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, ${lighten(c.bg, 6)}, ${darken(c.bg, 8)})` }}>
          <div style={{ position: 'absolute', top: '34%', left: 0, right: 0, bottom: '30%', background: lighten(c.bg, 54), boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.12)', display: 'grid', placeItems: 'center', padding: `0 ${pad * 0.7}px` }}>
            <div style={title(0.135, darken(c.bg, 30), 'center')}>{book.title}</div>
          </div>
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: pad * 0.7, ...author(c.ink, 'center') }}>{book.author}</div>
        </div>
      );
    case 'arc': // sun/moon over horizon
      return (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: `linear-gradient(180deg, ${darken(c.bg, 6)} 0%, ${c.bg} 52%, ${darken(c.bg, 16)} 100%)` }}>
          <div style={{ position: 'absolute', top: width * 0.16, left: '50%', transform: 'translateX(-50%)', width: width * 0.52, height: width * 0.52, borderRadius: '50%', background: `radial-gradient(circle at 38% 34%, ${lighten(c.rule, 22)}, ${c.rule})`, boxShadow: `0 0 ${width * 0.12}px ${lighten(c.rule, 10)}` }} />
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: '34%', height: 1.5, background: lighten(c.bg, 30), opacity: 0.5 }} />
          <div style={{ position: 'absolute', left: pad * 0.8, right: pad * 0.8, bottom: pad * 0.55, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: pad * 0.3 }}>
            <div style={title(0.12, c.ink, 'center')}>{book.title}</div>
            <div style={author(c.ink, 'center')}>{book.author}</div>
          </div>
        </div>
      );
    case 'frame': // inset border, literary plate
      return (
        <div style={{ position: 'absolute', inset: 0, padding: Math.round(width * 0.07), background: `linear-gradient(165deg, ${lighten(c.bg, 5)}, ${darken(c.bg, 10)})` }}>
          <div style={{ width: '100%', height: '100%', border: `1.5px solid ${c.rule}`, borderRadius: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: `0 ${pad * 0.6}px`, position: 'relative' }}>
            <div style={{ width: width * 0.12, height: 2, background: c.rule, marginBottom: pad * 0.5 }} />
            <div style={title(0.125, c.ink, 'center')}>{book.title}</div>
            <div style={{ width: width * 0.12, height: 2, background: c.rule, margin: `${pad * 0.5}px 0 ${pad * 0.6}px` }} />
            <div style={author(c.ink, 'center')}>{book.author}</div>
          </div>
        </div>
      );
    case 'split': // photo-art top, cream title block bottom
    default: {
      const motif = ['circle', 'hills', 'stripes'][(book.title.length + (book.id ? book.id.length : 0)) % 3];
      return (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: '0 0 54%', position: 'relative', overflow: 'hidden', background: `linear-gradient(150deg, ${lighten(c.bg, 14)}, ${darken(c.bg, 16)})` }}>
            {motif === 'circle' && (
              <div style={{ position: 'absolute', right: width * 0.14, top: width * 0.1, width: width * 0.34, height: width * 0.34, borderRadius: '50%', background: `radial-gradient(circle at 38% 34%, ${lighten(c.rule, 18)}, ${c.rule})`, opacity: 0.85 }} />
            )}
            {motif === 'hills' && (
              <>
                <div style={{ position: 'absolute', left: '-12%', bottom: '-22%', width: '80%', height: '70%', borderRadius: '50%', background: darken(c.bg, 22), opacity: 0.7 }} />
                <div style={{ position: 'absolute', right: '-16%', bottom: '-30%', width: '80%', height: '74%', borderRadius: '50%', background: lighten(c.rule, 8), opacity: 0.6 }} />
                <div style={{ position: 'absolute', right: width * 0.16, top: width * 0.09, width: width * 0.16, height: width * 0.16, borderRadius: '50%', background: lighten(c.rule, 26), opacity: 0.8 }} />
              </>
            )}
            {motif === 'stripes' && (
              <div style={{ position: 'absolute', inset: 0, background: `repeating-linear-gradient(135deg, ${lighten(c.rule, 6)} 0 ${width * 0.06}px, ${darken(c.bg, 8)} ${width * 0.06}px ${width * 0.12}px)`, opacity: 0.55 }} />
            )}
          </div>
          <div style={{ flex: 1, background: lighten(c.bg, 58), padding: `${pad * 0.7}px ${pad * 0.7}px`, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={title(0.115, darken(c.bg, 32))}>{book.title}</div>
            <div style={{ ...author(darken(c.bg, 18)), marginTop: pad * 0.35 }}>{book.author}</div>
          </div>
        </div>
      );
    }
  }
}

function BookCover({ book, width = 96, hero = false, real, style = {} }) {
  const useReal = real !== undefined ? real : (window.DILIBRIS_REAL_COVERS !== false);
  const [realSrc, setRealSrc] = React.useState(null);
  const [imgOk, setImgOk] = React.useState(false);
  React.useEffect(() => {
    setImgOk(false); setRealSrc(null);
    if (!useReal) return;
    let alive = true;
    findCoverId(book).then((id) => {
      if (alive && id) setRealSrc(`https://covers.openlibrary.org/b/id/${id}-${hero ? 'L' : 'M'}.jpg`);
    });
    return () => { alive = false; };
  }, [book.id, hero, useReal]);
  const realLayer = realSrc ? (
    <img
      src={realSrc} alt="" loading="lazy"
      onLoad={() => setImgOk(true)} onError={() => { setImgOk(false); setRealSrc(null); }}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: imgOk ? 1 : 0, transition: 'opacity var(--dur-base) ease', zIndex: 1 }}
    />
  ) : null;
  const ratio = hero ? 1.5 : (book.ratio || 1.5);
  const h = Math.round(width * ratio);
  const c = book.cover || { bg: '#5E4632', ink: '#F4E9DB', rule: '#BFA289' };
  const titleSize = Math.max(11, Math.round(width * (hero ? 0.11 : 0.135)));
  const authorSize = Math.max(9, Math.round(width * 0.085));

  const frame = {
    position: 'relative', width, height: h, flex: '0 0 auto',
    borderRadius: 'var(--r-book)', overflow: 'hidden',
    background: book.placeholder ? '#F4ECDE' : c.bg,
    boxShadow: hero ? 'var(--shadow-hero)' : 'var(--shadow-book)',
    ...style,
  };
  // hardcover cloth weave (matte, fine)
  const cloth = {
    position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.4, mixBlendMode: 'soft-light',
    background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.5) 0 0.5px, rgba(255,255,255,0.16) 0.5px 1.5px), repeating-linear-gradient(90deg, rgba(0,0,0,0.5) 0 0.5px, rgba(255,255,255,0.16) 0.5px 1.5px)',
    backgroundSize: '3px 3px, 3px 3px',
  };
  // uneven cloth/paper aging — soft blotches
  const mottle = {
    position: 'absolute', inset: 0, pointerEvents: 'none',
    backgroundImage: 'var(--grain-leather)', backgroundSize: '170px 230px',
    mixBlendMode: 'soft-light', opacity: 0.34,
  };
  // rounded spine (left) — soft warm lit ridge then shadow valley (matte, not chrome)
  const spine = {
    position: 'absolute', top: 0, bottom: 0, left: 0, width: '10%', zIndex: 2,
    background: 'linear-gradient(90deg, rgba(0,0,0,0.30) 0%, rgba(255,236,200,0.13) 26%, rgba(255,236,200,0) 58%, rgba(0,0,0,0.05) 100%)',
  };
  // page block at the head, warm cream
  const topPages = {
    position: 'absolute', top: 0, left: '10%', right: Math.max(3, Math.round(width * 0.038)), height: Math.max(2, Math.round(width * 0.022)), zIndex: 2,
    background: 'linear-gradient(180deg, #ECDFC4, #C7B58E 62%, rgba(0,0,0,0.22))',
  };
  // fore-edge at right: a cream sliver of striated pages with board shadow
  const edge = {
    position: 'absolute', top: 1, bottom: 1, right: 0, width: Math.max(3, Math.round(width * 0.038)), zIndex: 2,
    background: 'repeating-linear-gradient(180deg, rgba(120,96,60,0.42) 0 1px, #F0E5CB 1px 2.6px)',
    boxShadow: 'inset 1px 0 2px rgba(0,0,0,0.4), -1px 0 3px rgba(0,0,0,0.28)',
    borderRadius: '0 2px 2px 0',
  };
  // matte warm key light from upper-left (replaces glossy plastic sheen)
  const sheen = {
    position: 'absolute', inset: 0, pointerEvents: 'none',
    background: 'linear-gradient(145deg, rgba(255,240,214,0.10) 0%, rgba(255,240,214,0) 24%)',
  };
  const paper = {
    position: 'absolute', inset: 0, backgroundImage: 'var(--grain-paper)', backgroundSize: '100px 100px',
    mixBlendMode: 'overlay', opacity: 0.4, pointerEvents: 'none',
  };
  // room-light grounding: head sits in the shelf shadow, foot catches warm pooled light
  const roomLight = {
    position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2,
    background: 'linear-gradient(180deg, rgba(0,0,0,0.20) 0%, rgba(0,0,0,0) 15%, rgba(0,0,0,0) 68%, rgba(120,70,24,0.13) 100%)',
  };
  const vignette = {
    position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2,
    background: 'radial-gradient(135% 100% at 34% 14%, rgba(255,240,214,0.10) 0%, rgba(0,0,0,0) 46%, rgba(0,0,0,0.26) 100%)',
  };

  if (book.placeholder) {
    const ipad = Math.round(width * 0.07);
    return (
      <div style={{ ...frame, padding: ipad, background: 'linear-gradient(165deg, #FBF3E5, #EFE2CC)' }}>
        {/* inset literary plate — quiet typographic cover, no illustration */}
        <div style={{
          width: '100%', height: '100%', border: '1.5px solid #C9B79A', borderRadius: 2,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: `0 ${Math.round(width * 0.09)}px`, textAlign: 'center',
        }}>
          <div style={{ width: width * 0.14, height: 2, background: '#C9B79A', marginBottom: width * 0.08 }} />
          <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: titleSize, lineHeight: 1.14, color: '#3A2E22', textWrap: 'balance' }}>{book.title}</div>
          <div style={{ width: width * 0.14, height: 2, background: '#C9B79A', margin: `${width * 0.08}px 0 ${width * 0.06}px` }} />
          <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: authorSize, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#8A7B66' }}>{book.author}</div>
        </div>
        {realLayer}
        <div style={{ ...paper, opacity: 0.36 }} />
        <div style={mottle} />
        <div style={vignette} />
        <div style={sheen} />
        <div style={roomLight} />
        <div style={spine} />
        <div style={topPages} />
        <div style={edge} />
      </div>
    );
  }

  return (
    <div style={frame}>
      <CoverArt book={book} width={width} />
      {realLayer}
      <div style={cloth} />
      <div style={mottle} />
      <div style={paper} />
      <div style={vignette} />
      <div style={sheen} />
      <div style={roomLight} />
      <div style={spine} />
      <div style={topPages} />
      <div style={edge} />
    </div>
  );
}

/* ---------- Status pill ----------------------------------------------- */
function StatusPill({ status, size = 'md' }) {
  const S = window.DILIBRIS.STATUS[status];
  if (!S) return null;
  const pad = size === 'sm' ? '3px 9px' : '5px 12px';
  const fs = size === 'sm' ? 'var(--fs-xs)' : 'var(--fs-sm)';
  const v = S.cssVar;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, padding: pad,
      borderRadius: 'var(--r-pill)', fontFamily: 'var(--font-sans)', fontWeight: 600,
      fontSize: fs, color: `var(--status-${v})`, background: `var(--status-${v}-bg)`,
      whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 7, height: 7, borderRadius: 999, background: `var(--status-${v})` }} />
      {S.label}
    </span>
  );
}

/* ---------- Stat chip ------------------------------------------------- */
function StatChip({ label, value, accent }) {
  return (
    <div style={{
      flex: '1 1 0', minWidth: 0, background: 'var(--bg-card-soft)', border: '1px solid var(--line)',
      borderRadius: 'var(--r-md)', padding: '10px 12px',
    }}>
      <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: '1.3rem', color: accent || 'var(--text-main)', lineHeight: 1 }}>{value}</div>
      <div style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', marginTop: 5, letterSpacing: '0.2px' }}>{label}</div>
    </div>
  );
}

/* ---------- Star rating (1–5, half steps) ----------------------------- */
function Star({ fill, size }) {
  // fill: 0..1
  const id = 'g' + Math.random().toString(36).slice(2, 8);
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <defs>
        <linearGradient id={id}>
          <stop offset={`${fill * 100}%`} stopColor="var(--gold-highlight)" />
          <stop offset={`${fill * 100}%`} stopColor="#E7DFD0" />
        </linearGradient>
      </defs>
      <path d="M12 2.5l2.7 5.9 6.3.7-4.7 4.3 1.3 6.3L12 16.9 6.1 19.9l1.3-6.3L2.7 9.1l6.3-.7z"
        fill={`url(#${id})`} stroke="var(--gold-deep)" strokeWidth="0.8" strokeOpacity="0.5" strokeLinejoin="round" />
    </svg>
  );
}
function StarRating({ value = 0, size = 22, onChange }) {
  const stars = [];
  const interactive = !!onChange;
  for (let i = 1; i <= 5; i++) {
    const fill = Math.max(0, Math.min(1, value - (i - 1)));
    stars.push(
      <span key={i} style={{ position: 'relative', display: 'inline-flex', cursor: interactive ? 'pointer' : 'default' }}>
        <Star fill={fill} size={size} />
        {interactive && (
          <>
            <span onClick={() => onChange(i - 0.5)} style={{ position: 'absolute', left: 0, top: 0, width: '50%', height: '100%' }} />
            <span onClick={() => onChange(i)} style={{ position: 'absolute', right: 0, top: 0, width: '50%', height: '100%' }} />
          </>
        )}
      </span>
    );
  }
  return (
    <span style={{ display: 'inline-flex', gap: 3, alignItems: 'center' }}>
      {stars}
      {value > 0 && <span style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-sm)', color: 'var(--text-muted)', marginLeft: 6 }}>{value.toFixed(1).replace('.0', '')}</span>}
    </span>
  );
}

/* ---------- Challenge bar (gold fill on cream track) ------------------ */
function ChallengeBar({ value, target, height = 14 }) {
  const pct = Math.min(100, Math.round((value / target) * 100));
  return (
    <div>
      <div style={{ position: 'relative', height, borderRadius: 999, background: 'var(--gold-light)', border: '1px solid #F0E4BE', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: pct + '%',
          background: 'linear-gradient(180deg, #FBD94E 0%, var(--gold-highlight) 55%, #ECBE1F 100%)',
          borderRadius: 999, transition: 'width var(--dur-base) var(--ease-warm)',
        }} />
      </div>
    </div>
  );
}

/* ---------- Brand mark ------------------------------------------------ */
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

/* ---------- Book spine (realistic, varied bindings, shelf view) ---------- */
function _spineLum(hex) {
  const m = (hex || '#5E4632').replace('#', '');
  const r = parseInt(m.slice(0, 2), 16), g = parseInt(m.slice(2, 4), 16), b = parseInt(m.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}
/* Vertical spine text that shrinks its font until the whole string fits the
   compartment height — so long Ukrainian titles read in full, never clipped. */
function VertFit({ text, baseSize, minSize = 8, weight = 600, family = 'var(--font-serif)', color, letterSpacing = '0.3px', opacity = 1, shadow }) {
  const ref = React.useRef(null);
  React.useLayoutEffect(() => {
    const el = ref.current; if (!el) return;
    let size = baseSize;
    el.style.fontSize = size + 'px';
    let guard = 64;
    while (el.scrollHeight > el.clientHeight + 0.5 && size > minSize && guard-- > 0) {
      size -= 0.5; el.style.fontSize = size + 'px';
    }
  });
  return (
    <span ref={ref} style={{
      writingMode: 'vertical-rl', whiteSpace: 'nowrap', fontFamily: family, fontWeight: weight,
      fontSize: baseSize, letterSpacing, color, opacity, lineHeight: 1,
      maxHeight: '100%', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis',
      textShadow: shadow,
    }}>{text}</span>
  );
}

function BookSpine({ book, width = 120, style = {} }) {
  const ratio = book.ratio || 1.5;
  // deterministic per-book PRNG from id + title
  const sid = (book.id || '') + '|' + (book.title || '');
  let s = 0; for (let i = 0; i < sid.length; i++) s = (s * 131 + sid.charCodeAt(i)) >>> 0;
  const rand = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };

  // a minority of books have slumped — a tiny lean against their neighbours.
  // Derived from a separate hash so it doesn't perturb the binding/colour rolls.
  let s2 = 0; for (let i = 0; i < sid.length; i++) s2 = (s2 * 73 + sid.charCodeAt(i) * 19 + 7) >>> 0;
  const lean = (s2 % 100) < 16 ? ((s2 & 1) ? 1 : -1) * (0.8 + (s2 % 17) / 12) : 0;  // ~0.8–2.2°

  // height carries real shelf variance so the row isn't a picket fence
  const h = Math.round(width * ratio * (book.scale || 1) * (0.9 + rand() * 0.2));
  const thick = Math.round(Math.max(26, Math.min(62, 26 + (book.pages || 320) / 14 + rand() * 8)) * (width / 120));

  // --- colour grading: age the cover hue into warm bound leather/cloth so the
  //     spine sits in the sepia photo instead of floating on top of it ---
  const cover = book.cover || {};
  const raw = book.placeholder ? '#6E5A44' : (cover.bg || '#5E4632');
  const tones = ['#4A3320', '#3A2818', '#573A22', '#43301F', '#6A4A2B', '#332515', '#5A3E26'];
  const tone = tones[Math.floor(rand() * tones.length)];
  // keep only ~30% of the original hue — enough to tell books apart, not to shout
  const base = `color-mix(in oklab, ${raw} 30%, ${tone})`;
  const isLight = _spineLum(raw) > 0.62;
  const ink = isLight ? '#241608' : `color-mix(in oklab, ${cover.ink || '#F2E8DA'} 55%, #d6bf92)`;
  const rule = `color-mix(in oklab, ${cover.rule || '#BBA088'} 55%, #5f4427)`;
  const gilt = '#B59247';                // dull, rubbed antique gold
  const giltHi = '#D8B968';
  const fs = Math.max(9, Math.min(14, Math.round(thick * 0.32)));
  const serif = 'var(--font-serif)';
  const sans = 'var(--font-sans)';

  // barrel curvature: dark where the spine rolls into the boards, faint warm sheen mid
  const barrel = 'linear-gradient(90deg, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0.08) 16%, rgba(255,232,180,0.05) 48%, rgba(0,0,0,0.12) 82%, rgba(0,0,0,0.44) 100%)';
  // vertical room light: head sits in the shelf-above shadow, foot catches warm pooled light
  const roomLight = 'linear-gradient(180deg, rgba(0,0,0,0.34) 0%, rgba(0,0,0,0.05) 14%, rgba(0,0,0,0) 52%, rgba(255,196,116,0.06) 86%, rgba(120,70,24,0.10) 100%)';

  const Title = ({ color, weight = 600, top = '15%', bottom = '16%', shadow }) => (
    <div style={{ position: 'absolute', left: 0, right: 0, top, bottom, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '2% 0' }}>
      <VertFit text={book.title} baseSize={fs} minSize={7} weight={weight} family={serif} color={color}
        letterSpacing="0.2px" opacity={0.92}
        shadow={shadow || (isLight ? '0 1px 0 rgba(255,255,255,0.2)' : '0 1px 1px rgba(0,0,0,0.5)')} />
    </div>
  );
  const pageBlock = (
    <span style={{ position: 'absolute', top: 0, left: 1, right: 1, height: Math.max(3, Math.round(h * 0.015)),
      background: 'linear-gradient(180deg, #E4D2AC 0%, #B89D72 70%, rgba(0,0,0,0.4) 100%)', borderRadius: '2px 2px 0 0', opacity: 0.9 }} />
  );
  const lastName = (book.author || '').trim().split(/\s+/).pop() || '';
  const monogram = (book.author || '').trim().split(/\s+/).filter(Boolean).map((w) => w[0].toUpperCase()).join('');

  // most of the shelf is antique raised-hub leather like the backdrop; a few cloth & paperback
  const r = rand();
  const kind = r < 0.6 ? 'antique' : r < 0.84 ? 'cloth' : 'printed';

  let deco;
  if (kind === 'antique') {
    // raised cords frame ONE roomy gilt title compartment + a surname patch at
    // the foot, so even long Ukrainian titles get their full vertical run.
    const cordTop = 0.135, cordBot = 0.80, cordFoot = 0.875;
    const Hub = ({ p }) => (
      <span style={{ position: 'absolute', left: 0, right: 0, top: `${p * 100}%`, height: Math.max(5, Math.round(h * 0.026)),
        background: 'linear-gradient(180deg, rgba(255,228,172,0.22) 0%, rgba(255,210,150,0.05) 30%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.5) 100%)',
        boxShadow: '0 1px 1px rgba(0,0,0,0.5)' }} />
    );
    deco = (
      <React.Fragment>
        {pageBlock}
        {/* gilt title compartment between the top two cords (dark tooled leather label) */}
        <div style={{ position: 'absolute', left: '12%', right: '12%', top: `${cordTop * 100 + 2.5}%`, bottom: `${(1 - cordBot) * 100 + 2.5}%`,
          background: `color-mix(in oklab, ${base} 58%, #170d06)`, borderRadius: 1,
          boxShadow: `inset 0 0 0 1px rgba(181,146,71,0.3), inset 0 2px 5px rgba(0,0,0,0.5)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '4% 0' }}>
          <VertFit text={book.title} baseSize={fs} minSize={7} weight={700} family={serif} color={gilt}
            shadow="0 1px 0 rgba(0,0,0,0.6)" />
        </div>
        {/* author monogram on the worn foot patch — always fits */}
        <div style={{ position: 'absolute', left: '26%', right: '26%', top: `${cordFoot * 100 + 1.5}%`, bottom: '2.5%',
          background: `color-mix(in oklab, ${base} 50%, #120a05)`, borderRadius: 1,
          boxShadow: `inset 0 0 0 1px rgba(181,146,71,0.26)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '5% 0' }}>
          <VertFit text={monogram} baseSize={Math.max(7, fs - 3)} minSize={5} weight={600} family={serif} color={gilt}
            letterSpacing="1px" opacity={0.9} shadow="0 1px 0 rgba(0,0,0,0.6)" />
        </div>
        <Hub p={cordTop} /><Hub p={cordBot} /><Hub p={cordFoot} />
      </React.Fragment>
    );
  } else if (kind === 'cloth') {
    // cloth hardcover: foil title between debossed double rules, surname foil at the foot
    deco = (
      <React.Fragment>
        {pageBlock}
        <span style={{ position: 'absolute', top: '8%', left: '22%', right: '22%', height: 1, background: gilt, opacity: 0.5, boxShadow: '0 1px 0 rgba(255,255,255,0.1)' }} />
        <span style={{ position: 'absolute', top: '9.6%', left: '28%', right: '28%', height: 1, background: gilt, opacity: 0.28 }} />
        <Title color={ink} weight={600} top="14%" bottom="16%" />
        <span style={{ position: 'absolute', bottom: '9.5%', left: '22%', right: '22%', height: 1, background: gilt, opacity: 0.45 }} />
        <span style={{ position: 'absolute', bottom: '3.5%', left: 0, right: 0, textAlign: 'center', fontFamily: sans, fontWeight: 700,
          fontSize: Math.max(7, Math.round(fs * 0.6)), color: ink, opacity: 0.62, letterSpacing: '0.5px' }}>{lastName[0] || ''}</span>
      </React.Fragment>
    );
  } else {
    // paperback: contrasting cap band at the head, printed title, publisher mark at foot
    const bandCol = `color-mix(in oklab, ${base} 40%, #160d06)`;
    const titleCol = isLight ? '#241608' : ink;
    const capH = 7 + rand() * 2.5;
    deco = (
      <React.Fragment>
        <span style={{ position: 'absolute', top: 0, left: 0, right: 0, height: `${capH}%`, background: bandCol, opacity: 0.92 }} />
        <span style={{ position: 'absolute', top: `${capH + 0.6}%`, left: '18%', right: '18%', height: 1, background: gilt, opacity: 0.45 }} />
        <Title color={titleCol} weight={600} top={`${capH + 6}%`} bottom="17%" />
        <span style={{ position: 'absolute', bottom: '4.5%', left: '32%', right: '32%', height: Math.max(6, thick * 0.16), borderRadius: 1, border: `1px solid ${titleCol}`, opacity: 0.45 }} />
      </React.Fragment>
    );
  }

  return (
    <div className="dl-spine" style={{ width: thick, height: h, background: base, transform: lean ? `rotate(${lean}deg)` : undefined, transformOrigin: 'bottom center', ...style }}>
      <span style={{ position: 'absolute', inset: 0, background: barrel, pointerEvents: 'none' }} />
      {deco}
      <div className="mottle"></div>
      <div className="cloth"></div>
      <div className="wear"></div>
      <span style={{ position: 'absolute', inset: 0, background: roomLight, pointerEvents: 'none', zIndex: 5 }} />
      <span style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: Math.max(5, Math.round(h * 0.03)), background: 'linear-gradient(0deg, rgba(0,0,0,0.5), rgba(0,0,0,0))', zIndex: 5 }} />
    </div>
  );
}

Object.assign(window, { BookCover, BookSpine, StatusPill, StatChip, Star, StarRating, ChallengeBar, BrandMark });
