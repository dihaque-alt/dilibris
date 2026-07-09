-- Robust avatar storage policies (idempotent — safe to re-run on prod)

insert into storage.buckets (id, name, public, file_size_limit)
values ('avatars', 'avatars', true, 2097152)
on conflict (id) do update
set public = true,
    file_size_limit = 2097152;

drop policy if exists "avatars_public_read" on storage.objects;
drop policy if exists "avatars_select_own" on storage.objects;
drop policy if exists "avatars_insert_own" on storage.objects;
drop policy if exists "avatars_update_own" on storage.objects;
drop policy if exists "avatars_delete_own" on storage.objects;

create policy "avatars_public_read"
  on storage.objects
  for select
  to public
  using (bucket_id = 'avatars');

create policy "avatars_insert_own"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and starts_with(name, auth.uid()::text || '/')
  );

create policy "avatars_update_own"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and starts_with(name, auth.uid()::text || '/')
  )
  with check (
    bucket_id = 'avatars'
    and starts_with(name, auth.uid()::text || '/')
  );

create policy "avatars_delete_own"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and starts_with(name, auth.uid()::text || '/')
  );
