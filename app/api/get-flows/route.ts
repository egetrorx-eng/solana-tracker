import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

import { generateMockFlows } from '@/lib/mockData'

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const timeframe = searchParams.get('timeframe') || '5min'

        console.log(`API get-flows called for timeframe: ${timeframe}`)

        // Query Supabase for latest data for the specified timeframe
        // We fetch more rows to build a small history for sparklines (e.g., last 10 snapshots per token)
        const { data, error } = await supabase
            .from('token_flows')
            .select('*')
            .eq('timeframe', timeframe)
            .order('fetched_at', { ascending: false })
            .limit(300)

        if (error) {
            console.error('Supabase error:', error.message)
            return NextResponse.json(generateMockFlows())
        }

        if (!data || data.length === 0) {
            console.log('No data in Supabase, returning mock data')
            return NextResponse.json(generateMockFlows())
        }

        // Group by symbol to get the latest state and price history
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        interface TokenAggregation extends Record<string, any> {
            price_history: number[];
            wallet_history: number[];
        }
        const tokenMap = new Map<string, TokenAggregation>()
        data.forEach(row => {
            if (!tokenMap.has(row.symbol)) {
                tokenMap.set(row.symbol, {
                    ...row,
                    price_history: [parseFloat(row.price_change_pct || 0)],
                    wallet_history: [parseInt(row.smart_wallet_count || 0)]
                })
            } else {
                const existing = tokenMap.get(row.symbol)
                if (existing) {
                    if (existing.price_history.length < 15) {
                        existing.price_history.push(parseFloat(row.price_change_pct || 0))
                    }
                    if (existing.wallet_history.length < 15) {
                        existing.wallet_history.push(parseInt(row.smart_wallet_count || 0))
                    }
                }
            }
        })

        // Convert map back to array and sort by net_flows (using latest snapshot)
        const formattedData = Array.from(tokenMap.values())
            .map(token => ({
                symbol: token.symbol,
                token_address: token.token_address || '',
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
                price_history: token.price_history.reverse(), // chronologically
                wallet_history: token.wallet_history.reverse(), // chronologically
            }))
            .sort((a, b) => b.net_flows - a.net_flows)
            .slice(0, 30) // Limit to top 30

        return NextResponse.json(formattedData)
    } catch (error: unknown) {
        console.error('Error in get-flows:', error)
        return NextResponse.json(
            { error: (error as Error).message || 'Failed to fetch data', details: error },
            { status: 500 }
        )
    }
}
