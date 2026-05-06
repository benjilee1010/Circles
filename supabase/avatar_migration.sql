-- Run this in your Supabase SQL editor to add avatar support

-- 1. Add avatar_url column to contacts
alter table contacts add column if not exists avatar_url text;

-- 2. Create storage bucket for avatars
-- Go to Supabase Dashboard → Storage → New bucket
-- Name: avatars
-- Public: true (so images load without signed URLs)

-- 3. Storage policy (run after creating the bucket)
create policy "Users can upload their own avatars"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can update their own avatars"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Anyone can view avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Users can delete their own avatars"
  on storage.objects for delete
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
