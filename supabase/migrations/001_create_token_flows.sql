-- Create token_flows table
CREATE TABLE IF NOT EXISTS token_flows (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(10) NOT NULL,
  mint_address VARCHAR(44) NOT NULL,
  timeframe VARCHAR(10) NOT NULL,
  price_change_pct DECIMAL(5,2),
  market_cap DECIMAL(15,2),
  smart_wallet_count INTEGER,
  volume DECIMAL(15,2),
  liquidity DECIMAL(15,2),
  inflows DECIMAL(15,2),
  outflows DECIMAL(15,2),
  net_flows DECIMAL(15,2),
  token_age INTEGER,
  token_sectors TEXT[],
  fetched_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for optimized queries
CREATE INDEX IF NOT EXISTS idx_timeframe_netflows 
ON token_flows(timeframe, net_flows DESC, fetched_at DESC);

-- Create index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_fetched_at 
ON token_flows(fetched_at);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE token_flows ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anonymous reads (for the anon key)
CREATE POLICY "Allow anonymous read access" 
ON token_flows FOR SELECT 
USING (true);

-- Create policy to allow service role to insert/delete
CREATE POLICY "Allow service role full access" 
ON token_flows FOR ALL 
USING (true);
