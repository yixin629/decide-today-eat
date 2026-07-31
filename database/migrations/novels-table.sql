-- 情侣书架（小说）独立迁移
-- 可用于新库，也可为旧 novels 表补齐当前页面使用的字段。

CREATE TABLE IF NOT EXISTS novels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, NOW()) NOT NULL,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  cover_url TEXT,
  description TEXT,
  link TEXT,
  added_by TEXT NOT NULL,
  likes TEXT[] DEFAULT array[]::TEXT[],
  status TEXT DEFAULT 'want_to_read'
);

ALTER TABLE novels ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, NOW());
ALTER TABLE novels ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
ALTER TABLE novels ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE novels ADD COLUMN IF NOT EXISTS author TEXT;
ALTER TABLE novels ADD COLUMN IF NOT EXISTS cover_url TEXT;
ALTER TABLE novels ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE novels ADD COLUMN IF NOT EXISTS link TEXT;
ALTER TABLE novels ADD COLUMN IF NOT EXISTS added_by TEXT;
ALTER TABLE novels ADD COLUMN IF NOT EXISTS likes TEXT[] DEFAULT array[]::TEXT[];
ALTER TABLE novels ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'want_to_read';

ALTER TABLE novels ALTER COLUMN created_at SET DEFAULT timezone('utc'::text, NOW());
ALTER TABLE novels ALTER COLUMN likes SET DEFAULT array[]::TEXT[];
ALTER TABLE novels ALTER COLUMN status SET DEFAULT 'want_to_read';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.novels'::regclass
      AND contype = 'p'
  ) THEN
    UPDATE novels
    SET id = gen_random_uuid()
    WHERE id IS NULL;

    ALTER TABLE novels ALTER COLUMN id SET NOT NULL;
    ALTER TABLE novels ADD CONSTRAINT novels_pkey PRIMARY KEY (id);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.novels'::regclass
      AND conname = 'novels_status_check'
  ) THEN
    ALTER TABLE novels
      ADD CONSTRAINT novels_status_check
      CHECK (status IN ('want_to_read', 'reading', 'read')) NOT VALID;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS novels_created_at_idx ON novels(created_at DESC);
CREATE INDEX IF NOT EXISTS novels_status_idx ON novels(status);

ALTER TABLE novels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public access" ON novels;
CREATE POLICY "Allow public access"
  ON novels
  FOR ALL
  USING (true)
  WITH CHECK (true);
