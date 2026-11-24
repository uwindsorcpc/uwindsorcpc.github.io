-- =============================================================================
-- CPC UWindsor database: tables, security rules and sign-up function.
--
-- Run once in Supabase → SQL Editor → New query → paste → Run.
-- It is safe to re-run: it only creates what is missing and replaces rules.
--
-- SECURITY MODEL
--   • Public content (events, team, contests, problems, FAQ):
--       anyone may READ published rows; only admins may change anything.
--   • Member sign-ups: nobody but admins can read, change or count them.
--       The public Join form can only call submit_signup(), which inserts
--       one row and returns nothing.
--   • An "admin" is a user listed in public.admins who signed in WITH 2FA
--       (assurance level aal2). A password alone is never enough.
--   • Every table has Row Level Security on. The last block of this file
--       stops with an error if any table in the public schema does not.
-- =============================================================================

create extension if not exists pgcrypto;

-- Helper functions live in a schema the website API does not expose.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Admins
-- -----------------------------------------------------------------------------
create table if not exists public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;

-- True only for a listed admin whose current session passed 2FA.
create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    coalesce((select auth.jwt() ->> 'aal'), '') = 'aal2'
    and exists (select 1 from public.admins a where a.user_id = (select auth.uid()));
$$;
revoke all on function private.is_admin() from public;
grant execute on function private.is_admin() to anon, authenticated;

-- Keeps updated_at current on every edit.
create or replace function private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function private.touch_updated_at() from public;

-- -----------------------------------------------------------------------------
-- Public content tables
-- -----------------------------------------------------------------------------
create table if not exists public.events (
  id          uuid primary key default gen_random_uuid(),
  title       text not null check (char_length(title) between 1 and 200),
  starts_at   timestamptz not null,
  ends_at     timestamptz not null,
  room        text not null check (char_length(room) between 1 and 100),
  type        text not null check (type in ('practice', 'contest', 'workshop')),
  description text check (char_length(description) <= 2000),
  kattis_url  text check (kattis_url ~ '^https://'),
  published   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint events_end_after_start check (ends_at > starts_at)
);
create index if not exists events_starts_at_idx on public.events (starts_at);

create table if not exists public.team_members (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 1 and 100),
  role       text not null check (char_length(role) between 1 and 100),
  bio        text check (char_length(bio) <= 600),
  photo_url  text check (photo_url ~ '^https://'),
  -- { "github": "https://…", "linkedin": "…", "codeforces": "…", "kattis": "…", "website": "…", "email": "…" }
  links      jsonb not null default '{}'::jsonb check (jsonb_typeof(links) = 'object'),
  sort_order integer not null default 0,
  published  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.past_contests (
  id           uuid primary key default gen_random_uuid(),
  title        text not null check (char_length(title) between 1 and 200),
  held_on      date not null,
  problems     integer check (problems between 0 and 100),
  participants integer check (participants between 0 and 10000),
  description  text check (char_length(description) <= 2000),
  kattis_url   text check (kattis_url ~ '^https://'),
  published    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.problems (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 1 and 200),
  url        text not null check (url ~ '^https://'),
  topic      text check (char_length(topic) <= 60),
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  sort_order integer not null default 0,
  published  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.faqs (
  id         uuid primary key default gen_random_uuid(),
  question   text not null check (char_length(question) between 1 and 300),
  answer     text not null check (char_length(answer) between 1 and 2000),
  sort_order integer not null default 0,
  published  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Member sign-ups (private)
-- -----------------------------------------------------------------------------
create table if not exists public.members (
  id                uuid primary key default gen_random_uuid(),
  full_name         text not null check (char_length(full_name) between 1 and 100),
  email             text not null check (char_length(email) <= 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  program           text check (char_length(program) <= 100),
  year_of_study     text check (year_of_study in ('1', '2', '3', '4', '5+', 'grad', 'other')),
  experience        text not null default 'none' check (experience in ('none', 'beginner', 'intermediate', 'advanced')),
  codeforces_handle text check (codeforces_handle ~ '^[A-Za-z0-9_.-]{3,24}$'),
  status            text not null default 'new' check (status in ('new', 'active', 'inactive')),
  notes             text check (char_length(notes) <= 2000),
  consented_at      timestamptz not null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create unique index if not exists members_email_unique on public.members (lower(email));

-- Attendance can be added later as:
--   public.attendance (event_id → events.id, member_id → members.id)
-- with the same admin-only rules as members.

-- -----------------------------------------------------------------------------
-- updated_at triggers
-- -----------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['events', 'team_members', 'past_contests', 'problems', 'faqs', 'members'] loop
    execute format('drop trigger if exists touch_updated_at on public.%I', t);
    execute format('create trigger touch_updated_at before update on public.%I
                    for each row execute function private.touch_updated_at()', t);
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- Row Level Security and privileges
-- -----------------------------------------------------------------------------
-- Start from nothing, then grant exactly what each role needs.
revoke all on public.admins, public.events, public.team_members, public.past_contests,
              public.problems, public.faqs, public.members
  from anon, authenticated;

-- Public content: readable by everyone (rules below still hide drafts),
-- writable only through the admin rules.
do $$
declare t text;
begin
  foreach t in array array['events', 'team_members', 'past_contests', 'problems', 'faqs'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('grant select on public.%I to anon, authenticated', t);
    execute format('grant insert, update, delete on public.%I to authenticated', t);

    execute format('drop policy if exists "Anyone can read published rows" on public.%I', t);
    execute format('create policy "Anyone can read published rows" on public.%I
                    for select to anon, authenticated
                    using (published or (select private.is_admin()))', t);

    execute format('drop policy if exists "Admins can insert" on public.%I', t);
    execute format('create policy "Admins can insert" on public.%I
                    for insert to authenticated
                    with check ((select private.is_admin()))', t);

    execute format('drop policy if exists "Admins can update" on public.%I', t);
    execute format('create policy "Admins can update" on public.%I
                    for update to authenticated
                    using ((select private.is_admin()))
                    with check ((select private.is_admin()))', t);

    execute format('drop policy if exists "Admins can delete" on public.%I', t);
    execute format('create policy "Admins can delete" on public.%I
                    for delete to authenticated
                    using ((select private.is_admin()))', t);
  end loop;
end $$;

-- Members: admins only. The public has no access at all (not even insert);
-- the Join form goes through submit_signup() below.
alter table public.members enable row level security;
grant select, update, delete on public.members to authenticated;

drop policy if exists "Admins can read members" on public.members;
create policy "Admins can read members" on public.members
  for select to authenticated using ((select private.is_admin()));

drop policy if exists "Admins can update members" on public.members;
create policy "Admins can update members" on public.members
  for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

drop policy if exists "Admins can delete members" on public.members;
create policy "Admins can delete members" on public.members
  for delete to authenticated using ((select private.is_admin()));

-- Admins table: a signed-in user can see only their own row (so the admin
-- page can say "you are not an admin"). Nobody can add admins through the API;
-- that is done here in the SQL Editor.
grant select on public.admins to authenticated;
drop policy if exists "Users can see their own admin row" on public.admins;
create policy "Users can see their own admin row" on public.admins
  for select to authenticated using (user_id = (select auth.uid()));

-- -----------------------------------------------------------------------------
-- Public sign-up function (the only way the public can write anything)
-- -----------------------------------------------------------------------------
create or replace function public.submit_signup(
  p_full_name         text,
  p_email             text,
  p_program           text,
  p_year_of_study     text,
  p_experience        text,
  p_codeforces_handle text,
  p_consent           boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_consent is distinct from true then
    raise exception 'Consent is required to sign up.' using errcode = '22023';
  end if;

  -- Simple flood guard against scripted spam.
  if (select count(*) from public.members where created_at > now() - interval '1 minute') >= 20 then
    raise exception 'Too many sign-ups right now. Please try again in a minute.' using errcode = '53400';
  end if;

  -- Duplicate emails are silently ignored, so the form never reveals
  -- whether someone is already a member.
  insert into public.members (full_name, email, program, year_of_study, experience, codeforces_handle, consented_at)
  values (
    btrim(p_full_name),
    lower(btrim(p_email)),
    nullif(btrim(p_program), ''),
    nullif(p_year_of_study, ''),
    coalesce(nullif(p_experience, ''), 'none'),
    nullif(btrim(p_codeforces_handle), ''),
    now()
  )
  on conflict ((lower(email))) do nothing;
end;
$$;
revoke all on function public.submit_signup(text, text, text, text, text, text, boolean) from public;
grant execute on function public.submit_signup(text, text, text, text, text, text, boolean) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Team photo storage: anyone can view, only admins can upload or delete.
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('team-photos', 'team-photos', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Admins can upload team photos" on storage.objects;
create policy "Admins can upload team photos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'team-photos' and (select private.is_admin()));

drop policy if exists "Admins can update team photos" on storage.objects;
create policy "Admins can update team photos" on storage.objects
  for update to authenticated
  using (bucket_id = 'team-photos' and (select private.is_admin()))
  with check (bucket_id = 'team-photos' and (select private.is_admin()));

drop policy if exists "Admins can delete team photos" on storage.objects;
create policy "Admins can delete team photos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'team-photos' and (select private.is_admin()));

-- -----------------------------------------------------------------------------
-- Safety net: refuse to finish if any public table has RLS switched off.
-- -----------------------------------------------------------------------------
do $$
declare t text;
begin
  for t in
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity
  loop
    raise exception 'Table public.% has Row Level Security turned OFF. Fix this before going live.', t;
  end loop;
end $$;
