-- Fix missing INSERT policy for profiles table
-- This allows users to create their own profile when syncing from Clerk

-- Drop existing policies if they exist (optional, for clean setup)
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create INSERT policy for profiles
CREATE POLICY "Users can insert own profile" 
  ON profiles 
  FOR INSERT 
  WITH CHECK (true);

-- Note: If you're using this in production, you might want to add more restrictive checks
-- For example: WITH CHECK (id = current_setting('request.jwt.claims', true)::json->>'sub')

