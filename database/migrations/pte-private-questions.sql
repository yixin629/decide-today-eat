-- Personal-use PTE source material. Run only in a project with Supabase Auth.
-- Existing database migration; does not alter the public pte_practice_items table.
-- Each row belongs to one authenticated user. Anonymous access is not granted.
-- Back up this table before manual edits or deletion. Restore from a Supabase backup.

CREATE TABLE IF NOT EXISTS public.pte_private_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_code TEXT NOT NULL CHECK (question_code ~ '^[A-Z&]{2,8}$'),
  source_number INTEGER NOT NULL CHECK (source_number > 0),
  title TEXT NOT NULL DEFAULT '',
  question_text TEXT NOT NULL DEFAULT '',
  answer_text TEXT NOT NULL DEFAULT '',
  source_pages JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(source_pages) = 'object'),
  review_status TEXT NOT NULL DEFAULT 'needs-review'
    CHECK (review_status IN ('needs-review', 'reviewed', 'incomplete')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (owner_id, question_code, source_number)
);

CREATE INDEX IF NOT EXISTS pte_private_questions_owner_code_number_idx
  ON public.pte_private_questions(owner_id, question_code, source_number);

ALTER TABLE public.pte_private_questions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'pte_private_questions' AND policyname = 'PTE private questions select own') THEN
    CREATE POLICY "PTE private questions select own" ON public.pte_private_questions
      FOR SELECT TO authenticated USING (owner_id = (SELECT auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'pte_private_questions' AND policyname = 'PTE private questions insert own') THEN
    CREATE POLICY "PTE private questions insert own" ON public.pte_private_questions
      FOR INSERT TO authenticated WITH CHECK (owner_id = (SELECT auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'pte_private_questions' AND policyname = 'PTE private questions update own') THEN
    CREATE POLICY "PTE private questions update own" ON public.pte_private_questions
      FOR UPDATE TO authenticated USING (owner_id = (SELECT auth.uid()))
      WITH CHECK (owner_id = (SELECT auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'pte_private_questions' AND policyname = 'PTE private questions delete own') THEN
    CREATE POLICY "PTE private questions delete own" ON public.pte_private_questions
      FOR DELETE TO authenticated USING (owner_id = (SELECT auth.uid()));
  END IF;
END
$$;

REVOKE ALL ON public.pte_private_questions FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pte_private_questions TO authenticated;
