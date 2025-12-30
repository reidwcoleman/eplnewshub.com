-- EPL Betting Game - Supabase Schema
-- Run this SQL in your Supabase SQL Editor

-- 1. Create user_profiles table for storing display names
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON public.user_profiles(username);

-- 2. Ensure user_wallets table has all needed columns
-- (Add columns if they don't exist - won't error if they do)
DO $$
BEGIN
    -- Add columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_wallets' AND column_name = 'lifetime_winnings') THEN
        ALTER TABLE public.user_wallets ADD COLUMN lifetime_winnings INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_wallets' AND column_name = 'total_bets') THEN
        ALTER TABLE public.user_wallets ADD COLUMN total_bets INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_wallets' AND column_name = 'won_bets') THEN
        ALTER TABLE public.user_wallets ADD COLUMN won_bets INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_wallets' AND column_name = 'lost_bets') THEN
        ALTER TABLE public.user_wallets ADD COLUMN lost_bets INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_wallets' AND column_name = 'current_streak') THEN
        ALTER TABLE public.user_wallets ADD COLUMN current_streak INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_wallets' AND column_name = 'best_streak') THEN
        ALTER TABLE public.user_wallets ADD COLUMN best_streak INTEGER DEFAULT 0;
    END IF;
END $$;

-- 3. Create the betting_leaderboard view
DROP VIEW IF EXISTS public.betting_leaderboard;

CREATE VIEW public.betting_leaderboard AS
SELECT
    w.user_id,
    COALESCE(p.username, 'Anonymous') as username,
    p.avatar_url,
    w.coins,
    w.lifetime_winnings as profit,
    w.total_bets,
    w.won_bets,
    w.lost_bets,
    w.current_streak,
    w.best_streak,
    CASE
        WHEN w.total_bets > 0 THEN ROUND((w.won_bets::NUMERIC / w.total_bets::NUMERIC) * 100, 1)
        ELSE 0
    END as win_rate,
    w.updated_at
FROM public.user_wallets w
LEFT JOIN public.user_profiles p ON w.user_id = p.user_id
WHERE w.total_bets > 0  -- Only show users who have placed at least one bet
ORDER BY w.lifetime_winnings DESC, w.won_bets DESC;

-- 4. Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies for user_profiles

-- Allow anyone to read profiles (for leaderboard)
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.user_profiles;
CREATE POLICY "Profiles are viewable by everyone"
ON public.user_profiles FOR SELECT
TO public
USING (true);

-- Allow users to insert their own profile
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
CREATE POLICY "Users can insert own profile"
ON public.user_profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile"
ON public.user_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 6. Grant access to the view
GRANT SELECT ON public.betting_leaderboard TO anon, authenticated;

-- 7. Create function to get or create user profile
CREATE OR REPLACE FUNCTION public.get_or_create_profile(
    p_user_id UUID,
    p_username TEXT DEFAULT NULL
) RETURNS TABLE (
    id UUID,
    user_id UUID,
    username TEXT,
    is_new BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_profile RECORD;
    v_is_new BOOLEAN := false;
BEGIN
    -- Try to get existing profile
    SELECT * INTO v_profile FROM public.user_profiles WHERE user_profiles.user_id = p_user_id;

    IF v_profile IS NULL THEN
        -- Create new profile with provided username or generate one
        INSERT INTO public.user_profiles (user_id, username)
        VALUES (
            p_user_id,
            COALESCE(p_username, 'Player_' || SUBSTRING(p_user_id::TEXT, 1, 8))
        )
        RETURNING * INTO v_profile;
        v_is_new := true;
    END IF;

    RETURN QUERY SELECT v_profile.id, v_profile.user_id, v_profile.username, v_is_new;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.get_or_create_profile TO authenticated;

-- 8. Create trigger to update user_wallets.updated_at on changes
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_wallets_updated_at ON public.user_wallets;
CREATE TRIGGER update_user_wallets_updated_at
    BEFORE UPDATE ON public.user_wallets
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 9. Add combo betting columns to user_bets table
DO $$
BEGIN
    -- Add combo_id column for linking bets in a combo
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_bets' AND column_name = 'combo_id') THEN
        ALTER TABLE public.user_bets ADD COLUMN combo_id TEXT;
    END IF;

    -- Add combo_odds column for storing the combined odds
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_bets' AND column_name = 'combo_odds') THEN
        ALTER TABLE public.user_bets ADD COLUMN combo_odds DECIMAL(10,2);
    END IF;

    -- Add combo_size column for storing how many bets are in the combo
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_bets' AND column_name = 'combo_size') THEN
        ALTER TABLE public.user_bets ADD COLUMN combo_size INTEGER;
    END IF;
END $$;

-- Create index for combo lookups
CREATE INDEX IF NOT EXISTS idx_user_bets_combo_id ON public.user_bets(combo_id);

-- Done! Your betting leaderboard is now set up.
