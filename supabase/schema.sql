-- Run this once in the Supabase dashboard: Project → SQL Editor → New query → paste → Run.
-- Nothing here can be applied from this repo automatically — it needs your project's
-- credentials, which only you have.

create extension if not exists pgcrypto;

create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  amount numeric not null,
  category text not null,
  note text,
  date date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists expenses_user_id_date_idx on expenses (user_id, date);

alter table expenses enable row level security;

create policy "Users can view their own expenses"
  on expenses for select
  using (auth.uid() = user_id);

create policy "Users can insert their own expenses"
  on expenses for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own expenses"
  on expenses for update
  using (auth.uid() = user_id);

create policy "Users can delete their own expenses"
  on expenses for delete
  using (auth.uid() = user_id);
