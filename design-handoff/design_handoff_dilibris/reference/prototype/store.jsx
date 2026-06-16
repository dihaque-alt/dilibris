/* DiLibris — shared live store. Lifts books / shelves / notes / sessions /
   buddy groups / settings into one persisted React state so every "add",
   "edit" and "delete" button actually changes the app. STATUS + palettes
   stay static config on window.DILIBRIS. */

const DL_STORAGE_KEY = 'dilibris-state-v1';

/* buddy reads seed (moved here from screens so groups can be created live) */
const SEED_GROUPS = [
  { id: 'g1', name: 'Жадан-клуб', bookTitle: 'Інтернат', color: 'var(--status-reread)', deadline: '20 червня',
    members: [['Олена', 'var(--status-reading)', 62], ['Іра', 'var(--status-dnf)', 88], ['Маркіян', 'var(--status-done)', 41], ['Соломія', 'var(--accent-lime)', 55]],
    chat: [['Іра', 'Розділ про спортзал — це щось 😮'], ['Олена', 'Дочитую сьогодні, не спойлерте!'], ['Маркіян', 'Тримаюсь, наздожену на вихідних']],
    notes: [
      { id: 'gn1', author: 'Маркіян', color: 'var(--status-done)', page: '58', text: 'Опис туману над містом — найсильніша сцена поки що. Перечитав двічі.' },
      { id: 'gn2', author: 'Олена', color: 'var(--status-reading)', page: '', text: 'Паша як персонаж дратує і чіпляє водночас — і це, мабуть, головне.' },
    ] },
  { id: 'g2', name: 'Сестри по книгах', bookTitle: 'Польові дослідження', color: 'var(--status-dnf)', deadline: '28 червня',
    members: [['Олена', 'var(--status-reading)', 38], ['Юля', 'var(--status-want)', 22], ['Даша', 'var(--accent-lime)', 51]],
    chat: [['Юля', 'Перші 50 сторінок — і вже не відпускає'], ['Даша', 'Забужко як завжди безжальна ❤️']],
    notes: [
      { id: 'gn3', author: 'Даша', color: 'var(--accent-lime)', page: '33', text: 'Мова тіла й мова держави — вона плете їх в один вузол.' },
    ] },
  { id: 'g3', name: 'Повільне читання', bookTitle: 'Місто', color: 'var(--status-done)', deadline: '5 липня',
    members: [['Олена', 'var(--status-reading)', 80], ['Богдан', 'var(--status-reading)', 33], ['Ніна', 'var(--status-done)', 28], ['Тарас', 'var(--status-want)', 12], ['Леся', 'var(--accent-lime)', 44], ['Юрко', 'var(--status-dnf)', 9]],
    chat: [['Богдан', 'Підмогильний і досі звучить сучасно'], ['Ніна', 'По розділу на день — і встигаємо ☕']],
    notes: [
      { id: 'gn4', author: 'Ніна', color: 'var(--status-done)', page: '120', text: 'Степан Радченко — архетип, що не старіє. Місто пожирає людину м’яко.' },
      { id: 'gn5', author: 'Богдан', color: 'var(--status-reading)', page: '', text: 'Київ 20-х тут живий до дрібниць — вулиці, шум, запахи.' },
    ] },
];

const SEED_NOTIFS = [
  { id: 'nf1', kind: 'buddy', text: 'Іра написала у «Жадан-клуб»', time: '2 год тому', read: false, go: { page: 'Спільне читання' } },
  { id: 'nf2', kind: 'challenge', text: 'Ти на 1 книгу попереду річного графіка ✦', time: 'сьогодні', read: false, go: { page: 'Дашборд' } },
  { id: 'nf3', kind: 'deadline', text: '«Сестри по книгах» — дедлайн за 4 дні', time: 'вчора', read: false, go: { page: 'Спільне читання' } },
  { id: 'nf4', kind: 'reminder', text: 'Тихий вечір — гарний час для «Міста»', time: '2 дні тому', read: true, go: null },
];

const DLContext = React.createContext(null);

let _seq = Date.now() % 100000;
function uid(p) { _seq += 1; return p + _seq.toString(36); }

/* assign generative cover art + shelf physics to a freshly added book */
function decorateBook(b) {
  const pal = window.DILIBRIS.palettes;
  const keys = Object.keys(pal);
  const arts = ['split', 'band', 'arc', 'type', 'frame'];
  const ratios = [1.46, 1.52, 1.58, 1.42, 1.55, 1.5];
  const scales = [1, 0.96, 1.04, 0.98, 1.02];
  const h = Math.abs((b.title || '').length * 7 + (b.author || '').length * 3);
  return {
    id: uid('bk'),
    pages: 320, pagesRead: 0, progress: 0, rating: 0, days: 0, minutes: 0,
    format: 'Паперова', status: 'want', placeholder: true,
    cover: pal[keys[h % keys.length]],
    art: arts[h % arts.length],
    ratio: ratios[h % ratios.length],
    scale: scales[h % scales.length],
    ...b,
  };
}

function loadState() {
  const D = window.DILIBRIS;
  const seed = {
    books: D.books,
    shelves: D.shelves,
    notes: D.notes,
    sessions: D.sessions,
    groups: SEED_GROUPS,
    notifications: SEED_NOTIFS,
    onboarded: false,
    settings: {
      name: 'Олена Кравець', email: 'olena@dilibris.app', city: 'Львів',
      yearTarget: 24, defaultPrivate: false, weeklyDigest: true, reminders: true,
    },
    toast: null,
  };
  try {
    const raw = localStorage.getItem(DL_STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      return { ...seed, ...saved, settings: { ...seed.settings, ...(saved.settings || {}) }, toast: null };
    }
  } catch (e) {}
  return seed;
}

function DLProvider({ children }) {
  const [state, setState] = React.useState(loadState);

  React.useEffect(() => {
    try {
      const { toast, ...persist } = state;
      localStorage.setItem(DL_STORAGE_KEY, JSON.stringify(persist));
    } catch (e) {}
  }, [state]);

  const toastTimer = React.useRef(null);
  const flash = React.useCallback((msg) => {
    setState((s) => ({ ...s, toast: { id: uid('t'), msg } }));
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setState((s) => ({ ...s, toast: null })), 2600);
  }, []);

  const api = React.useMemo(() => ({
    ...state,

    addBook(raw, shelfId) {
      const book = decorateBook(raw);
      setState((s) => {
        const shelves = s.shelves.map((sh) => {
          if (shelfId && sh.id === shelfId) return { ...sh, bookIds: [book.id, ...sh.bookIds] };
          if (!shelfId && sh.status === book.status) return { ...sh, bookIds: [book.id, ...sh.bookIds] };
          return sh;
        });
        return { ...s, books: [...s.books, book], shelves };
      });
      flash('Книгу додано до бібліотеки');
      return book;
    },

    updateBook(id, patch) {
      setState((s) => ({ ...s, books: s.books.map((b) => (b.id === id ? { ...b, ...patch } : b)) }));
    },

    moveBookToShelf(bookId, shelfId, book) {
      setState((s) => {
        const shelves = s.shelves.map((sh) => {
          const without = sh.bookIds.filter((x) => x !== bookId);
          if (sh.id === shelfId) return { ...sh, bookIds: [bookId, ...without] };
          return { ...sh, bookIds: without };
        });
        const books = s.books.map((b) => (b.id === bookId ? { ...b, ...book } : b));
        return { ...s, shelves, books };
      });
    },

    addShelf(shelf) {
      const id = uid('sh');
      setState((s) => ({ ...s, shelves: [...s.shelves, { id, label: shelf.label || 'Нова полиця', status: shelf.status || null, bookIds: [] }] }));
      flash('Полицю створено');
    },

    renameShelf(id, label) {
      setState((s) => ({ ...s, shelves: s.shelves.map((sh) => (sh.id === id ? { ...sh, label } : sh)) }));
    },

    deleteShelf(id) {
      setState((s) => ({ ...s, shelves: s.shelves.filter((sh) => sh.id !== id) }));
      flash('Полицю видалено');
    },

    addNote(bookId, note) {
      setState((s) => {
        const list = s.notes[bookId] || s.notes.bk1 || [];
        return { ...s, notes: { ...s.notes, [bookId]: [{ id: uid('n'), ...note }, ...list] } };
      });
      flash('Нотатку збережено');
    },

    addSession(bookId, sess) {
      setState((s) => {
        const list = s.sessions[bookId] || s.sessions.bk1 || [];
        return { ...s, sessions: { ...s.sessions, [bookId]: [{ id: uid('s'), ...sess }, ...list] } };
      });
      flash('Сесію записано');
    },

    createGroup(g) {
      const id = uid('g');
      const me = window.DILIBRIS_STATE ? window.DILIBRIS_STATE.settings.name.split(' ')[0] : 'Олена';
      setState((s) => ({ ...s, groups: [{
        id, name: g.name || 'Новий клуб', bookTitle: g.bookTitle || '', color: 'var(--accent-lime)',
        deadline: g.deadline || 'без дедлайну',
        members: [[me, 'var(--status-reading)', 0]],
        chat: [],
        notes: [],
      }, ...s.groups] }));
      flash('Клуб створено');
      return id;
    },

    joinGroup(id) {
      setState((s) => ({ ...s, groups: s.groups.map((g) => {
        if (g.id !== id) return g;
        const me = s.settings.name.split(' ')[0];
        if (g.members.some((m) => m[0] === me)) return g;
        return { ...g, members: [...g.members, [me, 'var(--accent-lime)', 0]] };
      }) }));
      flash('Ти долучилася до клубу');
    },

    sendChat(groupId, name, text) {
      setState((s) => ({ ...s, groups: s.groups.map((g) => (g.id === groupId ? { ...g, chat: [...g.chat, [name, text]] } : g)) }));
    },

    addGroupNote(groupId, { author, color, text, page }) {
      setState((s) => ({ ...s, groups: s.groups.map((g) => (g.id === groupId
        ? { ...g, notes: [{ id: uid('gn'), author, color: color || 'var(--accent-lime)', text, page: page || '' }, ...(g.notes || [])] }
        : g)) }));
      flash('Нотатку додано в клуб');
    },

    archiveGroup(id) {
      setState((s) => ({ ...s, groups: s.groups.filter((g) => g.id !== id) }));
      flash('Клуб заархівовано');
    },

    setSettings(patch) {
      setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
    },

    completeOnboarding(patch) {
      setState((s) => ({ ...s, onboarded: true, settings: { ...s.settings, ...(patch || {}) } }));
    },

    logout() {
      setState((s) => ({ ...s, onboarded: false }));
    },

    /* record a finished reading session: append it + advance the book */
    logReadingSession(bookId, { minutes, pages, note }) {
      const now = new Date();
      const months = ['січ', 'лют', 'бер', 'кві', 'тра', 'чер', 'лип', 'сер', 'вер', 'жов', 'лис', 'гру'];
      const date = `${now.getDate()} ${months[now.getMonth()]}`;
      setState((s) => {
        const list = s.sessions[bookId] || [];
        const sessions = { ...s.sessions, [bookId]: [{ id: uid('s'), date, pages: pages || 0, minutes: minutes || 0, note: (note || '').trim() }, ...list] };
        const books = s.books.map((b) => {
          if (b.id !== bookId) return b;
          const pagesRead = Math.min(b.pages, (b.pagesRead || 0) + (pages || 0));
          const progress = Math.min(100, Math.round((pagesRead / b.pages) * 100));
          return {
            ...b, pagesRead, progress,
            minutes: (b.minutes || 0) + (minutes || 0),
            days: (b.days || 0) + 1,
            status: progress >= 100 ? 'done' : (b.status === 'want' ? 'reading' : b.status),
          };
        });
        return { ...s, sessions, books };
      });
      flash('Сесію записано');
    },

    markNotifRead(id) {
      setState((s) => ({ ...s, notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) }));
    },
    markAllNotifsRead() {
      setState((s) => ({ ...s, notifications: s.notifications.map((n) => ({ ...n, read: true })) }));
    },

    flash,
    dismissToast() { setState((s) => ({ ...s, toast: null })); },
  }), [state, flash]);

  // expose latest snapshot for non-hook helpers
  window.DILIBRIS_STATE = state;

  return <DLContext.Provider value={api}>{children}</DLContext.Provider>;
}

function useDL() {
  const ctx = React.useContext(DLContext);
  if (!ctx) throw new Error('useDL must be used within DLProvider');
  return ctx;
}

/* small global toast surfaced by the provider */
function DLToast() {
  const { toast } = useDL();
  if (!toast) return null;
  return (
    <div key={toast.id} style={{
      position: 'fixed', left: '50%', bottom: 26, transform: 'translateX(-50%)', zIndex: 90,
      display: 'flex', alignItems: 'center', gap: 9, padding: '12px 18px',
      background: 'var(--text-main)', color: 'var(--bg-card)', borderRadius: 'var(--r-pill)',
      fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 'var(--fs-sm)',
      boxShadow: '0 14px 36px rgba(0,0,0,0.4)', animation: 'dl-toast-in var(--dur-base) var(--ease-warm)',
      maxWidth: '90vw',
    }}>
      <span style={{ color: 'var(--accent-lime)' }}>✓</span>{toast.msg}
    </div>
  );
}

Object.assign(window, { DLProvider, useDL, DLToast, dlUid: uid });
