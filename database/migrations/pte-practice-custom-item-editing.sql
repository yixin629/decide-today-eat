-- PTE custom question editing
--
-- Applies to existing databases after pte-practice-custom-items.sql.
-- Adds an UPDATE policy only for custom-* rows and grants UPDATE on payload only;
-- ids, task types, owners and timestamps cannot be changed through this grant.
--
-- Security limitation: the app still uses a browser-selected zyx/zly identity rather
-- than Supabase Auth. RLS therefore cannot prove which person is making the request.
-- Before public launch, replace this policy with auth.uid()-based ownership checks.
--
-- Backup/rollback: export pte_practice_items before running. To revoke editing:
--   DROP POLICY IF EXISTS "PTE custom items can be updated by the private app" ON pte_practice_items;
--   REVOKE UPDATE (payload) ON pte_practice_items FROM anon, authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'pte_practice_items'
      AND policyname = 'PTE custom items can be updated by the private app'
  ) THEN
    CREATE POLICY "PTE custom items can be updated by the private app"
      ON pte_practice_items FOR UPDATE
      USING (id LIKE 'custom-%' AND created_by IN ('zyx', 'zly'))
      WITH CHECK (id LIKE 'custom-%' AND created_by IN ('zyx', 'zly') AND jsonb_typeof(payload) = 'object');
  END IF;
END
$$;

GRANT UPDATE (payload) ON pte_practice_items TO anon, authenticated;
