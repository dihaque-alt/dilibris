# DiLibris — backlog v2

Після закриття v1.1 (пункти 1–30). Порядок: **по номерах**, один пункт за раз.

**Еталон prod:** https://www.dilibris.org

---

## Статус

| # | Пункт | Статус |
|---|--------|--------|
| 31 | Сесія читання — відсотки (progress_mode) | ✅ |
| 32 | Дашборд — місячна статистика (книги / сторінки / час) | ✅ |
| 33 | Фото профілю (upload + Settings) | ✅ |
| 34 | Публічні профілі + навігація | ✅ |

---

### 31. Сесія читання — відсотки
Коли `progress_mode = percent`, таймер і «+ Сесія» приймають **відсотки** (дельта 0–100), оновлюють `current_page` як %.

**Файли:** `SessionTimer.tsx`, `BookDetailModal.tsx`, `librarySync.ts`, `AppOverlays.tsx`, `sessionProgress.ts`

---

### 32. Дашборд — Storygraph-style місяці
Перемикач метрики на графіку: **книги / сторінки / час** за місяцями обраного року.

**Файли:** `stats.ts`, `dashboardSync.ts`, `DashboardPage.tsx`

---

### 33. Фото профілю
Supabase Storage `avatars` + UI в Settings.

**Файли:** `009_avatars_storage.sql`, `avatarUpload.ts`, `userSettings.ts`, `SettingsSheet.tsx`

**Міграція prod:** `supabase/migrations/009_avatars_storage.sql`

---

### 34. Публічні профілі
Toggle «Публічний профіль», маршрут `/u/:id`, клікабельні імена в відгуках/нотатках.

**Файли:** `ProfilePage.tsx`, `ProfileLink.tsx`, `App.tsx`, `SettingsSheet.tsx`, `BookReviewsSection.tsx`, `BookNotesSection.tsx`
