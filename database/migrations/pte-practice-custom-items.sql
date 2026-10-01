-- PTE 练习题库：允许 zyx / zly 在网站上上传自定义题目
--
-- 适用：已经执行过 database/migrations/pte-practice-items-table.sql 的数据库（现有库）。
-- 前端入口：/pte-practice →「上传题目」（app/pte-practice/components/upload/）。
--
-- 影响范围：
--   - pte_practice_items 新增可空列 created_by（'zyx' | 'zly'）与 created_at，
--     已有内置题目这两列为 NULL / 执行时刻，不改动任何 payload。
--   - 新增 payload 大小约束（<= 50000 字节，NOT VALID，只约束新写入的行）。
--   - **放宽 RLS**：新增 anon / authenticated 的 INSERT 与 DELETE 策略，并授予对应权限。
--     策略只允许写入/删除 id 以 'custom-' 开头且 created_by 为 zyx / zly 的行，
--     内置题目（created_by 为空）不能被前端修改或删除。
--   不含 DROP TABLE / TRUNCATE / 无条件 DELETE；策略与约束创建前先判断是否存在，可重复执行。
--
-- 安全风险（与 pte-practice-comments-table.sql 相同的已知限制）：
--   站点使用固定的 zyx / zly 前端身份而不是 Supabase Auth，RLS 无法验证调用者真实身份。
--   任何拿到匿名 key 的人都能以 created_by = 'zyx' 或 'zly' 插入或删除自定义题目。
--   公开部署前应接入可靠认证并改写这些策略。
--
-- 备份与恢复：执行前可在 Supabase 导出 pte_practice_items。若要撤销上传功能，执行：
--   DROP POLICY IF EXISTS "PTE custom items can be inserted by the private app" ON pte_practice_items;
--   DROP POLICY IF EXISTS "PTE custom items can be deleted by the private app" ON pte_practice_items;
--   REVOKE INSERT, DELETE ON pte_practice_items FROM anon, authenticated;
-- （已上传的题目会保留；如需清理可执行 DELETE FROM pte_practice_items WHERE id LIKE 'custom-%';）

ALTER TABLE pte_practice_items ADD COLUMN IF NOT EXISTS created_by TEXT;
ALTER TABLE pte_practice_items ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, NOW());

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pte_practice_items_created_by_check') THEN
    ALTER TABLE pte_practice_items ADD CONSTRAINT pte_practice_items_created_by_check
      CHECK (created_by IS NULL OR created_by IN ('zyx', 'zly'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pte_practice_items_payload_size_check') THEN
    ALTER TABLE pte_practice_items ADD CONSTRAINT pte_practice_items_payload_size_check
      CHECK (octet_length(payload::text) <= 50000) NOT VALID;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS pte_practice_items_created_by_idx
  ON pte_practice_items(created_by)
  WHERE created_by IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'pte_practice_items'
      AND policyname = 'PTE custom items can be inserted by the private app'
  ) THEN
    CREATE POLICY "PTE custom items can be inserted by the private app"
      ON pte_practice_items FOR INSERT
      WITH CHECK (id LIKE 'custom-%' AND created_by IN ('zyx', 'zly') AND jsonb_typeof(payload) = 'object');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'pte_practice_items'
      AND policyname = 'PTE custom items can be deleted by the private app'
  ) THEN
    CREATE POLICY "PTE custom items can be deleted by the private app"
      ON pte_practice_items FOR DELETE
      USING (id LIKE 'custom-%' AND created_by IS NOT NULL);
  END IF;
END
$$;

GRANT INSERT, DELETE ON pte_practice_items TO anon, authenticated;
