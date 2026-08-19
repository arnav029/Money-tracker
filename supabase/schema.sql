-- Run this once in the Supabase dashboard: Project -> SQL Editor -> New query -> paste -> Run.
-- Nothing here can be applied from this repo automatically — it needs your project's
-- credentials, which only you have.
--
-- Before running this, also do the one-time dashboard step: Authentication -> Sign In / Providers
-- -> Third-Party Auth -> Add integration -> Firebase, using your Firebase Project ID. That's what
-- lets Supabase trust Firebase-issued JWTs (phone-auth users live in Firebase, not auth.users).

create extension if not exists pgcrypto;

drop table if exists expenses;

create table expenses (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  amount numeric not null,
  category text not null,
  note text,
  date date not null default current_date,
  created_at timestamptz not null default now()
);

create index expenses_user_id_date_idx on expenses (user_id, date);

alter table expenses enable row level security;

-- Firebase UIDs aren't valid Postgres uuids and there's no matching auth.users row for them, so
-- ownership is checked directly against the JWT's `sub` claim (scoped to your Firebase project's
-- issuer/audience) rather than the usual auth.uid() = user_id pattern.
create policy "Users can view their own expenses"
  on expenses for select
  using (
    (select auth.jwt()->>'iss') = 'https://securetoken.google.com/money-tracker-ada28'
    and (select auth.jwt()->>'aud') = 'money-tracker-ada28'
    and (select auth.jwt()->>'sub') = user_id
  );

create policy "Users can insert their own expenses"
  on expenses for insert
  with check (
    (select auth.jwt()->>'iss') = 'https://securetoken.google.com/money-tracker-ada28'
    and (select auth.jwt()->>'aud') = 'money-tracker-ada28'
    and (select auth.jwt()->>'sub') = user_id
  );

create policy "Users can update their own expenses"
  on expenses for update
  using (
    (select auth.jwt()->>'iss') = 'https://securetoken.google.com/money-tracker-ada28'
    and (select auth.jwt()->>'aud') = 'money-tracker-ada28'
    and (select auth.jwt()->>'sub') = user_id
  );

create policy "Users can delete their own expenses"
  on expenses for delete
  using (
    (select auth.jwt()->>'iss') = 'https://securetoken.google.com/money-tracker-ada28'
    and (select auth.jwt()->>'aud') = 'money-tracker-ada28'
    and (select auth.jwt()->>'sub') = user_id
  );
