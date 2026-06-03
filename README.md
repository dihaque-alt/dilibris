# DiLibris

Окремий проєкт — віртуальна бібліотека прочитаного.

**Репозиторій:** `/Users/diana.haque/dilibris` (не D.O.Brief)

## Docs

- [Product spec](docs/product-spec.md)
- [Data model](docs/data-model.md)

## Supabase setup

1. Створи **новий** проєкт у [Supabase Dashboard](https://supabase.com/dashboard).
2. SQL Editor → встав `supabase/migrations/001_initial_schema.sql`.
3. Authentication → URL configuration:
   - `http://localhost:5173/**` (Vite dev)
   - prod URL після деплою
4. Authentication → Email → увімкни Magic Link.

## Env (web client, майбутній)

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## Як додавати книги (перша версія)

1. **Пошук** — назва / автор (Open Library + Google Books)
2. **Вручну** — якщо не знайшло
3. **Імпорт з Goodreads** — пізніше, коли кістяк уже працює (не блокує старт)

## Запуск (локально)

```bash
cd ~/dilibris
npm install
npm run dev
```

Відкрий http://localhost:5173 — magic link надішле лист, після кліку поверне на `/auth/callback`.

## Що вже є в кістяку

- [x] Vite + React + TypeScript + Supabase
- [x] Magic link auth
- [x] CRUD полиць
- [x] Додавання книги (Open Library + вручну)
- [x] Placeholder обкладинки (кіт з ножиком)
- [x] Картка книги + сесії читання + рейтинг
- [x] Відгуки (публічні, свій + інших)
- [x] Нотатки (private/public, цитати/думки)
- [x] Дашборд + reading challenge
- [x] Buddy reads (створення, join, чат, спільні нотатки)
- [x] Offline (IndexedDB + sync queue для бібліотеки)
- [x] Claude Design prompt — [`docs/claude-design-prompt.md`](docs/claude-design-prompt.md)

## Наступні кроки (після кістяка)

## GitHub (коли будеш готова)

```bash
cd ~/dilibris
git add .
git commit -m "Initial DiLibris spec and database schema"
gh repo create DiLibris --private --source=. --push
```
