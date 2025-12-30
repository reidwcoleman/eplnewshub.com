-- App Config Table - Supabase Schema
-- Run this SQL in your Supabase SQL Editor

-- Create app_config table for storing API keys and settings
CREATE TABLE IF NOT EXISTS public.app_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_app_config_key ON public.app_config(key);

-- Enable Row Level Security
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read config (needed for frontend)
DROP POLICY IF EXISTS "Config is readable by everyone" ON public.app_config;
CREATE POLICY "Config is readable by everyone"
ON public.app_config FOR SELECT
TO public
USING (true);

-- Only allow service role to modify config
DROP POLICY IF EXISTS "Only service role can modify config" ON public.app_config;
CREATE POLICY "Only service role can modify config"
ON public.app_config FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Grant read access
GRANT SELECT ON public.app_config TO anon, authenticated;

-- Insert Groq API key (run this separately after table creation)
-- INSERT INTO public.app_config (key, value) VALUES ('groq_api_key', 'your-api-key-here');
