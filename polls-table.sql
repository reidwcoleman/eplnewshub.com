-- Create poll_votes table for storing poll votes
-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS poll_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    poll_id TEXT NOT NULL,
    option_id TEXT NOT NULL,
    voted_at TIMESTAMPTZ DEFAULT NOW(),
    voter_ip TEXT
);

-- Create index for faster vote counting
CREATE INDEX IF NOT EXISTS idx_poll_votes_poll_option ON poll_votes(poll_id, option_id);

-- Enable Row Level Security
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert votes (anonymous voting)
CREATE POLICY "Anyone can vote" ON poll_votes
    FOR INSERT
    WITH CHECK (true);

-- Allow anyone to read vote counts
CREATE POLICY "Anyone can read votes" ON poll_votes
    FOR SELECT
    USING (true);
