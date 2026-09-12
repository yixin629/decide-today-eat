-- Music Player: Listen Together
-- One shared row holding "what's currently playing" so two clients can stay in sync.
-- Reactions (flowers etc.) are sent as ephemeral Supabase Realtime broadcast events and
-- need no table. Run after music-player-schema.sql. Safe to re-run.

CREATE TABLE IF NOT EXISTS music_sync_session (
  id TEXT PRIMARY KEY DEFAULT 'default',
  song_id UUID REFERENCES songs(id) ON DELETE SET NULL,
  position_seconds NUMERIC NOT NULL DEFAULT 0,
  is_playing BOOLEAN NOT NULL DEFAULT false,
  updated_by TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, NOW())
);

INSERT INTO music_sync_session (id) VALUES ('default') ON CONFLICT (id) DO NOTHING;

ALTER TABLE music_sync_session ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public access" ON music_sync_session;
CREATE POLICY "Allow public access" ON music_sync_session FOR ALL USING (true) WITH CHECK (true);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'music_sync_session'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE music_sync_session;
  END IF;
END $$;
