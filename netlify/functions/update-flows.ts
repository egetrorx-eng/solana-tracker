import type { Config } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'

// ── Supabase ──────────────────────────────────────────────────────────────────
const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
)

const NANSEN_API_KEY = process.env.NANSEN_API_KEY!

// Nansen netflow fields for each timeframe
const TIMEFRAMES: Record<string, string> = {
    '1h':  'net_flow_1h_usd',
    '24h': 'net_flow_24h_usd',
    '7d':  'net_flow_7d_usd',
    '30d': 'net_flow_30d_usd',
}

// DexScreener price-change key per timeframe
const DEX_KEY: Record<string, string> = {
    '1h':  'h1',
    '24h': 'h24',
    '7d':  'h24',
    '30d': 'h24',
}

interface NansenToken {
    token_address:    string
    token_symbol:     string
    net_flow_1h_usd:  number
    net_flow_24h_usd: number
    net_flow_7d_usd:  number
    net_flow_30d_usd: number
    chain:            string
    token_sectors:    string[]
    trader_count:     number
    token_age_days:   number
    market_cap_usd:   number
}

interface DexPair {
    baseToken:   { address: string; symbol: string }
    priceChange: Record<string, number>
    volume:      Record<string, number>
    liquidity:   { usd: number }
    fdv:         number
}

// ── Main handler ──────────────────────────────────────────────────────────────
export default async function handler() {
    console.log('[update-flows] Starting scheduled data refresh…')

    if (!NANSEN_API_KEY || !process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
        console.error('[update-flows] Missing required environment variables')
        return
    }

    try {
        // 1. Fetch from Nansen — order by 24h net flow by default
        const nansenRes = await fetch('https://api.nansen.ai/api/v1/smart-money/netflow', {
            method: 'POST',
            headers: {
                'apiKey': NANSEN_API_KEY,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chains:     ['solana'],
                pagination: { page: 1, per_page: 100 },
                order_by:   [{ direction: 'DESC', field: 'net_flow_24h_usd' }],
            }),
        })

        if (!nansenRes.ok) {
            const txt = await nansenRes.text()
            console.error(`[update-flows] Nansen error ${nansenRes.status}: ${txt}`)
            return
        }

        const nansenJson  = await nansenRes.json()
        const tokens: NansenToken[] = nansenJson.data || []
        if (tokens.length === 0) {
            console.log('[update-flows] Nansen returned 0 tokens — nothing to store')
            return
        }

        console.log(`[update-flows] Fetched ${tokens.length} tokens from Nansen`)

        // 2. Enrich with DexScreener (price, volume, liquidity)
        const addresses = tokens.map(t => t.token_address).filter(Boolean)
        const dexMap    = new Map<string, DexPair>()

        const batchSize = 30
        for (let i = 0; i < addresses.length; i += batchSize) {
            const batch = addresses.slice(i, i + batchSize)
            try {
                const dexRes = await fetch(
                    `https://api.dexscreener.com/latest/dex/tokens/${batch.join(',')}`
                )
                if (dexRes.ok) {
                    const dexJson = await dexRes.json()
                    const pairs: DexPair[] = dexJson.pairs || []
                    pairs.forEach(pair => {
                        const addr     = pair.baseToken.address
                        const existing = dexMap.get(addr)
                        if (!existing || (pair.liquidity?.usd || 0) > (existing.liquidity?.usd || 0)) {
                            dexMap.set(addr, pair)
                        }
                    })
                }
            } catch (e) {
                console.error('[update-flows] DexScreener batch error:', e)
            }
        }

        // 3. Build rows — one per timeframe per token
        const rows: Record<string, unknown>[] = []
        const now = new Date().toISOString()

        for (const token of tokens) {
            const dex = dexMap.get(token.token_address)

            for (const [tf, flowField] of Object.entries(TIMEFRAMES)) {
                const dexKey  = DEX_KEY[tf] || 'h24'
                const netFlow = (token as unknown as Record<string, number>)[flowField] || 0

                rows.push({
                    symbol:             token.token_symbol,
                    token_address:      token.token_address,
                    timeframe:          tf,
                    price_change_pct:   dex?.priceChange?.[dexKey] || 0,
                    market_cap:         token.market_cap_usd || dex?.fdv || 0,
                    smart_wallet_count: token.trader_count   || 0,
                    volume:             dex?.volume?.[dexKey] || 0,
                    liquidity:          dex?.liquidity?.usd  || 0,
                    inflows:            netFlow > 0 ? netFlow           : 0,
                    outflows:           netFlow < 0 ? Math.abs(netFlow) : 0,
                    net_flows:          netFlow,
                    token_age:          token.token_age_days  || 0,
                    token_sectors:      token.token_sectors   || [],
                    fetched_at:         now,
                })
            }
        }

        // 4. Upsert into Supabase in batches of 200
        console.log(`[update-flows] Upserting ${rows.length} rows into Supabase…`)
        for (let i = 0; i < rows.length; i += 200) {
            const batch = rows.slice(i, i + 200)
            const { error } = await supabase.from('token_flows').insert(batch)
            if (error) {
                console.error('[update-flows] Supabase insert error:', error.message)
            }
        }

        // 5. Clean up rows older than 24 hours
        const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        const { error: delError } = await supabase
            .from('token_flows')
            .delete()
            .lt('fetched_at', cutoff)

        if (delError) {
            console.error('[update-flows] Cleanup error:', delError.message)
        } else {
            console.log('[update-flows] Old rows cleaned up')
        }

        console.log('[update-flows] Refresh complete ✓')
    } catch (err) {
        console.error('[update-flows] Unexpected error:', err)
    }
}

// ── Netlify schedule config ───────────────────────────────────────────────────
export const config: Config = {
    schedule: '* * * * *',   // every minute
}
