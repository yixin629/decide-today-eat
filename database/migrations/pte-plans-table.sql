-- PTE 多计划云端存储
-- 当前网站使用自定义 zyx / zly 前端身份，而不是 Supabase Auth。
-- 因此 RLS 只能限制允许的 user_id，无法通过 auth.uid() 验证调用者身份。

CREATE TABLE IF NOT EXISTS pte_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL CHECK (user_id IN ('zyx', 'zly')),
  name TEXT NOT NULL CHECK (char_length(name) <= 50),
  config JSONB NOT NULL CHECK (jsonb_typeof(config) = 'object'),
  days JSONB NOT NULL CHECK (jsonb_typeof(days) = 'array'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS pte_plans_user_updated_at_idx
  ON pte_plans(user_id, updated_at DESC);

ALTER TABLE pte_plans ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'pte_plans'
      AND policyname = 'PTE plans can be read by the private app'
  ) THEN
    CREATE POLICY "PTE plans can be read by the private app"
      ON pte_plans FOR SELECT
      USING (user_id IN ('zyx', 'zly'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'pte_plans'
      AND policyname = 'PTE plans can be inserted by the private app'
  ) THEN
    CREATE POLICY "PTE plans can be inserted by the private app"
      ON pte_plans FOR INSERT
      WITH CHECK (user_id IN ('zyx', 'zly'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'pte_plans'
      AND policyname = 'PTE plans can be updated by the private app'
  ) THEN
    CREATE POLICY "PTE plans can be updated by the private app"
      ON pte_plans FOR UPDATE
      USING (user_id IN ('zyx', 'zly'))
      WITH CHECK (user_id IN ('zyx', 'zly'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'pte_plans'
      AND policyname = 'PTE plans can be deleted by the private app'
  ) THEN
    CREATE POLICY "PTE plans can be deleted by the private app"
      ON pte_plans FOR DELETE
      USING (user_id IN ('zyx', 'zly'));
  END IF;
END
$$;

GRANT SELECT, INSERT, UPDATE, DELETE ON pte_plans TO anon, authenticated;
