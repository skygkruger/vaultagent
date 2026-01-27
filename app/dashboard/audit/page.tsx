'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

// ═══════════════════════════════════════════════════════════════
//  VAULTAGENT - AUDIT LOG PAGE
//  View security audit trail with tier-based retention
// ═══════════════════════════════════════════════════════════════

interface AuditLog {
  id: string
  action: string
  target: string | null
  agent_name: string | null
  ip_address: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

const ACTION_COLORS: Record<string, string> = {
  SECRET_CREATE: '#a8d8b9',
  SECRET_READ: '#7eb8da',
  SECRET_UPDATE: '#c4a7e7',
  SECRET_DELETE: '#eb6f92',
  SESSION_CREATE: '#a8d8b9',
  SESSION_REVOKE: '#eb6f92',
  VAULT_CREATE: '#a8d8b9',
  VAULT_DELETE: '#eb6f92',
  LOGIN: '#7eb8da',
  LOGOUT: '#6e6a86',
}

const ACTION_ICONS: Record<string, string> = {
  SECRET_CREATE: '[+]',
  SECRET_READ: '[>]',
  SECRET_UPDATE: '[~]',
  SECRET_DELETE: '[x]',
  SESSION_CREATE: '[+]',
  SESSION_REVOKE: '[x]',
  VAULT_CREATE: '[+]',
  VAULT_DELETE: '[x]',
  LOGIN: '[>]',
  LOGOUT: '[<]',
}

export default function AuditPage() {
  const { profile } = useAuth()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [retentionDays, setRetentionDays] = useState<number | null>(null)

  // Pagination
  const [offset, setOffset] = useState(0)
  const limit = 25

  // Filters
  const [actionFilter, setActionFilter] = useState('')
  const [agentFilter, setAgentFilter] = useState('')

  // Export state
  const [exporting, setExporting] = useState(false)

  // Fetch logs
  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      })

      if (actionFilter) params.set('action', actionFilter)
      if (agentFilter) params.set('agent', agentFilter)

      try {
        const response = await fetch(`/api/audit?${params}`)
        const data = await response.json()

        if (!response.ok) {
          setError(data.error || 'Failed to fetch audit logs')
        } else {
          setLogs(data.logs || [])
          setTotal(data.total || 0)
          setRetentionDays(data.retention_days)
        }
      } catch {
        setError('Failed to fetch audit logs')
      }

      setLoading(false)
    }

    fetchLogs()
  }, [offset, actionFilter, agentFilter])

  // Export logs
  const handleExport = async (format: 'json' | 'csv') => {
    setExporting(true)
    setError(null)

    try {
      const response = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format }),
      })

      if (!response.ok) {
        const data = await response.json()
        if (data.code === 'FEATURE_UNAVAILABLE') {
          setError(data.error)
        } else {
          setError(data.error || 'Failed to export logs')
        }
      } else {
        if (format === 'csv') {
          const blob = await response.blob()
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `vaultagent-audit-${new Date().toISOString().split('T')[0]}.csv`
          a.click()
          window.URL.revokeObjectURL(url)
        } else {
          const data = await response.json()
          const blob = new Blob([JSON.stringify(data.logs, null, 2)], {
            type: 'application/json',
          })
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `vaultagent-audit-${new Date().toISOString().split('T')[0]}.json`
          a.click()
          window.URL.revokeObjectURL(url)
        }
      }
    } catch {
      setError('Failed to export logs')
    }

    setExporting(false)
  }

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Unique actions for filter
  const uniqueActions = Array.from(new Set(logs.map((l) => l.action)))
  const uniqueAgents = Array.from(
    new Set(logs.filter((l) => l.agent_name).map((l) => l.agent_name!))
  )

  const totalPages = Math.ceil(total / limit)
  const currentPage = Math.floor(offset / limit) + 1

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-xl mb-2" style={{ color: '#a8d8b9' }}>
            [&gt;] Audit Log
          </h1>
          <p className="text-xs" style={{ color: '#6e6a86' }}>
            // security event trail
            {retentionDays !== null && retentionDays !== -1 && (
              <span> ({retentionDays} day retention)</span>
            )}
            {retentionDays === -1 && <span> (unlimited retention)</span>}
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => handleExport('csv')}
            disabled={exporting}
            className="text-xs px-3 py-2 disabled:opacity-50"
            style={{
              border: '1px solid #6e6a86',
              color: '#6e6a86',
              backgroundColor: 'transparent',
            }}
          >
            {exporting ? '[~]' : '[>] EXPORT CSV'}
          </button>
          <button
            onClick={() => handleExport('json')}
            disabled={exporting}
            className="text-xs px-3 py-2 disabled:opacity-50"
            style={{
              border: '1px solid #6e6a86',
              color: '#6e6a86',
              backgroundColor: 'transparent',
            }}
          >
            {exporting ? '[~]' : '[>] EXPORT JSON'}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          className="p-3 mb-6 text-xs"
          style={{
            backgroundColor: '#2a1a2e',
            border: '1px solid #eb6f92',
            color: '#eb6f92',
          }}
        >
          [!] {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div>
          <label className="block text-xs mb-2" style={{ color: '#6e6a86' }}>
            ACTION
          </label>
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value)
              setOffset(0)
            }}
            className="px-3 py-2 text-xs"
            style={{
              backgroundColor: '#252542',
              border: '1px solid #6e6a86',
              color: '#e8e3e3',
              minWidth: '150px',
            }}
          >
            <option value="">All Actions</option>
            {uniqueActions.map((action) => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs mb-2" style={{ color: '#6e6a86' }}>
            AGENT
          </label>
          <select
            value={agentFilter}
            onChange={(e) => {
              setAgentFilter(e.target.value)
              setOffset(0)
            }}
            className="px-3 py-2 text-xs"
            style={{
              backgroundColor: '#252542',
              border: '1px solid #6e6a86',
              color: '#e8e3e3',
              minWidth: '150px',
            }}
          >
            <option value="">All Agents</option>
            {uniqueAgents.map((agent) => (
              <option key={agent} value={agent}>
                {agent}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div style={{ border: '1px solid #6e6a86' }}>
        <div
          className="px-4 py-3 grid grid-cols-12 gap-4"
          style={{
            backgroundColor: '#252542',
            borderBottom: '1px solid #6e6a86',
          }}
        >
          <span className="text-xs col-span-2" style={{ color: '#6e6a86' }}>
            TIMESTAMP
          </span>
          <span className="text-xs col-span-2" style={{ color: '#6e6a86' }}>
            ACTION
          </span>
          <span className="text-xs col-span-3" style={{ color: '#6e6a86' }}>
            TARGET
          </span>
          <span className="text-xs col-span-2" style={{ color: '#6e6a86' }}>
            AGENT
          </span>
          <span className="text-xs col-span-3" style={{ color: '#6e6a86' }}>
            IP ADDRESS
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <p className="text-xs" style={{ color: '#6e6a86' }}>
              [~] Loading audit logs...
            </p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-xs" style={{ color: '#6e6a86' }}>
              No audit logs found.
            </p>
          </div>
        ) : (
          <div>
            {logs.map((log, i) => (
              <div
                key={log.id}
                className="px-4 py-3 grid grid-cols-12 gap-4 items-center"
                style={{
                  borderBottom: i < logs.length - 1 ? '1px solid #2a2a3e' : 'none',
                }}
              >
                <span className="text-xs col-span-2" style={{ color: '#6e6a86' }}>
                  {formatTimestamp(log.created_at)}
                </span>
                <span className="text-xs col-span-2 flex items-center gap-2">
                  <span style={{ color: ACTION_COLORS[log.action] || '#6e6a86' }}>
                    {ACTION_ICONS[log.action] || '[?]'}
                  </span>
                  <span style={{ color: ACTION_COLORS[log.action] || '#a8b2c3' }}>
                    {log.action}
                  </span>
                </span>
                <span className="text-xs col-span-3 truncate" style={{ color: '#e8e3e3' }}>
                  {log.target || '-'}
                </span>
                <span className="text-xs col-span-2" style={{ color: '#c4a7e7' }}>
                  {log.agent_name || '-'}
                </span>
                <span className="text-xs col-span-3" style={{ color: '#6e6a86' }}>
                  {log.ip_address || '-'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {total > limit && (
        <div className="flex justify-between items-center mt-4">
          <span className="text-xs" style={{ color: '#6e6a86' }}>
            Showing {offset + 1}-{Math.min(offset + limit, total)} of {total} events
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={offset === 0}
              className="text-xs px-3 py-1 disabled:opacity-50"
              style={{
                border: '1px solid #6e6a86',
                color: '#6e6a86',
              }}
            >
              [&lt;] PREV
            </button>
            <span className="text-xs px-3 py-1" style={{ color: '#6e6a86' }}>
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setOffset(offset + limit)}
              disabled={offset + limit >= total}
              className="text-xs px-3 py-1 disabled:opacity-50"
              style={{
                border: '1px solid #6e6a86',
                color: '#6e6a86',
              }}
            >
              NEXT [&gt;]
            </button>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div
        className="p-4 text-xs mt-6"
        style={{
          backgroundColor: '#252542',
          border: '1px solid #6e6a86',
        }}
      >
        <p style={{ color: '#a8d8b9', marginBottom: '8px' }}>[i] Audit Trail</p>
        <p style={{ color: '#6e6a86', lineHeight: '1.5' }}>
          All secret access, session creation, and security events are logged automatically.
          {profile?.tier === 'free' && (
            <span style={{ color: '#eb6f92' }}>
              {' '}
              Free tier has 7-day retention. Upgrade for longer retention and export capabilities.
            </span>
          )}
        </p>
      </div>
    </div>
  )
}
