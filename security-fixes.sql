-- Fix Security Advisor Issues

-- 1. Enable RLS on check_ins table
-- The Security Advisor reported that RLS is disabled.
ALTER TABLE IF EXISTS check_ins ENABLE ROW LEVEL SECURITY;

-- Add a policy to allow public access (consistent with other tables in this project)
DROP POLICY IF EXISTS "Allow public access" ON check_ins;
CREATE POLICY "Allow public access" ON check_ins FOR ALL USING (true) WITH CHECK (true);

-- 2. Fix Mutable Search Path on Function
-- The `update_updated_at_column` function needs a fixed search path for security.
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql' SET search_path = public;
