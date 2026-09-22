-- PTE 练习记录云端存储
--
-- 影响范围：仅新增 pte_practice_attempts 表、索引与 RLS 策略，不修改、不
-- 删除任何已有表或数据（无 DROP / TRUNCATE / 无条件 DELETE）。可安全重复
-- 执行：CREATE TABLE / INDEX 均带 IF NOT EXISTS，策略创建前先判断是否已存在。
--
-- 背景：将 app/pte-practice/lib/attempt-repository.ts 原先保存在浏览器
-- localStorage（key: pte-practice-attempts-v1）的练习记录迁移为按用户
-- （zyx / zly）区分的云端记录，用于支持"我的练习"历史和"练习集锦"共享动态。
-- 前端在 Supabase 不可用时会回退为仅本地展示，不会阻塞练习本身。
--
-- 当前站点使用固定的 zyx / zly 前端身份，而不是 Supabase Auth，因此 RLS
-- 只能限制允许写入的 user_id 取值，无法通过 auth.uid() 验证调用者真实身份
-- （与 database/migrations/pte-plans-table.sql 采用的模式完全一致）。这意味着
-- 任何知道匿名密钥的客户端都可以以 zyx 或 zly 的名义写入/读取，这是本站现有
-- 认证模型的已知限制，非本次改动引入。

CREATE TABLE IF NOT EXISTS pte_practice_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL CHECK (user_id IN ('zyx', 'zly')),
  task_type TEXT NOT NULL CHECK (task_type IN (
    'reading-mcq-single',
    'reading-reorder',
    'reading-fill-blanks-drag',
    'listening-fill-blanks-typed',
    'listening-highlight-summary',
    'speaking-read-aloud',
    'writing-summarize-text',
    'writing-essay'
  )),
  item_id TEXT NOT NULL,
  duration_seconds NUMERIC NOT NULL CHECK (duration_seconds >= 0),
  dimensions JSONB NOT NULL CHECK (jsonb_typeof(dimensions) = 'array'),
  summary TEXT NOT NULL CHECK (char_length(summary) <= 2000),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS pte_practice_attempts_user_created_idx
  ON pte_practice_attempts(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS pte_practice_attempts_created_idx
  ON pte_practice_attempts(created_at DESC);

-- JSONB 列的实时更新推送需要 REPLICA IDENTITY FULL（本表只会 INSERT，不会
-- UPDATE，但与仓库内其它含 JSONB 列并启用 Realtime 的表保持一致做法）。
ALTER TABLE pte_practice_attempts REPLICA IDENTITY FULL;

ALTER TABLE pte_practice_attempts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'pte_practice_attempts'
      AND policyname = 'PTE practice attempts can be read by the private app'
  ) THEN
    CREATE POLICY "PTE practice attempts can be read by the private app"
      ON pte_practice_attempts FOR SELECT
      USING (user_id IN ('zyx', 'zly'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'pte_practice_attempts'
      AND policyname = 'PTE practice attempts can be inserted by the private app'
  ) THEN
    CREATE POLICY "PTE practice attempts can be inserted by the private app"
      ON pte_practice_attempts FOR INSERT
      WITH CHECK (user_id IN ('zyx', 'zly'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'pte_practice_attempts'
      AND policyname = 'PTE practice attempts can be deleted by the private app'
  ) THEN
    CREATE POLICY "PTE practice attempts can be deleted by the private app"
      ON pte_practice_attempts FOR DELETE
      USING (user_id IN ('zyx', 'zly'));
  END IF;
END
$$;

GRANT SELECT, INSERT, DELETE ON pte_practice_attempts TO anon, authenticated;

-- 启用 Realtime，供"练习集锦"共享动态实时刷新（做法与
-- database/migrations/music-player-listen-together.sql 一致）。
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'pte_practice_attempts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE pte_practice_attempts;
  END IF;
END $$;
