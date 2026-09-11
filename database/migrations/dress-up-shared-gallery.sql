-- 换装共享作品墙（现有库与全新库均可按需执行）
-- 新增共享造型表和 Realtime，不删除或覆盖现有数据。
-- 当前 created_by 来自浏览器本地身份，仅适用于两人私人站点，不构成强认证。

CREATE TABLE IF NOT EXISTS public.dress_up_outfits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by text NOT NULL CHECK (char_length(created_by) BETWEEN 1 AND 40),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 60),
  outfit jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS dress_up_outfits_created_at_idx ON public.dress_up_outfits (created_at DESC);
ALTER TABLE public.dress_up_outfits ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'dress_up_outfits' AND policyname = 'Private site can read shared outfits') THEN
    CREATE POLICY "Private site can read shared outfits" ON public.dress_up_outfits FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'dress_up_outfits' AND policyname = 'Private site can create shared outfits') THEN
    CREATE POLICY "Private site can create shared outfits" ON public.dress_up_outfits FOR INSERT WITH CHECK (true);
  END IF;
END $$;

ALTER TABLE public.dress_up_outfits REPLICA IDENTITY FULL;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.dress_up_outfits;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
