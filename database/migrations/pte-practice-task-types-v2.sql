-- PTE 练习：放开 22 种题型的 task_type 约束（新增 Summarize Group Discussion / Respond to a Situation）
--
-- 适用：已经执行过 pte-practice-items-table.sql、pte-practice-attempts-table.sql、
-- pte-practice-comments-table.sql 的现有数据库；全新数据库在执行这三份文件之后执行本文件。
--
-- 背景：
--   - pte_practice_attempts 与 pte_practice_comments 建表时的 task_type CHECK 只包含最早的 8 种题型，
--     其余 14 种题型（含本次新增的 2 种）的练习记录无法写入云端，前端会回退到本机保存；
--     题目留言同理无法保存。
--   - pte_practice_items 的约束为 20 种，不含 2025 年 8 月新增的
--     speaking-summarize-group-discussion 与 speaking-respond-to-situation，相关自定义题目无法上传。
--
-- 影响范围：只删除并重建上述三张表上引用 task_type 的 CHECK 约束，取值范围只会变宽，
-- 不修改、不删除任何数据行。没有 DROP TABLE / TRUNCATE / DELETE。
-- 可安全重复执行：每次都会先删除表上所有引用 task_type 的 CHECK 约束，再按统一名称重建。
--
-- 备份与恢复：执行前可在 Supabase 导出这三张表。若需恢复旧约束，重新创建只包含原取值的
-- CHECK 约束即可（注意：届时已写入的新题型行会导致约束创建失败，需要先处理这些行）。

BEGIN;

DO $$
DECLARE
  target_table TEXT;
  constraint_row RECORD;
  allowed TEXT := $list$
    'reading-mcq-single',
    'reading-mcq-multiple',
    'reading-reorder',
    'reading-fill-blanks-drag',
    'reading-fill-blanks-dropdown',
    'listening-fill-blanks-typed',
    'listening-highlight-summary',
    'listening-mcq-single',
    'listening-mcq-multiple',
    'listening-summarize-spoken-text',
    'listening-select-missing-word',
    'listening-highlight-incorrect-words',
    'listening-write-from-dictation',
    'speaking-read-aloud',
    'speaking-repeat-sentence',
    'speaking-describe-image',
    'speaking-retell-lecture',
    'speaking-answer-short-question',
    'speaking-summarize-group-discussion',
    'speaking-respond-to-situation',
    'writing-summarize-text',
    'writing-essay'
  $list$;
BEGIN
  FOREACH target_table IN ARRAY ARRAY['pte_practice_items', 'pte_practice_attempts', 'pte_practice_comments'] LOOP
    IF to_regclass('public.' || target_table) IS NULL THEN
      RAISE NOTICE '表 % 不存在，跳过', target_table;
      CONTINUE;
    END IF;

    -- 建表时的内联 CHECK 由 Postgres 自动命名，这里按定义内容查找，避免名称不一致时遗漏旧约束。
    FOR constraint_row IN
      SELECT conname FROM pg_constraint
      WHERE conrelid = ('public.' || target_table)::regclass
        AND contype = 'c'
        AND pg_get_constraintdef(oid) LIKE '%task_type%'
    LOOP
      EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT %I', target_table, constraint_row.conname);
    END LOOP;

    EXECUTE format(
      'ALTER TABLE public.%I ADD CONSTRAINT %I CHECK (task_type IN (%s))',
      target_table,
      target_table || '_task_type_check',
      allowed
    );
  END LOOP;
END
$$;

COMMIT;
