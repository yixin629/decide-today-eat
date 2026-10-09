-- PTE commercial support tickets with per-user isolation.
-- Intended for the standalone commercial PTE Supabase project after
-- pte-commercial-foundation.sql. It is additive and does not modify legacy data.
-- Back up the database before execution. Rollback drops pte_support_tickets and
-- permanently deletes all ticket history, so export the table before rollback.

CREATE TABLE IF NOT EXISTS public.pte_support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('bug', 'content', 'account', 'billing', 'feature', 'other')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal', 'high', 'urgent')),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 4 AND 120),
  description TEXT NOT NULL CHECK (char_length(description) BETWEEN 10 AND 5000),
  page_url TEXT CHECK (page_url IS NULL OR char_length(page_url) <= 500),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_for_user', 'resolved', 'closed')),
  staff_reply TEXT CHECK (staff_reply IS NULL OR char_length(staff_reply) <= 10000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.pte_support_staff (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'agent' CHECK (role IN ('agent', 'admin')),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS pte_support_tickets_user_created_idx ON public.pte_support_tickets (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS pte_support_tickets_status_created_idx ON public.pte_support_tickets (status, created_at);

ALTER TABLE public.pte_support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pte_support_staff ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'pte_support_tickets' AND policyname = 'PTE users read own tickets') THEN
    CREATE POLICY "PTE users read own tickets" ON public.pte_support_tickets FOR SELECT TO authenticated USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'pte_support_tickets' AND policyname = 'PTE users create own tickets') THEN
    CREATE POLICY "PTE users create own tickets" ON public.pte_support_tickets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  END IF;
END
$$;

REVOKE ALL ON public.pte_support_tickets FROM anon;
REVOKE ALL ON public.pte_support_staff FROM anon, authenticated;
REVOKE UPDATE, DELETE ON public.pte_support_tickets FROM authenticated;
GRANT SELECT, INSERT ON public.pte_support_tickets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pte_support_tickets TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pte_support_staff TO service_role;
