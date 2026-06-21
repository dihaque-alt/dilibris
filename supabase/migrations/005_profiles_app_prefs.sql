-- User app preferences (settings, appearance, library display) synced across devices.

alter table public.profiles
  add column if not exists app_prefs jsonb not null default '{}'::jsonb;

comment on column public.profiles.app_prefs is
  'App preferences: city, notifications, appearance, library display.';
