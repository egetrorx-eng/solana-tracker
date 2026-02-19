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
const NANSEN_API_KEY = env.NANSEN_API_KEY || 'LMKwN29RPgiy5oBJVDqaC9OXeJjBdNgd'

async function fetchNansenData(): Promise<any[]> {
    console.log(`Fetching 24h Netflows from Nansen...`)
    try {
        const fetchFunc: any = (global as any).fetch || (globalThis as any).fetch
        if (!fetchFunc) throw new Error('Fetch not found in this node version')

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
            console.log(`API_ERROR_${response.status}: ${error}`)
            return []
        }

        const json = await response.json()
        console.log(`API_SUCCESS: Received ${json.data?.length || 0} tokens`)
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
    console.log('--- Nansen + DexScreener Live Sync ---')
    const nansenTokens = await fetchNansenData()
    if (nansenTokens.length === 0) {
        console.log('No tokens fetched. Exiting.')
        return
    }

    const addresses = nansenTokens.map((t: any) => t.token_address).filter(Boolean)
    const dexPairs = await fetchDexScreenerData(addresses)

    // Map dex pairs by address for quick lookup
    const dexMap = new Map()
    dexPairs.forEach((pair: any) => {
        const existing = dexMap.get(pair.baseToken.address)
        if (!existing || (pair.liquidity?.usd || 0) > (existing.liquidity?.usd || 0)) {
            dexMap.set(pair.baseToken.address, pair)
        }
    })

    // Detect existing DB columns
    const { data: sampleData } = await supabase.from('token_flows').select('*').limit(1)
    const existingColumns = sampleData && sampleData[0] ? Object.keys(sampleData[0]) : ['symbol', 'mint_address', 'timeframe', 'price_change_pct', 'market_cap', 'smart_wallet_count', 'volume', 'liquidity', 'inflows', 'outflows', 'net_flows', 'fetched_at']
    const addrCol = existingColumns.includes('token_address') ? 'token_address' : 'mint_address'
    console.log(`DB address column: ${addrCol}`)

    const timeframeMapping = [
        { db: '1h', dexKey: 'h1', nansenFlowKey: 'net_flow_1h_usd' },
        { db: '24h', dexKey: 'h24', nansenFlowKey: 'net_flow_24h_usd' },
        { db: '7d', dexKey: 'h24', nansenFlowKey: 'net_flow_7d_usd' },
        { db: '30d', dexKey: 'h24', nansenFlowKey: 'net_flow_30d_usd' }
    ]

    console.log(`Syncing ${nansenTokens.length} tokens across ${timeframeMapping.length} timeframes...`)

    for (const map of timeframeMapping) {
        // 1. Delete all existing rows for this timeframe
        const { error: delError } = await supabase!
            .from('token_flows')
            .delete()
            .eq('timeframe', map.db)

        if (delError) {
            console.error(`❌ Delete ${map.db}:`, delError.message)
            continue
        }

        // 2. Build fresh rows
        const rows = nansenTokens.map((token: any) => {
            const dexData = dexMap.get(token.token_address)
            const volumeValue = dexData?.volume?.[map.dexKey] || (map.dexKey === 'm5' ? 0 : dexData?.volume?.h24) || 0
            const netFlow = Number(token[map.nansenFlowKey] || 0)

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
                fetched_at: new Date().toISOString()
            }
            if (existingColumns.includes('token_age')) row.token_age = token.token_age_days || 0
            if (existingColumns.includes('token_sectors')) row.token_sectors = token.token_sectors || []
            return row
        })

        // 3. Bulk insert
        const { error: insertError } = await supabase.from('token_flows').insert(rows)
        if (insertError) {
            console.error(`❌ Insert ${map.db}:`, insertError.message)
        } else {
            console.log(`✅ ${map.db}: ${rows.length} tokens`)
        }
    }

    console.log('--- Done ---')
}

main()
