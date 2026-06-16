/* DiLibris — canvas-only framings (static library + static book card) and canvas assembly */

function CanvasLibrary({ wide }) {
  const { books, shelves } = window.DILIBRIS;
  const shown = wide ? shelves.slice(0, 3) : shelves.slice(0, 3);
  const bw = wide ? 100 : 78;
  return (
    <div style={{ background: 'var(--bg-room)', minHeight: '100%', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'var(--lamp-glow)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 90, background: 'linear-gradient(180deg, rgba(58,40,24,0.18) 0, rgba(58,40,24,0) 14%), repeating-linear-gradient(90deg, rgba(94,64,41,0.12) 0 1.5px, rgba(94,64,41,0) 1.5px 120px), linear-gradient(180deg, #CBA782, #AD875F)', pointerEvents: 'none' }} />
      <div style={{ position: 'relative' }}>
        <MiniHeader active="Бібліотека" compact={!wide} />
        <div style={{ padding: wide ? '20px 24px 60px' : '16px 12px 50px' }}>
          <div style={{ maxWidth: 920, margin: '0 auto 16px', padding: wide ? '0' : '0 6px' }}>
            <SectionTitle kicker="Твоя бібліотека" title="Вечір удома з книгами" />
          </div>
          <Bookcase shelves={shown} books={books} bookWidth={bw} showTitles={false} onPick={() => {}} onAddBook={() => {}} />
        </div>
      </div>
    </div>
  );
}

function CanvasBookCard({ wide }) {
  const book = window.DILIBRIS.books[0];
  const W = wide ? 660 : 375;
  return (
    <div style={{ width: W, background: 'var(--bg-card)', borderRadius: wide ? 'var(--r-xl)' : 'var(--r-xl) var(--r-xl) 0 0', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
      {!wide && <div style={{ width: 40, height: 4, borderRadius: 999, background: 'var(--line-strong)', margin: '10px auto 0' }} />}
      <div style={{ display: 'flex', gap: 16, padding: wide ? '24px 28px 18px' : '16px 18px 14px', alignItems: 'flex-start' }}>
        <BookCover book={book} width={wide ? 92 : 76} />
        <div style={{ flex: 1, minWidth: 0, paddingTop: 4 }}>
          <h2 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 'var(--fs-h2)', lineHeight: 'var(--lh-tight)', color: 'var(--text-main)' }}>{book.title}</h2>
          <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 'var(--fs-body)', color: 'var(--text-muted)', margin: '4px 0 10px' }}>{book.author}</div>
          <StatusPill status={book.status} size="sm" />
        </div>
        <div className="dl-close" style={{ display: 'grid', placeItems: 'center' }}>✕</div>
      </div>
      <div style={{ display: 'flex', gap: 8, padding: wide ? '0 28px 16px' : '0 18px 14px' }}>
        <StatChip label="прогрес" value={book.progress + '%'} accent="var(--accent-lime-deep)" />
        <StatChip label="днів читання" value={book.days} />
        <StatChip label="загалом" value={Math.round(book.minutes / 60) + ' год'} accent="var(--gold-deep)" />
      </div>
      <div style={{ padding: wide ? '0 28px' : '0 18px' }}>
        <Segmented tabs={['Прогрес', 'Відгук', 'Нотатки', 'Сесії']} active="Прогрес" onChange={() => {}} />
      </div>
      <div style={{ padding: wide ? '20px 28px 8px' : '16px 18px 8px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <Field label="Статус"><Choice options={['Хочу прочитати', 'Читаю зараз', 'Прочитано']} value="Читаю зараз" onChange={() => {}} /></Field>
        <Field label="Формат"><Choice options={['Паперова', 'Електронна']} value="Паперова" onChange={() => {}} /></Field>
        <Field label="Оцінка"><StarRating value={4.5} size={28} /></Field>
        <Toggle checked={true} onChange={() => {}} label="Рахувати в challenge" hint="Книга зараховується у твою річну ціль" />
      </div>
      <div style={{ padding: wide ? '16px 28px 22px' : '12px 18px 20px', borderTop: '1px solid var(--line)', display: 'flex', gap: 12, marginTop: 8 }}>
        <span className="dl-ghost" style={{ display: 'inline-block' }}>Скасувати</span>
        <button className="dl-primary" style={{ flex: 1 }}>Зберегти</button>
      </div>
    </div>
  );
}

/* center a card on a dim room so the modal/sheet reads in-context */
function CardStage({ wide, children }) {
  return (
    <div style={{ minHeight: '100%', background: 'var(--bg-overlay)', display: 'flex', alignItems: wide ? 'center' : 'flex-end', justifyContent: 'center', padding: wide ? 24 : 0 }}>
      {children}
    </div>
  );
}

function CanvasApp() {
  return (
    <DesignCanvas>
      <DCSection id="library" title="Бібліотека" subtitle="Головний екран — кімната з полицями">
        <DCArtboard id="lib-m" label="Мобільна · 375" width={375} height={900}><CanvasLibrary /></DCArtboard>
        <DCArtboard id="lib-d" label="Десктоп · 1280" width={1280} height={920}><CanvasLibrary wide /></DCArtboard>
      </DCSection>

      <DCSection id="card" title="Картка книги" subtitle="Одна цілісна картка — bottom sheet / модалка">
        <DCArtboard id="card-m" label="Мобільна · bottom sheet" width={375} height={760}><CardStage><CanvasBookCard /></CardStage></DCArtboard>
        <DCArtboard id="card-d" label="Десктоп · модалка" width={760} height={720}><CardStage wide><CanvasBookCard wide /></CardStage></DCArtboard>
      </DCSection>

      <DCSection id="dash" title="Дашборд" subtitle="Теплі, дружні підсумки року">
        <DCArtboard id="dash-m" label="Мобільна · 375" width={375} height={1180}><Dashboard /></DCArtboard>
        <DCArtboard id="dash-d" label="Десктоп · 1280" width={1280} height={900}><Dashboard wide /></DCArtboard>
      </DCSection>

      <DCSection id="buddy" title="Спільне читання" subtitle="Список груп і деталі групи">
        <DCArtboard id="buddy-m" label="Список · 375" width={375} height={720}><BuddyList /></DCArtboard>
        <DCArtboard id="buddy-d" label="Група · 1280" width={1280} height={620}><BuddyDetail wide /></DCArtboard>
      </DCSection>

      <DCSection id="auth" title="Вхід" subtitle="Magic link — тепло й мінімально">
        <DCArtboard id="auth-m" label="Мобільна · 375" width={375} height={620}><Auth /></DCArtboard>
        <DCArtboard id="auth-d" label="Десктоп · 1280" width={1280} height={620}><Auth wide /></DCArtboard>
      </DCSection>

      <DCSection id="empty" title="Порожні стани" subtitle="Перший запуск і порожня полиця">
        <DCArtboard id="empty-m" label="Перша кімната · 375" width={375} height={620}><EmptyRoom /></DCArtboard>
        <DCArtboard id="empty-d" label="Перша кімната · 1280" width={1280} height={560}><EmptyRoom wide /></DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<CanvasApp />);
