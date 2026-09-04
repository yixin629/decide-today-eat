-- PTE 个人模板云端存储（可重复执行，无删除操作）
-- 当前网站使用自定义 zyx / zly 前端身份，而不是 Supabase Auth。
-- 因此 RLS 只能限制允许的 user_id，无法通过 auth.uid() 验证调用者身份。

CREATE TABLE IF NOT EXISTS pte_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL CHECK (user_id IN ('zyx', 'zly')),
  task_types TEXT[] NOT NULL CHECK (cardinality(task_types) > 0),
  badge TEXT NOT NULL CHECK (char_length(badge) BETWEEN 1 AND 30),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 80),
  subtitle TEXT NOT NULL DEFAULT '' CHECK (char_length(subtitle) <= 160),
  tips JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(tips) = 'array'),
  lines JSONB NOT NULL CHECK (jsonb_typeof(lines) = 'array'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS pte_templates_user_updated_at_idx
  ON pte_templates(user_id, updated_at DESC);

ALTER TABLE pte_templates ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'pte_templates'
      AND policyname = 'PTE templates can be read by the private app'
  ) THEN
    CREATE POLICY "PTE templates can be read by the private app"
      ON pte_templates FOR SELECT
      USING (user_id IN ('zyx', 'zly'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'pte_templates'
      AND policyname = 'PTE templates can be inserted by the private app'
  ) THEN
    CREATE POLICY "PTE templates can be inserted by the private app"
      ON pte_templates FOR INSERT
      WITH CHECK (user_id IN ('zyx', 'zly'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'pte_templates'
      AND policyname = 'PTE templates can be updated by the private app'
  ) THEN
    CREATE POLICY "PTE templates can be updated by the private app"
      ON pte_templates FOR UPDATE
      USING (user_id IN ('zyx', 'zly'))
      WITH CHECK (user_id IN ('zyx', 'zly'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'pte_templates'
      AND policyname = 'PTE templates can be deleted by the private app'
  ) THEN
    CREATE POLICY "PTE templates can be deleted by the private app"
      ON pte_templates FOR DELETE
      USING (user_id IN ('zyx', 'zly'));
  END IF;
END
$$;

GRANT SELECT, INSERT, UPDATE, DELETE ON pte_templates TO anon, authenticated;
