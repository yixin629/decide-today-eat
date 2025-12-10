-- Music Player Schema
-- This script creates the songs table for the shared music player.

CREATE TABLE IF NOT EXISTS songs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, NOW()) NOT NULL,
  title TEXT NOT NULL,
  artist TEXT,
  url TEXT NOT NULL,
  cover TEXT,
  source TEXT DEFAULT 'file' CHECK (source IN ('file', 'spotify', 'youtube')),
  added_by TEXT
);

-- Enable RLS
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;

-- Allow public access (simple shared model)
DROP POLICY IF EXISTS "Allow public access" ON songs;
CREATE POLICY "Allow public access" ON songs FOR ALL USING (true) WITH CHECK (true);

-- Index for sorting
CREATE INDEX IF NOT EXISTS songs_created_at_idx ON songs(created_at);
