-- Supabase SQL Schema for Mahjong Feature and Virtual Currency
-- Execute this in the Supabase Dashboard SQL Editor

-- 1. 欢乐豆余额表 (User Balances)
create table user_balances (
  user_id text primary key,
  balance integer default 1000 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for user_balances
alter table user_balances enable row level security;

-- Policies for user_balances
create policy "Allow public read access on user_balances"
  on user_balances for select using (true);

create policy "Allow public insert on user_balances"
  on user_balances for insert with check (true);

create policy "Allow public update on user_balances"
  on user_balances for update using (true);

create policy "Allow public delete on user_balances"
  on user_balances for delete using (true);

-- 2. 麻将游戏状态表 (Mahjong Games)
create table mahjong_games (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  status text default 'waiting' check (status in ('waiting', 'playing', 'finished')),
  players jsonb default '[]'::jsonb not null, -- Array of up to 4 objects: { id (string), isBot (boolean) }
  game_state jsonb not null,                    -- Stores deck, current hands, discards, turn index, etc.
  mode text default 'standard' check (mode in ('standard', 'sichuan')),
  base_multiplier integer default 1,
  host_id text not null                         -- The string ID of the player who created the game and runs bot logic
);

-- Enable RLS for mahjong_games
alter table mahjong_games enable row level security;

-- Policies for mahjong_games
create policy "Allow public read access on mahjong_games"
  on mahjong_games for select using (true);

create policy "Allow public insert on mahjong_games"
  on mahjong_games for insert with check (true);

create policy "Allow public update on mahjong_games"
  on mahjong_games for update using (true);

create policy "Allow public delete on mahjong_games"
  on mahjong_games for delete using (true);

-- 创建触发器自动更新 updated_at for user_balances
create or replace function update_user_balances_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger update_user_balances_timer
  before update on user_balances
  for each row
  execute function update_user_balances_updated_at();

-- Insert initial balances for zy and zyx (or handle dynamically on login, but safe to initialize here)
insert into user_balances (user_id, balance) values
  ('zyx', 1000),
  ('zly', 1000)
on conflict (user_id) do nothing;
