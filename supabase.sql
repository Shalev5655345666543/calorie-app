create table if not exists profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'
);
create table if not exists meals (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  name text,
  c numeric, p numeric, cb numeric, f numeric,
  created_at timestamptz default now()
);
alter table profiles enable row level security;
alter table meals enable row level security;
create policy "own profile" on profiles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own meals" on meals for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
