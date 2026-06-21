-- In-app notifications (activity-derived, read state synced across devices).

create table public.user_notifications (
  user_id uuid not null references public.profiles (id) on delete cascade,
  id text not null,
  kind text not null check (kind in ('buddy', 'challenge', 'deadline', 'reminder')),
  body text not null,
  read boolean not null default false,
  created_at timestamptz not null default now(),
  go_page text,
  go_buddy_read_id uuid references public.buddy_reads (id) on delete set null,
  go_entry_id uuid references public.user_book_entries (id) on delete set null,
  primary key (user_id, id)
);

create index user_notifications_user_created_idx
  on public.user_notifications (user_id, created_at desc);

comment on table public.user_notifications is
  'Per-user notification feed; ids are stable dedupe keys (e.g. msg:uuid, challenge-half:2026).';

alter table public.user_notifications enable row level security;

create policy "user_notifications_select_own"
  on public.user_notifications for select
  using (user_id = auth.uid());

create policy "user_notifications_insert_own"
  on public.user_notifications for insert
  with check (user_id = auth.uid());

create policy "user_notifications_update_own"
  on public.user_notifications for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "user_notifications_delete_own"
  on public.user_notifications for delete
  using (user_id = auth.uid());

grant all on table public.user_notifications to authenticated;
