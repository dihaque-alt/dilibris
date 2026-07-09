-- Public avatar bucket: objects at {user_id}/avatar.{ext}

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatars_public_read"
  on storage.objects for select
  to public
  using (bucket_id = 'avatars');

create policy "avatars_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and starts_with(name, auth.uid()::text || '/')
  );

create policy "avatars_update_own"
  on storage.objects for update
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
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and starts_with(name, auth.uid()::text || '/')
  );
