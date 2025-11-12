-- Supabase SQL Schema
-- 在 Supabase Dashboard 中执行这些 SQL 语句

-- 1. 照片表
create table photos (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text,
  description text,
  image_url text not null,
  uploaded_by text not null,
  likes integer default 0
);

-- 2. 纪念日表
create table anniversaries (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  date date not null,
  description text,
  icon text default '💝',
  recurring boolean default false
);

-- 3. 五子棋游戏状态表
create table gomoku_games (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  board jsonb not null,
  current_player text not null,
  status text default 'playing',
  winner text,
  last_move jsonb
);

-- 4. 食物选项表
create table food_options (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  category text,
  emoji text default '🍱',
  is_favorite boolean default false
);

-- 5. 留言板表
create table love_notes (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  author text not null,
  content text not null,
  to_person text not null,
  is_read boolean default false
);

-- 6. 心愿清单表
create table wishlist (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  description text,
  status text default 'pending',
  completed_at timestamp with time zone,
  added_by text not null
);

-- 启用行级安全 (RLS)
alter table photos enable row level security;
alter table anniversaries enable row level security;
alter table gomoku_games enable row level security;
alter table food_options enable row level security;
alter table love_notes enable row level security;
alter table wishlist enable row level security;

-- 创建公共访问策略 (因为是私人网站，允许所有操作)
create policy "Enable all access for photos" on photos for all using (true);
create policy "Enable all access for anniversaries" on anniversaries for all using (true);
create policy "Enable all access for gomoku_games" on gomoku_games for all using (true);
create policy "Enable all access for food_options" on food_options for all using (true);
create policy "Enable all access for love_notes" on love_notes for all using (true);
create policy "Enable all access for wishlist" on wishlist for all using (true);

-- 插入一些示例食物数据
insert into food_options (name, category, emoji, is_favorite) values
  ('火锅', '中餐', '🍲', true),
  ('烤肉', '韩餐', '🥩', true),
  ('寿司', '日料', '🍣', true),
  ('披萨', '西餐', '🍕', false),
  ('拉面', '日料', '🍜', true),
  ('麻辣烫', '中餐', '🌶️', false),
  ('汉堡', '快餐', '🍔', false),
  ('炸鸡', '快餐', '🍗', true),
  ('海鲜', '中餐', '🦞', false),
  ('烧烤', '中餐', '🍢', true);
