-- FPL Teams Table - Supabase Schema
-- Run this SQL in your Supabase SQL Editor

-- Create fpl_teams table for storing user FPL team builds
CREATE TABLE IF NOT EXISTS public.fpl_teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    player_ids INTEGER[] NOT NULL DEFAULT '{}',
    team_name TEXT DEFAULT 'My Team',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_fpl_teams_user_id ON public.fpl_teams(user_id);

-- Enable Row Level Security
ALTER TABLE public.fpl_teams ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Allow users to read their own team
DROP POLICY IF EXISTS "Users can view own team" ON public.fpl_teams;
CREATE POLICY "Users can view own team"
ON public.fpl_teams FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to insert their own team
DROP POLICY IF EXISTS "Users can insert own team" ON public.fpl_teams;
CREATE POLICY "Users can insert own team"
ON public.fpl_teams FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own team
DROP POLICY IF EXISTS "Users can update own team" ON public.fpl_teams;
CREATE POLICY "Users can update own team"
ON public.fpl_teams FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own team
DROP POLICY IF EXISTS "Users can delete own team" ON public.fpl_teams;
CREATE POLICY "Users can delete own team"
ON public.fpl_teams FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create trigger to update updated_at on changes
CREATE OR REPLACE FUNCTION public.update_fpl_teams_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_fpl_teams_updated_at ON public.fpl_teams;
CREATE TRIGGER update_fpl_teams_updated_at
    BEFORE UPDATE ON public.fpl_teams
    FOR EACH ROW
    EXECUTE FUNCTION public.update_fpl_teams_updated_at();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fpl_teams TO authenticated;
