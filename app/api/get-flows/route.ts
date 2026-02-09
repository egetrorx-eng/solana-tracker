import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

import { generateMockFlows } from '@/lib/mockData'

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const timeframe = searchParams.get('timeframe') || '5min'

        console.log(`API get-flows called for timeframe: ${timeframe}`)

        // Query Supabase for latest data for the specified timeframe
        const { data, error } = await supabase
            .from('token_flows')
            .select('*')
            .eq('timeframe', timeframe)
            .order('net_flows', { ascending: false })
            .limit(20)

        if (error) {
            console.error('Supabase error:', error.message)
            // If Supabase fails, we still want to return mock data in development
            console.log('Falling back to mock data due to Supabase error')
            return NextResponse.json(generateMockFlows())
        }

        if (!data || data.length === 0) {
            console.log(`No data found in Supabase for ${timeframe}, returning mock data`)
            return NextResponse.json(generateMockFlows())
        }

        console.log(`Supabase returned ${data.length} rows for ${timeframe}`)

        // Format data for frontend
        const formattedData = data.map(token => ({
            symbol: token.symbol,
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

        return NextResponse.json(formattedData)
    } catch (error: unknown) {
        console.error('Error in get-flows:', error)
        return NextResponse.json(
            { error: (error as Error).message || 'Failed to fetch data', details: error },
            { status: 500 }
        )
    }
}
