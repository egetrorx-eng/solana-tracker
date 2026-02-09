const SYMBOLS = ['BONK', 'WIF', 'MYRO', 'POPCAT', 'MEW', 'PONKE', 'SAMO', 'FOXY', 'CRCL', 'SIGN', 'JUP', 'PYTH', 'DRIFT', 'CLOUD', 'SPEC']

export function generateMockFlows() {
    return SYMBOLS.map(symbol => {
        const inflows = Math.random() * 100000
        const outflows = Math.random() * 80000
        const netFlows = inflows - outflows

        return {
            symbol,
            price_change: (Math.random() - 0.5) * 20,
            market_cap: Math.random() * 5000000,
            smart_wallets: Math.floor(Math.random() * 50) + 1,
            volume: Math.random() * 1000000,
            liquidity: Math.random() * 500000,
            inflows,
            outflows,
            net_flows: netFlows,
            token_age: Math.floor(Math.random() * 30) + 1,
            token_sectors: ['Meme', 'Community'],
        }
    })
}
