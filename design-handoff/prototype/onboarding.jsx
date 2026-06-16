/* DiLibris — magic-link sign-in. Shown full-screen over the evening room
   until the reader "enters" their library. No passwords: email → лист →
   (підтвердження лінку) → коротке «про тебе» → бібліотека. */

function Onboarding() {
  const dl = useDL();
  const mobile = useIsMobile(760);
  const [step, setStep] = React.useState('email'); // email | sent | who
  const [name, setName] = React.useState(dl.settings.name || '');
  const [email, setEmail] = React.useState(dl.settings.email || '');
  const [target, setTarget] = React.useState(dl.settings.yearTarget || 24);

  const emailValid = /\S+@\S+\.\S+/.test(email.trim());
  const sendLink = () => { if (emailValid) setStep('sent'); };
  const enter = () => dl.completeOnboarding({ name: name.trim() || 'Читач', email: email.trim() || 'reader@dilibris.app', yearTarget: target });

  const field = {
    width: '100%', boxSizing: 'border-box', padding: '13px 16px', border: '1.5px solid var(--line-strong)', borderRadius: 'var(--r-md)',
    background: 'var(--bg-card)', fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-body)', color: 'var(--text-main)', outline: 'none',
  };
  const label = { display: 'block', fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-xs)', fontWeight: 600, letterSpacing: '0.4px', textTransform: 'uppercase', color: 'var(--text-faint)', marginBottom: 6 };

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      <Room />
      <div className="dl-grade" aria-hidden="true"></div>
      <div style={{ position: 'relative', zIndex: 2, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: mobile ? 18 : 28 }}>
        <div style={{
          width: 'min(460px, 96vw)', background: 'radial-gradient(130% 55% at 50% 0%, rgba(255,238,202,0.5), rgba(255,238,202,0) 58%), linear-gradient(180deg, #FBF5E9 0%, #F5EDDB 100%)',
          borderRadius: 'var(--r-xl)', boxShadow: '0 40px 90px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.85)',
          padding: mobile ? '28px 22px' : '40px 38px', animation: 'dl-card-in var(--dur-base) var(--ease-warm)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, justifyContent: 'center', marginBottom: 22 }}>
            <BrandMark />
            <span style={{ fontFamily: 'var(--font-brand)', fontWeight: 700, fontSize: '1.6rem', color: 'var(--text-main)', letterSpacing: '0.3px' }}>DiLibris</span>
          </div>

          {step === 'email' && (
            <React.Fragment>
              <h1 style={{ margin: '0 0 8px', fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 'clamp(1.6rem, 4vw, 2rem)', color: 'var(--text-main)', textAlign: 'center', lineHeight: 1.15 }}>Твоя віртуальна бібліотека</h1>
              <p style={{ margin: '0 0 26px', fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-body)', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 'var(--lh-body)' }}>Що читаєш, що відклала, з ким — і скільки радості це принесло за рік. Залиш пошту — надішлемо лінк для входу.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="твоя@пошта.com" style={field}
                  onKeyDown={(e) => { if (e.key === 'Enter') sendLink(); }} autoFocus />
                <button className="dl-primary" disabled={!emailValid} onClick={sendLink}
                  style={{ width: '100%', padding: '13px', fontSize: 'var(--fs-body)', opacity: emailValid ? 1 : 0.5, cursor: emailValid ? 'pointer' : 'not-allowed' }}>Надіслати лінк</button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, justifyContent: 'center', fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-xs)', color: 'var(--text-faint)', marginTop: 2 }}>
                  <span style={{ color: 'var(--accent-lime-deep)' }}>✦</span> Без паролів — лише безпечний лінк на пошту
                </div>
              </div>
            </React.Fragment>
          )}

          {step === 'sent' && (
            <React.Fragment>
              <div style={{ width: 64, height: 64, margin: '0 auto 18px', borderRadius: '50%', background: 'var(--accent-lime-light)', display: 'grid', placeItems: 'center', fontSize: '1.7rem', color: 'var(--accent-lime-deep)', boxShadow: 'inset 0 0 0 1px rgba(94,126,84,0.2)' }} aria-hidden="true">✉</div>
              <h1 style={{ margin: '0 0 8px', fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 'clamp(1.5rem, 3.6vw, 1.85rem)', color: 'var(--text-main)', textAlign: 'center' }}>Перевір пошту</h1>
              <p style={{ margin: '0 0 24px', fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-body)', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 'var(--lh-body)' }}>
                Лінк для входу полетів на<br /><b style={{ color: 'var(--text-main)' }}>{email.trim()}</b>.<br />Відкрий лист і тицьни «Увійти в DiLibris».
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <button className="dl-primary" style={{ width: '100%', padding: '13px', fontSize: 'var(--fs-body)' }} onClick={() => setStep('who')}>Я відкрив(ла) лінк</button>
                <button className="dl-ghost" style={{ width: '100%', padding: '12px' }} onClick={() => { dl.flash('Лінк надіслано ще раз'); }}>Надіслати ще раз</button>
                <button onClick={() => setStep('email')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-sm)', color: 'var(--text-muted)', marginTop: 2 }}>‹ Інша пошта</button>
              </div>
            </React.Fragment>
          )}

          {step === 'who' && (
            <React.Fragment>
              <h1 style={{ margin: '0 0 8px', fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 'clamp(1.5rem, 3.6vw, 1.8rem)', color: 'var(--text-main)', textAlign: 'center' }}>Трохи про тебе</h1>
              <p style={{ margin: '0 0 24px', fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-sm)', color: 'var(--text-muted)', textAlign: 'center' }}>Це налаштуємо зараз — зміниш будь-коли в профілі.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={label}>Ім’я</label>
                  <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Як до тебе звертатися?" style={field} />
                </div>
                <div>
                  <label style={label}>Ціль на рік · <b style={{ color: 'var(--accent-lime-deep)', textTransform: 'none' }}>{target} книг</b></label>
                  <input type="range" min="6" max="60" step="1" value={target} onChange={(e) => setTarget(+e.target.value)} style={{ width: '100%', accentColor: 'var(--accent-lime)' }} />
                </div>
                <button className="dl-primary" style={{ width: '100%', padding: '13px', fontSize: 'var(--fs-body)', marginTop: 4 }} onClick={enter}>Зайти в бібліотеку</button>
              </div>
            </React.Fragment>
          )}

          <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid var(--line)', textAlign: 'center', fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-xs)', color: 'var(--text-faint)' }}>
            Безкоштовно назавжди · без реклами
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Onboarding });
