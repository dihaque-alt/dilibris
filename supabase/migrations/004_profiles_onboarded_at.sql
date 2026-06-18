-- First-run onboarding completion (synced across devices).

alter table public.profiles
  add column if not exists onboarded_at timestamptz;

comment on column public.profiles.onboarded_at is
  'When the user completed first-run onboarding (name + year goal).';
