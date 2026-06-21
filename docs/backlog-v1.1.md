# DiLibris — план робіт v1.1

Порядок: **строго по номерах**, один пункт за раз. Кожен пункт має критерій «готово» — не переходимо далі, поки не виконано.

**Еталони:** `docs/product-spec.md` · `docs/design-handoff.md` · `design-handoff/prototype/` · prod https://www.dilibris.org

**Як працюємо:** ти пишеш «робимо #N» — проходимо пункт, деплой (якщо треба), оновлюємо статус тут.

---

## Статус

| # | Пункт | Статус |
|---|--------|--------|
| 1 | Smoke test + журнал відхилень | ✅ |
| 2 | Фото кімнати (room-bg, floor) | ✅ |
| 3 | Обкладинки за замовчуванням (cover, не spine) | ✅ |
| 4 | Bookcase chrome (лампа, карниз, цоколь) | ⏭ пропущено |
| 5 | Fly-out — дрібна parity | ✅ |
| 6 | Картка книги — візуал + таби | ✅ |
| 7 | Картка книги — поведінка (прогрес, сесії) | ✅ |
| 8 | Session timer + resume banner | ✅ |
| 9 | ReaderView — рішення (stub / прибрати / залишити) | ✅ |
| 10 | Auth + onboarding — візуал і копі | ✅ |
| 11 | Onboarding — persist у Supabase | ✅ |
| 12 | Offline: notes у черзі sync | ✅ |
| 13 | Offline: reviews у черзі sync | ✅ |
| 14 | Offline: dashboard snapshot | ✅ |
| 15 | Settings prefs → Supabase | ✅ |
| 16 | Notifications — прибрати seed, persist | ⬜ |
| 17 | Re-read (parent_entry_id) | ⬜ |
| 18 | Dashboard — візуал до прототипу | ⬜ |
| 19 | Notes feed — візуал + empty state | ⬜ |
| 20 | Buddy list — обкладинки + картки | ⬜ |
| 21 | Buddy detail — layout + shared notes | ⬜ |
| 22 | Add book — Google Books fallback | ⬜ |
| 23 | Add shelf — Choice chips замість select | ⬜ |
| 24 | Settings sheet — parity + заголовок | ⬜ |
| 25 | NotifBell — parity + deep links audit | ⬜ |
| 26 | Goodreads import — polish + spec update | ⬜ |
| 27 | Offline UX — один банер, без дублікатів | ⬜ |
| 28 | Копірайт і labels — один прохід | ⬜ |
| 29 | Mobile nav + safe area audit | ⬜ |
| 30 | Accessibility pass (focus, aria, reduced motion) | ⬜ |

---

## Фаза A — База (1)

### 1. Smoke test + журнал відхилень
**Навіщо:** зафіксувати реальний стан перед поліром; не виправляти «на око».

**Що зробити:**
- Пройти 5 шляхів (записати ✅/⚠️/❌):
  1. Вхід (email або Google) → onboarding → порожня кімната
  2. `+ Полиця` → `+ Книга` (Open Library) → книга на полиці
  3. Tap обкладинка → fly-out → detail → змінити статус → зберегти
  4. Сесія: старт → згорнути → банер → завершити → перевірити вкладку «Сесії»
  5. Offline: без мережі змінити прогрес → online → sync
- Додати знайдене в секцію «Журнал» нижче (якщо не покрито пунктами 2–30)

**Готово коли:** таблиця 5 шляхів заповнена; критичні ❌ прив’язані до номера пункту.

**Файли:** — (ручний QA)

#### Журнал (заповнюємо під час #1)
| Шлях | Статус | Пункт backlog | Нотатка |
|------|--------|---------------|---------|
| Вхід | ⚠️ | #10, #11 | Prod: login card (Google + magic link) завантажується. Повний email-flow не прогнано (потрібна пошта). Onboarding — `localStorage`, на новому пристроі покажеться знову. EmptyRoom для порожньої бібліотеки — ОК. |
| Додати книгу | ✅ | #23 | `+ Книга` → Open Library «1984 Orwell» → додано на полицю «Хочу прочитати» (455 книг). Статус — `<select>`, не choice chips. |
| Книга + detail | ✅ | #3, #5, #6 | Fly-out (FLIP) → detail → статус «Читаю зараз», стор. 10 → збережено, книга на полиці «Читаю зараз». Під час FLIP hero має `opacity:0` ~400ms — швидкий tap може не спрацювати (#5). Default view — spine (#3). |
| Сесія | ✅ | #8 | Старт → dismiss (backdrop) → banner «Продовжити» → resume → «Завершити й записати» (15 стор.) → вкладка «Сесії»: «17 черв. 15 стор. · 1 хв». Підтверджено раніше + повторно локально. |
| Offline | ✅ | #27, #28 | Offline: `current_page` 30 → Dexie `pendingOps` (1 op) → online → flush, `pending: 0`. Дубль банера: `OfflineBanner` + `LibraryPage .offline-hint` — однаковий текст (#27). |

**Додатково (не блокує #2):**
- Prod: `/room-bg.jpg`, `/floor.jpg` — HTTP 200; у git `public/` їх немає (#2).
- Prod login без сесії — ОК; локально — повний authed flow.
- Критичних ❌ немає; усі ⚠️ прив’язані до #2–#11, #23, #27, #28.

---

## Фаза B — Ядро: кімната + книга (2–9)

### 2. Фото кімнати (room-bg, floor)
**Навіщо:** handoff описує **фото-бекдроп**, не процедурний градієнт; зараз CSS посилається на `/room-bg.jpg` і `/floor.jpg`, але в `public/` їх немає.

**Що зробити:**
- Додати `room-bg.jpg` і `floor.jpg` у `public/` (з design-handoff bundle або власні)
- Перевірити `RoomBackdrop.tsx`, `library.css`, `library-overrides.css`
- Переконатись, що dim/mood з settings працюють поверх фото

**Готово коли:** на `/` видно стіну + підлогу як у `DiLibris Prototype.html`; немає битих фонів.

**Файли:** `public/`, `src/components/RoomBackdrop.tsx`, `src/styles/library.css`

---

### 3. Обкладинки за замовчуванням (cover, не spine)
**Навіщо:** `design-handoff.md` — «front-facing covers, never spines»; зараз default `bookView: 'spine'` у `libraryDisplayPrefs.ts`.

**Що зробити:**
- Змінити default на `'cover'`
- Перевірити spine mode лишається в Settings для тих, хто хоче
- Порівняти розміри/відступи cover mode з прототипом

**Готово коли:** новий юзер бачить обкладинки; spine — лише через налаштування.

**Файли:** `src/lib/libraryDisplayPrefs.ts`, `src/components/ShelfBookTile.tsx`, `src/styles/library-overrides.css`

---

### 4. Bookcase chrome (лампа, карниз, цоколь) — ⏭ **пропущено**
**Рішення (2026-06-17):** спроба `BookcaseChrome` (лампа + дерев’яна рама) на prod виглядала гірше за full-bleed полиці над фото-кімнатою. Revert `843141e`. **Залишаємо поточний UI** (як у `library.jsx` / photo shelves). Не повертаємось до пункту в v1.1.

~~**Навіщо:** прототип має повну `.dl-bookcase` структуру; prod — спрощені полиці.~~

**Наступний пункт:** #5.

---

### 5. Fly-out — дрібна parity
**Навіщо:** fly-out працює; лишились візуальні дрібниці.

**Що зробити:**
- Порівняти з `BookFlyout.tsx` vs `prototype` — hover lift (-10px), тіні, hint copy
- Вирішити: лишати ✕ close чи прибрати (prototype — scrim only)
- Safe area + короткий viewport (`app-shell.css`)

**Готово коли:** side-by-side з прототипом немає помітних відмінностей у motion і композиції.

**Зроблено (2026-06-17):** прибрано ✕ (scrim + Escape); hover lift −10px + `--shadow-book-hover`; hint margin 18px; клік поза обкладинкою закриває; safe-area / short viewport без змін (вже були).

**Файли:** `src/components/BookFlyout.tsx`, `src/styles/app-shell.css`

---

### 6. Картка книги — візуал + таби
**Навіщо:** detail card — другий найважливіший UI.

**Що зробити:**
- Header band, stat chips, tabs, footer — spacing/typography vs `bookcard.jsx`
- `BookReviewsSection` — замінити `btn-small`/`btn-secondary` на `dl-*`
- Mobile sheet handle, max-height, scroll body

**Готово коли:** desktop modal + mobile sheet виглядають як прототип; кнопки з design system.

**Зроблено (2026-06-17):** `dl-*` кнопки у відгуках/нотатках; embedded-стилі карток і форм у `detail-ui.css`; progress form stack gap 18px; mobile footer safe-area.

**Файли:** `BookDetailModal.tsx`, `detail-ui.css`, `BookReviewsSection.tsx`, `BookNotesSection.tsx`

---

### 7. Картка книги — поведінка (прогрес, сесії)
**Навіщо:** переконатись, що збереження = правильні дані.

**Що зробити:**
- Статус → auto `started_on` / `finished_on`
- `counts_toward_stats` впливає на dashboard/challenge
- Сесії: add/delete оновлюють `total_minutes` і `current_page`
- Рейтинг 0.5 крок — `StarRating` + save

**Готово коли:** зміни в detail відображаються на dashboard і після reload.

**Зроблено (2026-06-17):** auto `started_on`/`finished_on` (включно з dnf) у формі й при збереженні; `snapRating` 0.5; сесії add/delete синхронізують `current_page` + `total_minutes` (online trigger + offline queue); modal оновлює stat chips через `fetchEntry`.

**Файли:** `BookDetailModal.tsx`, `librarySync.ts`, `StarRating.tsx`

---

### 8. Session timer + resume banner
**Навіщо:** недавно додано sync; перевірити edge cases.

**Що зробити:**
- Тест: dismiss → banner → reload → інший пристрій
- Pause/resume + pages/note draft sync
- «Скасувати» vs «Завершити» — чіткі copy
- Portal + z-index над fly-out

**Готово коли:** сценарії з #1 (сесія) всі ✅; немає ghost sessions.

**Зроблено (2026-06-17):** банер через portal, z-index 105 (> fly-out); копірайт «Згорнути» / «Скинути» / «Завершити й записати»; clear active session лише після успішного log; realtime sync draft; merge dirty local; flush offline delete.

**Файли:** `SessionTimer.tsx`, `activeSessionSync.ts`, `ActiveSessionBanner.tsx`, `AppOverlays.tsx`

---

### 9. ReaderView — продуктове рішення
**Навіщо:** зараз демо-проза; для ebook є кнопка «Читати далі».

**Варіанти (обрати один):**
- **A)** Залишити stub з позначкою «демо» (як прототип)
- **B)** Прибрати для paper і ebook (лише сесії)
- **C)** Відкласти до v2 (EPUB/файл)

**Що зробити:** зафіксувати рішення в `product-spec.md`; реалізувати обране.

**Готово коли:** немає кнопки/flow, який обіцяє те, чого немає.

**Рішення (2026-06-17):** **B + відкладено до v2** — прибрано «▷ Читати далі» і `ReaderView` з prod; paper і ebook використовують лише «⏱ Почати сесію». Демо-reader лишається в `design-handoff/prototype/`; EPUB/файл — після v1.

**Файли:** `BookDetailModal.tsx`, `AppOverlays.tsx`, `docs/product-spec.md` (видалено `ReaderView.tsx`)

---

## Фаза C — Auth + дані / sync (10–17)

### 10. Auth + onboarding — візуал і копі
**Навіщо:** перше враження; порівняти з `onboarding.jsx`.

**Що зробити:**
- Кроки email / sent / who — layout, brand cat, footer «Безкоштовно назавжди»
- Google button — стиль не ламає card
- Copy: «Без паролів…», «Перевір пошту»

**Готово коли:** auth card візуально в одній системі з рештою app.

**Зроблено (2026-06-18):** спільний `BrandMark`; auth/onboarding картки на `detail-ui.css` (Google btn, divider, поля); копі як у прототипі; callback/loading на room backdrop.

**Файли:** `LoginForm.tsx`, `OnboardingWelcome.tsx`, `BrandMark.tsx`, `AuthCallbackPage.tsx`, `detail-ui.css`

---

### 11. Onboarding — persist у Supabase
**Навіщо:** `dilibris_onboarded_*` в localStorage — на новому пристрої onboarding знову.

**Що зробити:**
- Міграція: `profiles.onboarded_at timestamptz` (або `has_completed_onboarding boolean`)
- Читати з профілю замість localStorage
- Fallback localStorage → migrate on login

**Готово коли:** onboarding показується один раз на акаунт, на будь-якому пристрої.

**Зроблено (2026-06-18):** `profiles.onboarded_at`; `resolveOnboardingStatus` + migrate з localStorage; кеш localStorage після server read.

**Файли:** `supabase/migrations/004_profiles_onboarded_at.sql`, `src/lib/onboarding.ts`, `OnboardingWelcome.tsx`, `App.tsx`

**Deploy:** після merge — виконати міграцію в Supabase SQL Editor.

---

### 12. Offline: notes у черзі sync
**Навіщо:** spec обіцяє offline; notes зараз тільки online Supabase.

**Що зробити:**
- Dexie table `notes`
- `BookNotesSection` + `notesFeed.ts` — read cache, write queue
- `flushPendingOps` або окремий flush для notes
- Conflict: last-write-wins по `updated_at`

**Готово коли:** додана нотатка offline з’являється після reconnect на іншому пристрої.

**Зроблено (2026-06-18):** Dexie `notes`; `notesSync.ts` (read cache, write queue, LWW on flush); `BookNotesSection` + feed через offline шар.

**Файли:** `db.ts`, `notesSync.ts`, `librarySync.ts`, `BookNotesSection.tsx`, `notesFeed.ts`

---

### 13. Offline: reviews у черзі sync
**Аналогічно #12** для `BookReviewsSection.tsx` і таблиці `reviews`.

**Готово коли:** відгук можна написати offline і sync.

**Зроблено (2026-06-18):** Dexie `reviews`; `reviewsSync.ts` (read cache, write queue, LWW on flush); `BookReviewsSection` через offline шар.

**Файли:** `db.ts`, `reviewsSync.ts`, `librarySync.ts`, `BookReviewsSection.tsx`

---

### 14. Offline: dashboard snapshot
**Навіщо:** dashboard зараз тільки live Supabase.

**Що зробити:**
- При успішному online fetch — кешувати агрегати в Dexie
- Offline — показати snapshot + badge «дані станом на …»

**Готово коли:** `/dashboard` не пустий offline після хоча б одного візиту online.

**Зроблено (2026-06-18):** Dexie `dashboardSnapshots`; `dashboardSync.ts`; badge «Дані станом на …»; fallback з кешу бібліотеки.

**Файли:** `db.ts`, `dashboardSync.ts`, `stats.ts`, `DashboardPage.tsx`

---

### 15. Settings prefs → Supabase
**Навіщо:** city, digest, reminders, display prefs — localStorage only.

**Що зробити:**
- JSON column на `profiles` (e.g. `app_prefs jsonb`) або окремі колонки
- Migrate read/write у `userSettings.ts`, `appearancePrefs.ts`, `libraryDisplayPrefs.ts`
- Sync on login; local cache for offline read

**Готово коли:** зміна mood/accent на телефоні видна на ноуті після reload.

**Зроблено (2026-06-18):** `profiles.app_prefs` jsonb; `appPrefs.ts` (sync on login, legacy migrate); prefs modules + `AppPrefsSyncEffect`.

**Файли:** `005_profiles_app_prefs.sql`, `appPrefs.ts`, `userSettings.ts`, `appearancePrefs.ts`, `libraryDisplayPrefs.ts`, `AppPrefsSyncEffect.tsx`, `SettingsSheet.tsx`

**Міграція prod:** `supabase/migrations/005_profiles_app_prefs.sql` на DiLibris PRODUCTION.

---

### 16. Notifications — прибрати seed, persist
**Навіщо:** fake seed у `notificationsStore.ts`; localStorage не sync.

**Що зробити:**
- Прибрати або gate `seed()` за dev-only
- Зберігати notifications у Supabase **або** генерувати лише з `syncActivityNotifications` без фейків
- Read/unread state server-side

**Готово коли:** немає вигаданих «Час читати» при першому візиті; read state sync між пристроями.

**Файли:** `notificationsStore.ts`, `syncActivityNotifications.ts`, migration (optional `notifications` table)

---

### 17. Re-read (parent_entry_id)
**Навіщо:** spec — перечитання як окремий запис; schema має `parent_entry_id`, UI ні.

**Що зробити:**
- При зміні статусу на `re_reading` — prompt «новий прохід?» → create child entry
- Toggle «рахувати в challenge» на child
- Dashboard рахує правильно з `counts_toward_stats`

**Готово коли:** друге перечитання не перезаписує перше; challenge коректний.

**Файли:** `BookDetailModal.tsx`, `librarySync.ts`, `lib/stats.ts`

---

## Фаза D — Інші екрани (18–27)

### 18. Dashboard — візуал до прототипу
Gold challenge bar, stat cards, monthly bars, donut, authors — spacing, colors, typography vs `screens.jsx`.

**Файли:** `DashboardPage.tsx`, `screens-ui.css`, `FormatDonut.tsx`

---

### 19. Notes feed — візуал + empty state
Masonry cards, filter chips, search, empty illustration, eyebrow copy.

**Файли:** `NotesPage.tsx`, `screens-ui.css`

---

### 20. Buddy list — обкладинки + картки
`BookCover` на картці; progress bar; pluralization «1 учасник / 2 учасники»; archived state.

**Файли:** `BuddyReadsPage.tsx`, `screens-ui.css`

---

### 21. Buddy detail — layout + shared notes
Two-column layout; «Архівувати» copy; shared notes composer parity; chat bubbles.

**Файли:** `BuddyReadDetailPage.tsx`, `screens-ui.css`

---

### 22. Add book — Google Books fallback
Spec chain: Open Library → Google Books → manual.

**Файли:** new `googleBooks.ts`, `AddBookModal.tsx`

---

### 23. Add shelf — Choice chips
Replace `<select>` status filter with `dl-choice` row like detail card.

**Файли:** `AddShelfSheet.tsx`, `AddShelfForm.tsx`

---

### 24. Settings sheet — parity + заголовок
Title «Профіль і налаштування»; sections order vs prototype; toggles styling.

**Файли:** `SettingsSheet.tsx`, `detail-ui.css`

---

### 25. NotifBell — parity + deep links audit
Flyout styling; кожен тип веде куди треба; empty state.

**Файли:** `NotifBell.tsx`, `app-shell.css`

---

### 26. Goodreads import — polish + spec update
Preview list styling; error states; оновити `product-spec.md` (CSV shipped).

**Файли:** `GoodreadsImportSheet.tsx`, `docs/product-spec.md`

---

### 27. Offline UX — один банер
Прибрати дубль `OfflineBanner` + `LibraryPage` `.offline-hint`; один канал повідомлень.

**Файли:** `OfflineProvider.tsx`, `LibraryPage.tsx`, `OfflineBanner.tsx`

---

## Фаза E — Фінальний полish (28–30)

### 28. Копірайт і labels — один прохід
Єдиний тон (ти); `labels.ts`; помилки людською мовою; виправити «інternet» typo.

**Файли:** `labels.ts`, `librarySync.ts`, всі `*Page.tsx`

---

### 29. Mobile nav + safe area audit
Nav pills <820px; bottom sheets; banner/timer safe-area; tap targets ≥44px.

**Файли:** `AppNav.tsx`, `app-shell.css`, `detail-ui.css`

---

### 30. Accessibility pass
Focus trap у modals; `aria-label` на ✕; keyboard fly-out/detail; `prefers-reduced-motion` audit.

**Файли:** modals, `BookFlyout.tsx`, `BookDetailModal.tsx`

---

## Після v1.1 (не в scope зараз)

- Bookcase chrome (лампа, карниз, цоколь) — відхилено; photo + full-bleed shelves краще
- Push/email notifications backend
- EPUB / real reader
- Public profile pages
- Spine mode marketing decision (spec vs handoff)
- Automated E2E tests

---

## Швидка карта коду

| Шар | Де |
|-----|-----|
| Routes | `src/App.tsx` |
| Сторінки | `src/pages/*` |
| Глобальні оверлеї | `src/components/AppOverlays.tsx` |
| Бібліотека sync | `src/lib/offline/librarySync.ts` |
| Активна сесія | `src/lib/offline/activeSessionSync.ts` |
| Dexie | `src/lib/offline/db.ts` |
| Стилі кімнати | `src/styles/library.css`, `library-overrides.css` |
| Стилі карток | `src/styles/detail-ui.css` |
| Токени | `src/tokens.css` |

---

*Останнє оновлення: 2026-06-18 — #15 settings prefs Supabase*
