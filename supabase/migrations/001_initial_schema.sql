-- DiLibris initial schema (Supabase Postgres)
-- Run in SQL Editor or via supabase db push

-- =============================================================================
-- Extensions
-- =============================================================================

create extension if not exists pgcrypto with schema extensions;
create extension if not exists pg_trgm with schema extensions;

-- =============================================================================
-- Enums
-- =============================================================================

create type public.book_entry_status as enum (
  'want_to_read',
  'reading',
  'finished',
  'dnf',
  're_reading'
);

create type public.reading_format as enum (
  'paper',
  'ebook'
);

create type public.note_type as enum (
  'quote',
  'thought',
  'general'
);

create type public.note_visibility as enum (
  'private',
  'public'
);

create type public.buddy_read_member_role as enum (
  'owner',
  'member'
);

create type public.import_job_status as enum (
  'pending',
  'processing',
  'completed',
  'failed',
  'cancelled'
);

create type public.import_job_source as enum (
  'goodreads_csv',
  'manual_batch'
);

-- =============================================================================
-- Tables
-- =============================================================================

-- Profiles (1:1 with auth.users)
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  avatar_url text,
  bio text,
  locale text not null default 'uk',
  is_profile_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Public profile metadata for each authenticated user.';

-- Annual / custom reading goals
create table public.reading_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null default 'Reading challenge',
  year int not null check (year >= 2000 and year <= 2100),
  target_books int not null default 0 check (target_books >= 0),
  target_pages int not null default 0 check (target_pages >= 0),
  target_minutes int not null default 0 check (target_minutes >= 0),
  starts_on date,
  ends_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, year, title)
);

comment on table public.reading_challenges is 'Per-user reading goals (books, pages, minutes).';

-- Shared catalog of books (deduplicated by external_ids where possible)
create table public.books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  authors text[] not null default '{}',
  isbn_10 text,
  isbn_13 text,
  publisher text,
  published_year int check (published_year is null or (published_year >= 1000 and published_year <= 2100)),
  page_count int check (page_count is null or page_count > 0),
  language text,
  cover_url text,
  description text,
  external_ids jsonb not null default '{}'::jsonb,
  metadata_source text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint books_external_ids_is_object check (jsonb_typeof(external_ids) = 'object')
);

comment on table public.books is 'Canonical book records; external_ids holds Open Library, Google Books, etc.';
comment on column public.books.external_ids is 'e.g. {"open_library": "OL123W", "google_books": "abc123"}';

create index books_title_trgm_idx on public.books using gin (title extensions.gin_trgm_ops);
create index books_authors_gin_idx on public.books using gin (authors);
create index books_external_ids_gin_idx on public.books using gin (external_ids);

-- User-created virtual shelves
create table public.user_shelves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  description text,
  sort_order int not null default 0,
  status_filter public.book_entry_status,
  color text,
  icon text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

comment on table public.user_shelves is 'Virtual library shelves; optional status_filter groups by reading status.';

-- User ↔ book relationship (library entry)
create table public.user_book_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  book_id uuid not null references public.books (id) on delete restrict,
  shelf_id uuid references public.user_shelves (id) on delete set null,
  parent_entry_id uuid references public.user_book_entries (id) on delete set null,
  status public.book_entry_status not null default 'want_to_read',
  format public.reading_format,
  rating numeric(2, 1) check (
    rating is null
    or (
      rating >= 0.5
      and rating <= 5
      and mod((rating * 2)::numeric, 1) = 0
    )
  ),
  counts_toward_stats boolean not null default true,
  started_on date,
  finished_on date,
  current_page int not null default 0 check (current_page >= 0),
  total_pages int check (total_pages is null or total_pages > 0),
  total_minutes int not null default 0 check (total_minutes >= 0),
  is_entry_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.user_book_entries is 'A user copy of a book with status, rating, progress, and stats flags.';
comment on column public.user_book_entries.counts_toward_stats is 'Whether this entry (e.g. re-read) counts toward challenges/dashboard.';
comment on column public.user_book_entries.parent_entry_id is 'Links re_reading entries to the original finished entry.';

create index user_book_entries_user_status_idx on public.user_book_entries (user_id, status);
create index user_book_entries_book_idx on public.user_book_entries (book_id);
create unique index user_book_entries_user_book_active_uidx
  on public.user_book_entries (user_id, book_id)
  where parent_entry_id is null;

-- Individual reading sessions (drives total_minutes via trigger)
create table public.reading_sessions (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.user_book_entries (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  pages_read int not null default 0 check (pages_read >= 0),
  minutes int not null default 0 check (minutes >= 0),
  note text,
  created_at timestamptz not null default now()
);

comment on table public.reading_sessions is 'Timed reading log; minutes aggregate into user_book_entries.total_minutes.';

create index reading_sessions_entry_idx on public.reading_sessions (entry_id);

-- Public reviews (always visible to authenticated users per product spec)
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  book_id uuid not null references public.books (id) on delete cascade,
  entry_id uuid references public.user_book_entries (id) on delete set null,
  body text not null,
  rating numeric(2, 1) not null check (
    rating >= 0.5
    and rating <= 5
    and mod((rating * 2)::numeric, 1) = 0
  ),
  contains_spoilers boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, book_id)
);

comment on table public.reviews is 'Public written reviews with half-star ratings.';

-- Notes: quotes, thoughts, general; private or public; optional buddy read scope
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  entry_id uuid not null references public.user_book_entries (id) on delete cascade,
  book_id uuid not null references public.books (id) on delete cascade,
  buddy_read_id uuid,
  note_type public.note_type not null default 'general',
  visibility public.note_visibility not null default 'private',
  body text not null,
  page_number int check (page_number is null or page_number > 0),
  chapter text,
  contains_spoilers boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.notes is 'Per-entry notes; may be scoped to a buddy read for shared discussion.';

-- Buddy reads (group reading)
create table public.buddy_reads (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  book_id uuid not null references public.books (id) on delete restrict,
  title text not null,
  description text,
  invite_token text not null unique default encode(gen_random_bytes(16), 'hex'),
  target_finish_on date,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.buddy_reads is 'Shared reading group with invite link (invite_token).';

create index buddy_reads_owner_idx on public.buddy_reads (owner_id);

-- Buddy read membership
create table public.buddy_read_members (
  id uuid primary key default gen_random_uuid(),
  buddy_read_id uuid not null references public.buddy_reads (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.buddy_read_member_role not null default 'member',
  joined_at timestamptz not null default now(),
  unique (buddy_read_id, user_id)
);

comment on table public.buddy_read_members is 'Users participating in a buddy read.';

-- Buddy read chat / progress messages
create table public.buddy_read_messages (
  id uuid primary key default gen_random_uuid(),
  buddy_read_id uuid not null references public.buddy_reads (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

comment on table public.buddy_read_messages is 'In-group messages for a buddy read.';

create index buddy_read_messages_buddy_read_idx on public.buddy_read_messages (buddy_read_id, created_at desc);

-- Deferred / batch import jobs (e.g. Goodreads CSV)
create table public.import_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  source public.import_job_source not null,
  status public.import_job_status not null default 'pending',
  file_name text,
  total_rows int not null default 0,
  processed_rows int not null default 0,
  succeeded_rows int not null default 0,
  failed_rows int not null default 0,
  error_message text,
  result_summary jsonb not null default '{}'::jsonb,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table public.import_jobs is 'Background import queue (Goodreads CSV, etc.).';

-- FK: notes.buddy_read_id (after buddy_reads exists)
alter table public.notes
  add constraint notes_buddy_read_id_fkey
  foreign key (buddy_read_id) references public.buddy_reads (id) on delete set null;

create index notes_entry_idx on public.notes (entry_id);
create index notes_buddy_read_idx on public.notes (buddy_read_id) where buddy_read_id is not null;

-- =============================================================================
-- Helper functions
-- =============================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_buddy_read_member(
  p_buddy_read_id uuid,
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.buddy_read_members m
    where m.buddy_read_id = p_buddy_read_id
      and m.user_id = p_user_id
  );
$$;

comment on function public.is_buddy_read_member is 'RLS helper: true if user is a member of the buddy read.';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      split_part(coalesce(new.email, 'reader'), '@', 1)
    )
  );
  return new;
end;
$$;

create or replace function public.sync_entry_total_minutes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_entry_id uuid;
  v_total int;
begin
  v_entry_id := coalesce(new.entry_id, old.entry_id);

  select coalesce(sum(s.minutes), 0)::int
  into v_total
  from public.reading_sessions s
  where s.entry_id = v_entry_id;

  update public.user_book_entries e
  set total_minutes = v_total
  where e.id = v_entry_id;

  return coalesce(new, old);
end;
$$;

comment on function public.sync_entry_total_minutes is 'Keeps user_book_entries.total_minutes in sync with reading_sessions.';

-- Join buddy read via invite token (RPC)
create or replace function public.join_buddy_read(p_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_buddy_read public.buddy_reads%rowtype;
  v_member_id uuid;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_token is null or length(trim(p_token)) = 0 then
    raise exception 'Invalid invite token';
  end if;

  select *
  into v_buddy_read
  from public.buddy_reads br
  where br.invite_token = trim(p_token)
    and br.is_archived = false;

  if not found then
    raise exception 'Buddy read not found or archived';
  end if;

  insert into public.buddy_read_members (buddy_read_id, user_id, role)
  values (v_buddy_read.id, v_user_id, 'member')
  on conflict (buddy_read_id, user_id) do nothing
  returning id into v_member_id;

  return v_buddy_read.id;
end;
$$;

comment on function public.join_buddy_read is 'Authenticated user joins a buddy read by invite_token; returns buddy_read id.';

grant execute on function public.join_buddy_read(text) to authenticated;

-- =============================================================================
-- Triggers
-- =============================================================================

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger user_shelves_set_updated_at
  before update on public.user_shelves
  for each row execute function public.set_updated_at();

create trigger user_book_entries_set_updated_at
  before update on public.user_book_entries
  for each row execute function public.set_updated_at();

create trigger reviews_set_updated_at
  before update on public.reviews
  for each row execute function public.set_updated_at();

create trigger notes_set_updated_at
  before update on public.notes
  for each row execute function public.set_updated_at();

create trigger reading_challenges_set_updated_at
  before update on public.reading_challenges
  for each row execute function public.set_updated_at();

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create trigger reading_sessions_sync_entry_minutes_ins
  after insert on public.reading_sessions
  for each row execute function public.sync_entry_total_minutes();

create trigger reading_sessions_sync_entry_minutes_upd
  after update of minutes, entry_id on public.reading_sessions
  for each row execute function public.sync_entry_total_minutes();

create trigger reading_sessions_sync_entry_minutes_del
  after delete on public.reading_sessions
  for each row execute function public.sync_entry_total_minutes();

-- Enforce entry ownership on sessions
create or replace function public.enforce_reading_session_entry_owner()
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
    raise exception 'Session user must match entry owner';
  end if;

  new.user_id := v_entry_user;
  return new;
end;
$$;

create trigger reading_sessions_enforce_owner
  before insert or update on public.reading_sessions
  for each row execute function public.enforce_reading_session_entry_owner();

-- Notes: book_id must match entry's book
create or replace function public.enforce_note_book_consistency()
returns trigger
language plpgsql
as $$
declare
  v_book_id uuid;
  v_entry_user uuid;
begin
  select e.book_id, e.user_id
  into v_book_id, v_entry_user
  from public.user_book_entries e
  where e.id = new.entry_id;

  if v_book_id is null then
    raise exception 'Entry not found';
  end if;

  new.book_id := v_book_id;
  new.user_id := v_entry_user;

  if new.buddy_read_id is not null
    and not public.is_buddy_read_member(new.buddy_read_id, new.user_id) then
    raise exception 'Not a member of this buddy read';
  end if;

  return new;
end;
$$;

create trigger notes_enforce_book_and_buddy
  before insert or update on public.notes
  for each row execute function public.enforce_note_book_consistency();

-- Buddy read owner auto-added as member
create or replace function public.buddy_read_add_owner_member()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.buddy_read_members (buddy_read_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict (buddy_read_id, user_id) do update set role = 'owner';
  return new;
end;
$$;

create trigger buddy_reads_add_owner
  after insert on public.buddy_reads
  for each row execute function public.buddy_read_add_owner_member();

-- =============================================================================
-- Views
-- =============================================================================

create or replace view public.book_readers_public
with (security_invoker = true)
as
select
  e.book_id,
  e.user_id,
  p.display_name,
  p.avatar_url,
  e.status,
  e.rating as entry_rating,
  e.finished_on,
  r.id as review_id,
  r.body as review_body,
  r.rating as review_rating,
  r.created_at as review_created_at
from public.user_book_entries e
join public.profiles p on p.id = e.user_id
left join public.reviews r
  on r.user_id = e.user_id
  and r.book_id = e.book_id
where
  p.is_profile_public = true
  and (
    e.is_entry_public = true
    or r.id is not null
  )
  and e.status in ('finished', 're_reading');

comment on view public.book_readers_public is 'Public discovery: who read a book and their public review/rating.';

grant select on public.book_readers_public to authenticated, anon;

-- =============================================================================
-- Row Level Security
-- =============================================================================

alter table public.profiles enable row level security;
alter table public.reading_challenges enable row level security;
alter table public.books enable row level security;
alter table public.user_shelves enable row level security;
alter table public.user_book_entries enable row level security;
alter table public.reading_sessions enable row level security;
alter table public.reviews enable row level security;
alter table public.notes enable row level security;
alter table public.buddy_reads enable row level security;
alter table public.buddy_read_members enable row level security;
alter table public.buddy_read_messages enable row level security;
alter table public.import_jobs enable row level security;

-- profiles
create policy "profiles_select_public_or_own"
  on public.profiles for select
  using (is_profile_public = true or id = auth.uid());

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (id = auth.uid());

create policy "profiles_update_own"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "profiles_delete_own"
  on public.profiles for delete
  using (id = auth.uid());

-- reading_challenges (private to owner)
create policy "reading_challenges_select_own"
  on public.reading_challenges for select
  using (user_id = auth.uid());

create policy "reading_challenges_insert_own"
  on public.reading_challenges for insert
  with check (user_id = auth.uid());

create policy "reading_challenges_update_own"
  on public.reading_challenges for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "reading_challenges_delete_own"
  on public.reading_challenges for delete
  using (user_id = auth.uid());

-- books (shared catalog: read all, authenticated insert/update own contributions)
create policy "books_select_all"
  on public.books for select
  using (true);

create policy "books_insert_authenticated"
  on public.books for insert
  to authenticated
  with check (created_by is null or created_by = auth.uid());

create policy "books_update_creator"
  on public.books for update
  to authenticated
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

-- user_shelves
create policy "user_shelves_select_own"
  on public.user_shelves for select
  using (user_id = auth.uid());

create policy "user_shelves_insert_own"
  on public.user_shelves for insert
  with check (user_id = auth.uid());

create policy "user_shelves_update_own"
  on public.user_shelves for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "user_shelves_delete_own"
  on public.user_shelves for delete
  using (user_id = auth.uid());

-- user_book_entries
create policy "user_book_entries_select_own_or_public"
  on public.user_book_entries for select
  using (user_id = auth.uid() or is_entry_public = true);

create policy "user_book_entries_insert_own"
  on public.user_book_entries for insert
  with check (user_id = auth.uid());

create policy "user_book_entries_update_own"
  on public.user_book_entries for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "user_book_entries_delete_own"
  on public.user_book_entries for delete
  using (user_id = auth.uid());

-- reading_sessions
create policy "reading_sessions_select_own"
  on public.reading_sessions for select
  using (user_id = auth.uid());

create policy "reading_sessions_insert_own"
  on public.reading_sessions for insert
  with check (user_id = auth.uid());

create policy "reading_sessions_update_own"
  on public.reading_sessions for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "reading_sessions_delete_own"
  on public.reading_sessions for delete
  using (user_id = auth.uid());

-- reviews (public read, own write)
create policy "reviews_select_all_authenticated"
  on public.reviews for select
  to authenticated
  using (true);

create policy "reviews_select_anon"
  on public.reviews for select
  to anon
  using (true);

create policy "reviews_insert_own"
  on public.reviews for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "reviews_update_own"
  on public.reviews for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "reviews_delete_own"
  on public.reviews for delete
  using (user_id = auth.uid());

-- notes (split select; own CUD)
create policy "notes_select_own"
  on public.notes for select
  using (user_id = auth.uid());

create policy "notes_select_public"
  on public.notes for select
  using (visibility = 'public');

create policy "notes_select_buddy_read"
  on public.notes for select
  using (
    buddy_read_id is not null
    and public.is_buddy_read_member(buddy_read_id, auth.uid())
  );

create policy "notes_insert_own"
  on public.notes for insert
  with check (user_id = auth.uid());

create policy "notes_update_own"
  on public.notes for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "notes_delete_own"
  on public.notes for delete
  using (user_id = auth.uid());

-- buddy_reads
create policy "buddy_reads_select_member"
  on public.buddy_reads for select
  using (public.is_buddy_read_member(id, auth.uid()));

create policy "buddy_reads_insert_own"
  on public.buddy_reads for insert
  with check (owner_id = auth.uid());

create policy "buddy_reads_update_owner"
  on public.buddy_reads for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "buddy_reads_delete_owner"
  on public.buddy_reads for delete
  using (owner_id = auth.uid());

-- buddy_read_members
create policy "buddy_read_members_select_member"
  on public.buddy_read_members for select
  using (public.is_buddy_read_member(buddy_read_id, auth.uid()));

create policy "buddy_read_members_insert_owner_or_self_join"
  on public.buddy_read_members for insert
  with check (
    user_id = auth.uid()
    or exists (
      select 1 from public.buddy_reads br
      where br.id = buddy_read_id and br.owner_id = auth.uid()
    )
  );

create policy "buddy_read_members_delete_owner_or_self"
  on public.buddy_read_members for delete
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.buddy_reads br
      where br.id = buddy_read_id and br.owner_id = auth.uid()
    )
  );

-- buddy_read_messages
create policy "buddy_read_messages_select_member"
  on public.buddy_read_messages for select
  using (public.is_buddy_read_member(buddy_read_id, auth.uid()));

create policy "buddy_read_messages_insert_member"
  on public.buddy_read_messages for insert
  with check (
    user_id = auth.uid()
    and public.is_buddy_read_member(buddy_read_id, auth.uid())
  );

create policy "buddy_read_messages_update_own"
  on public.buddy_read_messages for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "buddy_read_messages_delete_own"
  on public.buddy_read_messages for delete
  using (user_id = auth.uid());

-- import_jobs
create policy "import_jobs_select_own"
  on public.import_jobs for select
  using (user_id = auth.uid());

create policy "import_jobs_insert_own"
  on public.import_jobs for insert
  with check (user_id = auth.uid());

create policy "import_jobs_update_own"
  on public.import_jobs for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "import_jobs_delete_own"
  on public.import_jobs for delete
  using (user_id = auth.uid());

-- =============================================================================
-- Grants (Supabase roles)
-- =============================================================================

grant usage on schema public to anon, authenticated, service_role;

grant select on table public.profiles to anon, authenticated;
grant insert, update, delete on table public.profiles to authenticated;

grant all on table public.reading_challenges to authenticated;
grant all on table public.books to authenticated;
grant select on table public.books to anon;

grant all on table public.user_shelves to authenticated;
grant all on table public.user_book_entries to authenticated;
grant select on table public.user_book_entries to anon;

grant all on table public.reading_sessions to authenticated;
grant select, insert, update, delete on table public.reviews to authenticated;
grant select on table public.reviews to anon;

grant all on table public.notes to authenticated;
grant all on table public.buddy_reads to authenticated;
grant all on table public.buddy_read_members to authenticated;
grant all on table public.buddy_read_messages to authenticated;
grant all on table public.import_jobs to authenticated;

grant execute on function public.is_buddy_read_member(uuid, uuid) to authenticated;
