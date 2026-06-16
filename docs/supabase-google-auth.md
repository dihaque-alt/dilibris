# Google OAuth для DiLibris

Magic link залишається. Google — додатковий спосіб входу через Supabase Auth.

## Що вже в коді

- Кнопка **«Увійти через Google»** на екрані входу
- Callback `/auth/callback` — PKCE (`exchangeCodeForSession`) + magic link
- Міграція `002_google_oauth_profile.sql` — `avatar_url` з Google при реєстрації

## 1. Google Cloud Console

1. [console.cloud.google.com](https://console.cloud.google.com) → проєкт (або новий).
2. **APIs & Services → OAuth consent screen**
   - User type: **External** (для особистого pet-проєкту достатньо)
   - App name: `DiLibris`
   - User support email + Developer contact
   - Scopes: залиш мінімальні (`email`, `profile`, `openid` — Supabase додає сам)
   - Test users: додай свій Gmail, поки app у статусі **Testing**
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID**
   - Application type: **Web application**
   - Name: `DiLibris Supabase`
   - **Authorized redirect URIs** — скопіюй з Supabase (крок 2 нижче), виглядає так:
     ```
     https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
     ```
4. Збережи **Client ID** і **Client Secret**.

## 2. Supabase Dashboard

1. **Authentication → Providers → Google** → увімкни.
2. Встав **Client ID** і **Client Secret** з Google.
3. Скопіюй **Callback URL (for OAuth)** — саме його додай у Google redirect URIs (крок 1).
4. **Authentication → URL Configuration → Redirect URLs** — мають бути:
   ```
   http://localhost:5173/**
   http://localhost:5174/**
   https://dilibris.vercel.app/**
   ```
   (5174 — якщо Vite зайняв 5173)

## 3. SQL (якщо БД уже створена з 001)

SQL Editor → виконай `supabase/migrations/002_google_oauth_profile.sql`.

Якщо проєкт новий — достатньо оновленого `handle_new_user` з 002 після 001.

## 4. Локальна перевірка

```bash
cd ~/dilibris
npm run dev
```

1. Відкрий http://localhost:5173
2. **Увійти через Google** → обери акаунт → повернення на `/auth/callback` → бібліотека
3. Magic link теж має працювати як раніше

## Типові помилки

| Симптом | Причина |
|---------|---------|
| `redirect_uri_mismatch` | У Google не той callback — має бути Supabase `/auth/v1/callback`, не `/auth/callback` твого сайту |
| «Access blocked» / app not verified | OAuth app у Testing — додай email у Test users |
| Повернення на сайт без сесії | Перевір Redirect URLs у Supabase (`http://localhost:5173/**`) |
| Користувач є, але без аватара | Профіль створений до міграції 002 — онови `avatar_url` вручну або через профіль пізніше |

## Env

Додаткових змінних у `.env.local` **не потрібно** — Google credentials живуть лише в Supabase Dashboard.

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## Один email — два способи входу

Supabase може з’єднати magic link і Google, якщо email збігається (залежить від налаштувань **Authentication → Providers**). Якщо побачиш duplicate user — перевір [Account Linking](https://supabase.com/docs/guides/auth/auth-identity-linking) у документації Supabase.
