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
const NANSEN_API_KEY = env.NANSEN_API_KEY
const TIMEFRAMES = ['5min', '10min', '30min', '1h', '6h', '12h', '24h']

async function fetchNansenData(timeframe: string): Promise<any[]> {
    console.log(`Fetching ${timeframe} from Nansen...`)
    try {
        const fetchFunc: any = (global as any).fetch || (globalThis as any).fetch
        if (!fetchFunc) {
            throw new Error('Fetch not found in this node version')
        }

        const response = await fetchFunc(
            `https://api.nansen.ai/v1/solana/smart-money?marketCapMax=5000000&timeframe=${timeframe}`,
            {
                headers: {
                    'Authorization': `Bearer ${NANSEN_API_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        )

        if (!response.ok) {
            console.warn(`Nansen API status: ${response.status}`)
            return []
        }

        const data = await response.json()
        return data.tokens || []
    } catch (error: any) {
        console.error(`Error: ${error.message}`)
        return []
    }
}

async function main() {
    console.log('--- Nansen Real Data Update ---')
    for (const timeframe of TIMEFRAMES) {
        const tokens = await fetchNansenData(timeframe)
        if (tokens.length > 0) {
            console.log(`Updating ${tokens.length} tokens for ${timeframe}...`)
            for (const token of tokens) {
                const netFlows = (token.smartMoneyInflows || 0) - (token.smartMoneyOutflows || 0)
                await supabase.from('token_flows').upsert({
                    symbol: token.symbol,
                    mint_address: token.mintAddress,
                    timeframe: timeframe,
                    price_change_pct: token.price24hChange || 0,
                    market_cap: token.marketCap,
                    smart_wallet_count: token.smartWalletCount || 0,
                    volume: token.volume || 0,
                    liquidity: token.liquidity || 0,
                    inflows: token.smartMoneyInflows || 0,
                    outflows: token.smartMoneyOutflows || 0,
                    net_flows: netFlows,
                    fetched_at: new Date().toISOString()
                }, { onConflict: 'symbol,timeframe' })
            }
        }
    }
    console.log('--- Done ---')
}

main()
