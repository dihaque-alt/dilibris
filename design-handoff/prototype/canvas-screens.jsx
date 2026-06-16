/* DiLibris — additional screens for the design canvas (Dashboard, Buddy, Auth, empties) */

function MiniHeader({ active = 'Бібліотека', compact }) {
  const links = ['Бібліотека', 'Дашборд', 'Спільне читання'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: compact ? 8 : 16, padding: compact ? '12px 16px' : '0 24px', height: compact ? 'auto' : 64, borderBottom: '1px solid var(--line)', background: 'rgba(249,246,240,0.9)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <BrandMark />
        <span style={{ fontFamily: 'var(--font-brand)', fontWeight: 700, fontSize: compact ? '1.1rem' : '1.3rem', color: 'var(--text-main)' }}>DiLibris</span>
      </div>
      {!compact && (
        <nav style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
          {links.map((l) => (
            <span key={l} style={{ padding: '8px 14px', borderRadius: 'var(--r-pill)', fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 'var(--fs-sm)', color: active === l ? 'var(--text-main)' : 'var(--text-muted)', background: active === l ? 'var(--bg-card)' : 'transparent', boxShadow: active === l ? 'var(--shadow-book)' : 'none' }}>{l}</span>
          ))}
        </nav>
      )}
      <span style={{ flex: 1 }} />
      {!compact && <><span style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>olena@dilibris.app</span><span className="dl-ghost" style={{ display: 'inline-block' }}>Вийти</span></>}
    </div>
  );
}

function SectionTitle({ kicker, title }) {
  return (
    <div style={{ marginBottom: 18 }}>
      {kicker && <div style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>{kicker}</div>}
      <h1 style={{ margin: '4px 0 0', fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 'var(--fs-h1)', color: 'var(--text-main)' }}>{title}</h1>
    </div>
  );
}

function Panel({ children, style }) {
  return <div style={{ background: 'var(--bg-card)', border: '1px solid var(--line)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-card)', padding: 20, ...style }}>{children}</div>;
}

/* ---------------- Dashboard ---------------- */
function Dashboard({ wide }) {
  const months = ['Січ', 'Лют', 'Бер', 'Кві', 'Тра', 'Чер', 'Лип', 'Сер', 'Вер', 'Жов', 'Лис', 'Гру'];
  const data = [1, 0, 2, 1, 3, 2, 0, 0, 0, 0, 0, 0];
  const max = 3;
  const authors = [['Сергій Жадан', 3], ['Ліна Костенко', 2], ['Леся Українка', 1], ['Марія Матіос', 1]];
  const langs = [['Українська', 78], ['Англійська', 18], ['Польська', 4]];
  return (
    <div style={{ background: 'var(--bg-room)', minHeight: '100%' }}>
      <MiniHeader active="Дашборд" compact={!wide} />
      <div style={{ padding: wide ? '28px 32px 40px' : '20px 16px 32px', maxWidth: wide ? 1180 : 'none', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <SectionTitle kicker="Твій читацький рік" title="Дашборд" />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 'var(--r-pill)', border: '1.5px solid var(--line-strong)', background: 'var(--bg-card)', fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 'var(--fs-sm)', color: 'var(--text-main)' }}>Рік&nbsp;<b style={{ fontFamily: 'var(--font-serif)' }}>2026</b><span style={{ color: 'var(--text-faint)' }}>▾</span></div>
        </div>

        {/* challenge */}
        <Panel style={{ marginTop: 8, background: 'linear-gradient(135deg, #FFFCF2, #FFF6DE)', borderColor: '#F0E4BE' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-sm)', color: '#8A6D14', fontWeight: 600 }}>Челендж 2026</div>
              <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: '1.9rem', color: 'var(--text-main)', marginTop: 2 }}>12 з 24 книг</div>
            </div>
            <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: '2.4rem', color: 'var(--gold-deep)' }}>50%</div>
          </div>
          <ChallengeBar value={12} target={24} height={16} />
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-xs)', color: '#8A6D14', marginTop: 8 }}>Ти на 1 книгу попереду графіка — так тримати ✦</div>
        </Panel>

        {/* summary stats */}
        <div style={{ display: 'grid', gridTemplateColumns: wide ? 'repeat(5, 1fr)' : 'repeat(2, 1fr)', gap: 10, marginTop: 16 }}>
          {[['12', 'книг'], ['3 248', 'сторінок'], ['64 год', 'часу'], ['4.4', 'сер. оцінка'], ['9 днів', 'найдовша пауза']].map(([v, l]) => (
            <Panel key={l} style={{ padding: 16 }}>
              <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: '1.6rem', color: 'var(--text-main)', lineHeight: 1 }}>{v}</div>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', marginTop: 6 }}>{l}</div>
            </Panel>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: wide ? '1.6fr 1fr' : '1fr', gap: 16, marginTop: 16 }}>
          {/* bar chart */}
          <Panel>
            <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 'var(--fs-h3)', color: 'var(--text-main)', marginBottom: 16 }}>Книги за місяць</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: wide ? 14 : 6, height: 150 }}>
              {data.map((d, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: '100%', maxWidth: 34, height: Math.max(4, (d / max) * 120), borderRadius: '6px 6px 0 0', background: d ? 'linear-gradient(180deg, var(--accent-lime), var(--accent-lime-deep))' : 'var(--line)', transition: 'height var(--dur-base)' }} />
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: '10px', color: 'var(--text-faint)' }}>{months[i]}</span>
                </div>
              ))}
            </div>
          </Panel>
          {/* format breakdown */}
          <Panel>
            <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 'var(--fs-h3)', color: 'var(--text-main)', marginBottom: 16 }}>Формат</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <div style={{ width: 92, height: 92, borderRadius: '50%', background: 'conic-gradient(var(--accent-lime) 0 67%, var(--status-done) 67% 100%)', display: 'grid', placeItems: 'center' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--bg-card)', display: 'grid', placeItems: 'center', fontFamily: 'var(--font-serif)', fontWeight: 700, color: 'var(--text-main)' }}>12</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-sm)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><i style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--accent-lime)' }} />Паперова · 8</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><i style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--status-done)' }} />Електронна · 4</span>
              </div>
            </div>
          </Panel>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: wide ? '1fr 1fr' : '1fr', gap: 16, marginTop: 16 }}>
          <Panel>
            <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 'var(--fs-h3)', color: 'var(--text-main)', marginBottom: 14 }}>Топ авторів</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {authors.map(([a, n]) => (
                <div key={a}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-sm)', color: 'var(--text-main)', marginBottom: 5 }}><span>{a}</span><span style={{ color: 'var(--text-muted)' }}>{n}</span></div>
                  <div style={{ height: 8, borderRadius: 999, background: 'var(--accent-lime-light)' }}><div style={{ height: '100%', width: (n / 3) * 100 + '%', borderRadius: 999, background: 'var(--accent-lime)' }} /></div>
                </div>
              ))}
            </div>
          </Panel>
          <Panel>
            <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 'var(--fs-h3)', color: 'var(--text-main)', marginBottom: 14 }}>Мови</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {langs.map(([a, n]) => (
                <div key={a}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-sm)', color: 'var(--text-main)', marginBottom: 5 }}><span>{a}</span><span style={{ color: 'var(--text-muted)' }}>{n}%</span></div>
                  <div style={{ height: 8, borderRadius: 999, background: 'var(--gold-light)' }}><div style={{ height: '100%', width: n + '%', borderRadius: 999, background: 'var(--gold-highlight)' }} /></div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Buddy read ---------------- */
function Avatar({ name, color }) {
  return <div style={{ width: 34, height: 34, borderRadius: '50%', background: color, color: '#fff', display: 'grid', placeItems: 'center', fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 'var(--fs-sm)', flex: '0 0 auto' }}>{name[0]}</div>;
}
function BuddyList({ wide }) {
  const groups = [
    { name: 'Жадан-клуб', book: 'Інтернат', members: 4, color: 'var(--status-reread)', pct: 62 },
    { name: 'Сестри по книгах', book: 'Польові дослідження', members: 3, color: 'var(--status-dnf)', pct: 40 },
    { name: 'Повільне читання', book: 'Місто', members: 6, color: 'var(--status-done)', pct: 28 },
  ];
  return (
    <div style={{ background: 'var(--bg-room)', minHeight: '100%' }}>
      <MiniHeader active="Спільне читання" compact={!wide} />
      <div style={{ padding: wide ? '28px 32px 40px' : '20px 16px 32px', maxWidth: wide ? 900 : 'none', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
          <SectionTitle kicker="Читаємо разом" title="Спільне читання" />
          <span className="dl-primary" style={{ display: 'inline-block' }}>+ Створити</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: wide ? '1fr 1fr' : '1fr', gap: 14, marginTop: 8 }}>
          {groups.map((g) => (
            <Panel key={g.name} style={{ padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Avatar name={g.name} color={g.color} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 'var(--fs-title)', color: 'var(--text-main)' }}>{g.name}</div>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>{g.members} учасники · «{g.book}»</div>
                </div>
              </div>
              <div style={{ height: 8, borderRadius: 999, background: 'var(--accent-lime-light)', marginTop: 14 }}><div style={{ height: '100%', width: g.pct + '%', borderRadius: 999, background: 'var(--accent-lime)' }} /></div>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', marginTop: 6 }}>Середній прогрес {g.pct}%</div>
            </Panel>
          ))}
        </div>
        <Panel style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', background: 'var(--bg-card-soft)' }}>
          <div style={{ flex: 1, minWidth: 180, fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>Маєш запрошення? Долучайся за лінком.</div>
          <span className="dl-ghost" style={{ display: 'inline-block' }}>Долучитися за лінком</span>
        </Panel>
      </div>
    </div>
  );
}
function BuddyDetail({ wide }) {
  const members = [['Олена', 'var(--status-reading)', 62], ['Іра', 'var(--status-dnf)', 88], ['Маркіян', 'var(--status-done)', 41], ['Соломія', 'var(--accent-lime)', 55]];
  return (
    <div style={{ background: 'var(--bg-room)', minHeight: '100%' }}>
      <MiniHeader active="Спільне читання" compact={!wide} />
      <div style={{ padding: wide ? '24px 32px 40px' : '18px 16px 32px', maxWidth: wide ? 980 : 'none', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
          <BookCover book={window.DILIBRIS.books[6]} width={56} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>Жадан-клуб · «Інтернат»</div>
            <h1 style={{ margin: '2px 0 0', fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 'var(--fs-h2)', color: 'var(--text-main)' }}>Читаємо до 20 червня</h1>
          </div>
          {wide && <div style={{ display: 'flex', gap: 8 }}><span className="dl-ghost" style={{ display: 'inline-block' }}>Копіювати лінк</span><span className="dl-ghost" style={{ display: 'inline-block' }}>Архівувати</span></div>}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: wide ? '1fr 1fr' : '1fr', gap: 16 }}>
          <Panel>
            <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 'var(--fs-h3)', marginBottom: 14, color: 'var(--text-main)' }}>Прогрес учасників</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {members.map(([n, c, p]) => (
                <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Avatar name={n} color={c} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-sm)', marginBottom: 5, color: 'var(--text-main)' }}><span>{n}</span><span style={{ color: 'var(--text-muted)' }}>{p}%</span></div>
                    <div style={{ height: 7, borderRadius: 999, background: 'var(--line)' }}><div style={{ height: '100%', width: p + '%', borderRadius: 999, background: c }} /></div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
          <Panel style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 'var(--fs-h3)', marginBottom: 14, color: 'var(--text-main)' }}>Чат</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
              {[['Іра', 'Розділ про спортзал — це щось 😮'], ['Олена', 'Дочитую сьогодні, не спойлерте!'], ['Маркіян', 'Тримаюсь, наздожену на вихідних']].map(([n, m], i) => (
                <div key={i} style={{ background: 'var(--bg-card-soft)', border: '1px solid var(--line)', borderRadius: 'var(--r-md)', padding: '10px 12px' }}>
                  <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 'var(--fs-xs)', color: 'var(--accent-lime-deep)' }}>{n}</div>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-sm)', color: 'var(--text-main)', marginTop: 2 }}>{m}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12, padding: '11px 14px', border: '1.5px solid var(--line-strong)', borderRadius: 'var(--r-md)', fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-sm)', color: 'var(--text-faint)' }}>Написати повідомлення…</div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Auth ---------------- */
function Auth({ wide }) {
  return (
    <div style={{ background: 'var(--lamp-glow)', minHeight: '100%', display: 'grid', placeItems: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 380, textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
          <BrandMark />
          <span style={{ fontFamily: 'var(--font-brand)', fontWeight: 700, fontSize: '1.8rem', color: 'var(--text-main)' }}>DiLibris</span>
        </div>
        <Panel style={{ padding: 28, textAlign: 'left' }}>
          <h1 style={{ margin: '0 0 6px', fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 'var(--fs-h2)', color: 'var(--text-main)' }}>Твоя віртуальна бібліотека</h1>
          <p style={{ margin: '0 0 22px', fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-sm)', color: 'var(--text-muted)', lineHeight: 'var(--lh-body)' }}>Залиш пошту — надішлемо чарівний лінк для входу. Жодних паролів.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Field label="Пошта"><div style={{ padding: '13px 14px', border: '1.5px solid var(--line-strong)', borderRadius: 'var(--r-md)', fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-body)', color: 'var(--text-faint)' }}>olena@dilibris.app</div></Field>
            <button className="dl-primary" style={{ padding: '13px', fontSize: 'var(--fs-body)' }}>Надіслати лінк</button>
          </div>
        </Panel>
        <div style={{ marginTop: 16, fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-xs)', color: 'var(--text-faint)' }}>Безкоштовно назавжди · без реклами</div>
      </div>
    </div>
  );
}

/* ---------------- Empty room (first run) ---------------- */
function EmptyRoom({ wide }) {
  return (
    <div style={{ background: 'var(--bg-room)', minHeight: '100%' }}>
      <MiniHeader compact={!wide} />
      <div style={{ display: 'grid', placeItems: 'center', padding: wide ? '80px 32px' : '56px 20px', minHeight: 420 }}>
        <div style={{ textAlign: 'center', maxWidth: 420 }}>
          <svg viewBox="0 0 120 80" width="160" height="106" style={{ marginBottom: 8 }} aria-hidden="true">
            <rect x="10" y="40" width="100" height="10" rx="2" fill="var(--wood-main)" />
            <rect x="10" y="40" width="100" height="3" fill="var(--wood-light)" />
            <rect x="14" y="50" width="6" height="14" fill="var(--wood-depth)" />
            <rect x="100" y="50" width="6" height="14" fill="var(--wood-depth)" />
            <rect x="34" y="20" width="14" height="20" rx="2" fill="none" stroke="var(--line-strong)" strokeWidth="2" strokeDasharray="3 4" />
            <rect x="53" y="20" width="14" height="20" rx="2" fill="none" stroke="var(--line-strong)" strokeWidth="2" strokeDasharray="3 4" />
            <rect x="72" y="20" width="14" height="20" rx="2" fill="none" stroke="var(--line-strong)" strokeWidth="2" strokeDasharray="3 4" />
          </svg>
          <h1 style={{ margin: '4px 0 8px', fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 'var(--fs-h1)', color: 'var(--text-main)' }}>Тут з’явиться твоя кімната з книгами</h1>
          <p style={{ margin: '0 0 22px', fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-body)', color: 'var(--text-muted)', lineHeight: 'var(--lh-body)' }}>Створи першу полицю — і почни розставляти улюблені книжки.</p>
          <button className="dl-primary" style={{ padding: '12px 22px', fontSize: 'var(--fs-body)' }}>+ Створити полицю</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { MiniHeader, SectionTitle, Panel, Dashboard, BuddyList, BuddyDetail, Auth, EmptyRoom, Avatar });
