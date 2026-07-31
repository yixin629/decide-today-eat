-- LEGACY：旧计划与记录表兼容修复，字段版本不完全符合当前页面。
-- 仅为历史数据库保留；执行前先备份并阅读 database/README.md。

-- 为 time_capsules 表添加缺失的列（如果不存在）
DO $$ 
BEGIN
  -- 添加 open_date 列
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'time_capsules' 
    AND column_name = 'open_date'
  ) THEN
    ALTER TABLE time_capsules 
    ADD COLUMN open_date timestamp with time zone;
    
    -- 为现有记录设置默认值（比如1天后）
    UPDATE time_capsules 
    SET open_date = created_at + interval '1 day'
    WHERE open_date IS NULL;
    
    -- 设置为 NOT NULL
    ALTER TABLE time_capsules 
    ALTER COLUMN open_date SET NOT NULL;
    
    RAISE NOTICE '✅ 已添加 open_date 列';
  END IF;

  -- 添加 is_opened 列
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'time_capsules' 
    AND column_name = 'is_opened'
  ) THEN
    ALTER TABLE time_capsules 
    ADD COLUMN is_opened boolean DEFAULT false;
    
    RAISE NOTICE '✅ 已添加 is_opened 列';
  END IF;

  -- 添加 opened_at 列
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'time_capsules' 
    AND column_name = 'opened_at'
  ) THEN
    ALTER TABLE time_capsules 
    ADD COLUMN opened_at timestamp with time zone;
    
    RAISE NOTICE '✅ 已添加 opened_at 列';
  END IF;

  -- 添加 recipient 列
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'time_capsules' 
    AND column_name = 'recipient'
  ) THEN
    ALTER TABLE time_capsules 
    ADD COLUMN recipient text;
    
    RAISE NOTICE '✅ 已添加 recipient 列';
  END IF;
END $$;

-- 为 schedules 表添加缺失的列
DO $$ 
BEGIN
  -- 添加 reminder_minutes 列
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'schedules' 
    AND column_name = 'reminder_minutes'
  ) THEN
    ALTER TABLE schedules 
    ADD COLUMN reminder_minutes integer DEFAULT 30;
    
    RAISE NOTICE '✅ 已添加 reminder_minutes 列';
  END IF;

  -- 添加 location 列
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'schedules' 
    AND column_name = 'location'
  ) THEN
    ALTER TABLE schedules 
    ADD COLUMN location text;
    
    RAISE NOTICE '✅ 已添加 location 列';
  END IF;
END $$;

-- 为 diary_entries 表添加缺失的列
DO $$ 
BEGIN
  -- 添加 mood 列
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'diary_entries' 
    AND column_name = 'mood'
  ) THEN
    ALTER TABLE diary_entries 
    ADD COLUMN mood text DEFAULT '😊';
    
    RAISE NOTICE '✅ 已添加 mood 列';
  END IF;

  -- 添加 photos 列
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'diary_entries' 
    AND column_name = 'photos'
  ) THEN
    ALTER TABLE diary_entries 
    ADD COLUMN photos text[] DEFAULT array[]::text[];
    
    RAISE NOTICE '✅ 已添加 photos 列';
  END IF;

  -- 添加 updated_at 列
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'diary_entries' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE diary_entries 
    ADD COLUMN updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL;
    
    RAISE NOTICE '✅ 已添加 updated_at 列';
  END IF;
END $$;

-- 启用行级安全策略 (RLS)
DO $$ 
BEGIN
  -- 为 countdowns 表启用 RLS
  ALTER TABLE countdowns ENABLE ROW LEVEL SECURITY;
  
  -- 为 schedules 表启用 RLS
  ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
  
  -- 为 time_capsules 表启用 RLS
  ALTER TABLE time_capsules ENABLE ROW LEVEL SECURITY;
  
  -- 为 diary_entries 表启用 RLS
  ALTER TABLE diary_entries ENABLE ROW LEVEL SECURITY;
  
  RAISE NOTICE '✅ 已启用所有表的 RLS';
EXCEPTION 
  WHEN OTHERS THEN
    RAISE NOTICE 'RLS 可能已经启用';
END $$;

-- 创建或替换策略
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

-- 创建索引以提高查询性能
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

  -- Time Capsules 索引 - 检查列是否存在
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'time_capsules' 
    AND column_name = 'open_date'
  ) THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'time_capsules_open_date_idx') THEN
      CREATE INDEX time_capsules_open_date_idx ON time_capsules(open_date);
      RAISE NOTICE '✅ 创建 time_capsules_open_date_idx';
    END IF;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'time_capsules' 
    AND column_name = 'is_opened'
  ) THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'time_capsules_is_opened_idx') THEN
      CREATE INDEX time_capsules_is_opened_idx ON time_capsules(is_opened);
      RAISE NOTICE '✅ 创建 time_capsules_is_opened_idx';
    END IF;
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

-- 完成提示
DO $$ 
BEGIN
  RAISE NOTICE '✅✅✅ 数据库配置完成！所有缺失的列已添加，策略和索引已创建或更新。';
END $$;
