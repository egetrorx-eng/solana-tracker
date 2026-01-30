import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Load environment variables from .env.local manually
const envPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8')
    envContent.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/)
        if (match) {
            const key = match[1].trim()
            const value = match[2].trim().replace(/^["']|["']$/g, '') // Remove quotes if present
            process.env[key] = value
        }
    })
}

const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Use service key if available for bypassing RLS, otherwise anon key
const supabaseKey = supabaseServiceKey || supabaseAnonKey
const supabase = createClient(supabaseUrl, supabaseKey)

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

async function main() {
    console.log('Starting manual database seed...')
    console.log(`Supabase URL: ${supabaseUrl}`)

    if (!supabaseUrl || !supabaseAnonKey) {
        console.error('Error: Missing Supabase environment variables in .env.local')
        return
    }

    try {
        // Fetch data for all timeframes
        for (const timeframe of TIMEFRAMES) {
            console.log(`Generating data for timeframe: ${timeframe}`)

            const tokens = generateMockData(timeframe)

            // Insert data into Supabase
            for (const token of tokens) {
                const netFlows = (token.smartMoneyInflows || 0) - (token.smartMoneyOutflows || 0)

                const { error } = await supabase
                    .from('token_flows')
                    .insert({
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
                    })

                if (error) {
                    console.error(`Error inserting ${token.symbol}:`, error)
                }
            }
            console.log(`Inserted ${tokens.length} tokens for ${timeframe}`)
        }
        console.log('Database seeding completed successfully!')
    } catch (error) {
        console.error('Error seeding database:', error)
    }
}

main()
