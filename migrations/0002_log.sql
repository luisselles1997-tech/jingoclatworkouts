-- Athlete logs. Every row is owned by user_id (the signed-in account).
-- A box is optional: athletes keep their logs even if they leave.

create table if not exists profiles (
  user_id      text primary key,
  display_name text not null default '',
  unit         text not null default 'lb',
  updated_at   timestamptz not null default now()
);

create table if not exists boxes (
  id         text primary key,
  name       text not null,
  coach_id   text not null,
  created_at timestamptz not null default now()
);

create index if not exists boxes_coach_idx on boxes (coach_id);

create table if not exists memberships (
  user_id    text primary key,
  box_id     text not null references boxes (id) on delete cascade,
  role       text not null check (role in ('coach', 'athlete')),
  joined_at  timestamptz not null default now()
);

create index if not exists memberships_box_idx on memberships (box_id);

create table if not exists sessions (
  id      text primary key,
  user_id text not null,
  date    text not null,
  title   text not null default '',
  notes   text not null default '',
  blocks  jsonb not null,
  rev     text not null default '',
  updated_at timestamptz not null default now()
);

create index if not exists sessions_user_date_idx on sessions (user_id, date);

create table if not exists plans (
  id         text primary key,
  user_id    text not null,
  title      text not null default '',
  notes      text not null default '',
  group_name text not null default '',
  blocks     jsonb not null,
  rev        text not null default '',
  updated_at timestamptz not null default now()
);

create index if not exists plans_user_idx on plans (user_id);

create table if not exists one_rms (
  user_id  text not null,
  name_key text not null,
  name     text not null,
  value    double precision not null,
  primary key (user_id, name_key)
);

create table if not exists saved_foods (
  user_id   text not null,
  name_key  text not null,
  name      text not null,
  kcal_per_g double precision not null,
  grams     double precision not null default 100,
  primary key (user_id, name_key)
);

create table if not exists food_logs (
  user_id text not null,
  day     text not null,
  items   jsonb not null,
  primary key (user_id, day)
);

create table if not exists drafts (
  user_id    text primary key,
  payload    jsonb not null,
  updated_at timestamptz not null default now()
);
