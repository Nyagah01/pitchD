-- Run this in the Supabase SQL editor (Project → SQL Editor → New query).
-- Backs the worker's low-Anthropic-credit email alert to the founder — a
-- single row tracks when each named alert was last sent, so a burst of
-- failed AI calls doesn't spam the inbox (rate-limited to once/hour in
-- worker/index.js). No RLS policies are defined on purpose: this table has
-- no legitimate end-user access at all, only the service role (which
-- bypasses RLS) should ever touch it.

create table system_alerts (
  key text primary key,
  last_sent_at timestamptz not null default now()
);

alter table system_alerts enable row level security;
