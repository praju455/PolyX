-- PolyX Messaging Schema - Clean Version (Idempotent)
-- This script can be run multiple times without errors
-- Run this SQL in your Supabase SQL Editor

-- ============================================
-- MESSAGES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE
);

-- Drop existing policies if they exist (to make script idempotent)
DROP POLICY IF EXISTS "Users can read their own messages" ON messages;
DROP POLICY IF EXISTS "Users can insert their own messages" ON messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_messages_from ON messages(from_address);
CREATE INDEX IF NOT EXISTS idx_messages_to ON messages(to_address);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_deleted ON messages(deleted);
CREATE INDEX IF NOT EXISTS idx_messages_read ON messages(read_at);

-- Disable RLS for now (using service role key)
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- ============================================
-- BLOCKED USERS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS blocked_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_address TEXT NOT NULL,
  blocked_address TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(blocker_address, blocked_address)
);

CREATE INDEX IF NOT EXISTS idx_blocked_blocker ON blocked_users(blocker_address);
CREATE INDEX IF NOT EXISTS idx_blocked_blocked ON blocked_users(blocked_address);
ALTER TABLE blocked_users DISABLE ROW LEVEL SECURITY;

-- ============================================
-- VERIFICATION
-- ============================================

-- Verify tables were created
SELECT 
  'messages' as table_name, 
  COUNT(*) as row_count 
FROM messages
UNION ALL
SELECT 
  'blocked_users' as table_name, 
  COUNT(*) as row_count 
FROM blocked_users;


