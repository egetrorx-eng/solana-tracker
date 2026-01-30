# Quick Start: Setting Up Your Supabase Database

This guide walks you through setting up the Supabase database for your Solana Smart Money Tracker.

## Step 1: Access Supabase SQL Editor

1. Go to https://supabase.com/dashboard
2. Select your project: `ujhocmveslwehdlcjbtv`
3. Click on **SQL Editor** in the left sidebar

## Step 2: Run the Migration

1. Click **New query** button
2. Copy the entire contents of the file `supabase/migrations/001_create_token_flows.sql`
3. Paste it into the SQL editor
4. Click **Run** button (or press F5)

## Step 3: Verify Table Creation

After running the migration, verify everything was created:

1. Click on **Table Editor** in the left sidebar
2. You should see a new table called `token_flows`
3. Click on it to see the structure

You should see these columns:
- `id` (int8, primary key)
- `symbol` (varchar)
- `mint_address` (varchar)
- `timeframe` (varchar)
- `price_change_pct` (numeric)
- `market_cap` (numeric)
- `smart_wallet_count` (int4)
- `volume` (numeric)
- `liquidity` (numeric)
- `inflows` (numeric)
- `outflows` (numeric)
- `net_flows` (numeric)
- `fetched_at` (timestamp with time zone)

## Step 4: Verify Indexes

1. In the SQL Editor, run this query to check indexes:

```sql
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'token_flows';
```

You should see:
- `token_flows_pkey` (primary key on id)
- `idx_timeframe_netflows` (for fast queries)
- `idx_fetched_at` (for cleanup)

## Step 5: Check Row Level Security

1. In the SQL Editor, run:

```sql
SELECT * FROM pg_policies WHERE tablename = 'token_flows';
```

You should see two policies:
- `Allow anonymous read access` - allows GET requests from frontend
- `Allow service role full access` - allows INSERT/DELETE from backend functions

## That's It!

Your database is now ready. The Netlify Function will start populating data once deployed.

## Troubleshooting

**Error: permission denied for table token_flows**
- Make sure RLS policies were created
- Check that you're using the correct `SUPABASE_ANON_KEY` in your environment variables

**No data showing in table**
- Wait for the scheduled function to run (every 5 minutes after Netlify deployment)
- Check Netlify Functions logs for errors
- Manually trigger the function from Netlify dashboard

**Need to reset the table?**
Run this in SQL Editor:
```sql
DROP TABLE IF EXISTS token_flows CASCADE;
```
Then re-run the migration script.
