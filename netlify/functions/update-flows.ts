import { Handler, schedule } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'

const NANSEN_API_KEY = process.env.NANSEN_API_KEY || ''
const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

const myHandler: Handler = async () => {
    console.log('Starting scheduled update-flows function...')

    if (!NANSEN_API_KEY) {
        return { statusCode: 500, body: JSON.stringify({ error: 'NANSEN_API_KEY not set' }) }
    }

    try {
        // Fetch from Nansen Smart Money Netflow API
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
                    order_by: [{ direction: 'DESC', field: 'net_flow_24h_usd' }],
                }),
            }
        )

        if (!nansenResponse.ok) {
            const errorText = await nansenResponse.text()
            throw new Error(`Nansen API error (${nansenResponse.status}): ${errorText}`)
        }

        const json = await nansenResponse.json()
        const nansenTokens = json.data || []
        console.log(`Fetched ${nansenTokens.length} tokens from Nansen`)

        // Enrich with DexScreener data
        const addresses = nansenTokens.map((t: any) => t.token_address).filter(Boolean)
        const dexMap = new Map()

        if (addresses.length > 0) {
            try {
                const batchSize = 30
                for (let i = 0; i < addresses.length; i += batchSize) {
                    const batch = addresses.slice(i, i + batchSize)
                    const dexResponse = await fetch(
                        `https://api.dexscreener.com/latest/dex/tokens/${batch.join(',')}`
                    )
                    if (dexResponse.ok) {
                        const dexJson: any = await dexResponse.json()
                        const dexPairs = dexJson.pairs || []
                        dexPairs.forEach((pair: any) => {
                            const existing = dexMap.get(pair.baseToken.address)
                            if (!existing || (pair.liquidity?.usd || 0) > (existing.liquidity?.usd || 0)) {
                                dexMap.set(pair.baseToken.address, pair)
                            }
                        })
                    }
                }
            } catch (e) {
                console.error('DexScreener enrich error:', e)
            }
        }

        // Detect existing DB columns
        const { data: sampleData } = await supabase.from('token_flows').select('*').limit(1)
        const existingColumns = sampleData && sampleData[0] ? Object.keys(sampleData[0]) : ['symbol', 'mint_address', 'timeframe', 'price_change_pct', 'market_cap', 'smart_wallet_count', 'volume', 'liquidity', 'inflows', 'outflows', 'net_flows', 'fetched_at']
        const addrCol = existingColumns.includes('token_address') ? 'token_address' : 'mint_address'

        const dbTimeframes = [
            { db: '5min', dexKey: 'm5', nansenFlowKey: 'net_flow_1h_usd' },
            { db: '10min', dexKey: 'm5', nansenFlowKey: 'net_flow_1h_usd' },
            { db: '30min', dexKey: 'h1', nansenFlowKey: 'net_flow_1h_usd' },
            { db: '1h', dexKey: 'h1', nansenFlowKey: 'net_flow_1h_usd' },
            { db: '6h', dexKey: 'h6', nansenFlowKey: 'net_flow_24h_usd' },
            { db: '12h', dexKey: 'h6', nansenFlowKey: 'net_flow_24h_usd' },
            { db: '24h', dexKey: 'h24', nansenFlowKey: 'net_flow_24h_usd' },
        ]

        // Delete-then-insert per timeframe (no unique constraint needed)
        for (const map of dbTimeframes) {
            await supabase.from('token_flows').delete().eq('timeframe', map.db)

            const rows = nansenTokens.map((token: any) => {
                const dexData = dexMap.get(token.token_address)
                const netFlow = token[map.nansenFlowKey] || 0
                const volumeValue = dexData?.volume?.[map.dexKey] || 0

                const row: any = {
                    symbol: (token.token_symbol || '').substring(0, 10),
                    [addrCol]: token.token_address,
                    timeframe: map.db,
                    price_change_pct: dexData?.priceChange?.[map.dexKey] || 0,
                    market_cap: token.market_cap_usd || dexData?.fdv || 0,
                    smart_wallet_count: token.trader_count || 0,
                    volume: volumeValue,
                    liquidity: dexData?.liquidity?.usd || 0,
                    inflows: netFlow > 0 ? netFlow : 0,
                    outflows: netFlow < 0 ? Math.abs(netFlow) : 0,
                    net_flows: netFlow,
                    fetched_at: new Date().toISOString(),
                }
                if (existingColumns.includes('token_age')) row.token_age = token.token_age_days || 0
                if (existingColumns.includes('token_sectors')) row.token_sectors = token.token_sectors || []
                return row
            })

            const { error } = await supabase.from('token_flows').insert(rows)
            if (error) {
                console.error(`Error inserting ${map.db}:`, error.message)
            }
        }

        console.log('Update-flows completed successfully')
        return {
            statusCode: 200,
            body: JSON.stringify({ message: `Updated ${nansenTokens.length} tokens` }),
        }
    } catch (error) {
        console.error('Error in update-flows:', error)
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to update data' }),
        }
    }
}

export const handler = schedule('*/5 * * * *', myHandler)
