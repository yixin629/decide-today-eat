-- PTE commercial account, membership and entitlement foundation.
--
-- Intended for the future standalone PTE Supabase project. Do not execute against
-- the current private couple-site database unless commercial mode is being tested.
-- This migration is additive and does not alter zyx/zly records or legacy policies.
--
-- Secrets are not stored here. Stripe writes are performed only by the service-role
-- webhook after signature verification. Browser users can read only their own rows.
-- Back up the database before execution. Rollback requires dropping the trigger,
-- function and the four pte_* tables created below; doing so deletes commercial data.

CREATE TABLE IF NOT EXISTS public.pte_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.pte_memberships (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'monthly', 'yearly')),
  status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('inactive', 'pending_activation', 'trialing', 'active', 'past_due', 'unpaid', 'paused', 'canceled', 'incomplete', 'incomplete_expired')),
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.pte_entitlements (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  question_bank TEXT NOT NULL DEFAULT 'starter' CHECK (question_bank IN ('starter', 'full')),
  mock_exams_per_month INTEGER NOT NULL DEFAULT 1 CHECK (mock_exams_per_month >= 0),
  ai_scores_per_month INTEGER NOT NULL DEFAULT 5 CHECK (ai_scores_per_month >= 0),
  teacher_feedback BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.pte_payment_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  stripe_object_id TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  processed_at TIMESTAMPTZ,
  processing_error TEXT
);

ALTER TABLE public.pte_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pte_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pte_entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pte_payment_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'pte_profiles' AND policyname = 'PTE users read own profile') THEN
    CREATE POLICY "PTE users read own profile" ON public.pte_profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'pte_profiles' AND policyname = 'PTE users update own profile') THEN
    CREATE POLICY "PTE users update own profile" ON public.pte_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'pte_memberships' AND policyname = 'PTE users read own membership') THEN
    CREATE POLICY "PTE users read own membership" ON public.pte_memberships FOR SELECT TO authenticated USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'pte_entitlements' AND policyname = 'PTE users read own entitlements') THEN
    CREATE POLICY "PTE users read own entitlements" ON public.pte_entitlements FOR SELECT TO authenticated USING (auth.uid() = user_id);
  END IF;
END
$$;

REVOKE ALL ON public.pte_profiles, public.pte_memberships, public.pte_entitlements, public.pte_payment_events FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.pte_memberships, public.pte_entitlements, public.pte_payment_events FROM authenticated;
GRANT SELECT ON public.pte_profiles, public.pte_memberships, public.pte_entitlements TO authenticated;
GRANT UPDATE (display_name, updated_at) ON public.pte_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pte_profiles, public.pte_memberships, public.pte_entitlements, public.pte_payment_events TO service_role;

CREATE OR REPLACE FUNCTION public.create_pte_commercial_account()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.pte_profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', ''))
  ON CONFLICT (user_id) DO NOTHING;
  INSERT INTO public.pte_memberships (user_id) VALUES (NEW.id) ON CONFLICT (user_id) DO NOTHING;
  INSERT INTO public.pte_entitlements (user_id) VALUES (NEW.id) ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'create_pte_commercial_account_after_signup') THEN
    CREATE TRIGGER create_pte_commercial_account_after_signup
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.create_pte_commercial_account();
  END IF;
END
$$;
