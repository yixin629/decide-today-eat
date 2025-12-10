-- Ultra Safe New Features Schema
-- This script checks for tables AND columns, adding them if they are missing.

-- Helper function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-----------------------------------------------------------------------------
-- 1. Countdowns
-----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS countdowns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, NOW()) NOT NULL
);

-- Safely add columns
ALTER TABLE countdowns ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE countdowns ADD COLUMN IF NOT EXISTS target_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE countdowns ADD COLUMN IF NOT EXISTS type TEXT CHECK (type IN ('countdown', 'countup'));
ALTER TABLE countdowns ADD COLUMN IF NOT EXISTS emoji TEXT DEFAULT '⏰';

-- Fix constraints if needed (simple check constraint is hard to modify safely in one line, 
-- but column creation handles it for new tables. For existing, we assume it's okay or we'd need complex PL/PGSQL)

ALTER TABLE countdowns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access" ON countdowns;
CREATE POLICY "Allow public access" ON countdowns FOR ALL USING (true) WITH CHECK (true);

-----------------------------------------------------------------------------
-- 2. Schedules
-----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, NOW()) NOT NULL
);

ALTER TABLE schedules ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS event_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS reminder_minutes INTEGER DEFAULT 30;
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'upcoming';
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS created_by TEXT;

-- Drop check constraint to be safe before adding (if we want to ensure it exists correctly)
-- ALTER TABLE schedules DROP CONSTRAINT IF EXISTS schedules_status_check;
-- ALTER TABLE schedules ADD CONSTRAINT schedules_status_check CHECK (status IN ('upcoming', 'completed', 'cancelled'));

ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access" ON schedules;
CREATE POLICY "Allow public access" ON schedules FOR ALL USING (true) WITH CHECK (true);

-----------------------------------------------------------------------------
-- 3. Time Capsules (The one that failed for you)
-----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS time_capsules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, NOW()) NOT NULL
);

ALTER TABLE time_capsules ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE time_capsules ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE time_capsules ADD COLUMN IF NOT EXISTS created_by TEXT;
ALTER TABLE time_capsules ADD COLUMN IF NOT EXISTS recipient TEXT;
ALTER TABLE time_capsules ADD COLUMN IF NOT EXISTS open_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE time_capsules ADD COLUMN IF NOT EXISTS is_opened BOOLEAN DEFAULT false;
ALTER TABLE time_capsules ADD COLUMN IF NOT EXISTS opened_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE time_capsules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access" ON time_capsules;
CREATE POLICY "Allow public access" ON time_capsules FOR ALL USING (true) WITH CHECK (true);

-----------------------------------------------------------------------------
-- 4. Diary Entries
-----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS diary_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, NOW()) NOT NULL
);

ALTER TABLE diary_entries ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, NOW()) NOT NULL;
ALTER TABLE diary_entries ADD COLUMN IF NOT EXISTS date DATE;
ALTER TABLE diary_entries ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE diary_entries ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE diary_entries ADD COLUMN IF NOT EXISTS mood TEXT DEFAULT '😊';
ALTER TABLE diary_entries ADD COLUMN IF NOT EXISTS author TEXT;
ALTER TABLE diary_entries ADD COLUMN IF NOT EXISTS photos TEXT[] DEFAULT array[]::TEXT[];

ALTER TABLE diary_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access" ON diary_entries;
CREATE POLICY "Allow public access" ON diary_entries FOR ALL USING (true) WITH CHECK (true);

DROP TRIGGER IF EXISTS update_diary_entries_updated_at ON diary_entries;
CREATE TRIGGER update_diary_entries_updated_at
  BEFORE UPDATE ON diary_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-----------------------------------------------------------------------------
-- 5. Mood Records
-----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mood_records (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  mood INTEGER NOT NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Usually this table was missing entirely, but just in case:
ALTER TABLE mood_records ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE mood_records ADD COLUMN IF NOT EXISTS mood INTEGER;
ALTER TABLE mood_records ADD COLUMN IF NOT EXISTS note TEXT;
ALTER TABLE mood_records ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE mood_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access" ON mood_records;
CREATE POLICY "Allow public access" ON mood_records FOR ALL USING (true) WITH CHECK (true);

-----------------------------------------------------------------------------
-- 6. Novels (New Feature)
-----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS novels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, NOW()) NOT NULL,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  cover_url TEXT,
  description TEXT,
  link TEXT,
  added_by TEXT NOT NULL,
  likes TEXT[] DEFAULT array[]::TEXT[]
);

ALTER TABLE novels ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access" ON novels;
CREATE POLICY "Allow public access" ON novels FOR ALL USING (true) WITH CHECK (true);

-----------------------------------------------------------------------------
-- Indexes (Safe creation)
-----------------------------------------------------------------------------
-- Indexes will fail if the column doesn't exist, but we just added them above.
CREATE INDEX IF NOT EXISTS countdowns_target_date_idx ON countdowns(target_date);
CREATE INDEX IF NOT EXISTS schedules_event_date_idx ON schedules(event_date);
CREATE INDEX IF NOT EXISTS schedules_status_idx ON schedules(status);
CREATE INDEX IF NOT EXISTS time_capsules_open_date_idx ON time_capsules(open_date);
CREATE INDEX IF NOT EXISTS time_capsules_is_opened_idx ON time_capsules(is_opened);
CREATE INDEX IF NOT EXISTS diary_entries_date_idx ON diary_entries(date DESC);
CREATE INDEX IF NOT EXISTS diary_entries_author_idx ON diary_entries(author);
CREATE INDEX IF NOT EXISTS mood_records_user_id_idx ON mood_records(user_id);
CREATE INDEX IF NOT EXISTS novels_created_at_idx ON novels(created_at DESC);
