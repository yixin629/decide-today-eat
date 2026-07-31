-- LEGACY：旧计划与记录表综合修复，不代表当前完整 schema。
-- 仅为历史数据库保留；执行前先备份并阅读 database/README.md。

-- ==================== 修复所有表的策略和权限 ====================

-- 1. 确保所有表都启用 RLS
ALTER TABLE countdowns ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_capsules ENABLE ROW LEVEL SECURITY;
ALTER TABLE diary_entries ENABLE ROW LEVEL SECURITY;

-- 2. Countdowns 表策略
DROP POLICY IF EXISTS "Allow public read access" ON countdowns;
DROP POLICY IF EXISTS "Allow public insert" ON countdowns;
DROP POLICY IF EXISTS "Allow public update" ON countdowns;
DROP POLICY IF EXISTS "Allow public delete" ON countdowns;

CREATE POLICY "Allow public read access" ON countdowns FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON countdowns FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON countdowns FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON countdowns FOR DELETE USING (true);

-- 3. Schedules 表策略
DROP POLICY IF EXISTS "Allow public read access" ON schedules;
DROP POLICY IF EXISTS "Allow public insert" ON schedules;
DROP POLICY IF EXISTS "Allow public update" ON schedules;
DROP POLICY IF EXISTS "Allow public delete" ON schedules;

CREATE POLICY "Allow public read access" ON schedules FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON schedules FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON schedules FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON schedules FOR DELETE USING (true);

-- 4. Time Capsules 表策略
DROP POLICY IF EXISTS "Allow public read access" ON time_capsules;
DROP POLICY IF EXISTS "Allow public insert" ON time_capsules;
DROP POLICY IF EXISTS "Allow public update" ON time_capsules;
DROP POLICY IF EXISTS "Allow public delete" ON time_capsules;

CREATE POLICY "Allow public read access" ON time_capsules FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON time_capsules FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON time_capsules FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON time_capsules FOR DELETE USING (true);

-- 5. Diary Entries 表策略
DROP POLICY IF EXISTS "Allow public read access" ON diary_entries;
DROP POLICY IF EXISTS "Allow public insert" ON diary_entries;
DROP POLICY IF EXISTS "Allow public update" ON diary_entries;
DROP POLICY IF EXISTS "Allow public delete" ON diary_entries;

CREATE POLICY "Allow public read access" ON diary_entries FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON diary_entries FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON diary_entries FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON diary_entries FOR DELETE USING (true);

-- ==================== 添加缺失的列 ====================

-- Time Capsules 表添加缺失列
DO $$ 
BEGIN
  -- 添加 unlock_date 列（如果不存在）
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'time_capsules' 
    AND column_name = 'unlock_date'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'time_capsules'
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
END $$;

-- Schedules 表添加缺失列
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
END $$;

-- Diary Entries 表添加缺失列
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
END $$;

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
  RAISE NOTICE '✅✅✅ 数据库配置完成！';
  RAISE NOTICE '所有表的策略、缺失的列和索引都已创建或更新。';
  RAISE NOTICE '';
  RAISE NOTICE '注意：time_capsules 表使用以下字段名：';
  RAISE NOTICE '  - sender (创建者)';
  RAISE NOTICE '  - receiver (收件人)';
  RAISE NOTICE '  - unlock_date (开启日期)';
END $$;
