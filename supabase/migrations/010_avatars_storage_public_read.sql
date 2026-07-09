-- Fix avatar bucket public read (required for getPublicUrl in browser)

update storage.buckets
set public = true
where id = 'avatars';

drop policy if exists "avatars_public_read" on storage.objects;

create policy "avatars_public_read"
  on storage.objects
  for select
  to public
  using (bucket_id = 'avatars');

drop policy if exists "avatars_select_own" on storage.objects;

create policy "avatars_select_own"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
