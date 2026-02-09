import { Handler, schedule } from '@netlify/functions'
import { supabase } from '../../lib/supabase'

const NANSEN_API_KEY = process.env.NANSEN_API_KEY || ''
const TIMEFRAMES = ['5min', '10min', '30min', '1h', '6h', '12h', '24h']

interface NansenToken {
    symbol: string
    mintAddress: string
    marketCap: number
    price24hChange?: number
    volume?: number
    liquidity?: number
    smartMoneyInflows?: number
    smartMoneyOutflows?: number
    smartWalletCount?: number
}

// This function would fetch data from Nansen API
async function fetchNansenData(timeframe: string): Promise<NansenToken[]> {
    // This function is no longer used in the updated handler, but keeping its signature for now.
    // The actual fetching and upsert logic is moved directly into the handler.
    return []
}

// Generate mock data for development/testing
function generateMockData(timeframe: string): NansenToken[] {
    const symbols = ['CRCL', 'SIGN', 'BONK', 'WIF', 'MYRO', 'POPCAT', 'MEW', 'PONKE', 'SAMO', 'FOXY']

    return symbols.map((symbol, idx) => ({
        symbol,
        mintAddress: `${symbol}${Math.random().toString(36).substring(2, 15)}mint`,
        marketCap: Math.random() * 5000000,
        price24hChange: (Math.random() - 0.5) * 20,
        volume: Math.random() * 1000000,
        liquidity: Math.random() * 500000,
        smartMoneyInflows: Math.random() * 100000,
        smartMoneyOutflows: Math.random() * 80000,
        smartWalletCount: Math.floor(Math.random() * 50) + 1,
    }))
}

// Main handler function
const myHandler: Handler = async () => {
    console.log('Starting scheduled update-flows function...')

    try {
        // Fetch from Nansen Smart Money Netflow API
        const nansenResponse = await fetch(
            `https://api.nansen.ai/api/v1/smart-money/netflow`,
            {
                method: 'POST',
                headers: {
                    'apiKey': NANSEN_API_KEY,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chains: ['solana'],
                    pagination: { page: 1, per_page: 50 },
                    order_by: [{ direction: 'DESC', field: 'net_flow_24h_usd' }]
                })
            }
        )

        if (!nansenResponse.ok) {
            const errorText = await nansenResponse.text()
            throw new Error(`Nansen API error (${nansenResponse.status}): ${errorText}`)
        }

        const json = await nansenResponse.json()
        const nansenTokens = json.data || []

        console.log(`Fetched ${nansenTokens.length} tokens from Nansen for 24h`)

        // Enrich with DexScreener data
        const addresses = nansenTokens.map((t: any) => t.token_address).filter(Boolean)
        let dexMap = new Map()

        if (addresses.length > 0) {
            try {
                const dexResponse = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${addresses.join(',')}`)
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
            } catch (e) {
                console.error('DexScreener enrich error:', e)
            }
        }

        // Update Supabase with enriched data for 7 timeframes
        const dbTimeframes = [
            { db: '5min', dexKey: 'm5', nansenFlowKey: 'net_flow_1h_usd' },
            { db: '10min', dexKey: 'm5', nansenFlowKey: 'net_flow_1h_usd' },
            { db: '30min', dexKey: 'm5', nansenFlowKey: 'net_flow_1h_usd' },
            { db: '1h', dexKey: 'h1', nansenFlowKey: 'net_flow_1h_usd' },
            { db: '6h', dexKey: 'h6', nansenFlowKey: 'net_flow_24h_usd' },
            { db: '12h', dexKey: 'h6', nansenFlowKey: 'net_flow_24h_usd' },
            { db: '24h', dexKey: 'h24', nansenFlowKey: 'net_flow_24h_usd' }
        ]

        for (const token of nansenTokens) {
            const dexData = dexMap.get(token.token_address)

            for (const map of dbTimeframes) {
                const volumeValue = dexData?.volume?.[map.dexKey] || (map.dexKey === 'm5' ? 0 : dexData?.volume?.h24) || 0

                const { error } = await supabase.from('token_flows').upsert({
                    symbol: token.token_symbol,
                    timeframe: map.db,
                    price_change_pct: dexData?.priceChange?.[map.dexKey] || 0,
                    market_cap: token.market_cap_usd || dexData?.fdv || 0,
                    smart_wallet_count: token.trader_count || 0,
                    volume: volumeValue,
                    liquidity: dexData?.liquidity?.usd || 0,
                    inflows: 0,
                    outflows: 0,
                    net_flows: token[map.nansenFlowKey] || 0,
                    token_age: token.token_age_days || 0,
                    token_sectors: token.token_sectors || [],
                    fetched_at: new Date().toISOString()
                }, { onConflict: 'symbol,timeframe' })

                if (error) {
                    console.error(`Error upserting ${token.token_symbol} for ${map.db}:`, error)
                }
            }
        }

        // Delete data older than 24 hours
        const twentyFourHoursAgo = new Date()
        twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)

        const { error: deleteError } = await supabase
            .from('token_flows')
            .delete()
            .lt('fetched_at', twentyFourHoursAgo.toISOString())

        if (deleteError) {
            console.error('Error deleting old data:', deleteError)
        }

        console.log('Update-flows function completed successfully')

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Data updated successfully' }),
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
