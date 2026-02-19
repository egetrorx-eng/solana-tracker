'use client'

import { useState, useEffect, useCallback } from 'react'

const TIMEFRAMES = ['1H', '24H', '7D', '30D']

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
}

type SortKey = keyof TokenData
type SortDirection = 'asc' | 'desc'

function formatNumber(num: number | null | undefined): string {
    if (num === null || num === undefined || isNaN(num)) return '---'
    if (Math.abs(num) >= 1000000000) return (num / 1000000000).toFixed(2) + 'B'
    if (Math.abs(num) >= 1000000) return (num / 1000000).toFixed(2) + 'M'
    if (Math.abs(num) >= 1000) return (num / 1000).toFixed(2) + 'K'
    return num.toFixed(2)
}

export default function Dashboard() {
    const [timeframe, setTimeframe] = useState('5MIN')
    const [data, setData] = useState<TokenData[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [sortKey, setSortKey] = useState<SortKey>('net_flows')
    const [sortDir, setSortDir] = useState<SortDirection>('desc')
    const [countdown, setCountdown] = useState(30)

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDir(prev => prev === 'desc' ? 'asc' : 'desc')
        } else {
            setSortKey(key)
            setSortDir('desc')
        }
    }

    const sortedData = [...data].sort((a, b) => {
        const valA = typeof a[sortKey] === 'string' ? (a[sortKey] as string) : (a[sortKey] as number) || 0
        const valB = typeof b[sortKey] === 'string' ? (b[sortKey] as string) : (b[sortKey] as number) || 0
        if (typeof valA === 'string' && typeof valB === 'string') {
            return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA)
        }
        return sortDir === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number)
    })

    const SortArrow = ({ col }: { col: SortKey }) => {
        if (sortKey !== col) return <span className="sort-indicator inactive">⇅</span>
        return <span className="sort-indicator active">{sortDir === 'desc' ? '▼' : '▲'}</span>
    }

    const fetchData = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await fetch(`/api/get-flows?timeframe=${timeframe.toLowerCase()}`)
            const json = await res.json()
            if (!res.ok) throw new Error(json.error || 'Failed to fetch')
            setData(json)
            setCountdown(30)
        } catch (err: unknown) {
            console.error('Fetch error:', err)
            setError((err as Error).message)
            setData([])
        }
        setLoading(false)
    }, [timeframe])

    useEffect(() => {
        fetchData()
        const interval = setInterval(fetchData, 30000)
        return () => clearInterval(interval)
    }, [fetchData])

    useEffect(() => {
        const timer = setInterval(() => setCountdown(prev => (prev > 0 ? prev - 1 : 30)), 1000)
        return () => clearInterval(timer)
    }, [])

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement) return
            const num = parseInt(e.key)
            if (num >= 1 && num <= 4) setTimeframe(TIMEFRAMES[num - 1])
            if (e.key === 'r' || e.key === 'R') fetchData()
        }
        window.addEventListener('keydown', handleKey)
        return () => window.removeEventListener('keydown', handleKey)
    }, [fetchData])

    const columns: { key: SortKey; label: string; format: (t: TokenData) => string; align: string; color?: (t: TokenData) => string }[] = [
        { key: 'price_change', label: `${timeframe} %`, align: 'right', format: t => `${t.price_change >= 0 ? '+' : ''}${t.price_change.toFixed(2)}%`, color: t => t.price_change < 0 ? 'negative' : 'positive' },
        { key: 'market_cap', label: 'MARKETCAP', align: 'right', format: t => `$${formatNumber(t.market_cap)}` },
        { key: 'smart_wallets', label: 'SM WALLETS', align: 'center', format: t => String(t.smart_wallets) },
        { key: 'volume', label: 'VOLUMES', align: 'right', format: t => `$${formatNumber(t.volume)}` },
        { key: 'liquidity', label: 'LIQUIDITY', align: 'right', format: t => `$${formatNumber(t.liquidity)}` },
        { key: 'inflows', label: 'INFLOWS', align: 'right', format: t => `$${formatNumber(t.inflows)}`, color: () => 'positive' },
        { key: 'outflows', label: 'OUTFLOWS', align: 'right', format: t => `$${formatNumber(t.outflows)}`, color: () => 'negative' },
        { key: 'net_flows', label: 'NETFLOWS', align: 'right', format: t => `${t.net_flows >= 0 ? '+' : ''}$${formatNumber(t.net_flows)}`, color: t => t.net_flows < 0 ? 'negative' : 'positive' },
    ]

    return (
        <div className="tracker-container">
            <div className="scanlines" />

            {/* Header */}
            <header className="tracker-header">
                <h1 className="tracker-title">SOLANA MICROCAP<br />SMART MONEY TRACKER</h1>
                <p className="tracker-subtitle">Powered by <a href="https://nsn.ai/gamefi?utm_source=tracker" target="_blank" rel="noopener noreferrer">NANSEN</a></p>
            </header>

            {/* Status Bar */}
            <div className="status-bar">
                <span className="status-item">TRACKING {data.length} TOKENS</span>
                <span className="status-divider">|</span>
                <span className="status-item">
                    <span className={`status-dot ${countdown <= 5 ? 'warning' : ''}`} />
                    REFRESH: {countdown}s
                </span>
                {loading && (
                    <>
                        <span className="status-divider">|</span>
                        <span className="status-item syncing">⟳ SYNCING</span>
                    </>
                )}
            </div>

            {/* Timeframe Buttons */}
            <div className="timeframe-bar">
                {TIMEFRAMES.map((tf, idx) => (
                    <button
                        key={tf}
                        onClick={() => setTimeframe(tf)}
                        className={`tf-btn ${timeframe === tf ? 'active' : ''}`}
                        title={`Press ${idx + 1}`}
                    >
                        {tf}
                    </button>
                ))}
                <button onClick={fetchData} className="tf-btn refresh-btn" title="Press R">
                    REFRESH
                </button>
            </div>

            {/* Data Table */}
            <div className="table-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th className="col-rank">#</th>
                            <th className="col-symbol sortable" onClick={() => handleSort('symbol')}>
                                SYMBOL <SortArrow col="symbol" />
                            </th>
                            {columns.map(col => (
                                <th
                                    key={col.key}
                                    className={`sortable align-${col.align}`}
                                    onClick={() => handleSort(col.key)}
                                >
                                    {col.label} <SortArrow col={col.key} />
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {sortedData.length === 0 && !loading ? (
                            <tr>
                                <td colSpan={10} className="empty-state">
                                    <div className="empty-icon">[ ! ]</div>
                                    <p>{error ? `Error: ${error}` : 'No data detected for this timeframe'}</p>
                                    <button onClick={fetchData} className="retry-btn">RETRY</button>
                                </td>
                            </tr>
                        ) : (
                            sortedData.map((token, idx) => (
                                <tr key={`${token.symbol}-${idx}`} className="data-row">
                                    <td className="col-rank">{idx + 1}</td>
                                    <td className="col-symbol">
                                        <a
                                            href={`https://dexscreener.com/solana/${token.token_address || token.symbol}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            {token.symbol}
                                        </a>
                                    </td>
                                    {columns.map(col => (
                                        <td
                                            key={col.key}
                                            className={`align-${col.align} ${col.color ? col.color(token) : ''}`}
                                        >
                                            {col.format(token)}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            <footer className="tracker-footer">
                KEYBOARD: 1-4 for timeframes | R to refresh | Data updates every 30s
            </footer>
        </div>
    )
}
