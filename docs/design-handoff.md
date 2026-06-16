# Handoff: DiLibris — тепла особиста бібліотека (візуальний шар)

## Overview
DiLibris is a warm, personal virtual-library web app for readers ~25–30. The core
metaphor is **a cozy room with wooden bookcases** where books are the heroes —
displayed as **front-facing covers standing on shelves** (never spines, never an
admin grid). This bundle is the **visual layer**: design system, tokens, component
specs, and HTML reference mockups for every screen.

Ukrainian UI only. **Light theme only — no dark mode.** Mobile-first, responsive to
1280px desktop.

## About the Design Files
The files under `reference/` are **design references created in HTML** — prototypes
showing intended look and behavior, **not production code to copy verbatim**. The
existing app is **Vite + React + TypeScript + Supabase + Dexie (offline IndexedDB)**.
Your task is to **recreate these designs in that codebase**, replacing only the
**visual layer** — keep the data model, Supabase logic, routes, and offline sync.

- `tokens.css` and `library.css` ARE meant to be used (near-)directly: drop them into
  `src/` and consume the CSS variables.
- The `.html` / `.jsx` files are references for layout, composition, and motion. The
  React in `reference/prototype/*.jsx` is Babel-in-browser prototype code — re-implement
  it idiomatically in the real TS/React app, don't paste it.

Existing files to replace the visuals of: `src/tokens.css`, `src/index.css`,
`src/styles/library.css`, `LibraryPage.tsx`, `DashboardPage.tsx`, `BuddyReadsPage.tsx`,
auth + buddy-detail pages. Routes: `/` · `/dashboard` · `/buddy-reads` ·
`/buddy-reads/:id` · magic-link auth. Placeholder asset already in repo:
`public/placeholder-cover.svg` (cat with knife) — an upgraded SVG is described below.

## Fidelity
**High-fidelity.** Final colors, typography, spacing, shadows, and interactions.
Recreate pixel-faithfully using the codebase's React patterns. All values reference
`tokens.css`.

---

## Design Tokens
Use `tokens.css` verbatim (it is the source of truth). Highlights:

### Color
| Token | Value | Use |
|---|---|---|
| `--bg-room` | `#F9F6F0` | cream wall / app bg |
| `--bg-card` | `#FFFFFF` | cards, sheets |
| `--bg-card-soft` | `#FCFAF6` | nested panels |
| `--bg-overlay` | `rgba(36,32,28,0.45)` | modal/flyout scrim |
| `--wood-light / -main / -depth / -shadow` | `#B88E6B / #9E7453 / #7A5538 / #5E4029` | shelf wood ramp |
| `--accent-lime` | `#7E9F70` | primary action / olive status |
| `--accent-lime-deep` | `#5F7E54` | lime text on light |
| `--accent-lime-light` | `#F0F4EE` | status-pill bg |
| `--gold-highlight` | `#FAD02C` | challenge, stars |
| `--gold-deep` | `#C99A12` | gold text |
| `--gold-light` | `#FFF9E6` | gold pill / offline banner |
| `--text-main / -muted / -faint` | `#24201C / #72685E / #A39A8E` | text ramp |
| `--line / --line-strong` | `#ECE4D7 / #DED3C2` | hairlines |

**Status hues** (pill text / bg):
`want #C28A4E / #FBF1E2` · `reading #7E9F70 / #F0F4EE` · `done #6E8FA6 / #ECF1F5` ·
`dnf #B07B7B / #F6EDED` · `reread #9C82B5 / #F2EEF6`.

### Typography
3 families (Google Fonts — see `fonts.html`):
- `--font-brand` **Comfortaa** 500/700 — logo / brand only
- `--font-serif` **EB Garamond** 500/700/italic500 — book titles, shelf labels, headings
- `--font-sans` **Plus Jakarta Sans** 400/500/600 — UI, body

Scale (clamp-based, mobile→desktop): `--fs-display 36→48` · `--fs-h1 28→36` ·
`--fs-h2 22→28` · `--fs-h3 20` · `--fs-title 17` · `--fs-body 16` · `--fs-sm 14` ·
`--fs-xs 12`. Line-heights: tight 1.15, snug 1.3, body 1.55.

### Spacing · Radii · Shadows · Motion
- Spacing: 4px base — `--sp-1…16` (4,8,12,16,20,24,32,40,48,64).
- Radii: `--r-xs 6 · -sm 10 · -md 14 · -lg 20 · -xl 28 · -pill 999`; `--r-book: 3px 5px 5px 3px`.
- Shadows: `--shadow-book`, `--shadow-book-hover`, `--shadow-shelf`, `--shadow-card`,
  `--shadow-sheet`, `--shadow-hero`, `--shadow-contact` — all warm (brown-toned, never grey).
- Motion: `--ease-warm cubic-bezier(.22,1,.36,1)`, `--ease-back cubic-bezier(.34,1.56,.64,1)`;
  `--dur-fast 140 · --dur-base 240 · --dur-fly 520`. **All durations → 0 under
  `prefers-reduced-motion: reduce`** (already in `tokens.css`).

---

## Screens / Views

### 1. Library home `/` ⭐ HIGHEST PRIORITY
- **Purpose:** the room — browse your books on wooden shelves.
- **Layout:** sticky translucent header (brand + nav `Бібліотека · Дашборд · Нотатки ·
  Спільне читання` + notification bell + `+ Полиця` + profile menu with email
  («Профіль і налаштування» · «Імпорт із Goodreads» · `Вийти`)). Below: page title block, then a **bookcase**
  centered, max-width 920px. Mobile: nav collapses to a scrollable pill row.
- **Room backdrop** (`Room` / `.dl-room` in `library.css`): graded plaster wall
  (`#ECE0CC→#D8C6A9`) with an evening light-pool top-right, soft window-light patch
  upper-left, vignette, cream baseboard, receding wood-plank floor at the bottom.
- **Bookcase** (`.dl-bookcase`): brass pendant lamp above → cornice → case-body
  (warm wood back + grain + side posts, deep inset shadows) → one **compartment per
  shelf** → base plinth with feet. Drop-shadow casts onto the wall.
- **Compartment:** horizontally-scrolling row of front-facing covers standing on a
  3-layer plank (lit lip + grain + shadowed face). A cream **nameplate** (serif label +
  optional status pill) sits on the plank's left; a `+ Книга` button on the right.
- **Book tile:** see component spec. Hover lifts `-10px` with `--ease-back`.
- **States:** empty shelf → dashed-book glyph + «Порожня полиця». First-run empty room →
  centered illustration + «Створи першу полицю — тут зʼявиться твоя кімната з книгами».
  Offline → subtle gold-cream banner «Показано збережену копію — сервер тимчасово
  недоступний».
- **Fly-out (hero):** tap a cover → it flies to screen-center over a dimmed scrim with
  title (serif) + author + olive status pill + hint «Тицьни обкладинку, щоб відкрити
  книгу». Tap the enlarged cover → book detail card. See storyboard below.

### 2. Book detail card ⭐ HIGHEST PRIORITY
- **Purpose:** one cohesive card for everything about a book.
- **Mobile:** bottom sheet (rounded top `--r-xl`, drag handle, `--shadow-sheet`, slides up).
  **Desktop:** centered modal `min(680px,94vw)`.
- **Anatomy (top→bottom):** header (cover + serif title + italic author + status pill +
  close ✕) → 3 stat chips (прогрес %, днів читання, загалом год) → segmented tabs
  → scroll body → footer (`Скасувати` + primary `Зберегти`).
- **Tabs:**
  - **Прогрес** — status choice chips, format (Паперова/Електронна), star rating (0.5
    steps), pages read / start date, toggle «Рахувати в challenge».
  - **Відгук** — rating, spoiler toggle «Містить спойлери» (hides body behind «Показати
    відгук»), public review text.
  - **Нотатки** — note cards with type badge (Цитата/Думка/Загальна) + visibility badge
    (Особиста/Публічна); `+ Нотатка`.
  - **Сесії** — list of reading sessions (date · pages · minutes · note); `+ Сесія`.

### 3. Dashboard `/dashboard`
Year selector; gold reading-challenge bar («12 з 24 книг», 50%); summary stat cards
(books, pages, time, avg rating, longest break); bars «Книги за місяць»; donut for
format split; horizontal bars for top authors + languages. Warm, friendly — **not**
corporate analytics.

### 4. Buddy read `/buddy-reads` + `/buddy-reads/:id`
List of groups (avatar, name, members, current book, avg-progress bar) + `+ Створити`
+ join-by-link. Detail: a left column stacking **member-progress bars** + **shared
notes**, and a right **chat** column; header actions `Копіювати лінк` · `Архівувати`.
- **Shared notes** (`SharedNotes` in `reference/prototype/screens.jsx`): collapsible
  composer (`+ Нотатка` → textarea + optional page field → `Додати нотатку`) above a
  list of note cards (member avatar + name + olive `с. N` page badge + serif body).
  Data lives on each group as `notes: [{id, author, color, text, page}]`; wire to
  `addGroupNote(groupId, {author, color, text, page})` in the store.

### 5. Auth (magic link)
Centered on the room's lamp-glow bg. **No passwords** — a 3-step flow in
`reference/prototype/onboarding.jsx` (`Onboarding`):
1. **email** — brand + «Твоя віртуальна бібліотека», email field, `Надіслати лінк`
   (disabled until the address is valid), reassurance «Без паролів — лише безпечний
   лінк на пошту».
2. **sent** — ✉ glyph + «Перевір пошту», shows the address, `Я відкрив(ла) лінк`
   (simulates clicking the magic link), `Надіслати ще раз`, `‹ Інша пошта`.
3. **who** — «Трохи про тебе»: name field + year-goal slider → `Зайти в бібліотеку`.

Footer on every step: «Безкоштовно назавжди · без реклами». In the real app, steps 1→2
send the Supabase magic link and step 2→3 is the post-redirect landing for first-time
users (returning users skip straight to the library).

### 6. Notes feed `/notes` (NotesFeed)
Warm feed of every note across all books (`reference/prototype/notes.jsx`). Filter
chips by kind (Цитата/Думка/Загальна), free-text search, and each card links back to its
book (opens the detail card). Reachable from the header nav item `Нотатки`.

### 7. Reading mode (ReaderView) + Reading session (SessionTimer)
`reference/prototype/reader.jsx` — distraction-free reading surface opened from the book
detail card; `SessionTimer` is the live timer/`Сесія читання` sheet that, on save, calls
`logReadingSession(bookId, {minutes, pages, note})` to append the session and advance the
book's progress/status.

### 8. Notifications (NotifBell) + Profile & settings (SettingsSheet)
Header bell with unread dot opens a flyout of notifications (`reference/prototype/notifs.jsx`),
each deep-linking to a page. The profile menu opens `Профіль і налаштування`
(`SettingsSheet` in `app.jsx`): name/email/city, year-goal slider, and toggles for
default-private notes, weekly digest, and reading reminders.

### 9. Modals / sheets
`Додати книгу` (Open Library search tab + manual tab; bottom sheet on mobile),
`Додати полицю` (name + optional status), `Сесія читання` (date, pages, minutes, note),
`Новий клуб` / `Долучитися за лінком` (buddy reads).

---

## Component Specs
Full specs + the fly-out storyboard are in `reference/DiLibris Component Specs.html`.
The live design system (swatches, type, components) is in
`reference/DiLibris Design System.html`. Quick reference:

- **Book tile** — front-facing cover, `width × ratio` (ratio 1.42–1.6 per book for an
  organic row). Generative art styles: `split` (art top + cream title block), `band`
  (centered band), `arc` (sun/moon over horizon), `type` (bold typographic), `frame`
  (inset literary border). Texture layers: cloth weave (soft-light), paper grain
  (overlay), vignette, sheen, rounded lit spine (left 11%), top page-block, fore-edge
  shadow (right 7%). Sizes via Tweak: Компактно 78 / Затишно 100 / Велично 124.
  Placeholder = cat-with-knife SVG on cream.
- **Status pill** — dot + label, `--r-pill`, colored by `--status-*`.
- **Stat chip** — serif value 1.3rem + caption, `--bg-card-soft`, `--r-md`.
- **Star rating** — 1–5, 0.5 step via 50% linear-gradient; half-clickable halves.
- **Challenge bar** — gold fill on `--gold-light` track, animated width.
- **Offline banner** — gold-cream, non-alarming.

## Interactions & Behavior
- **Hover** (pointer devices): book lifts `-10px`/`--ease-back`; nav/buttons darken &
  rise 1px.
- **Fly-out:** FLIP transform from the tapped cover's `getBoundingClientRect()` to a
  centered hero at `--dur-fly` with `--ease-back`; scrim fades `--bg-overlay`; title/
  author/pill fade in +120ms. Tap hero → detail card. Tap scrim → dismiss.
- **Reduced motion:** all durations 0; hero appears instantly (fade only), no flight.
- **Sheets/modals:** `dl-sheet-up` (mobile) / `dl-card-in` (desktop); scrim click closes.
- **Responsive:** single bookcase column throughout; header nav collapses <820px; cards
  become bottom sheets <720px.

## State Management (visual layer only — wire to existing stores)
- `flyout: {book, rect} | null` · `detail: book | null` · `sheet: 'book'|'shelf'|null` ·
  `reader: bookId | null` · `session: bookId | null` · `settingsOpen: bool` ·
  `page: 'Бібліотека'|'Дашборд'|'Нотатки'|'Спільне читання'` · `onboarded: bool`.
- Per-book editable: status, format, rating, pagesRead, countInChallenge, review,
  spoiler, notes[], sessions[]. Shelves: `{id, label, status|null, bookIds[]}` (status
  optional — a shelf MAY map to a reading status).
- **Buddy groups:** `{id, name, bookTitle, deadline, color, members:[[name,color,pct]],
  chat:[[name,text]], notes:[{id,author,color,text,page}]}`. The prototype store
  (`reference/prototype/store.jsx`) is the behavioral reference: `addBook`, `updateBook`,
  `addShelf`, `addNote`, `logReadingSession`, `createGroup`/`joinGroup`/`sendChat`/
  `addGroupNote`/`archiveGroup`, `setSettings`, `completeOnboarding`/`logout`,
  `markNotifRead`. In the real app these already exist (or map onto Supabase/Dexie) —
  bind, don't recreate.

## Assets
- **Room backdrop is a PHOTO, not procedural.** The evening-library scene is composited
  from `reference/prototype/room-bg.jpg` (wall + shelves) and `reference/prototype/floor.jpg`
  (receding plank floor), wired in `library.css` via `.dl-photo` / the floor layer; the
  `--dl-dim` token controls the scrim over it. (`wall.jpg` is an alternate backdrop.)
  Move these into the app's `public/` (or an `assets/` import) and keep the same class
  hooks. A pure-CSS `data-mood="day"` fallback is also defined for the screens canvas.
- **Cat-with-knife placeholder** — upgraded SVG (cat clearly holding a knife aloft) is
  inlined as the `CatKnife` component in `reference/prototype/components.jsx`; port it to
  `public/placeholder-cover.svg`. Used whenever a book has no cover image.
- **Book covers** — fully generative (CSS/SVG), no image assets needed.
- **No icon library** — the few glyphs (✕, +, ▾, ✉, ✕) are text; brand mark is an inline
  SVG (`BrandMark` in `app.jsx`).

## Files
- `tokens.css` — production `:root` design tokens (use directly).
- `library.css` — room + bookcase + book-tile-texture CSS (use directly; classes are
  framework-agnostic). Expects `room-bg.jpg` / `floor.jpg` alongside it.
- `fonts.html` — Google Fonts `<link>` block for `index.html`.
- `reference/DiLibris Prototype.html` — the full live prototype (open this first): library
  home + fly-out + detail card + dashboard + buddy reads + notes + auth + all sheets.
- `reference/DiLibris Screens Canvas.html` — every screen at 375px + 1280px.
- `reference/DiLibris Static Library.html` — pure HTML/CSS library home (no JS), 375px.
- `reference/DiLibris Design System.html` — colors, type, spacing, radii, shadows, components.
- `reference/DiLibris Component Specs.html` — specs + fly-out storyboard + reduced-motion.
- `reference/prototype/` — prototype React source (Babel-in-browser; reference only,
  re-implement in TS). Key files: `store.jsx` (state + all mutations), `app.jsx` (shell,
  header, fly-out, add/settings sheets), `library.jsx` + `bookcard.jsx` (room, shelves,
  book tiles, detail card), `screens.jsx` (dashboard + buddy reads + shared notes),
  `notes.jsx` (notes feed), `reader.jsx` (reading mode + session timer), `notifs.jsx`
  (notification bell), `onboarding.jsx` (magic-link auth), `components.jsx` (shared bits +
  `CatKnife`), `data.js` (seed data), `room-bg.jpg`/`floor.jpg`/`wall.jpg` (backdrops).
