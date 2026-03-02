-- =============================================================================
-- eximIA Workspace Hub — Storage Bucket for App Logos
-- =============================================================================

insert into storage.buckets (id, name, public)
values ('app-logos', 'app-logos', true);

-- Users can upload to their own folder
create policy "Users upload own logos"
  on storage.objects
  for insert
  with check (
    bucket_id = 'app-logos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Anyone can read logos (public bucket)
create policy "Public read logos"
  on storage.objects
  for select
  using (bucket_id = 'app-logos');

-- Users can delete their own logos
create policy "Users delete own logos"
  on storage.objects
  for delete
  using (
    bucket_id = 'app-logos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
