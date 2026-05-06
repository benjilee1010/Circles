-- Run this in your Supabase SQL editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Contacts table
create table if not exists contacts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  birthday date,
  notes text,
  reminder_frequency text not null default '1m',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_contacted_at timestamptz
);

-- Important dates (anniversaries, etc.)
create table if not exists important_dates (
  id uuid primary key default uuid_generate_v4(),
  contact_id uuid not null references contacts(id) on delete cascade,
  label text not null,
  date date not null
);

-- Interactions (hangouts / conversations)
create table if not exists interactions (
  id uuid primary key default uuid_generate_v4(),
  contact_id uuid not null references contacts(id) on delete cascade,
  date date not null,
  note text,
  created_at timestamptz not null default now()
);

-- Auto-update updated_at on contacts
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists contacts_updated_at on contacts;
create trigger contacts_updated_at
  before update on contacts
  for each row execute procedure update_updated_at();

-- Auto-update last_contacted_at when an interaction is inserted/deleted
create or replace function sync_last_contacted()
returns trigger as $$
begin
  update contacts
  set last_contacted_at = (
    select max(date::timestamptz)
    from interactions
    where contact_id = coalesce(new.contact_id, old.contact_id)
  )
  where id = coalesce(new.contact_id, old.contact_id);
  return coalesce(new, old);
end;
$$ language plpgsql;

drop trigger if exists interactions_sync_last_contacted on interactions;
create trigger interactions_sync_last_contacted
  after insert or update or delete on interactions
  for each row execute procedure sync_last_contacted();

-- Row Level Security
alter table contacts enable row level security;
alter table important_dates enable row level security;
alter table interactions enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'contacts' and policyname = 'Users own contacts') then
    create policy "Users own contacts" on contacts
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'important_dates' and policyname = 'Users own important_dates') then
    create policy "Users own important_dates" on important_dates
      using (exists (select 1 from contacts where contacts.id = important_dates.contact_id and contacts.user_id = auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where tablename = 'interactions' and policyname = 'Users own interactions') then
    create policy "Users own interactions" on interactions
      using (exists (select 1 from contacts where contacts.id = interactions.contact_id and contacts.user_id = auth.uid()));
  end if;
end $$;
