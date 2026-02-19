import { Handler } from '@netlify/functions'
import { supabase } from '../../lib/supabase'

export const handler: Handler = async (event) => {
    // Enable CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json',
    }

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers, body: '' }
    }

    try {
        const timeframe = event.queryStringParameters?.timeframe || '5min'

        // Query Supabase for latest data for the specified timeframe
        const { data, error } = await supabase
            .from('token_flows')
            .select('*')
            .eq('timeframe', timeframe)
            .order('net_flows', { ascending: false })
            .limit(50)

        if (error) {
            throw error
        }

        // Format data for frontend
        let formattedData = (data || []).map(token => ({
            symbol: token.symbol,
            token_address: token.token_address || token.mint_address || '',
            price_change: parseFloat(token.price_change_pct || 0),
            market_cap: parseFloat(token.market_cap || 0),
            smart_wallets: token.smart_wallet_count || 0,
            volume: parseFloat(token.volume || 0),
            liquidity: parseFloat(token.liquidity || 0),
            inflows: parseFloat(token.inflows || 0),
            outflows: parseFloat(token.outflows || 0),
            net_flows: parseFloat(token.net_flows || 0),
            token_age: token.token_age || 0,
            token_sectors: token.token_sectors || [],
        }))

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(formattedData),
        }
    } catch (error) {
        console.error('Error in get-flows:', error)
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Failed to fetch data' }),
        }
    }
}
