-- Migration 002: Add Round 4 fields to users table & enable leaderboard read access
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS primary_suspect TEXT,
  ADD COLUMN IF NOT EXISTS primary_motive TEXT,
  ADD COLUMN IF NOT EXISTS secondary_suspect TEXT,
  ADD COLUMN IF NOT EXISTS secondary_motive TEXT,
  ADD COLUMN IF NOT EXISTS round4_motive TEXT,
  ADD COLUMN IF NOT EXISTS round4_method TEXT,
  ADD COLUMN IF NOT EXISTS round4_evidence TEXT[],
  ADD COLUMN IF NOT EXISTS round4_report TEXT,
  ADD COLUMN IF NOT EXISTS round4_score INT DEFAULT 0;

-- Policy to allow leaderboard reading of users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Allow read all users for leaderboard'
  ) THEN
    CREATE POLICY "Allow read all users for leaderboard"
    ON users FOR SELECT
    USING (true);
  END IF;
END $$;
