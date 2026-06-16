/* DiLibris — Нотатки: every quote & thought across the whole library, one
   warm feed. Filter by kind, search the text, jump to the book. */

function NotesFeed({ onOpenBook }) {
  const dl = useDL();
  const wide = !useIsMobile(760);
  const [kind, setKind] = React.useState('Усі');
  const [q, setQ] = React.useState('');

  // flatten store notes (keyed by bookId) → [{note, book}]
  const all = [];
  Object.entries(dl.notes).forEach(([bookId, list]) => {
    const book = dl.books.find((b) => b.id === bookId);
    if (!book) return;
    list.forEach((n) => all.push({ n, book }));
  });

  const term = q.trim().toLowerCase();
  let items = all.filter(({ n, book }) => {
    if (kind !== 'Усі' && n.type !== kind) return false;
    if (term && !((n.text + ' ' + book.title + ' ' + book.author).toLowerCase().includes(term))) return false;
    return true;
  });

  const counts = {
    'Усі': all.length,
    'Цитата': all.filter((x) => x.n.type === 'Цитата').length,
    'Думка': all.filter((x) => x.n.type === 'Думка').length,
    'Загальна': all.filter((x) => x.n.type === 'Загальна').length,
  };

  return (
    <div className="dl-page" style={{ maxWidth: 900 }}>
      <PageHead eyebrow="На полях" title="Нотатки" sub="Цитати й думки з усіх книг — зібрані в одному місці" />

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 18 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['Усі', 'Цитата', 'Думка', 'Загальна'].map((k) => (
            <button key={k} onClick={() => setKind(k)} className="dl-notefilter" data-active={kind === k}>
              {k}<span style={{ opacity: 0.6, marginLeft: 6 }}>{counts[k]}</span>
            </button>
          ))}
        </div>
        <span style={{ flex: 1 }} />
        <div className="dl-libsearch" style={{ flex: '0 1 240px', background: 'var(--bg-card)', border: '1px solid var(--line-strong)' }}>
          <span aria-hidden="true" style={{ color: 'var(--text-faint)' }}>⌕</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Шукати в нотатках…" style={{ color: 'var(--text-main)' }} />
        </div>
      </div>

      {items.length === 0 ? (
        <Panel soft style={{ textAlign: 'center', padding: '40px 24px', fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>
          Тут поки порожньо — додай нотатку з картки будь-якої книги.
        </Panel>
      ) : (
        <div style={{ columns: wide ? '2 320px' : '1', columnGap: 16 }}>
          {items.map(({ n, book }, i) => (
            <div key={book.id + (n.id || i)} style={{ breakInside: 'avoid', marginBottom: 16 }}>
              <Panel onClick={() => onOpenBook(book)} style={{ padding: 18 }}>
                <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                  <NoteBadge tone={n.type === 'Цитата' ? 'quote' : n.type === 'Думка' ? 'thought' : 'general'}>{n.type}</NoteBadge>
                  <NoteBadge tone={n.vis === 'Публічна' ? 'pub' : 'priv'}>{n.vis}</NoteBadge>
                </div>
                <p style={{ margin: 0, fontFamily: n.type === 'Цитата' ? 'var(--font-serif)' : 'var(--font-sans)', fontStyle: n.type === 'Цитата' ? 'italic' : 'normal', fontSize: 'var(--fs-body)', lineHeight: 'var(--lh-body)', color: 'var(--text-main)' }}>{n.text}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14, paddingTop: 13, borderTop: '1px solid var(--line)' }}>
                  <BookCover book={book} width={28} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 'var(--fs-sm)', color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{book.title}</div>
                    <div style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>{book.author}</div>
                  </div>
                </div>
              </Panel>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { NotesFeed });
