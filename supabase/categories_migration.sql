-- Run this in your Supabase SQL editor

-- 1. Add category column to contacts
alter table contacts add column if not exists category text;

-- 2. Custom user categories table
create table if not exists user_categories (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

alter table user_categories enable row level security;

create policy "Users own categories" on user_categories
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
