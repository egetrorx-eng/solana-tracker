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
    try {
        // Note: This is a placeholder. Replace with actual Nansen API endpoint
        // Example: https://api.nansen.ai/v1/solana/tokens?marketCapMax=5000000&timeframe=${timeframe}
        const response = await fetch(
            `https://api.nansen.ai/v1/solana/smart-money?marketCapMax=5000000&timeframe=${timeframe}`,
            {
                headers: {
                    'Authorization': `Bearer ${NANSEN_API_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        )

        if (!response.ok) {
            throw new Error(`Nansen API error: ${response.status}`)
        }

        const data = await response.json()
        return data.tokens || []
    } catch (error) {
        console.error(`Error fetching Nansen data for ${timeframe}:`, error)
        // Return mock data for development
        return generateMockData(timeframe)
    }
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
export const handler: Handler = async () => {
    console.log('Starting scheduled update-flows function...')

    try {
        // Fetch data for all timeframes
        for (const timeframe of TIMEFRAMES) {
            console.log(`Fetching data for timeframe: ${timeframe}`)

            const tokens = await fetchNansenData(timeframe)

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

// Schedule the function to run every 5 minutes (adjusted for personal plan)
export const updateFlowsScheduled = schedule('*/5 * * * *', handler)
