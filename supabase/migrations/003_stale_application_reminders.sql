-- Run this in the Supabase SQL editor (Project → SQL Editor → New query).
-- Adds a third reminder type: nudge the user about applications they
-- started but never actually submitted, sitting in "not_applied" for a
-- week. Same one-shot-flag pattern as deadline_reminder_sent /
-- interview_reminder_sent.

alter table applications add column not_applied_reminder_sent boolean not null default false;
