create extension if not exists "pgcrypto";

create type application_status as enum (
  'not_applied', 'applied', 'in_progress', 'interview', 'offer', 'denied', 'withdrawn'
);

-- One row per user: the living profile everything else draws from
create table profile (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  location text,
  headline text,               -- "BBIT Graduate | AI Builder | KTH Exchange Alumni"
  summary text,                -- 3-4 line career summary
  linkedin_url text,
  github_url text,
  portfolio_url text,
  photo_url text,
  raw_intake text,              -- latest free-text/resume dump, kept for re-parsing
  daily_goal integer not null default 3,   -- gamification: target applications/day
  lessons_learned text[] not null default '{}',  -- synthesized from rejection feedback
  updated_at timestamptz not null default now()
);

create table experience (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company text not null,
  role text not null,
  start_date date,
  end_date date,               -- null if current
  description text,
  achievements text[],
  skills_used text[],
  order_index integer default 0
);

create table education (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  institution text not null,
  degree text,
  field text,
  start_date date,
  end_date date,
  grade text,                  -- "First Class Honours"
  description text
);

create table skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text,                -- Technical, Soft Skills, Tools
  proficiency text               -- Expert, Intermediate, Beginner
);

create table certifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  issuer text,
  date_issued date,
  expiry_date date,
  credential_url text
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,           -- "Familio"
  description text,
  tech_stack text[],
  url text,
  github_url text,
  impact text,                  -- "Live with active users, WhatsApp reminders"
  start_date date,
  end_date date
);

create table applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company text not null,
  role text not null,
  job_description text,
  status application_status not null default 'not_applied',
  applied_date date,
  deadline date,
  interview_date timestamptz,
  deadline_reminder_sent boolean not null default false,
  interview_reminder_sent boolean not null default false,
  salary_min integer,
  salary_max integer,
  currency text default 'KES',
  job_url text,
  notes text,
  ats_score integer,             -- AI match score 0-100 (keyword/requirement match)
  hireability_score integer,     -- AI critic score 0-100 (overall competitiveness)
  hireability_notes text[],      -- remaining weaknesses noted at the final revision
  rejection_employer_feedback text,   -- what the employer said, if anything
  rejection_improvement_notes text,   -- user's own reflection on what to improve
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  application_id uuid references applications(id) on delete cascade,
  name text,
  role text,
  email text,
  linkedin_url text,
  notes text
);

create table generated_docs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  application_id uuid references applications(id) on delete cascade,
  type text not null,            -- cv | cover_letter | interview_prep | codility_prep | essay
  content text,
  version integer default 1,
  created_at timestamptz not null default now()
);

create or replace function set_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger applications_updated_at before update on applications
for each row execute function set_updated_at();

create trigger profile_updated_at before update on profile
for each row execute function set_updated_at();

-- Row Level Security — required now that this is multi-tenant.
alter table profile enable row level security;
alter table experience enable row level security;
alter table education enable row level security;
alter table skills enable row level security;
alter table certifications enable row level security;
alter table projects enable row level security;
alter table applications enable row level security;
alter table contacts enable row level security;
alter table generated_docs enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['profile', 'experience', 'education', 'skills', 'certifications', 'projects', 'applications', 'contacts', 'generated_docs']
  loop
    execute format(
      'create policy "own rows" on %I for all using (auth.uid() = user_id) with check (auth.uid() = user_id);',
      t
    );
  end loop;
end $$;
