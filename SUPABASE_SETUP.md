# Supabase Setup for Global Leaderboard

## Step 1: Create Supabase Account
1. Go to https://supabase.com
2. Sign up for free account
3. Create a new project (choose any name, password, region)

## Step 2: Create Leaderboard Table
1. In your Supabase dashboard, go to **Table Editor**
2. Click **New Table**
3. Name: `leaderboard`
4. Add these columns:
   - `user_id` (text, primary key)
   - `username` (text)
   - `total_points` (int8, default: 0)
   - `streak` (int8, default: 0)
   - `total_predictions` (int8, default: 0)
   - `correct_predictions` (int8, default: 0)
   - `accuracy` (int8, default: 0)
   - `last_updated` (timestamptz, default: now())
5. Click **Save**

## Step 3: Enable Row Level Security (RLS)
1. Go to **Authentication** → **Policies**
2. For the `leaderboard` table, create two policies:

**Policy 1: Enable Read Access**
- Name: `Enable read access for all users`
- Policy command: `SELECT`
- Target roles: `public`
- USING expression: `true`

**Policy 2: Enable Insert/Update Access**
- Name: `Enable insert/update for all users`
- Policy command: `INSERT, UPDATE`
- Target roles: `public`
- WITH CHECK expression: `true`

## Step 4: Get API Credentials
1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (looks like: https://xxxxx.supabase.co)
   - **anon public key** (long string starting with eyJ...)

## Step 5: Update epl-predictor-game.html
Replace the LeaderboardStorage section with the code I'll provide, using your API credentials.

Done! Your leaderboard will now be truly global.
