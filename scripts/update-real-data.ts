import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Manual env loading
const envPath = path.join(process.cwd(), '.env.local')
if (!fs.existsSync(envPath)) {
    console.error('.env.local not found')
    process.exit(1)
}

const envContent = fs.readFileSync(envPath, 'utf8')
const env: Record<string, string> = {}
envContent.split('\n').forEach(line => {
    const [key, ...value] = line.split('=')
    if (key && value) env[key.trim()] = value.join('=').trim().replace(/^['"]|['"]$/g, '')
})

console.log('SUPABASE_ANON_KEY:', env.SUPABASE_ANON_KEY ? 'PRESENT' : 'MISSING')
console.log('NANSEN_KEY:', env.NANSEN_API_KEY ? 'PRESENT' : 'MISSING')

const supabaseUrl = env.SUPABASE_URL
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)
const NANSEN_API_KEY = 'LMKwN29RPgiy5oBJVDqaC9OXeJjBdNgd' // Using provided key
const TIMEFRAMES = ['24h'] // The current netflow API focuses on 24h, 7d, 30d. We will map 24h for now.

async function fetchNansenData(): Promise<any[]> {
    console.log(`Fetching 24h Netflows from Nansen...`)
    try {
        const fetchFunc: any = (global as any).fetch || (globalThis as any).fetch
        if (!fetchFunc) {
            throw new Error('Fetch not found in this node version')
        }

        const response = await fetchFunc(
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

        if (!response.ok) {
            const error = await response.text()
            console.log(`API_ERROR_${response.status}: ${error}`);
            return []
        }

        const json = await response.json()
        console.log(`API_SUCCESS: Received ${json.data?.length || 0} tokens`);
        return json.data || []
    } catch (error: any) {
        console.error(`Error: ${error.message}`)
        return []
    }
}

async function fetchDexScreenerData(addresses: string[]): Promise<any[]> {
    if (addresses.length === 0) return []
    console.log(`Enriching ${addresses.length} tokens with DexScreener data...`)
    try {
        const fetchFunc: any = (global as any).fetch || (globalThis as any).fetch
        const response = await fetchFunc(`https://api.dexscreener.com/latest/dex/tokens/${addresses.join(',')}`)
        if (!response.ok) return []
        const json = await response.json()
        return json.pairs || []
    } catch (error) {
        console.error('DexScreener error:', error)
        return []
    }
}

async function main() {
    console.log('--- Nansen + DexScreener Live Sync (Multi-Timeframe) ---')
    const nansenTokens = await fetchNansenData()
    if (nansenTokens.length > 0) {
        const addresses = nansenTokens.map(t => t.token_address).filter(Boolean)
        const dexPairs = await fetchDexScreenerData(addresses)

        // Map dex pairs by address for quick lookup
        const dexMap = new Map()
        dexPairs.forEach((pair: any) => {
            // DexScreener returns multiple pairs, we take the one with highest liquidity (often Raydium)
            const existing = dexMap.get(pair.baseToken.address)
            if (!existing || (pair.liquidity?.usd || 0) > (existing.liquidity?.usd || 0)) {
                dexMap.set(pair.baseToken.address, pair)
            }
        })

        console.log(`Updating ${nansenTokens.length} tokens for 7 timeframes...`)

        // Comprehensive mapping for all UI timeframes
        const timeframeMapping = [
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

            for (const map of timeframeMapping) {
                // Correctly map volume to the timeframe interval
                const volumeValue = dexData?.volume?.[map.dexKey] || (map.dexKey === 'm5' ? 0 : dexData?.volume?.h24) || 0

                await supabase.from('token_flows').upsert({
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
            }
        }
    }
    console.log('--- Done ---')
}

main()
