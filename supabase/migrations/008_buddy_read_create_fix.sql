-- Fix buddy read creation: owner can read own rows (PostgREST insert.returning),
-- and invite_token default resolves pgcrypto in extensions schema.

create policy "buddy_reads_select_owner"
  on public.buddy_reads for select
  using (owner_id = auth.uid());

alter table public.buddy_reads
  alter column invite_token set default encode(extensions.gen_random_bytes(16), 'hex');
