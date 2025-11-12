-- Supabase SQL Schema for New Features (Safe Version)
-- 在 Supabase Dashboard 中执行这些 SQL 语句来添加新功能表
-- 使用 IF NOT EXISTS 避免重复创建

-- 1. 倒计时/正计时表
CREATE TABLE IF NOT EXISTS countdowns (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  target_date timestamp with time zone not null,
  type text not null check (type in ('countdown', 'countup')),
  emoji text default '⏰'
);

-- 2. 共享日程表
CREATE TABLE IF NOT EXISTS schedules (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  description text,
  event_date timestamp with time zone not null,
  location text,
  reminder_minutes integer default 30,
  status text default 'upcoming' check (status in ('upcoming', 'completed', 'cancelled')),
  created_by text not null
);

-- 3. 时光胶囊表
CREATE TABLE IF NOT EXISTS time_capsules (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  content text not null,
  created_by text not null,
  recipient text,
  open_date timestamp with time zone not null,
  is_opened boolean default false,
  opened_at timestamp with time zone
);

-- 4. 恋爱日记表
CREATE TABLE IF NOT EXISTS diary_entries (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  date date not null,
  title text not null,
  content text not null,
  mood text default '😊',
  author text not null,
  photos text[] default array[]::text[]
);

-- 启用行级安全策略 (RLS)
-- 如果已经启用会自动跳过

DO $$ 
BEGIN
  -- 为 countdowns 表启用 RLS
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'countdowns' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE countdowns ENABLE ROW LEVEL SECURITY;
  END IF;

  -- 为 schedules 表启用 RLS
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'schedules' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
  END IF;

  -- 为 time_capsules 表启用 RLS
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'time_capsules' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE time_capsules ENABLE ROW LEVEL SECURITY;
  END IF;

  -- 为 diary_entries 表启用 RLS
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'diary_entries' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE diary_entries ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- 创建或替换策略
-- 删除旧策略（如果存在）并创建新策略

-- Countdowns 表策略
DROP POLICY IF EXISTS "Allow public read access" ON countdowns;
DROP POLICY IF EXISTS "Allow public insert" ON countdowns;
DROP POLICY IF EXISTS "Allow public update" ON countdowns;
DROP POLICY IF EXISTS "Allow public delete" ON countdowns;

CREATE POLICY "Allow public read access" ON countdowns FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON countdowns FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON countdowns FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON countdowns FOR DELETE USING (true);

-- Schedules 表策略
DROP POLICY IF EXISTS "Allow public read access" ON schedules;
DROP POLICY IF EXISTS "Allow public insert" ON schedules;
DROP POLICY IF EXISTS "Allow public update" ON schedules;
DROP POLICY IF EXISTS "Allow public delete" ON schedules;

CREATE POLICY "Allow public read access" ON schedules FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON schedules FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON schedules FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON schedules FOR DELETE USING (true);

-- Time Capsules 表策略
DROP POLICY IF EXISTS "Allow public read access" ON time_capsules;
DROP POLICY IF EXISTS "Allow public insert" ON time_capsules;
DROP POLICY IF EXISTS "Allow public update" ON time_capsules;
DROP POLICY IF EXISTS "Allow public delete" ON time_capsules;

CREATE POLICY "Allow public read access" ON time_capsules FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON time_capsules FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON time_capsules FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON time_capsules FOR DELETE USING (true);

-- Diary Entries 表策略
DROP POLICY IF EXISTS "Allow public read access" ON diary_entries;
DROP POLICY IF EXISTS "Allow public insert" ON diary_entries;
DROP POLICY IF EXISTS "Allow public update" ON diary_entries;
DROP POLICY IF EXISTS "Allow public delete" ON diary_entries;

CREATE POLICY "Allow public read access" ON diary_entries FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON diary_entries FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON diary_entries FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON diary_entries FOR DELETE USING (true);

-- 创建或替换触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为 diary_entries 创建触发器
DROP TRIGGER IF EXISTS update_diary_entries_updated_at ON diary_entries;
CREATE TRIGGER update_diary_entries_updated_at
  BEFORE UPDATE ON diary_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 创建索引以提高查询性能（IF NOT EXISTS 需要用 DO 块）
DO $$ 
BEGIN
  -- Countdowns 索引
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'countdowns_target_date_idx') THEN
    CREATE INDEX countdowns_target_date_idx ON countdowns(target_date);
  END IF;

  -- Schedules 索引
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'schedules_event_date_idx') THEN
    CREATE INDEX schedules_event_date_idx ON schedules(event_date);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'schedules_status_idx') THEN
    CREATE INDEX schedules_status_idx ON schedules(status);
  END IF;

  -- Time Capsules 索引
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'time_capsules_open_date_idx') THEN
    CREATE INDEX time_capsules_open_date_idx ON time_capsules(open_date);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'time_capsules_is_opened_idx') THEN
    CREATE INDEX time_capsules_is_opened_idx ON time_capsules(is_opened);
  END IF;

  -- Diary Entries 索引
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'diary_entries_date_idx') THEN
    CREATE INDEX diary_entries_date_idx ON diary_entries(date DESC);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'diary_entries_author_idx') THEN
    CREATE INDEX diary_entries_author_idx ON diary_entries(author);
  END IF;
END $$;

-- 完成提示
DO $$ 
BEGIN
  RAISE NOTICE '✅ 数据库配置完成！所有表、策略和索引已创建或更新。';
END $$;
