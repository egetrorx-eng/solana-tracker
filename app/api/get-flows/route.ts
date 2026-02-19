import { NextRequest, NextResponse } from 'next/server'

const NANSEN_API_KEY = process.env.NANSEN_API_KEY || ''

// Map UI timeframes to Nansen netflow fields
const TIMEFRAME_FLOW_FIELD: Record<string, string> = {
    '1h': 'net_flow_1h_usd',
    '24h': 'net_flow_24h_usd',
    '7d': 'net_flow_7d_usd',
    '30d': 'net_flow_30d_usd',
}

// Map UI timeframes to DexScreener price change keys
const TIMEFRAME_DEX_KEY: Record<string, string> = {
    '1h': 'h1',
    '24h': 'h24',
    '7d': 'h24', // DexScreener doesn't have 7d price change
    '30d': 'h24',
}

interface NansenToken {
    token_address: string
    token_symbol: string
    net_flow_1h_usd: number
    net_flow_24h_usd: number
    net_flow_7d_usd: number
    net_flow_30d_usd: number
    chain: string
    token_sectors: string[]
    trader_count: number
    token_age_days: number
    market_cap_usd: number
}

interface DexPair {
    baseToken: { address: string; symbol: string }
    priceChange: Record<string, number>
    volume: Record<string, number>
    liquidity: { usd: number }
    fdv: number
}

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const timeframe = (searchParams.get('timeframe') || '1h').toLowerCase()

        if (!NANSEN_API_KEY) {
            return NextResponse.json(
                { error: 'NANSEN_API_KEY not configured' },
                { status: 500 }
            )
        }

        // 1. Fetch from Nansen Smart Money Netflow API
        const nansenFlowField = TIMEFRAME_FLOW_FIELD[timeframe] || 'net_flow_24h_usd'

        const nansenResponse = await fetch(
            'https://api.nansen.ai/api/v1/smart-money/netflow',
            {
                method: 'POST',
                headers: {
                    'apiKey': NANSEN_API_KEY,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chains: ['solana'],
                    pagination: { page: 1, per_page: 50 },
                    order_by: [{ direction: 'DESC', field: nansenFlowField }],
                }),
                next: { revalidate: 30 },
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

        const nansenJson = await nansenResponse.json()
        const nansenTokens: NansenToken[] = nansenJson.data || []

        if (nansenTokens.length === 0) {
            return NextResponse.json([])
        }

        // 2. Enrich with DexScreener data
        const addresses = nansenTokens.map(t => t.token_address).filter(Boolean)
        const dexMap = new Map<string, DexPair>()

        if (addresses.length > 0) {
            try {
                const batchSize = 30
                for (let i = 0; i < addresses.length; i += batchSize) {
                    const batch = addresses.slice(i, i + batchSize)
                    const dexResponse = await fetch(
                        `https://api.dexscreener.com/latest/dex/tokens/${batch.join(',')}`,
                        { next: { revalidate: 30 } }
                    )
                    if (dexResponse.ok) {
                        const dexJson = await dexResponse.json()
                        const pairs: DexPair[] = dexJson.pairs || []
                        pairs.forEach(pair => {
                            const addr = pair.baseToken.address
                            const existing = dexMap.get(addr)
                            if (!existing || (pair.liquidity?.usd || 0) > (existing.liquidity?.usd || 0)) {
                                dexMap.set(addr, pair)
                            }
                        })
                    }
                }
            } catch (e) {
                console.error('DexScreener error:', e)
            }
        }

        // 3. Format for frontend — include ALL 4 Nansen flow fields
        const dexKey = TIMEFRAME_DEX_KEY[timeframe] || 'h24'

        const formattedData = nansenTokens.map(token => {
            const dex = dexMap.get(token.token_address)

            // Look up the flow for the selected timeframe
            const flowByField: Record<string, number> = {
                'net_flow_1h_usd': token.net_flow_1h_usd || 0,
                'net_flow_24h_usd': token.net_flow_24h_usd || 0,
                'net_flow_7d_usd': token.net_flow_7d_usd || 0,
                'net_flow_30d_usd': token.net_flow_30d_usd || 0,
            }
            const netFlow = flowByField[nansenFlowField] || 0

            return {
                symbol: token.token_symbol,
                token_address: token.token_address,
                price_change: dex?.priceChange?.[dexKey] || 0,
                market_cap: token.market_cap_usd || dex?.fdv || 0,
                smart_wallets: token.trader_count || 0,
                volume: dex?.volume?.[dexKey] || 0,
                liquidity: dex?.liquidity?.usd || 0,
                // All 4 Nansen flow fields
                flow_1h: token.net_flow_1h_usd || 0,
                flow_24h: token.net_flow_24h_usd || 0,
                flow_7d: token.net_flow_7d_usd || 0,
                flow_30d: token.net_flow_30d_usd || 0,
                // Net flows for the selected timeframe
                net_flows: netFlow,
                inflows: netFlow > 0 ? netFlow : 0,
                outflows: netFlow < 0 ? Math.abs(netFlow) : 0,
                token_age: token.token_age_days || 0,
                token_sectors: token.token_sectors || [],
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
