# Solana Microcap Smart Money Tracker

A terminal-aesthetic, mobile-responsive dashboard tracking smart money flows on Solana microcap tokens. Built with Next.js 15, Netlify Functions, and Supabase. Powered by Nansen API.

## Features

- **Real-time Data**: Track smart money flows across 7 timeframes (5min, 10min, 30min, 1h, 6h, 12h, 24h)
- **Terminal Aesthetic**: Black background with neon green text and monospace fonts
- **Mobile Responsive**: Optimized for desktop traders with full mobile support
- **9 Key Metrics**: Symbol, price change %, market cap, smart wallets, volume, liquidity, inflows, outflows, net flows
- **Auto-refresh**: Data updates every 30 seconds automatically

## Tech Stack

- **Frontend**: Next.js 15 + TypeScript + TailwindCSS
- **Backend**: Netlify Functions (Serverless)
- **Database**: Supabase (PostgreSQL)
- **API**: Nansen Smart Money API
- **Deployment**: Netlify (auto-deploy from GitHub)

## Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Nansen API key
- Netlify account
- GitHub account

## Local Development Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
NANSEN_API_KEY=your_nansen_api_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Set Up Supabase Database

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run the migration script from `supabase/migrations/001_create_token_flows.sql`

This will create:
- `token_flows` table with all required columns
- Optimized indexes for queries
- Row Level Security policies

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment to Netlify

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin your-repo-url
git push -u origin main
```

### 2. Connect to Netlify

1. Log in to [Netlify](https://netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Connect your GitHub repository
4. Netlify will auto-detect Next.js settings

### 3. Configure Environment Variables

In Netlify dashboard → Site settings → Environment variables, add:

```
NANSEN_API_KEY=your_nansen_api_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Deploy

Netlify will automatically:
- Build your Next.js app
- Deploy the frontend
- Set up the API endpoints at `/api/get-flows`
- Schedule `update-flows` function to run every 5 minutes

## API Endpoints

### GET /api/get-flows

Fetch token flow data for a specific timeframe.

**Query Parameters:**
- `timeframe` (optional): `5min`, `10min`, `30min`, `1h`, `6h`, `12h`, `24h` (default: `5min`)

**Response:**
```json
[
  {
    "symbol": "CRCL",
    "price_change": -0.06,
    "market_cap": 972.00,
    "smart_wallets": 3,
    "volume": 476.34,
    "liquidity": 97.22,
    "inflows": 952.67,
    "outflows": 85.74,
    "net_flows": 666.87
  }
]
```

## Scheduled Functions

The `update-flows` function runs every **5 minutes** (optimized for Netlify personal plan) to:

1. Fetch Solana microcap tokens from Nansen API
2. Calculate metrics for all 7 timeframes
3. Insert data into Supabase
4. Clean up data older than 24 hours

## Mobile Responsiveness

- **Desktop (>1024px)**: Full table, all columns visible
- **Tablet (768px-1024px)**: Horizontal scroll, sticky SYMBOL column
- **Mobile (<768px)**: Horizontal scroll, sticky SYMBOL column, touch-friendly buttons (44px min)

## Project Structure

```
nansen/
├── app/
│   ├── page.tsx          # Main dashboard
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Global styles
├── netlify/functions/
│   ├── get-flows.ts      # API endpoint
│   └── update-flows.ts   # Scheduled data fetcher
├── lib/
│   ├── supabase.ts       # Supabase client
│   └── types.ts          # TypeScript types
├── supabase/migrations/
│   └── 001_create_token_flows.sql
├── netlify.toml          # Netlify config
└── package.json
```

## Customization

### Adjust Refresh Interval

Frontend auto-refresh (in `app/page.tsx`):
```typescript
const interval = setInterval(fetchData, 30000) // 30 seconds
```

Backend scheduled function (in `netlify.toml`):
```toml
schedule = "*/5 * * * *"  # Every 5 minutes
```

### Change Color Theme

Edit `tailwind.config.ts` to customize the terminal colors.

## Troubleshooting

### Data not loading?

1. Check Supabase connection in browser console
2. Verify environment variables are set in Netlify
3. Check Netlify Functions logs for errors

### Nansen API errors?

The app includes mock data fallback for development. Update the Nansen API endpoint in `netlify/functions/update-flows.ts` with the correct endpoint for your use case.

### Build fails?

Make sure you have Node.js 18+ installed and all dependencies are installed via `npm install`.

## License

MIT

## Support

For issues related to:
- **Nansen API**: Contact Nansen support
- **Supabase**: Check Supabase documentation
- **Netlify**: Check Netlify documentation
