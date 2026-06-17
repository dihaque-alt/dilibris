-- Live reading session draft (one per user); syncs across devices until finished or discarded.

create table public.active_reading_sessions (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  entry_id uuid not null references public.user_book_entries (id) on delete cascade,
  accumulated_seconds int not null default 0 check (accumulated_seconds >= 0),
  is_running boolean not null default true,
  last_tick_at timestamptz not null default now(),
  pages_draft text not null default '',
  note_draft text not null default '',
  updated_at timestamptz not null default now()
);

comment on table public.active_reading_sessions is
  'In-progress reading timer per user; removed when session is saved or discarded.';

create index active_reading_sessions_entry_idx on public.active_reading_sessions (entry_id);

create or replace function public.enforce_active_reading_session_owner()
returns trigger
language plpgsql
as $$
declare
  v_entry_user uuid;
begin
  select e.user_id into v_entry_user
  from public.user_book_entries e
  where e.id = new.entry_id;

  if v_entry_user is null then
    raise exception 'Entry not found';
  end if;

  if v_entry_user <> coalesce(new.user_id, auth.uid()) then
    raise exception 'Active session user must match entry owner';
  end if;

  new.user_id := v_entry_user;
  new.updated_at := now();
  return new;
end;
$$;

create trigger active_reading_sessions_enforce_owner
  before insert or update on public.active_reading_sessions
  for each row execute function public.enforce_active_reading_session_owner();

alter table public.active_reading_sessions enable row level security;

create policy "active_reading_sessions_select_own"
  on public.active_reading_sessions for select
  using (user_id = auth.uid());

create policy "active_reading_sessions_insert_own"
  on public.active_reading_sessions for insert
  with check (user_id = auth.uid());

create policy "active_reading_sessions_update_own"
  on public.active_reading_sessions for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "active_reading_sessions_delete_own"
  on public.active_reading_sessions for delete
  using (user_id = auth.uid());

grant all on table public.active_reading_sessions to authenticated;

alter publication supabase_realtime add table public.active_reading_sessions;
