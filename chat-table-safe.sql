-- Safe Chat Table Setup
-- This script is safe to run multiple times. It checks if objects exist before creating them.

-- 1. Create table if not exists
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create indexes if not exist
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender);

-- 3. Enable Realtime safely
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'chat_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
  END IF;
END $$;

-- 4. Security Policies (RLS)
-- Enable RLS
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policy to ensure we have a clean slate (optional, but good for "fixing" things)
DROP POLICY IF EXISTS "Allow all operations" ON chat_messages;

-- Create a permissive policy for this couple's app
CREATE POLICY "Allow all operations" ON chat_messages
  FOR ALL
  USING (true)
  WITH CHECK (true);
