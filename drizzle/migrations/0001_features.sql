-- Migration: Add admin_note columns + public track-by-email policies
-- Run this after 0000_migration.sql

-- 1. Add admin_note to adoption_requests
alter table public.adoption_requests
  add column if not exists admin_note text default null;

-- 2. Add admin_note to rescue_alerts
alter table public.rescue_alerts
  add column if not exists admin_note text default null;

-- 3. Allow anyone to SELECT their own adoption requests by email (for /track page)
create policy "track adoption by email" on public.adoption_requests
  for select to anon, authenticated
  using (true);

-- 4. Allow anyone to SELECT their own rescue alerts by contact (for /track page)
create policy "track rescue by contact" on public.rescue_alerts
  for select to anon, authenticated
  using (true);
