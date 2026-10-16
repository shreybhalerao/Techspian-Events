-- ============================================================
-- Techspian Event Meetings — database setup (Phase 1)
-- Paste this whole file into Supabase → SQL Editor → New query → Run.
-- It is safe to run more than once.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Team members (the allow-list)
--    Only emails listed here can sign in or see any data.
--    Add a teammate:  insert into public.team_members (email, full_name)
--                     values ('name@techspian.com', 'Full Name');
-- ------------------------------------------------------------
create table if not exists public.team_members (
  email       text primary key check (email = lower(email)),
  full_name   text,
  user_id     uuid unique references auth.users (id) on delete set null,
  created_at  timestamptz not null default now()
);

-- Is the current logged-in user on the team?
-- SECURITY DEFINER so it can read team_members regardless of RLS.
create or replace function public.is_team_member()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.team_members
    where user_id = auth.uid()
       or email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- Block sign-ups from anyone not on the allow-list.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.team_members where email = lower(new.email)) then
    raise exception 'This email is not on the Techspian team list.';
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  before insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- Fills team_members.user_id once the auth row exists (the BEFORE
-- trigger above cannot reference a row that is not inserted yet).
create or replace function public.link_team_member()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.team_members set user_id = new.id
  where email = lower(new.email) and user_id is distinct from new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_linked on auth.users;
create trigger on_auth_user_linked
  after insert on auth.users
  for each row execute function public.link_team_member();

-- Called by the app after every sign-in, in case someone was added to
-- the team list after their login account already existed.
create or replace function public.claim_team_membership()
returns void
language sql
security definer
set search_path = public
as $$
  update public.team_members set user_id = auth.uid()
  where email = lower(coalesce(auth.jwt() ->> 'email', ''))
    and user_id is distinct from auth.uid();
$$;

revoke execute on function public.claim_team_membership() from anon, public;
grant execute on function public.claim_team_membership() to authenticated;

-- ------------------------------------------------------------
-- 2. Events
-- ------------------------------------------------------------
create table if not exists public.events (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  city        text,
  start_date  date,
  end_date    date,
  created_by  uuid references auth.users (id) on delete set null default auth.uid(),
  created_at  timestamptz not null default now(),
  constraint events_dates_ok check (end_date is null or start_date is null or end_date >= start_date)
);

-- ------------------------------------------------------------
-- 3. Meetings
-- ------------------------------------------------------------
create table if not exists public.meetings (
  id                uuid primary key default gen_random_uuid(),
  event_id          uuid not null references public.events (id) on delete restrict,
  company           text not null,
  contact_name      text,
  designation       text,
  email             text,
  phone             text,
  meeting_datetime  timestamptz,
  booked_by         uuid references auth.users (id) on delete set null default auth.uid(),
  status            text not null default 'booked'
                    check (status in ('booked', 'met', 'no-show', 'cancelled', 'rescheduled')),
  interest_level    text check (interest_level in ('high', 'medium', 'low')),
  notes             text,
  card_photo_path   text,
  voice_note_path   text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists meetings_event_idx on public.meetings (event_id);
create index if not exists meetings_event_email_idx on public.meetings (event_id, lower(email));
create index if not exists meetings_updated_idx on public.meetings (updated_at);

-- Keep updated_at current. If the app sends its own updated_at
-- (used later for offline sync), that value is kept.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  if new.updated_at is not distinct from old.updated_at then
    new.updated_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists meetings_touch_updated_at on public.meetings;
create trigger meetings_touch_updated_at
  before update on public.meetings
  for each row execute function public.touch_updated_at();

-- ------------------------------------------------------------
-- 4. Row Level Security — team members only
-- ------------------------------------------------------------
alter table public.team_members enable row level security;
alter table public.events       enable row level security;
alter table public.meetings     enable row level security;

drop policy if exists "team can read team" on public.team_members;
create policy "team can read team" on public.team_members
  for select to authenticated using (public.is_team_member());
-- No insert/update/delete policies on team_members: manage the list
-- from the Supabase dashboard (Table Editor), which bypasses RLS.

drop policy if exists "team can read events"   on public.events;
drop policy if exists "team can add events"    on public.events;
drop policy if exists "team can edit events"   on public.events;
drop policy if exists "team can delete events" on public.events;
create policy "team can read events"   on public.events for select to authenticated using (public.is_team_member());
create policy "team can add events"    on public.events for insert to authenticated with check (public.is_team_member());
create policy "team can edit events"   on public.events for update to authenticated using (public.is_team_member()) with check (public.is_team_member());
create policy "team can delete events" on public.events for delete to authenticated using (public.is_team_member());

drop policy if exists "team can read meetings"   on public.meetings;
drop policy if exists "team can add meetings"    on public.meetings;
drop policy if exists "team can edit meetings"   on public.meetings;
drop policy if exists "team can delete meetings" on public.meetings;
create policy "team can read meetings"   on public.meetings for select to authenticated using (public.is_team_member());
create policy "team can add meetings"    on public.meetings for insert to authenticated with check (public.is_team_member());
create policy "team can edit meetings"   on public.meetings for update to authenticated using (public.is_team_member()) with check (public.is_team_member());
create policy "team can delete meetings" on public.meetings for delete to authenticated using (public.is_team_member());

-- Anonymous (not logged in) visitors get nothing.
revoke all on public.team_members, public.events, public.meetings from anon;
