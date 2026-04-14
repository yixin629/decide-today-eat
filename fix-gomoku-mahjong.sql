-- 修复五子棋和麻将数据库表
-- 在 Supabase SQL Editor 中执行此脚本

-- ============================================================
-- 1. 修复 gomoku_games 表 (添加 game_state 列，放宽旧列约束)
-- ============================================================

-- 添加 game_state JSONB 列 (新代码将整个游戏状态存储在这里)
ALTER TABLE gomoku_games ADD COLUMN IF NOT EXISTS game_state jsonb;

-- 放宽旧列的 NOT NULL 约束 (新代码不再直接使用这些列)
ALTER TABLE gomoku_games ALTER COLUMN board DROP NOT NULL;
ALTER TABLE gomoku_games ALTER COLUMN board SET DEFAULT '{}'::jsonb;
ALTER TABLE gomoku_games ALTER COLUMN current_player DROP NOT NULL;
ALTER TABLE gomoku_games ALTER COLUMN current_player SET DEFAULT 'black';

-- 确保 players, host_id, game_mode 列存在
ALTER TABLE gomoku_games ADD COLUMN IF NOT EXISTS players jsonb DEFAULT '[]'::jsonb;
ALTER TABLE gomoku_games ADD COLUMN IF NOT EXISTS host_id text;
ALTER TABLE gomoku_games ADD COLUMN IF NOT EXISTS game_mode text DEFAULT 'pvp';

-- ============================================================
-- 2. 确保 mahjong_games 表存在并配置正确
-- ============================================================

CREATE TABLE IF NOT EXISTS mahjong_games (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  status text default 'waiting' check (status in ('waiting', 'playing', 'finished')),
  players jsonb default '[]'::jsonb not null,
  game_state jsonb default '{}'::jsonb not null,
  mode text default 'standard' check (mode in ('standard', 'sichuan')),
  base_multiplier integer default 1,
  host_id text not null
);

-- ============================================================
-- 3. 确保 user_balances 表存在
-- ============================================================

CREATE TABLE IF NOT EXISTS user_balances (
  user_id text primary key,
  balance integer default 1000 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 初始化余额
INSERT INTO user_balances (user_id, balance) VALUES
  ('zyx', 1000),
  ('zly', 1000)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================
-- 4. RLS 策略 (确保公开访问)
-- ============================================================

ALTER TABLE gomoku_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE mahjong_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_balances ENABLE ROW LEVEL SECURITY;

-- gomoku_games
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'gomoku_games' AND policyname = 'Enable all access for gomoku_games') THEN
    CREATE POLICY "Enable all access for gomoku_games" ON gomoku_games FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- mahjong_games
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'mahjong_games' AND policyname = 'Enable all access for mahjong_games') THEN
    CREATE POLICY "Enable all access for mahjong_games" ON mahjong_games FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- user_balances
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_balances' AND policyname = 'Enable all access for user_balances') THEN
    CREATE POLICY "Enable all access for user_balances" ON user_balances FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ============================================================
-- 5. 启用 Realtime (实时订阅)
-- ============================================================

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE gomoku_games;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE mahjong_games;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE user_balances;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
