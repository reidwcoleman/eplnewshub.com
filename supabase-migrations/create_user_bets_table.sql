-- Create user_bets table for storing predictor game bets
CREATE TABLE IF NOT EXISTS user_bets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    match_id TEXT NOT NULL,
    match_date TIMESTAMPTZ NOT NULL,
    home_team TEXT NOT NULL,
    away_team TEXT NOT NULL,
    bet_type TEXT NOT NULL CHECK (bet_type IN ('home', 'draw', 'away')),
    stake INTEGER NOT NULL CHECK (stake > 0),
    odds DECIMAL(5,2) NOT NULL CHECK (odds > 1),
    potential_win INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost')),
    payout INTEGER DEFAULT 0,
    settled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_bets_user_id ON user_bets(user_id);
CREATE INDEX IF NOT EXISTS idx_user_bets_status ON user_bets(status);
CREATE INDEX IF NOT EXISTS idx_user_bets_match_id ON user_bets(match_id);

-- Enable Row Level Security
ALTER TABLE user_bets ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own bets
CREATE POLICY "Users can view own bets" ON user_bets
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own bets
CREATE POLICY "Users can insert own bets" ON user_bets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own bets (for settlement)
CREATE POLICY "Users can update own bets" ON user_bets
    FOR UPDATE USING (auth.uid() = user_id);

-- Add new columns to user_wallets if they don't exist
ALTER TABLE user_wallets ADD COLUMN IF NOT EXISTS last_daily_bonus DATE;
ALTER TABLE user_wallets ADD COLUMN IF NOT EXISTS daily_bonus_day INTEGER DEFAULT 0;
ALTER TABLE user_wallets ADD COLUMN IF NOT EXISTS lifetime_winnings INTEGER DEFAULT 0;
ALTER TABLE user_wallets ADD COLUMN IF NOT EXISTS total_bets INTEGER DEFAULT 0;
ALTER TABLE user_wallets ADD COLUMN IF NOT EXISTS won_bets INTEGER DEFAULT 0;
ALTER TABLE user_wallets ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0;
ALTER TABLE user_wallets ADD COLUMN IF NOT EXISTS best_streak INTEGER DEFAULT 0;
