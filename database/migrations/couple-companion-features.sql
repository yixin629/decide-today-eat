-- 双人陪伴功能增量迁移：万能转盘、共同养成、回忆地图、礼物与通知
-- 可重复执行，不包含 DROP、TRUNCATE 或 DELETE。
-- 当前项目仍使用 zyx / zly 前端身份；这些策略不能替代 Supabase Auth 的可信隔离。

CREATE TABLE IF NOT EXISTS decision_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL CHECK (user_id IN ('zyx', 'zly')),
  wheel_type TEXT NOT NULL CHECK (char_length(wheel_type) BETWEEN 1 AND 40),
  option_kind TEXT NOT NULL DEFAULT 'choice' CHECK (option_kind IN ('choice', 'punishment')),
  label TEXT NOT NULL CHECK (char_length(label) BETWEEN 1 AND 80),
  emoji TEXT NOT NULL DEFAULT '✨' CHECK (char_length(emoji) <= 16),
  category TEXT NOT NULL DEFAULT '自定义',
  is_builtin BOOLEAN NOT NULL DEFAULT false,
  source_key TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, NOW())
);

-- CREATE TABLE IF NOT EXISTS 不会为已存在的旧表补字段，因此要单独增量补齐。
ALTER TABLE decision_options
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT '自定义',
  ADD COLUMN IF NOT EXISTS is_builtin BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS source_key TEXT;

CREATE INDEX IF NOT EXISTS decision_options_type_idx
  ON decision_options(wheel_type, option_kind, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS decision_options_source_key_idx
  ON decision_options(source_key) WHERE source_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS memory_places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by TEXT NOT NULL CHECK (created_by IN ('zyx', 'zly')),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 100),
  location_name TEXT NOT NULL CHECK (char_length(location_name) BETWEEN 1 AND 160),
  latitude DOUBLE PRECISION CHECK (latitude BETWEEN -90 AND 90),
  longitude DOUBLE PRECISION CHECK (longitude BETWEEN -180 AND 180),
  memory_date DATE NOT NULL,
  description TEXT NOT NULL DEFAULT '' CHECK (char_length(description) <= 1000),
  cover_url TEXT NOT NULL DEFAULT '' CHECK (char_length(cover_url) <= 1000),
  source_type TEXT NOT NULL DEFAULT 'manual' CHECK (source_type IN ('manual', 'photo', 'diary', 'schedule')),
  source_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS memory_places_date_idx ON memory_places(memory_date DESC);

CREATE TABLE IF NOT EXISTS couple_growth (
  pair_id TEXT PRIMARY KEY DEFAULT 'zyx-zly' CHECK (pair_id = 'zyx-zly'),
  pet_name TEXT NOT NULL DEFAULT '团团' CHECK (char_length(pet_name) BETWEEN 1 AND 30),
  pet_kind TEXT NOT NULL DEFAULT 'cat' CHECK (pet_kind IN ('cat', 'dog', 'rabbit')),
  experience INTEGER NOT NULL DEFAULT 0 CHECK (experience >= 0),
  garden_points INTEGER NOT NULL DEFAULT 0 CHECK (garden_points >= 0),
  last_cared_by TEXT CHECK (last_cared_by IN ('zyx', 'zly')),
  last_cared_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, NOW())
);

INSERT INTO couple_growth (pair_id) VALUES ('zyx-zly') ON CONFLICT (pair_id) DO NOTHING;

CREATE TABLE IF NOT EXISTS couple_gifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender TEXT NOT NULL CHECK (sender IN ('zyx', 'zly')),
  recipient TEXT NOT NULL CHECK (recipient IN ('zyx', 'zly') AND recipient <> sender),
  gift_type TEXT NOT NULL CHECK (char_length(gift_type) BETWEEN 1 AND 40),
  emoji TEXT NOT NULL DEFAULT '🎁' CHECK (char_length(emoji) <= 16),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 80),
  message TEXT NOT NULL DEFAULT '' CHECK (char_length(message) <= 500),
  opened_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS couple_gifts_recipient_idx
  ON couple_gifts(recipient, created_at DESC);

CREATE TABLE IF NOT EXISTS couple_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient TEXT NOT NULL CHECK (recipient IN ('zyx', 'zly')),
  actor TEXT NOT NULL CHECK (actor IN ('zyx', 'zly')),
  notification_type TEXT NOT NULL CHECK (char_length(notification_type) BETWEEN 1 AND 50),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 100),
  message TEXT NOT NULL DEFAULT '' CHECK (char_length(message) <= 500),
  link TEXT NOT NULL DEFAULT '/' CHECK (char_length(link) <= 300),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS couple_notifications_recipient_idx
  ON couple_notifications(recipient, read_at, created_at DESC);

-- 显式启用 RLS，便于 Supabase SQL Editor 的静态检查器识别。
ALTER TABLE decision_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_places ENABLE ROW LEVEL SECURITY;
ALTER TABLE couple_growth ENABLE ROW LEVEL SECURITY;
ALTER TABLE couple_gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE couple_notifications ENABLE ROW LEVEL SECURITY;

-- PTE 陪伴模式只返回汇总值，避免把题号、分数和笔记下载到对方浏览器。
CREATE OR REPLACE FUNCTION get_pte_companion_stats()
RETURNS TABLE (
  user_id TEXT,
  total_plans BIGINT,
  completed_items BIGINT,
  activity_dates JSONB
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH plan_totals AS (
    SELECT p.user_id, COUNT(*) AS total_plans
    FROM pte_plans p
    GROUP BY p.user_id
  ),
  completed AS (
    SELECT p.user_id, COUNT(*) AS completed_items
    FROM pte_plans p
    CROSS JOIN LATERAL jsonb_array_elements(p.days) AS day_item
    CROSS JOIN LATERAL jsonb_array_elements(COALESCE(day_item->'tasks', '[]'::jsonb)) AS task_item
    CROSS JOIN LATERAL jsonb_array_elements(COALESCE(task_item->'rows', '[]'::jsonb)) AS practice_row
    WHERE NULLIF(BTRIM(practice_row->>'questionId'), '') IS NOT NULL
    GROUP BY p.user_id
  ),
  active AS (
    SELECT p.user_id,
      jsonb_agg(DISTINCT day_item->>'date') FILTER (WHERE day_item->>'date' IS NOT NULL) AS activity_dates
    FROM pte_plans p
    CROSS JOIN LATERAL jsonb_array_elements(p.days) AS day_item
    WHERE EXISTS (
      SELECT 1
      FROM jsonb_array_elements(COALESCE(day_item->'tasks', '[]'::jsonb)) AS task_item,
           jsonb_array_elements(COALESCE(task_item->'rows', '[]'::jsonb)) AS practice_row
      WHERE NULLIF(BTRIM(practice_row->>'questionId'), '') IS NOT NULL
    )
    GROUP BY p.user_id
  )
  SELECT totals.user_id, totals.total_plans,
    COALESCE(completed.completed_items, 0),
    COALESCE(active.activity_dates, '[]'::jsonb)
  FROM plan_totals totals
  LEFT JOIN completed USING (user_id)
  LEFT JOIN active USING (user_id);
$$;

GRANT EXECUTE ON FUNCTION get_pte_companion_stats() TO anon, authenticated;

DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'decision_options', 'memory_places', 'couple_growth', 'couple_gifts', 'couple_notifications'
  ]
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = table_name
        AND policyname = table_name || ' private app access'
    ) THEN
      EXECUTE format(
        'CREATE POLICY %I ON %I FOR ALL USING (true) WITH CHECK (true)',
        table_name || ' private app access', table_name
      );
    END IF;
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON %I TO anon, authenticated', table_name);
  END LOOP;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public'
      AND tablename = 'couple_notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE couple_notifications;
  END IF;
END
$$;
