-- =============================================================================
-- UWindsor CPC: attendance (check-in) and RSVPs.
--
-- Run once in Supabase → SQL Editor → New query → paste → Run, AFTER
-- 0001_schema.sql. Safe to re-run.
--
-- HOW CHECK-IN WORKS
--   1. An admin opens check-in for an event. The database creates a random
--      secret for it.
--   2. The presenter screen shows a 5-character room code (and a QR code that
--      contains it). The code is derived from the secret and changes every
--      30 seconds, so a screenshot or a shared link stops working quickly.
--   3. Scanning the QR (or typing the code on /attend) trades the code for a
--      private 15-minute ticket. The ticket checks in exactly one person.
--   4. Members are matched by email. Non-members are asked to sign up, or
--      can check in as a guest after extra checks.
--
-- SECURITY
--   • attendance and rsvps: admins only (read, edit, delete).
--   • Secrets, tickets and failed attempts: no API access at all.
--   • The public can only call the functions below, which validate
--     everything, rate-limit, and never reveal other people's data.
--     The public board shows only the name each person chose to display.
-- =============================================================================

create extension if not exists pgcrypto with schema extensions;

-- -----------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------
create table if not exists public.event_checkins (
  event_id  uuid primary key references public.events (id) on delete cascade,
  secret    bytea not null,
  opened_at timestamptz not null default now(),
  closes_at timestamptz not null,
  closed_at timestamptz
);

create table if not exists public.checkin_tickets (
  token      uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.events (id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  lookups    integer not null default 0,
  used_at    timestamptz
);
create index if not exists checkin_tickets_event_idx on public.checkin_tickets (event_id, created_at);

create table if not exists public.checkin_failures (
  id         bigint generated always as identity primary key,
  event_id   uuid not null references public.events (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists checkin_failures_event_idx on public.checkin_failures (event_id, created_at);

-- Rate-limit log for public lookups (e.g. RSVP membership checks).
create table if not exists public.rate_log (
  id         bigint generated always as identity primary key,
  kind       text not null,
  created_at timestamptz not null default now()
);
create index if not exists rate_log_kind_idx on public.rate_log (kind, created_at);

create table if not exists public.attendance (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid not null references public.events (id) on delete cascade,
  member_id     uuid references public.members (id) on delete set null,
  is_guest      boolean not null default false,
  full_name     text not null check (char_length(full_name) between 2 and 100),
  email         text not null check (char_length(email) <= 254),
  display_name  text not null check (char_length(display_name) between 2 and 30),
  hidden        boolean not null default false,
  checked_in_at timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create unique index if not exists attendance_event_email_unique on public.attendance (event_id, lower(email));

create table if not exists public.rsvps (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.events (id) on delete cascade,
  member_id  uuid references public.members (id) on delete set null,
  is_guest   boolean not null default false,
  full_name  text not null check (char_length(full_name) between 2 and 100),
  email      text not null check (char_length(email) <= 254),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists rsvps_event_email_unique on public.rsvps (event_id, lower(email));

do $$
declare t text;
begin
  foreach t in array array['attendance', 'rsvps'] loop
    execute format('drop trigger if exists touch_updated_at on public.%I', t);
    execute format('create trigger touch_updated_at before update on public.%I
                    for each row execute function private.touch_updated_at()', t);
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.event_checkins   enable row level security;
alter table public.checkin_tickets  enable row level security;
alter table public.checkin_failures enable row level security;
alter table public.rate_log         enable row level security;
alter table public.attendance       enable row level security;
alter table public.rsvps            enable row level security;

-- Secrets, tickets, failures and the rate log: no API access for anyone (no policies, no grants).
revoke all on public.event_checkins, public.checkin_tickets, public.checkin_failures, public.rate_log,
              public.attendance, public.rsvps
  from anon, authenticated;

-- Attendance and RSVPs: admins can read, edit and delete. Rows are only ever
-- created by the functions below.
do $$
declare t text;
begin
  foreach t in array array['attendance', 'rsvps'] loop
    execute format('grant select, update, delete on public.%I to authenticated', t);

    execute format('drop policy if exists "Admins can read" on public.%I', t);
    execute format('create policy "Admins can read" on public.%I
                    for select to authenticated using ((select private.is_admin()))', t);

    execute format('drop policy if exists "Admins can update" on public.%I', t);
    execute format('create policy "Admins can update" on public.%I
                    for update to authenticated
                    using ((select private.is_admin())) with check ((select private.is_admin()))', t);

    execute format('drop policy if exists "Admins can delete" on public.%I', t);
    execute format('create policy "Admins can delete" on public.%I
                    for delete to authenticated using ((select private.is_admin()))', t);
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- Private helpers (not reachable through the API)
-- -----------------------------------------------------------------------------
create or replace function private.require_admin()
returns void
language plpgsql
stable
set search_path = ''
as $$
begin
  if not (select private.is_admin()) then
    raise exception 'Admins only (signed in with 2FA).' using errcode = '42501';
  end if;
end;
$$;

-- 5-character code for a 30-second window, from a 32-letter alphabet without
-- look-alikes (no 0/O, 1/I).
create or replace function private.room_code(p_secret bytea, p_window bigint)
returns text
language sql
immutable
set search_path = ''
as $$
  select string_agg(
           substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', (get_byte(h, i) % 32) + 1, 1), ''
           order by i)
  from (select extensions.hmac(convert_to(p_window::text, 'UTF8'), p_secret, 'sha256') as h) x,
       generate_series(0, 4) as i;
$$;

create or replace function private.current_window()
returns bigint
language sql
stable
set search_path = ''
as $$ select floor(extract(epoch from now()) / 30)::bigint $$;

-- The one event whose check-in is open right now, if any.
create or replace function private.open_checkin_event()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select c.event_id
  from public.event_checkins c
  where c.closed_at is null and now() < c.closes_at
  order by c.opened_at desc
  limit 1;
$$;

create or replace function private.clean_email(p text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare e text := lower(btrim(coalesce(p, '')));
begin
  if char_length(e) > 254 or e !~ '^[a-z0-9._%+''-]+@[a-z0-9.-]+\.[a-z]{2,}$' then
    raise exception 'Please enter a valid email address.' using errcode = '22023';
  end if;
  return e;
end;
$$;

create or replace function private.clean_name(p text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare n text := regexp_replace(btrim(coalesce(p, '')), '\s+', ' ', 'g');
begin
  if char_length(n) not between 2 and 100
     or n !~ '[[:alpha:]].*[[:alpha:]]'
     or n ~* '(https?:|www\.|\.com|@)' then
    raise exception 'Please enter your real name.' using errcode = '22023';
  end if;
  return n;
end;
$$;

-- Extra checks for guests: no throwaway or reserved email domains.
create or replace function private.check_guest_email(p_email text)
returns void
language plpgsql
immutable
set search_path = ''
as $$
declare domain text := split_part(p_email, '@', 2);
begin
  if domain = any (array[
       'mailinator.com', 'guerrillamail.com', 'guerrillamail.net', 'sharklasers.com', 'grr.la',
       '10minutemail.com', 'tempmail.com', 'temp-mail.org', 'tempmail.net', 'tempail.com',
       'yopmail.com', 'trashmail.com', 'getnada.com', 'maildrop.cc', 'dispostable.com',
       'throwawaymail.com', 'fakeinbox.com', 'mintemail.com', 'emailondeck.com', 'mohmal.com',
       'burnermail.io', 'mailnesia.com', 'spamgourmet.com', 'moakt.com', 'tempr.email'])
     or domain ~ '(^|\.)(example\.(com|org|net)|test|invalid|localhost)$' then
    raise exception 'Please use your real email address (temporary email services aren''t accepted).' using errcode = '22023';
  end if;
end;
$$;

-- Name shown on the board. Blank → a fun anonymous name.
create or replace function private.clean_display_name(p text, p_seq integer)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  d text := regexp_replace(btrim(coalesce(p, '')), '\s+', ' ', 'g');
  aliases text[] := array[
    'Anonymous Dijkstra', 'Binary Searcher', 'Segment Tree', 'Greedy Goose', 'DP Wizard',
    'Off-by-One', 'Union-Find', 'Fenwick Fan', 'Bit Twiddler', 'Heap Hopper', 'Graph Walker',
    'Modular Monk', 'Two Pointer', 'Prefix Sum', 'Big-O Bandit', 'Sparse Table', 'Trie Hard',
    'Memo Master', 'Edge Case', 'Accepted Soul'];
begin
  if d = '' then
    return aliases[(p_seq % array_length(aliases, 1)) + 1] || ' #' || p_seq;
  end if;
  if char_length(d) not between 2 and 30
     or d !~ '^[[:alnum:] ._''!#-]+$'
     or d !~ '[[:alpha:]]' then
    raise exception 'Screen name: 2–30 letters, numbers, spaces or . _ '' ! # - only.' using errcode = '22023';
  end if;
  return d;
end;
$$;

revoke all on function private.require_admin(), private.room_code(bytea, bigint), private.current_window(),
  private.open_checkin_event(), private.clean_email(text), private.clean_name(text),
  private.check_guest_email(text), private.clean_display_name(text, integer)
  from public;
grant execute on function private.require_admin() to authenticated;

-- -----------------------------------------------------------------------------
-- Admin functions
-- -----------------------------------------------------------------------------
-- Opens check-in for an event (closing any other open one). It stays open
-- until 30 minutes after the event ends, or 3 hours from now, whichever is later.
create or replace function public.open_checkin(p_event_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare ends timestamptz;
begin
  perform private.require_admin();
  select ends_at into ends from public.events where id = p_event_id;
  if ends is null then
    raise exception 'Event not found.' using errcode = '22023';
  end if;
  update public.event_checkins set closed_at = now() where closed_at is null and event_id <> p_event_id;
  insert into public.event_checkins (event_id, secret, opened_at, closes_at, closed_at)
  values (p_event_id, extensions.gen_random_bytes(32), now(),
          greatest(ends + interval '30 minutes', now() + interval '3 hours'), null)
  on conflict (event_id) do update
    set secret = excluded.secret, opened_at = excluded.opened_at,
        closes_at = excluded.closes_at, closed_at = null;
end;
$$;

create or replace function public.close_checkin(p_event_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.require_admin();
  update public.event_checkins set closed_at = now() where event_id = p_event_id and closed_at is null;
end;
$$;

-- What the presenter screen shows: is it open, the current code, seconds left.
create or replace function public.checkin_display(p_event_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  c public.event_checkins;
  w bigint := private.current_window();
begin
  perform private.require_admin();
  select * into c from public.event_checkins where event_id = p_event_id;
  if c.event_id is null or c.closed_at is not null or now() >= c.closes_at then
    return jsonb_build_object('open', false);
  end if;
  return jsonb_build_object(
    'open', true,
    'code', private.room_code(c.secret, w),
    'seconds_left', 30 - (floor(extract(epoch from now()))::bigint % 30),
    'closes_at', c.closes_at);
end;
$$;

-- -----------------------------------------------------------------------------
-- Public functions
-- -----------------------------------------------------------------------------
-- Is any check-in open? Returns the event's public details only.
create or replace function public.current_checkin()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select jsonb_build_object('event_id', e.id, 'title', e.title, 'room', e.room,
                               'starts_at', e.starts_at, 'ends_at', e.ends_at)
     from public.events e
     where e.id = private.open_checkin_event()),
    jsonb_build_object('event_id', null));
$$;

-- Trades the room code for a private 15-minute ticket.
create or replace function public.start_checkin(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  ev uuid := private.open_checkin_event();
  c public.event_checkins;
  w bigint := private.current_window();
  code text := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
  t uuid;
begin
  if ev is null then
    return jsonb_build_object('status', 'closed');
  end if;

  -- Housekeeping and brute-force protection.
  delete from public.checkin_failures where created_at < now() - interval '1 day';
  delete from public.checkin_tickets where expires_at < now() - interval '1 day';
  if (select count(*) from public.checkin_failures where event_id = ev and created_at > now() - interval '1 minute') >= 120 then
    return jsonb_build_object('status', 'busy');
  end if;
  if (select count(*) from public.checkin_tickets where event_id = ev and created_at > now() - interval '1 minute') >= 300 then
    return jsonb_build_object('status', 'busy');
  end if;

  select * into c from public.event_checkins where event_id = ev;
  -- Accept the current code and the previous one (people need a moment to scan).
  if code is distinct from private.room_code(c.secret, w) and code is distinct from private.room_code(c.secret, w - 1) then
    insert into public.checkin_failures (event_id) values (ev);
    return jsonb_build_object('status', 'wrong_code');
  end if;

  insert into public.checkin_tickets (event_id, expires_at)
  values (ev, now() + interval '15 minutes')
  returning token into t;
  return jsonb_build_object('status', 'ok', 'ticket', t);
end;
$$;

-- Checks one person in with a ticket.
-- Returns status: accepted | already | not_member | closed | bad_ticket | too_many | busy
create or replace function public.submit_checkin(
  p_ticket       uuid,
  p_full_name    text,
  p_email        text,
  p_display_name text,
  p_as_guest     boolean
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  tk public.checkin_tickets;
  e text;
  n text;
  d text;
  m uuid;
  seq integer;
  new_id uuid;
begin
  select * into tk from public.checkin_tickets where token = p_ticket for update;
  if tk.token is null or tk.used_at is not null or tk.expires_at < now() then
    return jsonb_build_object('status', 'bad_ticket');
  end if;
  if private.open_checkin_event() is distinct from tk.event_id then
    return jsonb_build_object('status', 'closed');
  end if;

  -- A ticket allows a few tries (typos), not unlimited member lookups.
  update public.checkin_tickets set lookups = lookups + 1 where token = tk.token;
  if tk.lookups >= 6 then
    return jsonb_build_object('status', 'too_many');
  end if;

  e := private.clean_email(p_email);
  n := private.clean_name(p_full_name);
  select id into m from public.members where lower(email) = e;

  if m is null and p_as_guest is distinct from true then
    return jsonb_build_object('status', 'not_member');
  end if;

  if m is null then
    perform private.check_guest_email(e);
    if (select count(*) from public.attendance
        where event_id = tk.event_id and is_guest and checked_in_at > now() - interval '1 minute') >= 15
       or (select count(*) from public.attendance where event_id = tk.event_id and is_guest) >= 200 then
      return jsonb_build_object('status', 'busy');
    end if;
  end if;

  select count(*) + 1 into seq from public.attendance where event_id = tk.event_id;
  d := private.clean_display_name(p_display_name, seq);

  insert into public.attendance (event_id, member_id, is_guest, full_name, email, display_name)
  values (tk.event_id, m, m is null, n, e, d)
  on conflict (event_id, (lower(email))) do nothing
  returning id into new_id;

  if new_id is null then
    return jsonb_build_object('status', 'already');
  end if;

  update public.checkin_tickets set used_at = now() where token = tk.token;
  return jsonb_build_object('status', 'accepted', 'display_name', d, 'guest', m is null);
end;
$$;

-- The public board for the open event: only the names people chose to show.
create or replace function public.checkin_board()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with ev as (select private.open_checkin_event() as id)
  select jsonb_build_object(
    'event_id', (select id from ev),
    'count', (select count(*) from public.attendance a, ev where a.event_id = ev.id and not a.hidden),
    'entries', coalesce((
      select jsonb_agg(jsonb_build_object('name', x.display_name, 'guest', x.is_guest) order by x.checked_in_at desc)
      from (select a.display_name, a.is_guest, a.checked_in_at
            from public.attendance a, ev
            where a.event_id = ev.id and not a.hidden
            order by a.checked_in_at desc
            limit 200) x), '[]'::jsonb));
$$;

-- RSVP to an upcoming published event.
-- Returns status: going | already | not_member | closed | busy
create or replace function public.submit_rsvp(
  p_event_id  uuid,
  p_full_name text,
  p_email     text,
  p_as_guest  boolean
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  e text;
  n text;
  m uuid;
  new_id uuid;
begin
  if not exists (select 1 from public.events where id = p_event_id and published and starts_at > now()) then
    return jsonb_build_object('status', 'closed');
  end if;

  -- Flood guard. Every call is counted (not just saved RSVPs), which also
  -- limits anyone trying to probe which emails belong to members.
  delete from public.rate_log where created_at < now() - interval '1 day';
  if (select count(*) from public.rate_log where kind = 'rsvp' and created_at > now() - interval '1 minute') >= 40 then
    return jsonb_build_object('status', 'busy');
  end if;
  insert into public.rate_log (kind) values ('rsvp');

  e := private.clean_email(p_email);
  n := private.clean_name(p_full_name);
  select id into m from public.members where lower(email) = e;

  if m is null and p_as_guest is distinct from true then
    return jsonb_build_object('status', 'not_member');
  end if;
  if m is null then
    perform private.check_guest_email(e);
  end if;

  insert into public.rsvps (event_id, member_id, is_guest, full_name, email)
  values (p_event_id, m, m is null, n, e)
  on conflict (event_id, (lower(email))) do nothing
  returning id into new_id;

  return jsonb_build_object('status', case when new_id is null then 'already' else 'going' end);
end;
$$;

-- "12 going" counts for upcoming events (numbers only, no names).
create or replace function public.rsvp_counts()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(jsonb_object_agg(r.event_id, r.n), '{}'::jsonb)
  from (select rs.event_id, count(*) as n
        from public.rsvps rs
        join public.events e on e.id = rs.event_id
        where e.published and e.ends_at > now()
        group by rs.event_id) r;
$$;

-- Who may call what.
revoke all on function public.open_checkin(uuid), public.close_checkin(uuid), public.checkin_display(uuid),
  public.current_checkin(), public.start_checkin(text), public.submit_checkin(uuid, text, text, text, boolean),
  public.checkin_board(), public.submit_rsvp(uuid, text, text, boolean), public.rsvp_counts()
  from public;
grant execute on function public.open_checkin(uuid), public.close_checkin(uuid), public.checkin_display(uuid)
  to authenticated;
grant execute on function public.current_checkin(), public.start_checkin(text),
  public.submit_checkin(uuid, text, text, text, boolean), public.checkin_board(),
  public.submit_rsvp(uuid, text, text, boolean), public.rsvp_counts()
  to anon, authenticated;

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
