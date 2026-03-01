-- PolyX Followers/Following Schema
-- Run this SQL in your Supabase SQL Editor to create the followers table
-- This script is idempotent - safe to run multiple times

-- ============================================
-- FOLLOWERS TABLE
-- ============================================

-- Drop existing table if you want to start fresh (optional - comment out if you want to keep data)
-- DROP TABLE IF EXISTS followers CASCADE;

CREATE TABLE IF NOT EXISTS followers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_address TEXT NOT NULL,
  following_address TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_address, following_address)
);

-- Create indexes (idempotent with IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_followers_follower ON followers(follower_address);
CREATE INDEX IF NOT EXISTS idx_followers_following ON followers(following_address);
CREATE INDEX IF NOT EXISTS idx_followers_created ON followers(created_at DESC);

-- Disable RLS for now (using service role key)
-- This is idempotent - safe to run multiple times
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables WHERE tablename = 'followers'
  ) THEN
    ALTER TABLE followers DISABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- ============================================
-- VERIFICATION
-- ============================================

-- Verify table was created
SELECT 
  'followers' as table_name, 
  COUNT(*) as row_count 
FROM followers;

