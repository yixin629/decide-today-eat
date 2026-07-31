-- 计划与记录功能初始化脚本
-- 创建倒计时、共享日程、时光胶囊和恋爱日记表，并配置兼容字段、策略和索引

-- ==================== 创建表（如果不存在）====================

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
  sender text not null,
  receiver text,
  unlock_date timestamp with time zone not null,
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

-- ==================== 为现有表添加缺失的列 ====================

-- Time Capsules 表添加缺失列
DO $$ 
BEGIN
  -- 添加 unlock_date 列（如果不存在）
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'time_capsules' 
    AND column_name = 'unlock_date'
  ) THEN
    ALTER TABLE time_capsules 
    ADD COLUMN unlock_date timestamp with time zone;
    
    -- 从现有数据迁移
    UPDATE time_capsules 
    SET unlock_date = created_at + interval '1 day'
    WHERE unlock_date IS NULL;
    
    ALTER TABLE time_capsules 
    ALTER COLUMN unlock_date SET NOT NULL;
    
    RAISE NOTICE '✅ time_capsules: 已添加 unlock_date 列';
  END IF;

  -- 添加 sender 列（如果不存在）
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'time_capsules' 
    AND column_name = 'sender'
  ) THEN
    ALTER TABLE time_capsules 
    ADD COLUMN sender text;
    
    -- 如果有旧的 created_by 列，迁移数据
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'time_capsules' 
      AND column_name = 'created_by'
    ) THEN
      UPDATE time_capsules SET sender = created_by WHERE sender IS NULL;
    END IF;
    
    UPDATE time_capsules SET sender = '未知' WHERE sender IS NULL;
    ALTER TABLE time_capsules ALTER COLUMN sender SET NOT NULL;
    
    RAISE NOTICE '✅ time_capsules: 已添加 sender 列';
  END IF;

  -- 添加 receiver 列（如果不存在）
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'time_capsules' 
    AND column_name = 'receiver'
  ) THEN
    ALTER TABLE time_capsules 
    ADD COLUMN receiver text;
    
    -- 如果有旧的 recipient 列，迁移数据
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'time_capsules' 
      AND column_name = 'recipient'
    ) THEN
      UPDATE time_capsules SET receiver = recipient WHERE receiver IS NULL;
    END IF;
    
    RAISE NOTICE '✅ time_capsules: 已添加 receiver 列';
  END IF;
END $$;

-- Schedules 表添加缺失列
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'schedules') THEN
    -- 添加 reminder_minutes 列
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'schedules' 
      AND column_name = 'reminder_minutes'
    ) THEN
      ALTER TABLE schedules 
      ADD COLUMN reminder_minutes integer DEFAULT 30;
      RAISE NOTICE '✅ schedules: 已添加 reminder_minutes 列';
    END IF;

    -- 添加 location 列
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'schedules' 
      AND column_name = 'location'
    ) THEN
      ALTER TABLE schedules 
      ADD COLUMN location text;
      RAISE NOTICE '✅ schedules: 已添加 location 列';
    END IF;
  END IF;
END $$;

-- Diary Entries 表添加缺失列
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'diary_entries') THEN
    -- 添加 mood 列
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'diary_entries' 
      AND column_name = 'mood'
    ) THEN
      ALTER TABLE diary_entries 
      ADD COLUMN mood text DEFAULT '😊';
      RAISE NOTICE '✅ diary_entries: 已添加 mood 列';
    END IF;

    -- 添加 photos 列
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'diary_entries' 
      AND column_name = 'photos'
    ) THEN
      ALTER TABLE diary_entries 
      ADD COLUMN photos text[] DEFAULT array[]::text[];
      RAISE NOTICE '✅ diary_entries: 已添加 photos 列';
    END IF;

    -- 添加 updated_at 列
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'diary_entries' 
      AND column_name = 'updated_at'
    ) THEN
      ALTER TABLE diary_entries 
      ADD COLUMN updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL;
      RAISE NOTICE '✅ diary_entries: 已添加 updated_at 列';
    END IF;
  END IF;
END $$;

-- ==================== 启用 RLS ====================

ALTER TABLE countdowns ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_capsules ENABLE ROW LEVEL SECURITY;
ALTER TABLE diary_entries ENABLE ROW LEVEL SECURITY;

-- ==================== 创建策略 ====================

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

-- ==================== 创建触发器 ====================

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

-- ==================== 创建索引 ====================

DO $$ 
BEGIN
  -- Countdowns 索引
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'countdowns_target_date_idx') THEN
    CREATE INDEX countdowns_target_date_idx ON countdowns(target_date);
    RAISE NOTICE '✅ 创建 countdowns_target_date_idx';
  END IF;

  -- Schedules 索引
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'schedules_event_date_idx') THEN
    CREATE INDEX schedules_event_date_idx ON schedules(event_date);
    RAISE NOTICE '✅ 创建 schedules_event_date_idx';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'schedules_status_idx') THEN
    CREATE INDEX schedules_status_idx ON schedules(status);
    RAISE NOTICE '✅ 创建 schedules_status_idx';
  END IF;

  -- Time Capsules 索引
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'time_capsules' 
    AND column_name = 'unlock_date'
  ) THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'time_capsules_unlock_date_idx') THEN
      CREATE INDEX time_capsules_unlock_date_idx ON time_capsules(unlock_date);
      RAISE NOTICE '✅ 创建 time_capsules_unlock_date_idx';
    END IF;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'time_capsules_is_opened_idx') THEN
    CREATE INDEX time_capsules_is_opened_idx ON time_capsules(is_opened);
    RAISE NOTICE '✅ 创建 time_capsules_is_opened_idx';
  END IF;

  -- Diary Entries 索引
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'diary_entries_date_idx') THEN
    CREATE INDEX diary_entries_date_idx ON diary_entries(date DESC);
    RAISE NOTICE '✅ 创建 diary_entries_date_idx';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'diary_entries_author_idx') THEN
    CREATE INDEX diary_entries_author_idx ON diary_entries(author);
    RAISE NOTICE '✅ 创建 diary_entries_author_idx';
  END IF;
END $$;

-- ==================== 完成 ====================

DO $$ 
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎉🎉🎉 数据库配置完成！🎉🎉🎉';
  RAISE NOTICE '';
  RAISE NOTICE '已创建/更新以下表：';
  RAISE NOTICE '  ✅ countdowns (倒计时/正计时)';
  RAISE NOTICE '  ✅ schedules (共享日程)';
  RAISE NOTICE '  ✅ time_capsules (时光胶囊)';
  RAISE NOTICE '  ✅ diary_entries (恋爱日记)';
  RAISE NOTICE '';
  RAISE NOTICE '所有表的RLS策略、触发器和索引都已配置完成。';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️ 注意：time_capsules 表使用以下字段名：';
  RAISE NOTICE '  - sender (创建者)';
  RAISE NOTICE '  - receiver (收件人)';
  RAISE NOTICE '  - unlock_date (开启日期)';
  RAISE NOTICE '';
  RAISE NOTICE '✨ 现在可以使用所有新功能了！';
END $$;
