import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// Valid timeframes supported by the Nansen API
const VALID_TIMEFRAMES = ['1h', '24h', '7d']

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

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const rawTf = (searchParams.get('timeframe') || '1h').toLowerCase()
        const timeframe = VALID_TIMEFRAMES.includes(rawTf) ? rawTf : '1h'

        const supabaseClient = getSupabase()

        // Try Supabase cache first
        if (supabaseClient) {
            try {
                const { data: topTokens, error: topError } = await supabaseClient
                    .from('token_flows')
                    .select('symbol, token_address')
                    .eq('timeframe', timeframe)
                    .order('net_flows', { ascending: false })
                    .order('fetched_at', { ascending: false })
                    .limit(40)

                if (topError) throw topError

                if (topTokens && topTokens.length > 0) {
                    const addresses = Array.from(new Set(topTokens.map(t => t.token_address))).slice(0, 20)

                    const { data: allRows, error: allError } = await supabaseClient
                        .from('token_flows')
                        .select('*')
                        .in('token_address', addresses)
                        .order('fetched_at', { ascending: false })

                    if (allError) throw allError

                    interface MergedToken {
                        symbol: string
                        token_address: string
                        market_cap: number
                        smart_wallets: number
                        flow_1h: number
                        flow_24h: number
                        flow_7d: number
                        net_flows: number
                        inflows: number
                        outflows: number
                        token_age: number
                        token_sectors: string[]
                    }

                    const tokenMap = new Map<string, MergedToken>()

                    allRows?.forEach(row => {
                        const addr = row.token_address
                        if (!tokenMap.has(addr)) {
                            tokenMap.set(addr, {
                                symbol:        row.symbol,
                                token_address: row.token_address,
                                market_cap:    row.market_cap || 0,
                                smart_wallets: row.smart_wallet_count || 0,
                                flow_1h:       0,
                                flow_24h:      0,
                                flow_7d:       0,
                                net_flows:     0,
                                inflows:       0,
                                outflows:      0,
                                token_age:     row.token_age || 0,
                                token_sectors: row.token_sectors || [],
                            })
                        }

                        const t = tokenMap.get(addr)!
                        if (row.timeframe === '1h')  t.flow_1h  = Number(row.net_flows)
                        if (row.timeframe === '24h') t.flow_24h = Number(row.net_flows)
                        if (row.timeframe === '7d')  t.flow_7d  = Number(row.net_flows)

                        if (row.timeframe === timeframe) {
                            t.net_flows = Number(row.net_flows)
                            t.inflows   = Number(row.inflows)
                            t.outflows  = Number(row.outflows)
                        }
                    })

                    const result = Array.from(tokenMap.values())
                        .sort((a, b) => b.net_flows - a.net_flows)
                        .slice(0, 20)

                    return NextResponse.json(result)
                }
            } catch (supaError: unknown) {
                console.warn('Supabase fetch failed, falling back to Nansen API directly. Error:', (supaError as Error).message)
            }
        }

        // ── Direct Nansen API fetch ──────────────────────────────────────────
        const NANSEN_API_KEY = process.env.NANSEN_API_KEY
        if (!NANSEN_API_KEY) return NextResponse.json({ error: 'Nansen API Key Not configured' }, { status: 500 })

        const nansenField = `net_flow_${timeframe}_usd`

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

        const formatted = tokens.map(t => {
            const netFlow = Number((t as unknown as Record<string, number>)[nansenField]) || 0
            return {
                symbol: t.token_symbol,
                token_address: t.token_address,
                market_cap: t.market_cap_usd || 0,
                smart_wallets: t.trader_count || 0,
                flow_1h: t.net_flow_1h_usd || 0,
                flow_24h: t.net_flow_24h_usd || 0,
                flow_7d: t.net_flow_7d_usd || 0,
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
