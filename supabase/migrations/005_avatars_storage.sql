-- Create public avatars bucket for AI-generated and user avatars
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Public read
create policy "avatars: public read"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Authenticated users can upload
create policy "avatars: authenticated upload"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.role() = 'authenticated');

-- Service role can upload (for AI-generated avatars from server actions)
create policy "avatars: service role upload"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.role() = 'service_role');
