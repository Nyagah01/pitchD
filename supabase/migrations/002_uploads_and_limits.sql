-- Run this in the Supabase SQL editor (Project → SQL Editor → New query).
-- Adds: daily usage tracking (for worker-side rate limiting), certification
-- attachments, and a storage bucket for profile photos + certification files.

-- 1. Daily usage tracking — the worker records one row per AI generation
-- call so it can enforce a daily cap. Only the worker (service role, which
-- bypasses RLS) can write; users can only read their own rows, so the
-- client can show "X of 5 used today" but can't tamper with the count.
create table usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null, -- 'generation' (CV + cover letter) | 'prep' (interview + codility prep)
  created_at timestamptz not null default now()
);

alter table usage_events enable row level security;
create policy "read own usage" on usage_events for select using (auth.uid() = user_id);

-- 2. Certification attachments (PDF or photo of the credential)
alter table certifications add column attachment_url text;

-- 3. Storage bucket for profile photos + certification attachments.
-- Public bucket, but paths are namespaced by user id (e.g. "<user_id>/photo.jpg"),
-- and only the owning user can write to their own folder.
insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', true)
on conflict (id) do nothing;

create policy "uploads: owner can manage their folder" on storage.objects
  for all
  using (bucket_id = 'uploads' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'uploads' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "uploads: public read" on storage.objects
  for select
  using (bucket_id = 'uploads');
