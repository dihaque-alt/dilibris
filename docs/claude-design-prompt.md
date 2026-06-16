# DiLibris — промпт для Claude Design

## Як використати

1. Відкрий **[claude.ai/design](https://claude.ai/design)** — це **Claude Design** (Anthropic Labs), не звичайний чат на claude.ai.
   - У лівому меню claude.ai має бути пункт **Design** (якщо ще не видно — rollout поступовий; спробуй прямий URL).
   - Потрібен **Pro / Max / Team / Enterprise** — на Free tier Claude Design поки недоступний.
2. Створи **новий проєкт** у Claude Design.
3. Скопіюй блок нижче **від `---START PROMPT---` до `---END PROMPT---`** і встав як перше повідомлення.
4. Ітеруй у Claude Design (редагуй візуально, проси варіанти fly-out, картки книги тощо).
5. **Експорт** (кнопка Export у проєкті): HTML, PDF або handoff для Claude Code — що зручніше. Обов’язково збережи **design tokens** (кольори, шрифти, spacing).
6. Поверни в Cursor: mockups + export + tokens — інтегруємо в код **без змін data model**.

**Код не чіпаємо**, поки немає deliverables від Claude Design.

### Claude Design vs claude.ai (чат)

| | **Claude Design** | **claude.ai чат + Artifacts** |
|---|---|---|
| URL | [claude.ai/design](https://claude.ai/design) | claude.ai/new |
| Призначення | Mockups, прототипи, decks, wireframes | Текст, код, загальні artifact |
| Для DiLibris | ✅ **Саме це** | ❌ Запасний варіант, якщо Design недоступний |
| Експорт | HTML, PPTX, PDF, Canva, Claude Code | HTML artifact у чаті |

Якщо Claude Design недоступний на твоєму плані — напиши, підберемо альтернативу (Figma AI, v0 тощо) або тимчасово Artifacts у чаті з чітким brief.

---

## Що НЕ робити (anti-patterns)

Це помилки попередньої спроби в коді — **не повторювати в дизайні**:

- ❌ Темна кімната / dark UI (dark mode — v2, не зараз)
- ❌ Книги «корінцями вбік» (spines) — потрібні **front-facing обкладинки**
- ❌ Сухий SaaS-дашборд, sidebar + grid замість кімнати
- ❌ Коричневі CSS-градієнти без ілюстративної глибини
- ❌ Окремі UX-шари без візуальної цілісності (fly-out + таби «на око»)

---

---START PROMPT---

# DiLibris — full design brief (v2)

Create the complete visual design for **DiLibris**, a warm personal virtual library web app. **Ukrainian UI only.** Mobile-first, responsive up to **1280px** desktop.

**Ignore any org default design system (e.g. Sprout)** — this product has its own warm library aesthetic. **Light theme only. No dark mode.**

---

## What DiLibris is

DiLibris is **not** a Goodreads clone. It is a **cozy room with wooden shelves** where books are the heroes — like displaying your reading life in a warm home library. Target: readers **25–30**. Emotion: cozy, joyful, warm («твоя бібліотека»). Free forever, no paywall, no social feed.

Functional v1 **already exists in code** (Vite + React + TypeScript + Supabase + offline IndexedDB). You are designing the **visual layer only** — design system, mockups, component specs, CSS tokens. **Do not redesign the data model or backend.**

---

## Core interaction (library home) ⭐

1. User sees a **virtual room** with **wooden shelves** (furniture, not a list or admin grid).
2. Books sit on shelves as **front-facing covers** — **never spines, never spine-out rows**.
3. User creates **unlimited shelves**; each shelf may map to a reading status.
4. **Tap a book** → cover **flies forward** toward the user (hero moment: playful, warm, not frantic). Design **2-frame storyboard** + **reduced-motion** variant.
5. **Tap the enlarged cover** → **book detail card** opens with reading stats, progress, review, notes.

**Placeholder cover** (when no image): whimsical **cat with a knife** — cute, illustrated, on-brand (SVG exists in code).

---

## Visual style

| Aspect | Direction |
|--------|-----------|
| Room | Illustrative / semi-realistic **2.5D** or warm flat with depth — **Animal Crossing** coziness |
| Walls | Warm cream (`#F9F6F0` feel) — evening lamp glow from top-right |
| Wood | Volumetric shelves: light highlight → warm walnut → deep shadow |
| Accents | Soft olive/lime for statuses; warm gold for challenge, stars, highlights |
| Light | Evening lamp, soft diffuse shadows, «at home» — **never dark UI** |
| Typography | Brand: rounded friendly · Headings/books: **serif** · UI: clean **sans**, Ukrainian |
| Avoid | Cold corporate SaaS, dark dashboards, sidebar+grid admin, flat brown gradients without depth |

**Mood references (do not copy):** Animal Crossing room · Storygraph stats clarity · Goodreads challenge · Literal/Fable bookish tone — but **less social feed, more personal library**.

---

## Draft design tokens (baseline — refine visually)

Use as starting point; improve in your design system:

```css
:root {
  /* Room */
  --bg-room: #F9F6F0;
  --bg-card: #FFFFFF;
  --bg-overlay: rgba(36, 32, 28, 0.45);

  /* Wood shelves */
  --wood-main: #9E7453;
  --wood-depth: #7A5538;
  --wood-light: #B88E6B;

  /* Accents */
  --accent-lime: #7E9F70;
  --accent-lime-light: #F0F4EE;
  --gold-highlight: #FAD02C;
  --gold-light: #FFF9E6;

  /* Text */
  --text-main: #24201C;
  --text-muted: #72685E;

  /* Shadows */
  --shadow-book: 0 4px 10px rgba(58,46,36,0.15), 0 1px 3px rgba(58,46,36,0.1);
  --shadow-shelf: 0 8px 24px rgba(36,32,28,0.12);
  --shadow-card: 0 12px 36px rgba(36,32,28,0.08);

  /* Fonts */
  --font-brand: 'Comfortaa', sans-serif;
  --font-serif: 'EB Garamond', Georgia, serif;
  --font-sans: 'Plus Jakarta Sans', sans-serif;
}
```

Google Fonts already chosen:
- **Comfortaa** 500, 700 — logo / brand
- **EB Garamond** 500, 700, italic 500 — book titles, shelf headings
- **Plus Jakarta Sans** 400, 500, 600 — UI labels, body

---

## Screens (design all; priority marked)

### 1. Library home ⭐ HIGHEST PRIORITY
- Cream room background with soft lamp light
- **Volumetric wooden shelves**: side brackets, deck, plank top surface, front edge shadow
- Multiple shelf units with user labels (e.g. «Читаю зараз», «Прочитано»)
- **Front-facing book covers** standing on shelf (not lying flat, not spines)
- Optional: book title in serif on hover
- Header nav: **Бібліотека** · **Дашборд** · **Спільне читання** + email + **Вийти**
- Actions: **+ Полиця**, **+ Книга** (per shelf)
- **Fly-out state**: enlarged cover centered, `--bg-overlay` dim behind, title (serif) + author + **olive status pill**, hint «Тицьни обкладинку…»
- **Empty shelf**: gentle illustration + «Порожня полиця»
- **First-time empty room**: «Створи першу полицю — тут з’явиться твоя кімната з книгами»
- **Offline banner** (subtle, gold-cream): «Показано збережену копію — сервер тимчасово недоступний»

### 2. Book detail card ⭐ HIGHEST PRIORITY
One **cohesive card** — not scattered admin panels. Include:
- Cover, title (serif), author, olive **status pill**
- Stat chips: progress %, days reading, total time
- Sections as **tabs** or unified card (must feel like ONE object):
  - **Прогрес**: status, format (Паперова / Електронна), rating stars 1–5 step 0.5, dates, pages, «Рахувати в challenge»
  - **Відгук**: public review + rating, spoiler toggle «Показати відгук»
  - **Нотатки**: Цитата / Думка / Загальна; badges **Особиста** / **Публічна**
  - **Сесії**: list + **+ Сесія**
- Primary: **Зберегти**
- Mobile: bottom sheet feel; desktop: centered modal

### 3. Dashboard — **Дашборд**
- Year selector (**Рік**)
- **Reading challenge**: target books/year, gold progress bar, «12 з 24 книг»
- Summary: books, pages, time, avg rating, longest break
- Bar chart: books per month
- Breakdowns: format, top authors, languages
- Warm friendly stats — not corporate analytics

### 4. Buddy read — **Спільне читання**
- Group list, create (**+ Створити**), join via link
- Group detail: member progress, chat, shared notes
- **Копіювати лінк**, **Архівувати**

### 5. Auth
- Magic link: email + **Надіслати лінк**
- Tagline: «Твоя віртуальна бібліотека»
- Warm minimal — same room aesthetic

### 6. Modals / bottom sheets
- **Додати книгу**: Open Library search + manual tab — **bottom sheet on mobile**
- **Додати полицю**: name + status filter
- **Сесія читання**: date, pages, minutes, note

---

## Ukrainian copy (use exactly)

**Nav:** Бібліотека · Дашборд · Спільне читання · Вийти

**Statuses:** Хочу прочитати · Читаю зараз · Прочитано · Не дочитала · Перечитую

**Format:** Паперова · Електронна

**Notes:** Цитата · Думка · Загальна · Особиста · Публічна

**Actions:** + Полиця · + Книга · + Сесія · Зберегти · Завантажуємо…

Tone: friendly «ти», no bureaucratic language.

---

## UI components to spec

| Component | Spec needed |
|-----------|-------------|
| Shelf unit | 2.5D wood: brackets, deck, plank, shadow; label serif |
| Book tile | Front cover, shadow, hover lift |
| Fly-out | Frame 1 (shelf) → Frame 2 (hero cover); reduced motion |
| Status pill | Olive on `--accent-lime-light` background |
| Stat chip | Progress, days, time |
| Challenge bar | Gold fill on cream track |
| Star rating | 1–5, half steps |
| Bottom sheet | Mobile modals, rounded top |
| Offline banner | Gold-cream, non-alarming |

---

## Deliverables — package as **Option 3: Both**

When asked how to package deliverables, choose **Both**:

1. **Interactive React prototype** (with Tweaks):
   - Library home — default + fly-out states
   - Book detail card — open state with tabs
2. **Design canvas** (375px mobile + 1280px desktop):
   - Library, book card, dashboard, buddy read, auth, empty states
3. **Design system doc** — colors, type scale, spacing, radii, shadows
4. **`tokens.css`** — production-ready `:root { … }` matching your visual design
5. **Static HTML + CSS artifact** — library home 375px, no JS
6. **Component specs** + fly-out animation storyboard
7. **Google Fonts `<link>` block** for `index.html`

**Export:** HTML, tokens.css, handoff bundle for Claude Code / Cursor.

---

## Hard constraints — do NOT

- ❌ Dark theme (v2 only)
- ❌ Book spines / spine-out rows
- ❌ Cold SaaS sidebar + data grid for library
- ❌ Social feed / follow / paywall
- ❌ Full-screen 3D engine — 2D/2.5D illustration or CSS depth is enough
- ❌ Sprout or generic org design system colors
- ❌ Separate disconnected UI blocks that feel like different apps

---

## Developer handoff (existing code)

- **Stack:** Vite + React + TypeScript + Supabase + Dexie offline
- **Styles:** `src/tokens.css` + `src/index.css` + `src/styles/library.css`
- **Pages:** `LibraryPage.tsx`, `DashboardPage.tsx`, `BuddyReadsPage.tsx`, …
- **Routes:** `/` · `/dashboard` · `/buddy-reads` · `/buddy-reads/:id` · magic link auth
- Replace **visual layer only** — keep data model, Supabase logic, offline sync
- Placeholder: `public/placeholder-cover.svg` (cat with knife)

**Start with:** library home + volumetric shelves + fly-out + book detail card. Then canvas for remaining screens.

---END PROMPT---

---

## Після Claude — що принести в Cursor

| Файл / формат | Навіщо |
|---------------|--------|
| Mockups (PNG або посилання) | Референс для верстки |
| CSS `:root` tokens | Пряма заміна в `src/index.css` |
| HTML/CSS artifact | База для library room + shelves |
| Component specs | Fly-out, shelf, book card, modals |
| Шрифти (Google Fonts URLs) | `index.html` |

Коли буде готово — напиши «є дизайн від Claude» і прикріпи файли або встав artifact.

## Поточний код (для розробника, не для Claude)

Стек: Vite + React + TypeScript + Supabase. Компоненти: `src/components/`, сторінки: `src/pages/`. Placeholder: `public/placeholder-cover.svg`.
