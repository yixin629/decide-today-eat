-- 大富翁在线房间（现有库与全新库均可按需执行）
-- 影响：新增 monopoly_rooms 表、索引、RLS 策略并加入 Realtime publication。
-- 不删除或覆盖现有数据；执行前仍建议备份 schema。回滚时可先导出房间记录，再手动删除表。
-- 当前站点身份来自浏览器 localStorage，策略仅适合此私人站点，不能视为强认证授权。

CREATE TABLE IF NOT EXISTS public.monopoly_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code text NOT NULL UNIQUE CHECK (room_code ~ '^[A-Z0-9]{6}$'),
  host_id text NOT NULL,
  host_name text NOT NULL CHECK (char_length(host_name) BETWEEN 1 AND 40),
  guest_id text,
  guest_name text CHECK (guest_name IS NULL OR char_length(guest_name) BETWEEN 1 AND 40),
  status text NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'finished')),
  game_state jsonb NOT NULL,
  version integer NOT NULL DEFAULT 0 CHECK (version >= 0),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CHECK (guest_id IS NULL OR guest_id <> host_id)
);

CREATE INDEX IF NOT EXISTS monopoly_rooms_status_created_idx
  ON public.monopoly_rooms (status, created_at DESC);

CREATE INDEX IF NOT EXISTS monopoly_rooms_updated_idx
  ON public.monopoly_rooms (updated_at DESC);

ALTER TABLE public.monopoly_rooms ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'monopoly_rooms'
      AND policyname = 'Private site can read monopoly rooms'
  ) THEN
    CREATE POLICY "Private site can read monopoly rooms"
      ON public.monopoly_rooms FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'monopoly_rooms'
      AND policyname = 'Private site can create monopoly rooms'
  ) THEN
    CREATE POLICY "Private site can create monopoly rooms"
      ON public.monopoly_rooms FOR INSERT
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'monopoly_rooms'
      AND policyname = 'Private site can update monopoly rooms'
  ) THEN
    CREATE POLICY "Private site can update monopoly rooms"
      ON public.monopoly_rooms FOR UPDATE
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

ALTER TABLE public.monopoly_rooms REPLICA IDENTITY FULL;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.monopoly_rooms;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
