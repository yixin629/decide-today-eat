-- 心情追踪独立迁移
-- 兼容历史 TEXT id；新插入在未提供 id 时自动生成 UUID 字符串。

CREATE TABLE IF NOT EXISTS mood_records (
  id TEXT DEFAULT gen_random_uuid()::TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  mood INTEGER NOT NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, NOW()) NOT NULL
);

ALTER TABLE mood_records ADD COLUMN IF NOT EXISTS id TEXT;
ALTER TABLE mood_records ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE mood_records ADD COLUMN IF NOT EXISTS mood INTEGER;
ALTER TABLE mood_records ADD COLUMN IF NOT EXISTS note TEXT;
ALTER TABLE mood_records ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, NOW());

DO $$
DECLARE
  id_data_type TEXT;
BEGIN
  SELECT data_type
  INTO id_data_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'mood_records'
    AND column_name = 'id';

  IF id_data_type = 'uuid' THEN
    ALTER TABLE mood_records ALTER COLUMN id SET DEFAULT gen_random_uuid();

    UPDATE mood_records
    SET id = gen_random_uuid()
    WHERE id IS NULL;
  ELSIF id_data_type IN ('text', 'character varying', 'character') THEN
    ALTER TABLE mood_records ALTER COLUMN id SET DEFAULT gen_random_uuid()::TEXT;

    UPDATE mood_records
    SET id = gen_random_uuid()::TEXT
    WHERE id IS NULL;
  ELSE
    RAISE EXCEPTION 'Unsupported mood_records.id type: %', id_data_type;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.mood_records'::regclass
      AND contype = 'p'
  ) THEN
    ALTER TABLE mood_records ALTER COLUMN id SET NOT NULL;
    ALTER TABLE mood_records ADD CONSTRAINT mood_records_pkey PRIMARY KEY (id);
  END IF;
END $$;

ALTER TABLE mood_records ALTER COLUMN created_at SET DEFAULT timezone('utc'::text, NOW());

CREATE INDEX IF NOT EXISTS mood_records_user_created_at_idx
  ON mood_records(user_id, created_at DESC);

ALTER TABLE mood_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public access" ON mood_records;
CREATE POLICY "Allow public access"
  ON mood_records
  FOR ALL
  USING (true)
  WITH CHECK (true);
