-- Music Player Enhancements
-- Adds "like" / "pin" support to songs plus a table for pinned artists.
-- Run this after music-player-schema.sql. Safe to re-run.

ALTER TABLE songs ADD COLUMN IF NOT EXISTS liked BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE songs ADD COLUMN IF NOT EXISTS pinned BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE songs ADD COLUMN IF NOT EXISTS pinned_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS songs_pinned_idx ON songs(pinned, pinned_at);
CREATE INDEX IF NOT EXISTS songs_liked_idx ON songs(liked);

CREATE TABLE IF NOT EXISTS pinned_artists (
  artist TEXT PRIMARY KEY,
  pinned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, NOW()) NOT NULL
);

ALTER TABLE pinned_artists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public access" ON pinned_artists;
CREATE POLICY "Allow public access" ON pinned_artists FOR ALL USING (true) WITH CHECK (true);

-- Realtime so pins/likes sync live for both users, matching the rest of the songs table.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'pinned_artists'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE pinned_artists;
  END IF;
END $$;
