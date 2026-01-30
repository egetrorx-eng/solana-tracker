import { supabase } from '../lib/supabase'

const TIMEFRAMES = ['5min', '10min', '30min', '1h', '6h', '12h', '24h']
const SYMBOLS = ['BONK', 'WIF', 'MYRO', 'POPCAT', 'MEW', 'PONKE', 'SAMO', 'FOXY', 'CRCL', 'SIGN']

async function generateMockData() {
    console.log('🚀 Generating mock data...')

    for (const timeframe of TIMEFRAMES) {
        console.log(`📊 Creating data for ${timeframe}...`)

        for (const symbol of SYMBOLS) {
            const inflows = Math.random() * 100000
            const outflows = Math.random() * 80000
            const netFlows = inflows - outflows

            const { error } = await supabase
                .from('token_flows')
                .insert({
                    symbol,
                    mint_address: `${symbol}${Math.random().toString(36).substring(2, 15)}mint`,
                    timeframe,
                    price_change_pct: (Math.random() - 0.5) * 20,
                    market_cap: Math.random() * 5000000,
                    smart_wallet_count: Math.floor(Math.random() * 50) + 1,
                    volume: Math.random() * 1000000,
                    liquidity: Math.random() * 500000,
                    inflows,
                    outflows,
                    net_flows: netFlows,
                })

            if (error) {
                console.error(`❌ Error inserting ${symbol}:`, error.message)
            }
        }
    }

    console.log('✅ Mock data generated successfully!')
    console.log('🔄 Refresh your browser at http://localhost:3000')
}

generateMockData()
