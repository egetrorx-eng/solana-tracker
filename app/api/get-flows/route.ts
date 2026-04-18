import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// Valid timeframes accepted by the frontend
const VALID_TIMEFRAMES = ['1h', '24h', '7d', '30d']

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const rawTf        = (searchParams.get('timeframe') || '1h').toLowerCase()
        const timeframe    = VALID_TIMEFRAMES.includes(rawTf) ? rawTf : '1h'

        // Check if Supabase is configured
        const supabaseClient = getSupabase()

        if (supabaseClient) {
            // ── Path A: serve from Supabase cache ──────────────────────────
            // Get the most recent batch of data for this timeframe
            const { data, error } = await supabaseClient
                .from('token_flows')
                .select('*')
                .eq('timeframe', timeframe)
                .order('net_flows', { ascending: false })
                .order('fetched_at', { ascending: false })
                .limit(50)

            if (error) {
                console.error('Supabase query error:', error.message)
                return NextResponse.json(
                    { error: 'Database query failed' },
                    { status: 500 }
                )
            }

            if (data && data.length > 0) {
                // Keep only the latest fetch batch — drop older duplicate symbols
                const latest  = data[0].fetched_at
                const freshMS = new Date(latest).getTime()
                const cutMS   = freshMS - 10 * 60 * 1000 // allow ±10 min window

                const deduplicated = new Map<string, typeof data[0]>()
                data
                    .filter(row => new Date(row.fetched_at).getTime() >= cutMS)
                    .forEach(row => {
                        if (!deduplicated.has(row.symbol)) {
                            deduplicated.set(row.symbol, row)
                        }
                    })

                const result = Array.from(deduplicated.values()).map(row => ({
                    symbol:        row.symbol,
                    token_address: row.token_address,
                    price_change:  row.price_change_pct  || 0,
                    market_cap:    row.market_cap         || 0,
                    smart_wallets: row.smart_wallet_count || 0,
                    volume:        row.volume             || 0,
                    liquidity:     row.liquidity          || 0,
                    inflows:       row.inflows            || 0,
                    outflows:      row.outflows           || 0,
                    net_flows:     row.net_flows          || 0,
                    // Expose all four flow columns (fill from net_flows if missing)
                    flow_1h:       timeframe === '1h'  ? row.net_flows : 0,
                    flow_24h:      timeframe === '24h' ? row.net_flows : 0,
                    flow_7d:       timeframe === '7d'  ? row.net_flows : 0,
                    flow_30d:      timeframe === '30d' ? row.net_flows : 0,
                    token_age:     row.token_age        || 0,
                    token_sectors: row.token_sectors    || [],
                }))

                return NextResponse.json(result)
            }
            // Fall through to live API if Supabase is empty (first run)
        }

        // ── Path B: live Nansen fetch (fallback / no Supabase) ─────────────
        const NANSEN_API_KEY = process.env.NANSEN_API_KEY || ''
        if (!NANSEN_API_KEY) {
            return NextResponse.json(
                { error: 'NANSEN_API_KEY not configured' },
                { status: 500 }
            )
        }

        const FLOW_FIELD: Record<string, string> = {
            '1h':  'net_flow_1h_usd',
            '24h': 'net_flow_24h_usd',
            '7d':  'net_flow_7d_usd',
            '30d': 'net_flow_30d_usd',
        }
        const DEX_KEY: Record<string, string> = {
            '1h': 'h1', '24h': 'h24', '7d': 'h24', '30d': 'h24',
        }

        const nansenFlowField = FLOW_FIELD[timeframe] || 'net_flow_24h_usd'

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

        const nansenResponse = await fetch(
            'https://api.nansen.ai/api/v1/smart-money/netflow',
            {
                method:  'POST',
                headers: { 'apiKey': NANSEN_API_KEY, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chains:     ['solana'],
                    pagination: { page: 1, per_page: 50 },
                    order_by:   [{ direction: 'DESC', field: nansenFlowField }],
                }),
            }
        )

        if (!nansenResponse.ok) {
            const errorText = await nansenResponse.text()
            console.error(`Nansen API error (${nansenResponse.status}): ${errorText}`)
            return NextResponse.json(
                { error: `Nansen API error: ${nansenResponse.status}` },
                { status: 502 }
            )
        }

        const nansenJson                = await nansenResponse.json()
        const nansenTokens: NansenToken[] = nansenJson.data || []

        if (nansenTokens.length === 0) {
            return NextResponse.json([])
        }

        // Enrich with DexScreener
        const addresses = nansenTokens.map(t => t.token_address).filter(Boolean)
        const dexMap    = new Map<string, DexPair>()

        for (let i = 0; i < addresses.length; i += 30) {
            try {
                const batch  = addresses.slice(i, i + 30)
                const dexRes = await fetch(
                    `https://api.dexscreener.com/latest/dex/tokens/${batch.join(',')}`
                )
                if (dexRes.ok) {
                    const dexJson   = await dexRes.json()
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
                console.error('DexScreener error:', e)
            }
        }

        const dexKey = DEX_KEY[timeframe] || 'h24'

        const formattedData = nansenTokens.map(token => {
            const dex     = dexMap.get(token.token_address)
            const netFlow = (token as unknown as Record<string, number>)[nansenFlowField] || 0

            return {
                symbol:        token.token_symbol,
                token_address: token.token_address,
                price_change:  dex?.priceChange?.[dexKey]  || 0,
                market_cap:    token.market_cap_usd || dex?.fdv || 0,
                smart_wallets: token.trader_count    || 0,
                volume:        dex?.volume?.[dexKey] || 0,
                liquidity:     dex?.liquidity?.usd   || 0,
                flow_1h:       token.net_flow_1h_usd  || 0,
                flow_24h:      token.net_flow_24h_usd || 0,
                flow_7d:       token.net_flow_7d_usd  || 0,
                flow_30d:      token.net_flow_30d_usd || 0,
                net_flows:     netFlow,
                inflows:       netFlow > 0 ? netFlow           : 0,
                outflows:      netFlow < 0 ? Math.abs(netFlow) : 0,
                token_age:     token.token_age_days   || 0,
                token_sectors: token.token_sectors    || [],
            }
        })

        return NextResponse.json(formattedData)

    } catch (error: unknown) {
        console.error('Error in get-flows:', error)
        return NextResponse.json(
            { error: (error as Error).message || 'Failed to fetch data' },
            { status: 500 }
        )
    }
}
