import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const timeframe = searchParams.get('timeframe') || '5min'

        // Fetch from Supabase token_flows table
        const { data, error } = await supabase
            .from('token_flows')
            .select('*')
            .eq('timeframe', timeframe.toLowerCase())
            .order('net_flows', { ascending: false })
            .limit(50)

        if (error) {
            console.error('Supabase error:', error)
            return NextResponse.json(
                { error: 'Failed to fetch data from database' },
                { status: 500 }
            )
        }

        if (!data || data.length === 0) {
            return NextResponse.json([])
        }

        // Map database columns to frontend format
        const formattedData = data.map(token => ({
            symbol: token.symbol,
            token_address: token.token_address || token.mint_address || '',
            price_change: Number(token.price_change_pct) || 0,
            market_cap: Number(token.market_cap) || 0,
            smart_wallets: token.smart_wallet_count || 0,
            volume: Number(token.volume) || 0,
            liquidity: Number(token.liquidity) || 0,
            inflows: Number(token.inflows) || 0,
            outflows: Number(token.outflows) || 0,
            net_flows: Number(token.net_flows) || 0,
            token_age: token.token_age || 0,
            token_sectors: token.token_sectors || [],
        }))

        return NextResponse.json(formattedData)
    } catch (error: unknown) {
        console.error('Error in get-flows:', error)
        return NextResponse.json(
            { error: (error as Error).message || 'Failed to fetch data' },
            { status: 500 }
        )
    }
}
