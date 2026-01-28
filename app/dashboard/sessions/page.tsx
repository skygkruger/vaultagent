'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase'

// ═══════════════════════════════════════════════════════════════
//  VAULTAGENT - SESSIONS PAGE
//  Manage agent sessions and access tokens
// ═══════════════════════════════════════════════════════════════

interface Vault {
  id: string
  name: string
}

interface Secret {
  id: string
  name: string
  vault_id: string
}

interface Session {
  id: string
  vault_id: string
  agent_name: string
  allowed_secrets: string[]
  token: string
  expires_at: string
  created_at: string
  vaults?: { name: string }
}

export default function SessionsPage() {
  const { user, profile } = useAuth()
  const [sessions, setSessions] = useState<Session[]>([])
  const [vaults, setVaults] = useState<Vault[]>([])
  const [secrets, setSecrets] = useState<Secret[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // New session form
  const [showCreateSession, setShowCreateSession] = useState(false)
  const [agentName, setAgentName] = useState('')
  const [selectedVault, setSelectedVault] = useState('')
  const [selectedSecrets, setSelectedSecrets] = useState<string[]>([])
  const [expiresIn, setExpiresIn] = useState('24') // hours
  const [creating, setCreating] = useState(false)

  // Copy token state
  const [copiedToken, setCopiedToken] = useState<string | null>(null)

  const supabase = createClient()

  // Fetch sessions, vaults, and secrets
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return

      // Fetch sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('sessions')
        .select('*, vaults(name)')
        .order('created_at', { ascending: false })

      if (sessionsError) {
        setError(sessionsError.message)
      } else {
        setSessions(sessionsData || [])
      }

      // Fetch vaults
      const { data: vaultsData } = await supabase
        .from('vaults')
        .select('id, name')
        .order('name')

      setVaults(vaultsData || [])
      if (vaultsData && vaultsData.length > 0 && !selectedVault) {
        setSelectedVault(vaultsData[0].id)
      }

      // Fetch all secrets
      const { data: secretsData } = await supabase
        .from('secrets')
        .select('id, name, vault_id')
        .order('name')

      setSecrets(secretsData || [])

      setLoading(false)
    }

    fetchData()
  }, [user])

  // Filter secrets by selected vault
  const vaultSecrets = secrets.filter((s) => s.vault_id === selectedVault)

  // Create new session
  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setCreating(true)

    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vault_id: selectedVault,
          agent_name: agentName,
          allowed_secrets: selectedSecrets,
          expires_in_hours: parseInt(expiresIn),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.code === 'LIMIT_REACHED') {
          setError(data.error)
        } else {
          setError(data.error || 'Failed to create session')
        }
      } else {
        // Refresh sessions list
        const { data: sessionsData } = await supabase
          .from('sessions')
          .select('*, vaults(name)')
          .order('created_at', { ascending: false })

        setSessions(sessionsData || [])

        setSuccess(`Session created! Token: ${data.session.token}`)
        setShowCreateSession(false)
        setAgentName('')
        setSelectedSecrets([])
        setExpiresIn('24')
      }
    } catch {
      setError('Failed to create session')
    }

    setCreating(false)
  }

  // Revoke session
  const handleRevokeSession = async (sessionId: string, agentName: string) => {
    if (!confirm(`Revoke session for "${agentName}"? The agent will lose access immediately.`)) {
      return
    }

    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Failed to revoke session')
      } else {
        setSessions(sessions.filter((s) => s.id !== sessionId))
        setSuccess('Session revoked')
      }
    } catch {
      setError('Failed to revoke session')
    }
  }

  // Copy token to clipboard
  const handleCopyToken = (token: string) => {
    navigator.clipboard.writeText(token)
    setCopiedToken(token)
    setTimeout(() => setCopiedToken(null), 2000)
  }

  // Toggle secret selection
  const toggleSecret = (secretId: string) => {
    setSelectedSecrets((prev) =>
      prev.includes(secretId) ? prev.filter((id) => id !== secretId) : [...prev, secretId]
    )
  }

  // Check if session is expired
  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date()

  // Format time remaining
  const formatTimeRemaining = (expiresAt: string) => {
    const now = new Date()
    const expires = new Date(expiresAt)
    const diff = expires.getTime() - now.getTime()

    if (diff <= 0) return 'Expired'

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (hours > 24) {
      const days = Math.floor(hours / 24)
      return `${days}d ${hours % 24}h`
    }
    return `${hours}h ${minutes}m`
  }

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-xs" style={{ color: '#5f5d64' }}>
          [~] Loading sessions...
        </p>
      </div>
    )
  }

  const activeSessions = sessions.filter((s) => !isExpired(s.expires_at))
  const expiredSessions = sessions.filter((s) => isExpired(s.expires_at))

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-lg sm:text-xl mb-2" style={{ color: '#a8d8b9' }}>
            [~] Agent Sessions
          </h1>
          <p className="text-xs" style={{ color: '#5f5d64' }}>
            {`// time-limited access tokens for AI agents`}
          </p>
        </div>
        <button
          onClick={() => setShowCreateSession(!showCreateSession)}
          className="text-xs px-4 py-2 w-full sm:w-auto"
          style={{
            border: '1px solid #a8d8b9',
            color: '#a8d8b9',
            backgroundColor: 'transparent',
          }}
        >
          {showCreateSession ? '[x] CANCEL' : '[+] NEW SESSION'}
        </button>
      </div>

      {/* Alerts */}
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

      {success && (
        <div
          className="p-3 mb-6 text-xs"
          style={{
            backgroundColor: '#1a2e1a',
            border: '1px solid #a8d8b9',
            color: '#a8d8b9',
          }}
        >
          [✓] {success}
        </div>
      )}

      {/* Create Session Form */}
      {showCreateSession && (
        <div
          className="mb-6 p-4"
          style={{ border: '1px solid #5f5d64', backgroundColor: '#1e1e2e' }}
        >
          <h2 className="text-sm mb-4" style={{ color: '#a8d8b9' }}>
            Create New Session
          </h2>
          <form onSubmit={handleCreateSession}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs mb-2" style={{ color: '#5f5d64' }}>
                  AGENT NAME
                </label>
                <input
                  type="text"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  placeholder="cursor-ai"
                  required
                  className="w-full px-3 py-2 text-xs"
                  style={{
                    backgroundColor: '#252542',
                    border: '1px solid #5f5d64',
                    color: '#e8e3e3',
                  }}
                />
              </div>
              <div>
                <label className="block text-xs mb-2" style={{ color: '#5f5d64' }}>
                  VAULT
                </label>
                <select
                  value={selectedVault}
                  onChange={(e) => {
                    setSelectedVault(e.target.value)
                    setSelectedSecrets([])
                  }}
                  required
                  className="w-full px-3 py-2 text-xs"
                  style={{
                    backgroundColor: '#252542',
                    border: '1px solid #5f5d64',
                    color: '#e8e3e3',
                  }}
                >
                  {vaults.map((vault) => (
                    <option key={vault.id} value={vault.id}>
                      {vault.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs mb-2" style={{ color: '#5f5d64' }}>
                ALLOWED SECRETS
              </label>
              {vaultSecrets.length === 0 ? (
                <p className="text-xs" style={{ color: '#5f5d64' }}>
                  No secrets in this vault. Add secrets first.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {vaultSecrets.map((secret) => (
                    <button
                      key={secret.id}
                      type="button"
                      onClick={() => toggleSecret(secret.id)}
                      className="px-3 py-1 text-xs"
                      style={{
                        border: `1px solid ${selectedSecrets.includes(secret.id) ? '#a8d8b9' : '#5f5d64'}`,
                        backgroundColor: selectedSecrets.includes(secret.id) ? '#252542' : 'transparent',
                        color: selectedSecrets.includes(secret.id) ? '#a8d8b9' : '#5f5d64',
                      }}
                    >
                      {selectedSecrets.includes(secret.id) ? '[✓] ' : '[ ] '}
                      {secret.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs mb-2" style={{ color: '#5f5d64' }}>
                  EXPIRES IN (HOURS)
                </label>
                <select
                  value={expiresIn}
                  onChange={(e) => setExpiresIn(e.target.value)}
                  className="w-full px-3 py-2 text-xs"
                  style={{
                    backgroundColor: '#252542',
                    border: '1px solid #5f5d64',
                    color: '#e8e3e3',
                  }}
                >
                  <option value="1">1 hour</option>
                  <option value="4">4 hours</option>
                  <option value="8">8 hours</option>
                  <option value="24">24 hours</option>
                  <option value="72">3 days</option>
                  <option value="168">7 days</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={creating || selectedSecrets.length === 0}
                className="px-4 py-2 text-xs disabled:opacity-50"
                style={{
                  backgroundColor: '#a8d8b9',
                  color: '#1a1a2e',
                }}
              >
                {creating ? '[~] CREATING...' : '[>] CREATE SESSION'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Active Sessions */}
      <div className="mb-6" style={{ border: '1px solid #5f5d64' }}>
        <div
          className="px-4 py-3"
          style={{
            backgroundColor: '#252542',
            borderBottom: '1px solid #5f5d64',
          }}
        >
          <span className="text-xs" style={{ color: '#a8d8b9' }}>
            ACTIVE SESSIONS ({activeSessions.length})
          </span>
        </div>

        {activeSessions.length === 0 ? (
          <div className="p-6 sm:p-8 text-center">
            <p className="text-xs" style={{ color: '#5f5d64' }}>
              No active sessions. Create one to grant agent access.
            </p>
          </div>
        ) : (
          <div>
            {activeSessions.map((session, i) => (
              <div
                key={session.id}
                className="px-3 sm:px-4 py-3"
                style={{
                  borderBottom:
                    i < activeSessions.length - 1 ? '1px solid #2a2a3e' : 'none',
                }}
              >
                {/* Session Header - Mobile Stack */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-2">
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    <span style={{ color: '#a8d8b9' }}>[~]</span>
                    <span style={{ color: '#e8e3e3' }}>{session.agent_name}</span>
                    <span
                      className="px-2 py-0.5 text-xs"
                      style={{
                        border: '1px solid #5f5d64',
                        color: '#5f5d64',
                      }}
                    >
                      {session.vaults?.name || 'Unknown Vault'}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                    <span
                      className="text-xs"
                      style={{ color: '#a8d8b9' }}
                    >
                      {formatTimeRemaining(session.expires_at)} remaining
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopyToken(session.token)}
                        className="text-xs px-2 py-1"
                        style={{
                          border: '1px solid #5f5d64',
                          color: copiedToken === session.token ? '#a8d8b9' : '#5f5d64',
                        }}
                      >
                        {copiedToken === session.token ? '[✓] COPIED' : '[>] COPY'}
                      </button>
                      <button
                        onClick={() => handleRevokeSession(session.id, session.agent_name)}
                        className="text-xs px-2 py-1"
                        style={{ color: '#eb6f92' }}
                      >
                        [x] REVOKE
                      </button>
                    </div>
                  </div>
                </div>
                {/* Secrets Tags */}
                <div className="flex flex-wrap gap-2 ml-0 sm:ml-8">
                  {session.allowed_secrets.map((secretId) => {
                    const secret = secrets.find((s) => s.id === secretId)
                    return (
                      <span
                        key={secretId}
                        className="text-xs px-2 py-0.5"
                        style={{
                          backgroundColor: '#252542',
                          color: '#5f5d64',
                        }}
                      >
                        {secret?.name || secretId}
                      </span>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Expired Sessions */}
      {expiredSessions.length > 0 && (
        <div style={{ border: '1px solid #5f5d64' }}>
          <div
            className="px-4 py-3"
            style={{
              backgroundColor: '#252542',
              borderBottom: '1px solid #5f5d64',
            }}
          >
            <span className="text-xs" style={{ color: '#5f5d64' }}>
              EXPIRED SESSIONS ({expiredSessions.length})
            </span>
          </div>
          <div>
            {expiredSessions.slice(0, 5).map((session, i) => (
              <div
                key={session.id}
                className="px-4 py-3 flex items-center justify-between opacity-50"
                style={{
                  borderBottom:
                    i < Math.min(expiredSessions.length, 5) - 1
                      ? '1px solid #2a2a3e'
                      : 'none',
                }}
              >
                <div className="flex items-center gap-3">
                  <span style={{ color: '#5f5d64' }}>[x]</span>
                  <span style={{ color: '#5f5d64' }}>{session.agent_name}</span>
                </div>
                <span className="text-xs" style={{ color: '#eb6f92' }}>
                  Expired {new Date(session.expires_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Box */}
      <div
        className="p-4 text-xs mt-6"
        style={{
          backgroundColor: '#252542',
          border: '1px solid #5f5d64',
        }}
      >
        <p style={{ color: '#a8d8b9', marginBottom: '8px' }}>[i] Session Tokens</p>
        <p style={{ color: '#5f5d64', lineHeight: '1.5' }}>
          Sessions grant time-limited access to specific secrets. Share the token with your AI agent
          via environment variable. When the session expires, the agent loses access automatically.
          {profile?.tier === 'free' && (
            <span style={{ color: '#eb6f92' }}>
              {' '}
              Free tier is limited to 50 sessions per day.
            </span>
          )}
        </p>
      </div>
    </div>
  )
}
