# Supabase Setup Instructions

## Required Tables

This application requires two Supabase tables:

1. **messages** - For direct messaging between users
2. **blocked_users** - For blocking functionality
3. **followers** - For storing follow relationships (NEW)

## Setup Steps

### 1. Messages and Blocked Users Tables

Run the SQL script in your Supabase SQL Editor:
- `backend/supabase-schema-clean.sql` (recommended - fully idempotent)
- OR `backend/supabase-schema.sql` (if you need to fix policies)

### 2. Followers Table (NEW - Required for Follow/Unfollow Features)

Run this SQL script in your Supabase SQL Editor:
- `backend/supabase-followers-schema.sql`

This will create the `followers` table with:
- `follower_address` - The address of the user who is following
- `following_address` - The address of the user being followed
- Unique constraint on (follower_address, following_address)
- Indexes for fast queries

## Verification

After running the SQL scripts, verify the tables exist:

```sql
-- Check all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('messages', 'blocked_users', 'followers');

-- Check followers table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'followers';

-- Check row count
SELECT COUNT(*) FROM followers;
```

## Troubleshooting

If you see errors like:
- `relation "followers" does not exist`
- `table "followers" does not exist`

**Solution:** Run `backend/supabase-followers-schema.sql` in your Supabase SQL Editor.

The backend will gracefully handle missing tables by:
- Logging a warning message
- Falling back to on-chain data
- Returning empty arrays instead of errors

## Environment Variables

Make sure your `backend/.env` file has:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

