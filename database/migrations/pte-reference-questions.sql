-- Existing database migration for source-material drafts shown in the PTE library.
-- Public SELECT exposes imported question and answer text to every site visitor.
-- Back up this table before changing or deleting rows; restore from a Supabase backup.
-- Do not import material here unless the site's access and content rights are acceptable.

CREATE TABLE IF NOT EXISTS public.pte_reference_questions (
  question_code TEXT NOT NULL CHECK (question_code ~ '^[A-Z&]{2,8}$'),
  source_number INTEGER NOT NULL CHECK (source_number > 0),
  title TEXT NOT NULL DEFAULT '',
  question_text TEXT NOT NULL DEFAULT '',
  answer_text TEXT NOT NULL DEFAULT '',
  source_pages JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(source_pages) = 'object'),
  review_status TEXT NOT NULL DEFAULT 'needs-review'
    CHECK (review_status IN ('needs-review', 'reviewed', 'incomplete')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (question_code, source_number)
);

CREATE INDEX IF NOT EXISTS pte_reference_questions_code_number_idx
  ON public.pte_reference_questions(question_code, source_number);

ALTER TABLE public.pte_reference_questions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'pte_reference_questions'
      AND policyname = 'PTE reference questions public read'
  ) THEN
    CREATE POLICY "PTE reference questions public read"
      ON public.pte_reference_questions FOR SELECT TO anon, authenticated USING (true);
  END IF;
END
$$;

GRANT SELECT ON public.pte_reference_questions TO anon, authenticated;
