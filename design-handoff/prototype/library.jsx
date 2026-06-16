/* DiLibris — real photo library behind, books standing spine-out on wooden
   shelves. The room photo is the atmosphere; each shelf bay has a dark recessed
   back and a lit wooden board the books actually stand on. */

function Room() {
  return (
    <div className="dl-room" aria-hidden="true">
      <div className="dl-photo"></div>
      <div className="dl-photo-grade"></div>
    </div>
  );
}

/* one book on the shelf — spine-out (default) or face-out cover */
function CoverTile({ book, width, onPick, showTitle, real, view }) {
  const [hover, setHover] = React.useState(false);
  const ref = React.useRef(null);
  const st = window.DILIBRIS.STATUS[book.status];
  const spine = view === 'spine';
  return (
    <div
      ref={ref}
      className={'dl-tile' + (spine ? ' is-spine' : '')}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => onPick(book, ref.current.querySelector('.dl-cv').getBoundingClientRect())}
      style={{ zIndex: hover ? 8 : 1 }}
    >
      {showTitle && (
        <div className="dl-tip" style={{ opacity: hover ? 1 : 0 }}>
          <span className="t">{book.title}</span>
          <span className="a">{book.author}</span>
        </div>
      )}
      <div className="dl-cv" style={{ transform: hover ? 'translateY(-12px)' : 'none' }}>
        {spine
          ? <BookSpine book={book} width={width} style={{ boxShadow: hover ? 'var(--shadow-book-hover)' : '2px 2px 6px rgba(0,0,0,0.5)' }} />
          : <BookCover book={book} width={width} real={real}
              style={{ boxShadow: hover ? 'var(--shadow-book-hover)' : 'var(--shadow-book)' }} />}
        {st && book.status !== 'want' && (
          <span className="dl-tile-dot" style={{ background: `var(--status-${st.cssVar})` }} />
        )}
        {book.progress > 0 && book.progress < 100 && (
          <span className="dl-tile-prog"><i style={{ width: book.progress + '%' }} /></span>
        )}
      </div>
    </div>
  );
}

/* one shelf = labelled bay of books on a wooden board */
function ShelfRail({ shelf, books, bookWidth, onPick, onAddBook, showTitles, real, view, filter, sort }) {
  const dl = useDL();
  const [menu, setMenu] = React.useState(false);
  const [editing, setEditing] = React.useState(false);
  const [name, setName] = React.useState(shelf.label);
  const st = shelf.status ? window.DILIBRIS.STATUS[shelf.status] : null;
  const showStatus = st && st.label !== shelf.label;
  const spine = view === 'spine';

  let list = shelf.bookIds.map((id) => books.find((b) => b.id === id)).filter(Boolean);
  const term = (filter || '').trim().toLowerCase();
  if (term) list = list.filter((b) => (b.title + ' ' + b.author).toLowerCase().includes(term));
  if (sort === 'Назва') list = [...list].sort((a, b) => a.title.localeCompare(b.title, 'uk'));
  else if (sort === 'Прогрес') list = [...list].sort((a, b) => (b.progress || 0) - (a.progress || 0));

  const commitName = () => { const v = name.trim(); if (v && v !== shelf.label) dl.renameShelf(shelf.id, v); else setName(shelf.label); setEditing(false); };

  // when a text filter is active and this shelf has no matches, fold it away
  if (term && list.length === 0) return null;

  return (
    <section className="dl-shelf" data-screen-label={shelf.label}>
      <div className="dl-shelf-head">
        <div className="dl-shelf-titles">
          {editing ? (
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)} onBlur={commitName}
              onKeyDown={(e) => { if (e.key === 'Enter') commitName(); if (e.key === 'Escape') { setName(shelf.label); setEditing(false); } }}
              style={{ font: 'inherit', fontFamily: 'var(--font-serif)', fontWeight: 700, color: 'var(--ink-room)', background: 'rgba(0,0,0,0.25)', border: '1px solid var(--ink-room-soft)', borderRadius: 6, padding: '2px 8px', outline: 'none', maxWidth: 260 }} />
          ) : (
            <h2 onDoubleClick={() => setEditing(true)} title="Подвійний клік — перейменувати">{shelf.label}</h2>
          )}
          <span className="dl-count">{list.length}</span>
          {showStatus && <StatusPill status={shelf.status} size="sm" />}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }}>
          <button className="dl-addbook" onClick={() => onAddBook(shelf)}>+ Книга</button>
          <button className="dl-addbook" aria-label="Опції полиці" onClick={() => setMenu((m) => !m)} style={{ padding: '6px 10px' }}>⋯</button>
          {menu && (
            <>
              <div onClick={() => setMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 30 }} />
              <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 31, background: 'var(--bg-card)', border: '1px solid var(--line)', borderRadius: 'var(--r-md)', boxShadow: 'var(--shadow-card)', padding: 6, minWidth: 170, animation: 'dl-card-in var(--dur-fast) var(--ease-warm)' }}>
                <ShelfMenuItem onClick={() => { setMenu(false); setEditing(true); }}>Перейменувати</ShelfMenuItem>
                <ShelfMenuItem onClick={() => { setMenu(false); onAddBook(shelf); }}>Додати книгу</ShelfMenuItem>
                <div style={{ height: 1, background: 'var(--line)', margin: '6px 4px' }} />
                <ShelfMenuItem danger onClick={() => { setMenu(false); dl.deleteShelf(shelf.id); }}>Видалити полицю</ShelfMenuItem>
              </div>
            </>
          )}
        </div>
      </div>
      <div className="dl-stage">
        <div className="dl-back"></div>
        <div className={'dl-rail dl-shelf-scroll' + (spine ? ' is-spine' : '')}>
          {list.length === 0
            ? <button className="dl-empty dl-empty-btn" onClick={() => onAddBook(shelf)}>Поки порожньо — додай першу книгу</button>
            : list.map((b) => (
                <CoverTile key={b.id} book={b} width={bookWidth} onPick={onPick} showTitle={showTitles} real={real} view={view} />
              ))}
        </div>
        <div className="dl-board"><span className="lip"></span></div>
      </div>
    </section>
  );
}

function ShelfMenuItem({ children, onClick, danger }) {
  return (
    <button onClick={onClick} style={{
      display: 'block', width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer', background: 'transparent',
      padding: '9px 12px', borderRadius: 'var(--r-sm)', fontFamily: 'var(--font-sans)', fontWeight: 600,
      fontSize: 'var(--fs-sm)', color: danger ? 'var(--status-dnf)' : 'var(--text-main)',
    }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card-soft)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >{children}</button>
  );
}

function Library({ shelves, books, bookWidth, onPick, onAddBook, showTitles, real, view }) {
  const [filter, setFilter] = React.useState('');
  const [sort, setSort] = React.useState('За полицею');
  return (
    <div className="dl-library">
      <div className="dl-libbar">
        <div className="dl-libsearch">
          <span aria-hidden="true">⌕</span>
          <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Шукати книгу або автора…" />
          {filter && <button onClick={() => setFilter('')} aria-label="Очистити">✕</button>}
        </div>
        <div className="dl-libsort">
          {['За полицею', 'Назва', 'Прогрес'].map((o) => (
            <button key={o} className={sort === o ? 'is-active' : ''} onClick={() => setSort(o)}>{o}</button>
          ))}
        </div>
      </div>
      {shelves.map((sh) => (
        <ShelfRail key={sh.id} shelf={sh} books={books} bookWidth={bookWidth}
          onPick={onPick} onAddBook={onAddBook} showTitles={showTitles} real={real} view={view}
          filter={filter} sort={sort} />
      ))}
    </div>
  );
}

Object.assign(window, { Room, Library, ShelfRail, CoverTile });
