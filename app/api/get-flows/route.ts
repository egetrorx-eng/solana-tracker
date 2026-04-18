import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// Valid timeframes accepted by the frontend
const VALID_TIMEFRAMES = ['1h', '24h', '7d', '30d', '5min', '10min', '6h']

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const rawTf        = (searchParams.get('timeframe') || '1h').toLowerCase()
        
        // Map 5min/10min/6h to 1h for the database query since we only store 1h/24h/7d/30d
        let dbTimeframe = rawTf
        if (['5min', '10min', '6h'].includes(dbTimeframe)) dbTimeframe = '1h'
        if (!VALID_TIMEFRAMES.includes(dbTimeframe)) dbTimeframe = '1h'

        const supabaseClient = getSupabase()

        if (supabaseClient) {
            // 1. Get the top 20 tokens for the requested timeframe
            const { data: topTokens, error: topError } = await supabaseClient
                .from('token_flows')
                .select('symbol, token_address')
                .eq('timeframe', dbTimeframe)
                .order('net_flows', { ascending: false })
                .order('fetched_at', { ascending: false })
                .limit(40) // Fetch a bit more to handle deduplication later

            if (topError) throw topError

            if (topTokens && topTokens.length > 0) {
                // Deduplicate addresses
                const addresses = Array.from(new Set(topTokens.map(t => t.token_address))).slice(0, 20)

                // 2. Fetch ALL timeframe rows for these 20 addresses to merge data
                const { data: allRows, error: allError } = await supabaseClient
                    .from('token_flows')
                    .select('*')
                    .in('token_address', addresses)
                    .order('fetched_at', { ascending: false })

                if (allError) throw allError

                // 3. Group and merge
                const tokenMap = new Map<string, TokenData>()
                
                // Process newest rows first (already ordered by fetched_at)
                allRows?.forEach(row => {
                    const addr = row.token_address
                    if (!tokenMap.has(addr)) {
                        tokenMap.set(addr, {
                            symbol:        row.symbol,
                            token_address: row.token_address,
                            price_change:  row.price_change_pct || 0,
                            market_cap:    row.market_cap || 0,
                            smart_wallets: row.smart_wallet_count || 0,
                            volume:        row.volume || 0,
                            liquidity:     row.liquidity || 0,
                            flow_1h:       0,
                            flow_24h:      0,
                            flow_7d:       0,
                            flow_30d:      0,
                            net_flows:     0,
                            inflows:       0,
                            outflows:      0,
                            token_age:     row.token_age || 0,
                            token_sectors: row.token_sectors || [],
                        } as TokenData)
                    }

                    const t = tokenMap.get(addr)!
                    // Set specific timeframe flows
                    if (row.timeframe === '1h')  t.flow_1h  = Number(row.net_flows)
                    if (row.timeframe === '24h') t.flow_24h = Number(row.net_flows)
                    if (row.timeframe === '7d')  t.flow_7d  = Number(row.net_flows)
                    if (row.timeframe === '30d') t.flow_30d = Number(row.net_flows)

                    // Set active net_flows for current view
                    if (row.timeframe === dbTimeframe) {
                        t.net_flows = Number(row.net_flows)
                        t.inflows   = Number(row.inflows)
                        t.outflows  = Number(row.outflows)
                    }
                })

                // Convert back to sorted array based on the requested timeframe's net_flows
                const result = Array.from(tokenMap.values())
                    .sort((a, b) => b.net_flows - a.net_flows)
                    .slice(0, 20)

                return NextResponse.json(result)
            }
        }

        // ── Fallback ─────────────────────────────────────────────────────────
        // (Simplified live fetch if DB is empty, also limited to 20)
        const NANSEN_API_KEY = process.env.NANSEN_API_KEY
        if (!NANSEN_API_KEY) return NextResponse.json({ error: 'Not configured' }, { status: 500 })

        const res = await fetch('https://api.nansen.ai/api/v1/smart-money/netflow', {
            method: 'POST',
            headers: { 'apiKey': NANSEN_API_KEY, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chains: ['solana'],
                pagination: { page: 1, per_page: 20 },
                order_by: [{ direction: 'DESC', field: `net_flow_${dbTimeframe}_usd` }],
            }),
        })

        if (!res.ok) return NextResponse.json({ error: 'Nansen error' }, { status: 502 })
        const json = await res.json()
        const tokens: NansenToken[] = json.data || []

        const formatted = tokens.map(t => ({
            symbol: t.token_symbol,
            token_address: t.token_address,
            price_change: 0, 
            market_cap: t.market_cap_usd || 0,
            smart_wallets: t.trader_count || 0,
            volume: 0,
            liquidity: 0,
            flow_1h: t.net_flow_1h_usd || 0,
            flow_24h: t.net_flow_24h_usd || 0,
            flow_7d: t.net_flow_7d_usd || 0,
            flow_30d: t.net_flow_30d_usd || 0,
            net_flows: Number(t[`net_flow_${dbTimeframe}_usd` as keyof NansenToken]) || 0,
            inflows: Number(t[`net_flow_${dbTimeframe}_usd` as keyof NansenToken]) > 0 ? Number(t[`net_flow_${dbTimeframe}_usd` as keyof NansenToken]) : 0,
            outflows: Number(t[`net_flow_${dbTimeframe}_usd` as keyof NansenToken]) < 0 ? Math.abs(Number(t[`net_flow_${dbTimeframe}_usd` as keyof NansenToken])) : 0,
            token_age: t.token_age_days || 0,
            token_sectors: t.token_sectors || [],
        }))

        return NextResponse.json(formatted)

    } catch (error: unknown) {
        console.error('API Error:', error)
        return NextResponse.json({ error: (error as Error).message }, { status: 500 })
    }
}
