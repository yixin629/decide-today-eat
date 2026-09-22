-- PTE 练习题讨论区 / 考场标记评论
--
-- 影响范围：仅新增 pte_practice_comments 表、索引与 RLS 策略，不修改、不
-- 删除任何已有表或数据（无 DROP / TRUNCATE / 无条件 DELETE）。可安全重复
-- 执行：CREATE TABLE / INDEX 均带 IF NOT EXISTS，策略创建前先判断是否已存在。
--
-- 背景：为 app/pte-practice 新增"练习集锦"共享动态下的评论区。任一用户
-- （zyx / zly）可以针对某道题目（pte_practice_items.id）留言，并可选填写
-- "在哪里考过"（exam_location）与"哪天考过"（exam_date）用于标记真实考场
-- 遇到过的题目。
--
-- item_id 为软引用（TEXT），不设置数据库外键约束到 pte_practice_items(id)：
-- 因为题库种子数据与评论表分别在不同迁移文件中执行，若加真实外键会强制
-- 要求 pte-practice-items-table.sql 必须先于本文件执行且不可回滚题库行，
-- 否则会插入失败；作为练习场景下的轻量级留言功能，软引用足够，遗留风险见
-- database/README.md 中的说明。
--
-- 当前站点使用固定的 zyx / zly 前端身份，而不是 Supabase Auth，RLS 只能
-- 限制允许写入的 user_id 取值，无法通过 auth.uid() 验证调用者真实身份
-- （与 pte-plans-table.sql / pte-practice-attempts-table.sql 一致）。

CREATE TABLE IF NOT EXISTS pte_practice_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id TEXT NOT NULL,
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
  user_id TEXT NOT NULL CHECK (user_id IN ('zyx', 'zly')),
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  exam_location TEXT CHECK (exam_location IS NULL OR char_length(exam_location) <= 100),
  exam_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS pte_practice_comments_item_created_idx
  ON pte_practice_comments(item_id, created_at DESC);

CREATE INDEX IF NOT EXISTS pte_practice_comments_created_idx
  ON pte_practice_comments(created_at DESC);

ALTER TABLE pte_practice_comments REPLICA IDENTITY FULL;

ALTER TABLE pte_practice_comments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'pte_practice_comments'
      AND policyname = 'PTE practice comments can be read by the private app'
  ) THEN
    CREATE POLICY "PTE practice comments can be read by the private app"
      ON pte_practice_comments FOR SELECT
      USING (user_id IN ('zyx', 'zly'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'pte_practice_comments'
      AND policyname = 'PTE practice comments can be inserted by the private app'
  ) THEN
    CREATE POLICY "PTE practice comments can be inserted by the private app"
      ON pte_practice_comments FOR INSERT
      WITH CHECK (user_id IN ('zyx', 'zly'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'pte_practice_comments'
      AND policyname = 'PTE practice comments can be deleted by the private app'
  ) THEN
    CREATE POLICY "PTE practice comments can be deleted by the private app"
      ON pte_practice_comments FOR DELETE
      USING (user_id IN ('zyx', 'zly'));
  END IF;
END
$$;

GRANT SELECT, INSERT, DELETE ON pte_practice_comments TO anon, authenticated;

-- 启用 Realtime，做法与 database/migrations/music-player-listen-together.sql
-- 及 pte-practice-attempts-table.sql 一致。
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'pte_practice_comments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE pte_practice_comments;
  END IF;
END $$;
