-- =============================================================================
-- eximIA Workspace Hub — Security Hardening
-- =============================================================================

-- Revoke anon role access to apps table (defense-in-depth)
revoke all on public.apps from anon;
grant all on public.apps to authenticated;

-- Add constraint: credentials_enc and credentials_iv must be both set or both null
alter table public.apps
  add constraint chk_credentials_pair
  check (
    (credentials_enc is null and credentials_iv is null)
    or (credentials_enc is not null and credentials_iv is not null)
  );

-- Storage: allow users to update (replace) their own logos
create policy "Users update own logos"
  on storage.objects
  for update
  using (
    bucket_id = 'app-logos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Update bucket config to restrict file types and size
update storage.buckets
  set allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'image/gif'],
      file_size_limit = 2097152  -- 2MB
  where id = 'app-logos';
