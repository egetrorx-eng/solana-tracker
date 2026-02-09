'use client'

import { useState, useEffect } from 'react'

const TIMEFRAMES = ['5MIN', '10MIN', '30MIN', '1H', '6H', '12H', '24H']

interface TokenData {
    symbol: string
    price_change: number
    market_cap: number
    smart_wallets: number
    volume: number
    liquidity: number
    inflows: number
    outflows: number
    net_flows: number
    token_age?: number
    token_sectors?: string[]
}

function formatNumber(num: number): string {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(2) + 'M'
    } else if (num >= 1000) {
        return (num / 1000).toFixed(2) + 'K'
    } else {
        return num.toFixed(2)
    }
}

export default function Dashboard() {
    const [timeframe, setTimeframe] = useState('5MIN')
    const [data, setData] = useState<TokenData[]>([])
    const [loading, setLoading] = useState(false)

    const [error, setError] = useState<string | null>(null)
    const [sortConfig, setSortConfig] = useState<{ key: keyof TokenData; direction: 'asc' | 'desc' } | null>({ key: 'net_flows', direction: 'desc' })

    const handleSort = (key: keyof TokenData) => {
        let direction: 'asc' | 'desc' = 'desc' // Default to highest first
        // If already sorting by this key and it's desc, toggle to asc (lowest first)
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = 'asc'
        }
        setSortConfig({ key, direction })
    }

    const sortedData = [...data].sort((a, b) => {
        if (!sortConfig) return 0

        const { key, direction } = sortConfig

        if (key === 'token_sectors') {
            const valA = (a[key] as string[])?.[0] || ''
            const valB = (b[key] as string[])?.[0] || ''
            return direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA)
        }

        if (typeof a[key] === 'string' && typeof b[key] === 'string') {
            return direction === 'asc'
                ? (a[key] as string).localeCompare(b[key] as string)
                : (b[key] as string).localeCompare(a[key] as string)
        }

        // Handle numeric sorting
        const valA = (a[key] as number) || 0
        const valB = (b[key] as number) || 0

        return direction === 'asc' ? valA - valB : valB - valA
    })

    const SortIcon = ({ columnKey }: { columnKey: keyof TokenData }) => {
        if (sortConfig?.key !== columnKey) return <span className="text-green/20 ml-1">[-]</span>
        return (
            <span className="ml-1 text-green font-bold animate-pulse">
                {sortConfig.direction === 'asc' ? '[LOWEST]' : '[HIGHEST]'}
            </span>
        )
    }

    const fetchData = async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await fetch(`/api/get-flows?timeframe=${timeframe.toLowerCase()}`)
            const json = await res.json()

            if (!res.ok) {
                throw new Error(json.error || 'Failed to fetch')
            }

            setData(json)
        } catch (error: any) {
            console.error('Error fetching data:', error)
            setError(error.message)
            setData([])
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchData()
        const interval = setInterval(fetchData, 30000) // auto-refresh every 30s
        return () => clearInterval(interval)
    }, [timeframe])

    return (
        <div className="min-h-screen bg-black text-green p-4 md:p-8 relative overflow-hidden crt-flicker">
            {/* Scanlines Overlay */}
            <div className="scanlines" />

            {/* Header */}
            <div className="mb-8 relative z-20">
                <h1 className="text-2xl md:text-4xl font-bold mb-2 tracking-tighter glow-text uppercase italic">
                    <span className="opacity-50 mr-2">[SYS_MSG]</span>
                    SOLANA MICROCAP SMART MONEY TRACKER
                </h1>
                <div className="flex items-center gap-4 text-xs font-mono">
                    <p className="opacity-80">
                        STATUS: <span className="text-green animate-pulse">CONNECTED_TO_SUPABASE</span>
                    </p>
                    <p className="opacity-80">
                        SOURCE: <a
                            href="https://nsn.ai/gamefi?utm_source=tracker"
                            className="underline hover:glow-text transition-all"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            NANSEN_INTELLIGENCE_API
                        </a>
                    </p>
                </div>
            </div>

            {/* Timeframe Buttons */}
            <div className="flex flex-wrap gap-2 mb-6">
                {TIMEFRAMES.map(tf => (
                    <button
                        key={tf}
                        onClick={() => setTimeframe(tf)}
                        className={`px-4 py-2 border transition-all font-mono ${timeframe === tf
                            ? 'bg-green text-black border-green font-bold'
                            : 'border-green text-green hover:bg-green-darker'
                            }`}
                    >
                        {tf}
                    </button>
                ))}
                <button
                    onClick={fetchData}
                    className="px-4 py-2 border border-green text-green hover:bg-green-darker transition-all font-mono"
                >
                    REFRESH
                </button>
            </div>

            {/* Loading Indicator */}
            {loading && (
                <div className="text-center py-4 text-green animate-pulse">
                    Loading data...
                </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto -mx-4 md:mx-0">
                <div className="inline-block min-w-full align-middle">
                    <div className="overflow-hidden">
                        <table className="min-w-full border-collapse">
                            <thead>
                                <tr className="border-b border-green-dark">
                                    <th className="text-left p-3 w-12 font-mono opacity-50">
                                        #
                                    </th>
                                    <th
                                        className="text-left p-3 sticky left-0 bg-black z-10 min-w-[80px] cursor-pointer hover:text-green select-none"
                                        onClick={() => handleSort('symbol')}
                                    >
                                        SYMBOL <SortIcon columnKey="symbol" />
                                    </th>
                                    <th
                                        className="text-right p-3 min-w-[100px] cursor-pointer hover:bg-green-darker select-none transition-colors"
                                        onClick={() => handleSort('price_change')}
                                    >
                                        {timeframe} % <div className="text-[10px]"><SortIcon columnKey="price_change" /></div>
                                    </th>
                                    <th
                                        className="text-right p-3 min-w-[120px] cursor-pointer hover:bg-green-darker select-none transition-colors"
                                        onClick={() => handleSort('market_cap')}
                                    >
                                        MARKETCAP <div className="text-[10px]"><SortIcon columnKey="market_cap" /></div>
                                    </th>
                                    <th
                                        className="text-right p-3 min-w-[110px] cursor-pointer hover:bg-green-darker select-none transition-colors"
                                        onClick={() => handleSort('smart_wallets')}
                                    >
                                        SM WALLETS <div className="text-[10px]"><SortIcon columnKey="smart_wallets" /></div>
                                    </th>
                                    <th
                                        className="text-right p-3 min-w-[110px] cursor-pointer hover:bg-green-darker select-none transition-colors"
                                        onClick={() => handleSort('volume')}
                                    >
                                        VOLUMES <div className="text-[10px]"><SortIcon columnKey="volume" /></div>
                                    </th>
                                    <th
                                        className="text-right p-3 min-w-[110px] cursor-pointer hover:bg-green-darker select-none transition-colors"
                                        onClick={() => handleSort('liquidity')}
                                    >
                                        LIQUIDITY <div className="text-[10px]"><SortIcon columnKey="liquidity" /></div>
                                    </th>
                                    <th
                                        className="text-right p-3 min-w-[110px] cursor-pointer hover:bg-green-darker select-none transition-colors"
                                        onClick={() => handleSort('token_age')}
                                    >
                                        AGE <div className="text-[10px]"><SortIcon columnKey="token_age" /></div>
                                    </th>
                                    <th
                                        className="text-left p-3 min-w-[150px] cursor-pointer hover:bg-green-darker select-none transition-colors"
                                        onClick={() => handleSort('token_sectors' as any)}
                                    >
                                        SECTORS <div className="text-[10px]"><SortIcon columnKey="token_sectors" /></div>
                                    </th>
                                    <th
                                        className="text-right p-3 min-w-[300px] cursor-pointer hover:bg-green-darker border-l border-green-dark select-none transition-colors"
                                        onClick={() => handleSort('net_flows')}
                                    >
                                        NET FLOWS <div className="text-[10px]"><SortIcon columnKey="net_flows" /></div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedData.length === 0 && !loading ? (
                                    <tr>
                                        <td colSpan={9} className="text-center py-8 text-green opacity-60">
                                            {error ? (
                                                <span className="text-red">Error: {error}</span>
                                            ) : (
                                                "No data available. Click REFRESH to load data."
                                            )}
                                        </td>
                                    </tr>
                                ) : (
                                    sortedData.map((token, idx) => (
                                        <tr
                                            key={`${token.symbol}-${idx}`}
                                            className="border-b border-green-dark/30 hover:bg-green-darker transition-colors"
                                        >
                                            <td className="p-3 text-left font-mono opacity-50">
                                                {idx + 1}
                                            </td>
                                            <td className="p-3 sticky left-0 bg-black z-10 font-bold">
                                                {token.symbol}
                                            </td>
                                            <td className={`p-3 text-right font-mono ${token.price_change < 0 ? 'text-red glow-text-red' : 'text-green glow-text'}`}>
                                                {token.price_change.toFixed(2)}%
                                            </td>
                                            <td className="p-3 text-right font-mono opacity-90">
                                                ${formatNumber(token.market_cap)}
                                            </td>
                                            <td className="p-3 text-right font-mono text-green/80">
                                                {token.smart_wallets}
                                            </td>
                                            <td className="p-3 text-right font-mono opacity-80">
                                                ${formatNumber(token.volume)}
                                            </td>
                                            <td className="p-3 text-right font-mono opacity-80">
                                                ${formatNumber(token.liquidity)}
                                            </td>
                                            <td className="p-3 text-right font-mono opacity-80">
                                                {token.token_age || 0}d
                                            </td>
                                            <td className="p-3 text-left font-mono text-[11px] opacity-70">
                                                <div className="flex flex-wrap gap-1">
                                                    {(token.token_sectors || []).slice(0, 2).map((s, i) => (
                                                        <span key={i} className="px-1 border border-green/30 rounded">
                                                            {s}
                                                        </span>
                                                    )) || 'n/a'}
                                                </div>
                                            </td>
                                            <td className={`p-3 text-right font-bold font-mono ${token.net_flows < 0 ? 'text-red glow-text-red' : 'text-green glow-text'}`}>
                                                ${formatNumber(token.net_flows)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
