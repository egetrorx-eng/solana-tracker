import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// Valid timeframes accepted by the frontend
const VALID_TIMEFRAMES = ['1h', '24h', '7d', '30d', '5min', '10min', '6h']

interface TokenData {
    symbol: string
    token_address: string
    price_change: number
    market_cap: number
    smart_wallets: number
    volume: number
    liquidity: number
    inflows: number
    outflows: number
    net_flows: number
    flow_1h: number
    flow_24h: number
    flow_7d: number
    flow_30d: number
    token_age?: number
    token_sectors?: string[]
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

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const rawTf        = (searchParams.get('timeframe') || '1h').toLowerCase()
        
        // Map 5min/10min/6h to 1h for the database query since we only store 1h/24h/7d/30d
        let dbTimeframe = rawTf
        if (['5min', '10min', '6h'].includes(dbTimeframe)) dbTimeframe = '1h'
        if (!VALID_TIMEFRAMES.includes(dbTimeframe)) dbTimeframe = '1h'

        const supabaseClient = getSupabase()

        const skipSupabase = ['5min', '10min', '6h'].includes(rawTf)

        if (supabaseClient && !skipSupabase) {
            try {
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
            } catch (supaError: unknown) {
                console.warn('Supabase fetch failed, falling back to Nansen API directly. Error:', (supaError as Error).message)
            }
        }

        // ── Fallback ─────────────────────────────────────────────────────────
        // (Simplified live fetch if DB is empty, also limited to 20)
        const NANSEN_API_KEY = process.env.NANSEN_API_KEY
        if (!NANSEN_API_KEY) return NextResponse.json({ error: 'Nansen API Key Not configured' }, { status: 500 })

        // Use the raw timeframe for Nansen directly (e.g. 5min, 10min) instead of mapping to 1h
        const nansenField = `net_flow_${rawTf}_usd`

        let res;
        try {
            res = await fetch('https://api.nansen.ai/api/v1/smart-money/netflow', {
                method: 'POST',
                headers: { 
                    'apiKey': NANSEN_API_KEY, 
                    'Content-Type': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                body: JSON.stringify({
                    chains: ['solana'],
                    pagination: { page: 1, per_page: 20 },
                    order_by: [{ direction: 'DESC', field: nansenField }],
                }),
            })
        } catch (fetchErr: unknown) {
            console.error('Nansen API fetch failed:', fetchErr)
            const msg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr)
            return NextResponse.json({ error: `Nansen Network Error: ${msg}` }, { status: 500 })
        }

        if (!res.ok) {
            const txt = await res.text().catch(() => '')
            return NextResponse.json({ error: `Nansen HTTP Error ${res.status}: ${txt}` }, { status: res.status })
        }

        const json = await res.json()
        const tokens: NansenToken[] = json.data || []

        // ── DexScreener enrichment ────────────────────────────────────────
        // Fetch price change, volume, and liquidity for the returned tokens
        const addresses = tokens.map(t => t.token_address).filter(Boolean)
        const dexMap = new Map<string, DexPair>()
        const batchSize = 30
        for (let i = 0; i < addresses.length; i += batchSize) {
            const batch = addresses.slice(i, i + batchSize)
            try {
                const dexRes = await fetch(
                    `https://api.dexscreener.com/latest/dex/tokens/${batch.join(',')}`,
                    { signal: AbortSignal.timeout(5000) }
                )
                if (dexRes.ok) {
                    const dexJson = await dexRes.json()
                    const pairs: DexPair[] = dexJson.pairs || []
                    pairs.forEach(pair => {
                        const addr = pair.baseToken.address
                        const existing = dexMap.get(addr)
                        if (!existing || (pair.liquidity?.usd || 0) > (existing.liquidity?.usd || 0)) {
                            dexMap.set(addr, pair)
                        }
                    })
                }
            } catch (dexErr: unknown) {
                console.warn('DexScreener enrichment failed:', (dexErr instanceof Error) ? dexErr.message : String(dexErr))
            }
        }

        // Map timeframe to DexScreener priceChange key
        const dexPriceKey: Record<string, string> = { '1h': 'h1', '24h': 'h24', '7d': 'h24', '30d': 'h24' }
        const priceKey = dexPriceKey[rawTf] || 'h24'

        const formatted = tokens.map(t => {
            const netFlow = Number((t as unknown as Record<string, number>)[nansenField]) || 0
            const dex = dexMap.get(t.token_address)
            return {
                symbol: t.token_symbol,
                token_address: t.token_address,
                price_change: dex?.priceChange?.[priceKey] || 0,
                market_cap: t.market_cap_usd || dex?.fdv || 0,
                smart_wallets: t.trader_count || 0,
                volume: dex?.volume?.[priceKey] || 0,
                liquidity: dex?.liquidity?.usd || 0,
                flow_1h: t.net_flow_1h_usd || 0,
                flow_24h: t.net_flow_24h_usd || 0,
                flow_7d: t.net_flow_7d_usd || 0,
                flow_30d: t.net_flow_30d_usd || 0,
                net_flows: netFlow,
                inflows: netFlow > 0 ? netFlow : 0,
                outflows: netFlow < 0 ? Math.abs(netFlow) : 0,
                token_age: t.token_age_days || 0,
                token_sectors: t.token_sectors || [],
            }
        })

        return NextResponse.json(formatted)

    } catch (error: unknown) {
        console.error('API Error:', error)
        return NextResponse.json({ error: (error as Error).message }, { status: 500 })
    }
}
