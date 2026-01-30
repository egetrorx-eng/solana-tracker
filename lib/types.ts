export interface TokenFlow {
    id?: number
    symbol: string
    mint_address: string
    timeframe: string
    price_change_pct: number
    market_cap: number
    smart_wallet_count: number
    volume: number
    liquidity: number
    inflows: number
    outflows: number
    net_flows: number
    fetched_at?: Date
}

export type TimeframeOption = '5min' | '10min' | '30min' | '1h' | '6h' | '12h' | '24h'
