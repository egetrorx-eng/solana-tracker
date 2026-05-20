'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'

const TIMEFRAMES = [
    { label: '1H', api: '1h' },
    { label: '24H', api: '24h' },
    { label: '7D', api: '7d' },
]

interface TokenData {
    symbol: string
    token_address?: string
    price_change: number
    market_cap: number
    smart_wallets: number
    inflows: number
    outflows: number
    net_flows: number
    flow_1h: number
    flow_24h: number
    flow_7d: number
    token_age?: number
    token_sectors?: string[]
}

interface LogEntry {
    time: string
    msg: string
    type?: 'default' | 'highlight' | 'error'
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

function formatFlow(num: number): string {
    if (num === 0) return '$0'
    const prefix = num >= 0 ? '+$' : '-$'
    return prefix + formatNumber(Math.abs(num))
}

export default function Dashboard() {
    const [timeframe, setTimeframe] = useState(TIMEFRAMES[0]) // default 1H
    const [data, setData] = useState<TokenData[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [sortKey, setSortKey] = useState<SortKey>('flow_1h')
    const [sortDir, setSortDir] = useState<SortDirection>('desc')
    const [countdown, setCountdown] = useState(15)
    const [logs, setLogs] = useState<LogEntry[]>([])

    const addLog = useCallback((msg: string, type: LogEntry['type'] = 'default') => {
        const now = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
        setLogs(prev => [{ time: now, msg, type }, ...prev].slice(0, 50))
    }, [])

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDir(prev => prev === 'desc' ? 'asc' : 'desc')
        } else {
            setSortKey(key)
            setSortDir('desc')
        }
        addLog(`Sorting by ${String(key).toUpperCase()} (${sortDir === 'desc' ? 'ASC' : 'DESC'})`)
    }

    const sortedData = useMemo(() => {
        return [...data].sort((a, b) => {
            const valA = typeof a[sortKey] === 'string' ? (a[sortKey] as string) : (a[sortKey] as number) || 0
            const valB = typeof b[sortKey] === 'string' ? (b[sortKey] as string) : (b[sortKey] as number) || 0
            if (typeof valA === 'string' && typeof valB === 'string') {
                return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA)
            }
            return sortDir === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number)
        })
    }, [data, sortKey, sortDir])

    const fetchData = useCallback(async () => {
        setLoading(true)
        setError(null)
        addLog(`Initiating system scan [TF: ${timeframe.label}]...`, 'highlight')
        try {
            const res = await fetch(`/api/get-flows?timeframe=${timeframe.api}`)
            const json = await res.json()
            if (!res.ok) throw new Error(json.error || 'Failed to fetch')
            setData(json)
            addLog(`Scan complete. Detected ${json.length} high-signal entities.`, 'highlight')
            setCountdown(15)
        } catch (err: unknown) {
            console.error('Fetch error:', err)
            const errMsg = (err as Error).message
            setError(errMsg)
            addLog(`SCAN ERROR: ${errMsg}`, 'error')
            setData([])
        }
        setLoading(false)
    }, [timeframe, addLog])

    useEffect(() => {
        fetchData()
        const interval = setInterval(fetchData, 15000)
        return () => clearInterval(interval)
    }, [fetchData])

    useEffect(() => {
        const timer = setInterval(() => setCountdown(prev => (prev > 0 ? prev - 1 : 15)), 1000)
        return () => clearInterval(timer)
    }, [])

    const SortArrow = ({ col }: { col: SortKey }) => {
        if (sortKey !== col) return <span className="sort-indicator inactive">[-]</span>
        return <span className="sort-indicator active">{sortDir === 'desc' ? '[↓]' : '[↑]'}</span>
    }

    const columns: { key: SortKey; label: string; format: (t: TokenData) => string; align: string; color?: (t: TokenData) => string }[] = [
        { key: 'market_cap', label: 'MCAP', align: 'right', format: t => `$${formatNumber(t.market_cap)}` },
        { key: 'smart_wallets', label: 'SW', align: 'center', format: t => String(t.smart_wallets) },
        { key: 'flow_1h', label: '1H FLOW', align: 'right', format: t => formatFlow(t.flow_1h), color: t => t.flow_1h < 0 ? 'negative' : 'positive' },
        { key: 'flow_24h', label: '24H FLOW', align: 'right', format: t => formatFlow(t.flow_24h), color: t => t.flow_24h < 0 ? 'negative' : 'positive' },
        { key: 'flow_7d', label: '7D FLOW', align: 'right', format: t => formatFlow(t.flow_7d), color: t => t.flow_7d < 0 ? 'negative' : 'positive' },
    ]

    return (
        <div className="tracker-container">
            <div className="scanlines" />

            {/* Header */}
            <header className="tracker-header">
                <div className="glitch-wrapper">
                    <h1 className="tracker-title glitch" data-text="SOLANA MICROCAP SMART MONEY TRACKER">SOLANA MICROCAP SMART MONEY TRACKER</h1>
                </div>
                <p className="tracker-subtitle">SOURCE: <a href="https://nsn.ai/gamefi?utm_source=tracker" target="_blank" rel="noopener noreferrer">NANSEN_INTELLIGENCE_API</a> | TRACKING {data.length} TOKENS</p>
            </header>

            {/* Status Bar */}
            <div className="status-bar">
                <span className="status-item">
                    <span className={`status-dot ${countdown <= 5 ? 'warning' : ''}`} />
                    REFRESH: {countdown}s
                </span>
                <span className="status-divider">|</span>
                <span className="status-item">
                    NETWORK: <span className="positive">STABLE</span>
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
                {TIMEFRAMES.map(tf => (
                    <button
                        key={tf.label}
                        id={`tf-btn-${tf.label.toLowerCase()}`}
                        onClick={() => {
                            setTimeframe(tf)
                            const apiKeyToFieldMap: Record<string, SortKey> = {
                                '1h': 'flow_1h',
                                '24h': 'flow_24h',
                                '7d': 'flow_7d'
                            }
                            setSortKey(apiKeyToFieldMap[tf.api] || 'flow_1h')
                            setSortDir('desc')
                            addLog(`Timeframe changed to ${tf.label}`)
                        }}
                        className={`tf-btn ${timeframe.label === tf.label ? 'active' : ''}`}
                    >
                        {tf.label}
                    </button>
                ))}
                <button id="btn-refresh" onClick={fetchData} className="tf-btn refresh-btn">
                    ↻ REFRESH
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
                                <td colSpan={7} className="empty-state">
                                    <div className="empty-icon">[ ! ]</div>
                                    <p>{error ? `ERROR: ${error}` : 'NO SPECTRAL DATA DETECTED IN THIS TIMEFRAME'}</p>
                                    <button onClick={fetchData} className="retry-btn">RETRY SYSTEM SCAN</button>
                                </td>
                            </tr>
                        ) : (
                            sortedData.map((token, idx) => (
                                <tr key={`${token.symbol}-${idx}`} className="data-row">
                                    <td className="col-rank">{idx + 1}</td>
                                    <td className="col-symbol">
                                        <a
                                            href="https://nsn.ai/gamefi"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            {token.symbol} ↗
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

            {/* Terminal Log */}
            <div className="terminal-log">
                <div className="log-header">
                    <span>SYSTEM_LOG.TXT</span>
                    <span>ACTIVE_CONNECTION: NANSEN_AI_API</span>
                </div>
                <div className="log-content">
                    {logs.map((log, i) => (
                        <div key={i} className="log-entry">
                            <span className="log-time">[{log.time}]</span>
                            <span className={`log-msg ${log.type || ''}`}>{log.msg}</span>
                        </div>
                    ))}
                    {logs.length === 0 && (
                        <div className="log-entry">
                            <span className="log-time">[{new Date().toLocaleTimeString('en-US', { hour12: false })}]</span>
                            <span className="log-msg">Initializing terminal interface...</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <footer className="tracker-footer">
                Data updates every 15 seconds | Powered by Nansen Smart Money API | System v2.1.0
            </footer>
        </div>
    )
}
