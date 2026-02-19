'use client'

import { useState, useEffect, useCallback } from 'react'

const TIMEFRAMES = ['5MIN', '10MIN', '30MIN', '1H', '6H', '12H', '24H']

interface TokenData {
    symbol: string
    token_address?: string
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
    price_history?: number[]
    wallet_history?: number[]
}

function formatNumber(num: number | null | undefined): string {
    if (num === null || num === undefined || isNaN(num)) {
        return '---'
    }
    if (Math.abs(num) >= 1000000000) {
        return (num / 1000000000).toFixed(2) + 'B'
    }
    if (Math.abs(num) >= 1000000) {
        return (num / 1000000).toFixed(2) + 'M'
    } else if (Math.abs(num) >= 1000) {
        return (num / 1000).toFixed(2) + 'K'
    } else {
        return num.toFixed(2)
    }
}

function FlowBar({ value, maxValue, isPositive }: { value: number; maxValue: number; isPositive: boolean }) {
    const percentage = Math.min(Math.abs(value) / maxValue * 100, 100)
    return (
        <div className="w-full h-2 bg-green/10 rounded-full overflow-hidden">
            <div
                className={`h-full rounded-full transition-all ${isPositive ? 'bg-gradient-to-r from-green/50 to-green' : 'bg-gradient-to-r from-red/50 to-red'}`}
                style={{ width: `${percentage}%` }}
            />
        </div>
    )
}

export default function Dashboard() {
    const [timeframe, setTimeframe] = useState('5MIN')
    const [data, setData] = useState<TokenData[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [sortConfig, setSortConfig] = useState<{ key: keyof TokenData; direction: 'asc' | 'desc' } | null>({ key: 'net_flows', direction: 'desc' })
    const [countdown, setCountdown] = useState(30)

    const handleSort = (key: keyof TokenData) => {
        let direction: 'asc' | 'desc' = 'desc'
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = 'asc'
        }
        setSortConfig({ key, direction })
    }

    const sortedData = [...data].sort((a, b) => {
        if (!sortConfig) return 0
        const { key, direction } = sortConfig

        if (typeof a[key] === 'string' && typeof b[key] === 'string') {
            return direction === 'asc'
                ? (a[key] as string).localeCompare(b[key] as string)
                : (b[key] as string).localeCompare(a[key] as string)
        }

        const valA = (a[key] as number) || 0
        const valB = (b[key] as number) || 0
        return direction === 'asc' ? valA - valB : valB - valA
    })

    const maxNetFlow = Math.max(...data.map(t => Math.abs(t.net_flows)), 1)

    const SortIcon = ({ columnKey }: { columnKey: keyof TokenData }) => {
        if (sortConfig?.key !== columnKey) return <span className="text-green/20 ml-1">[-]</span>
        return (
            <span className="ml-1 text-green font-bold animate-pulse">
                {sortConfig.direction === 'asc' ? '[↑]' : '[↓]'}
            </span>
        )
    }

    const fetchData = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await fetch(`/api/get-flows?timeframe=${timeframe.toLowerCase()}`)
            const json = await res.json()

            if (!res.ok) {
                throw new Error(json.error || 'Failed to fetch')
            }

            setData(json)
            setCountdown(30)
        } catch (error: unknown) {
            console.error('Error fetching data:', error)
            setError((error as Error).message)
            setData([])
        }
        setLoading(false)
    }, [timeframe])

    useEffect(() => {
        fetchData()
        const interval = setInterval(fetchData, 30000)
        return () => clearInterval(interval)
    }, [fetchData])

    // Countdown timer
    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown(prev => (prev > 0 ? prev - 1 : 30))
        }, 1000)
        return () => clearInterval(timer)
    }, [])

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement) return
            const num = parseInt(e.key)
            if (num >= 1 && num <= 7) {
                setTimeframe(TIMEFRAMES[num - 1])
            }
            if (e.key === 'r' || e.key === 'R') {
                fetchData()
            }
        }
        window.addEventListener('keydown', handleKeyPress)
        return () => window.removeEventListener('keydown', handleKeyPress)
    }, [fetchData])

    return (
        <div className="min-h-screen bg-black text-green p-4 md:p-8 relative overflow-hidden crt-flicker">
            <div className="scanlines" />

            {/* Header */}
            <div className="mb-6 relative z-20">
                <div className="flex flex-col gap-2">
                    <h1 className="text-2xl md:text-4xl font-bold tracking-tighter glow-text uppercase italic glitch-text relative">
                        SOLANA MICROCAP SMART MONEY TRACKER
                    </h1>
                    <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
                        <span className="opacity-80">
                            SOURCE: <a
                                href="https://nsn.ai/gamefi?utm_source=tracker"
                                className="underline hover:glow-text transition-all"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                NANSEN_INTELLIGENCE_API
                            </a>
                        </span>
                        <span className="opacity-50">|</span>
                        <span className="text-green/60">TRACKING {data.length} TOKENS</span>
                    </div>
                </div>
                {/* Refresh counter - top right */}
                <div className="absolute top-0 right-0 flex items-center gap-2 text-xs font-mono">
                    <div className={`w-2 h-2 rounded-full ${countdown <= 5 ? 'bg-yellow-500 animate-pulse' : 'bg-green'}`} />
                    <span className="tabular-nums glow-text">REFRESH: {countdown}s</span>
                </div>
            </div>

            {/* Timeframe Buttons */}
            <div className="flex flex-wrap gap-2 mb-6">
                {TIMEFRAMES.map((tf, idx) => (
                    <button
                        key={tf}
                        onClick={() => setTimeframe(tf)}
                        className={`px-4 py-2 border transition-all font-mono ${timeframe === tf
                            ? 'bg-green text-black border-green font-bold'
                            : 'border-green text-green hover:bg-green-darker'
                            }`}
                        title={`Press ${idx + 1} for ${tf}`}
                    >
                        {idx + 1}: {tf}
                    </button>
                ))}
                <button
                    onClick={fetchData}
                    className="px-4 py-2 border border-green text-green hover:bg-green-darker transition-all font-mono"
                    title="Press R to refresh"
                >
                    R: REFRESH
                </button>
            </div>

            {/* Loading Indicator */}
            {
                loading && (
                    <div className="fixed top-4 right-4 z-50">
                        <div className="flex items-center gap-2 px-3 py-1 bg-green/10 border border-green/30 rounded-full backdrop-blur-sm">
                            <div className="w-2 h-2 bg-green rounded-full animate-pulse" />
                            <span className="text-[10px] font-mono uppercase tracking-widest text-green">Syncing Data</span>
                        </div>
                    </div>
                )
            }

            {/* Table */}
            <div className="overflow-x-auto -mx-4 md:mx-0">
                <div className="inline-block min-w-full align-middle">
                    <div className="overflow-hidden">
                        <table className="min-w-full border-collapse">
                            <thead>
                                <tr className="border-b border-green-dark">
                                    <th className="text-left p-2 w-10 font-mono opacity-50">#</th>
                                    <th
                                        className="text-left p-2 sticky left-0 bg-black z-10 min-w-[70px] cursor-pointer hover:text-green select-none"
                                        onClick={() => handleSort('symbol')}
                                    >
                                        SYMBOL <SortIcon columnKey="symbol" />
                                    </th>
                                    <th className="text-center p-2 w-10">⬍</th>
                                    <th
                                        className="text-right p-2 cursor-pointer hover:text-green select-none"
                                        onClick={() => handleSort('price_change')}
                                    >
                                        {timeframe}% <SortIcon columnKey="price_change" />
                                    </th>
                                    <th
                                        className="text-right p-2 cursor-pointer hover:text-green select-none"
                                        onClick={() => handleSort('market_cap')}
                                    >
                                        MCAP <SortIcon columnKey="market_cap" />
                                    </th>
                                    <th
                                        className="text-right p-2 min-w-[70px] cursor-pointer hover:bg-green-darker select-none transition-colors"
                                        onClick={() => handleSort('smart_wallets')}
                                    >
                                        SMS <SortIcon columnKey="smart_wallets" />
                                    </th>
                                    <th
                                        className="text-right p-2 min-w-[80px] cursor-pointer hover:bg-green-darker select-none transition-colors"
                                        onClick={() => handleSort('volume')}
                                    >
                                        VOL <SortIcon columnKey="volume" />
                                    </th>
                                    <th
                                        className="text-right p-2 min-w-[80px] cursor-pointer hover:bg-green-darker select-none transition-colors"
                                        onClick={() => handleSort('liquidity')}
                                    >
                                        LIQ <SortIcon columnKey="liquidity" />
                                    </th>
                                    <th
                                        className="text-right p-2 min-w-[70px] cursor-pointer hover:bg-green-darker select-none transition-colors"
                                        onClick={() => handleSort('inflows')}
                                    >
                                        IN <SortIcon columnKey="inflows" />
                                    </th>
                                    <th
                                        className="text-right p-2 min-w-[70px] cursor-pointer hover:bg-green-darker select-none transition-colors"
                                        onClick={() => handleSort('outflows')}
                                    >
                                        OUT <SortIcon columnKey="outflows" />
                                    </th>
                                    <th
                                        className="text-right p-2 min-w-[50px] cursor-pointer hover:bg-green-darker select-none transition-colors"
                                        onClick={() => handleSort('token_age')}
                                    >
                                        AGE <SortIcon columnKey="token_age" />
                                    </th>
                                    <th
                                        className="text-right p-2 min-w-[180px] cursor-pointer hover:bg-green-darker border-l border-green-dark select-none transition-colors"
                                        onClick={() => handleSort('net_flows')}
                                    >
                                        NET FLOWS <SortIcon columnKey="net_flows" />
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedData.length === 0 && !loading ? (
                                    <tr>
                                        <td colSpan={12} className="text-center py-20">
                                            <div className="flex flex-col items-center justify-center gap-4">
                                                <div className="text-green/20 text-4xl font-mono">[ ! ]</div>
                                                <p className="text-green/60 font-mono tracking-widest uppercase">
                                                    {error ? `System Error: ${error}` : "No spectral data detected in this timeframe"}
                                                </p>
                                                <button
                                                    onClick={fetchData}
                                                    className="mt-2 px-6 py-2 border border-green/30 text-green/60 hover:bg-green hover:text-black transition-all font-mono text-xs"
                                                >
                                                    RETRY SYSTEM SCAN
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    sortedData.map((token, idx) => (
                                        <tr
                                            key={`${token.symbol}-${idx}`}
                                            className="border-b border-green-dark/30 hover:bg-green-darker transition-colors group"
                                        >
                                            <td className="p-2 text-left font-mono opacity-50 text-xs">
                                                {idx + 1}
                                            </td>
                                            <td className="p-2 sticky left-0 bg-black z-10 font-bold group-hover:glow-text transition-all">
                                                <a
                                                    href={`https://dexscreener.com/solana/${token.token_address || token.symbol}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="hover:underline hover:text-green transition-all"
                                                    title="View on DexScreener"
                                                >
                                                    {token.symbol} ↗
                                                </a>
                                            </td>
                                            <td className="p-2 text-center">
                                                {token.net_flows > 0 ? (
                                                    <span className="text-green text-lg">▲</span>
                                                ) : token.net_flows < 0 ? (
                                                    <span className="text-red text-lg">▼</span>
                                                ) : (
                                                    <span className="text-green/30">–</span>
                                                )}
                                            </td>
                                            <td className={`p-2 text-right font-mono text-sm ${token.price_change < 0 ? 'text-red' : 'text-green'}`}>
                                                {token.price_change >= 0 ? '+' : ''}{token.price_change.toFixed(2)}%
                                            </td>
                                            <td className="p-2 text-right font-mono opacity-90 text-sm">
                                                ${formatNumber(token.market_cap)}
                                            </td>
                                            <td className="p-2 text-right font-mono text-green/80 text-sm">
                                                {token.smart_wallets}
                                            </td>
                                            <td className="p-2 text-right font-mono opacity-80 text-sm">
                                                ${formatNumber(token.volume)}
                                            </td>
                                            <td className="p-2 text-right font-mono opacity-80 text-sm">
                                                ${formatNumber(token.liquidity)}
                                            </td>
                                            <td className="p-2 text-right font-mono text-green text-sm">
                                                +${formatNumber(token.inflows)}
                                            </td>
                                            <td className="p-2 text-right font-mono text-red text-sm">
                                                -${formatNumber(token.outflows)}
                                            </td>
                                            <td className="p-2 text-right font-mono opacity-80 text-sm">
                                                {token.token_age || 0}d
                                            </td>
                                            <td className={`p-2 text-right font-bold font-mono border-l border-green-dark/30`}>
                                                <div className="flex flex-col gap-1">
                                                    <span className={`${token.net_flows < 0 ? 'text-red' : 'text-green'}`}>
                                                        {token.net_flows >= 0 ? '+' : ''}${formatNumber(token.net_flows)}
                                                    </span>
                                                    <FlowBar value={token.net_flows} maxValue={maxNetFlow} isPositive={token.net_flows >= 0} />
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-4 border-t border-green-dark/30 text-center text-xs font-mono opacity-40">
                <p>KEYBOARD: 1-7 for timeframes | R to refresh | Data updates every 30 seconds</p>
            </div>
        </div >
    )
}
