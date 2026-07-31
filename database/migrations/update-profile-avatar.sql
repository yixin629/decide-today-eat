-- Add Avatar URL column if not exists
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Bucket for avatars (if using Storage)
-- Note: SQL cannot easily create Storage buckets directly in all environments without extensions, 
-- but we can set up the RLS for it if the bucket exists.
-- Assumption: 'avatars' bucket exists or will be created by user.

-- Enable RLS for profiles if not enabled
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles access" ON user_profiles;
CREATE POLICY "Public profiles access" ON user_profiles FOR ALL USING (true);
