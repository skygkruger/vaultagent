'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase'
import { encryptSecret, maskSecret } from '@/lib/encryption'
import { getTierLimits } from '@/lib/tier-limits'

// Helper to safely create Supabase client
function getSupabase() {
  try {
    return createClient()
  } catch {
    return null
  }
}

// ═══════════════════════════════════════════════════════════════
//  VAULTAGENT - DASHBOARD (VAULT VIEW)
//  Manage vaults and secrets
// ═══════════════════════════════════════════════════════════════

interface Vault {
  id: string
  name: string
  description: string | null
  created_at: string
}

interface Secret {
  id: string
  vault_id: string
  name: string
  encrypted_value: string
  iv: string
  salt: string
  created_at: string
  last_accessed_at: string | null
}

export default function DashboardPage() {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [vaults, setVaults] = useState<Vault[]>([])
  const [secrets, setSecrets] = useState<Secret[]>([])
  const [selectedVault, setSelectedVault] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [syncingStripe, setSyncingStripe] = useState(false)

  // New secret form
  const [showAddSecret, setShowAddSecret] = useState(false)
  const [newSecretName, setNewSecretName] = useState('')
  const [newSecretValue, setNewSecretValue] = useState('')
  const [masterPassword, setMasterPassword] = useState('')
  const [saving, setSaving] = useState(false)

  // New vault form
  const [showAddVault, setShowAddVault] = useState(false)
  const [newVaultName, setNewVaultName] = useState('')
  const [newVaultDescription, setNewVaultDescription] = useState('')
  const [creatingVault, setCreatingVault] = useState(false)

  // Sync Stripe subscription when returning from checkout
  useEffect(() => {
    const checkoutStatus = searchParams.get('checkout')
    if (checkoutStatus === 'success' && user && !syncingStripe) {
      setSyncingStripe(true)

      fetch('/api/stripe/sync', { method: 'POST' })
        .then(res => res.json())
        .then(data => {
          console.log('Stripe sync result:', data)
          if (data.synced) {
            // Refresh the profile to get updated tier
            refreshProfile()
            // Remove query param
            router.replace('/dashboard', { scroll: false })
          }
        })
        .catch(err => console.error('Stripe sync error:', err))
        .finally(() => setSyncingStripe(false))
    }
  }, [searchParams, user, syncingStripe, refreshProfile, router])

  // Fetch vaults - simplified with hard timeout
  useEffect(() => {
    let isMounted = true

    // Hard timeout for this page's loading state
    const timeout = setTimeout(() => {
      if (isMounted && loading) {
        setLoading(false)
      }
    }, 2000)

    const fetchVaults = async () => {
      // Don't fetch if auth is still loading
      if (authLoading) return

      // Don't fetch if no user
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const supabase = getSupabase()
        if (!supabase) {
          setLoading(false)
          return
        }

        const { data, error: fetchError } = await supabase
          .from('vaults')
          .select('*')
          .order('created_at', { ascending: true })

        if (!isMounted) return

        if (fetchError) {
          console.error('Vault fetch error:', fetchError)
          setError(fetchError.message)
        } else {
          setVaults(data || [])
          if (data && data.length > 0 && !selectedVault) {
            setSelectedVault(data[0].id)
          }
        }
      } catch (err) {
        console.error('Vault fetch exception:', err)
        if (isMounted) setError('Failed to load vaults')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchVaults()

    return () => {
      isMounted = false
      clearTimeout(timeout)
    }
  }, [user, authLoading])

  // Fetch secrets when vault changes
  useEffect(() => {
    const fetchSecrets = async () => {
      if (!selectedVault) return

      try {
        const supabase = getSupabase()
        if (!supabase) return

        const { data, error: fetchError } = await supabase
          .from('secrets')
          .select('*')
          .eq('vault_id', selectedVault)
          .order('created_at', { ascending: false })

        if (fetchError) {
          setError(fetchError.message)
        } else {
          setSecrets(data || [])
        }
      } catch (err) {
        console.error('Failed to fetch secrets:', err)
      }
    }

    fetchSecrets()
  }, [selectedVault])

  // Auto-dismiss errors after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  // Add new secret
  const handleAddSecret = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('[handleAddSecret] Starting...', { selectedVault, hasPassword: !!masterPassword })

    if (!selectedVault || !masterPassword) {
      console.log('[handleAddSecret] Missing vault or password')
      return
    }

    const supabase = getSupabase()
    if (!supabase) {
      setError('Database connection failed')
      return
    }

    setError(null)
    setSaving(true)
    console.log('[handleAddSecret] Set saving=true')

    try {
      // Check secret limit
      const currentSecretCount = secrets.length
      const tierLimits = getTierLimits(profile?.tier)
      console.log('[handleAddSecret] Tier limits:', tierLimits, 'Current count:', currentSecretCount)

      if (tierLimits.secret_limit !== -1 && currentSecretCount >= tierLimits.secret_limit) {
        setError(`You've reached your secret limit (${tierLimits.secret_limit}). Upgrade to add more.`)
        setSaving(false)
        return
      }

      // Check if crypto.subtle is available
      if (typeof crypto === 'undefined' || !crypto.subtle) {
        throw new Error('Web Crypto API not available. Please use HTTPS.')
      }
      console.log('[handleAddSecret] Crypto API available, starting encryption...')

      // Encrypt the secret client-side
      const encrypted = await encryptSecret(newSecretValue, masterPassword)
      console.log('[handleAddSecret] Encryption complete')

      // Save to database
      // Verify we have required data
      if (!user?.id) {
        throw new Error('No user ID available')
      }
      if (!selectedVault) {
        throw new Error('No vault selected')
      }

      console.log('[handleAddSecret] Starting Supabase insert...', {
        vault_id: selectedVault,
        user_id: user.id,
        name: newSecretName.toUpperCase().replace(/\s+/g, '_'),
      })

      const { error: insertError } = await supabase
        .from('secrets')
        .insert({
          vault_id: selectedVault,
          user_id: user?.id,
          name: newSecretName.toUpperCase().replace(/\s+/g, '_'),
          encrypted_value: encrypted.encrypted,
          iv: encrypted.iv,
          salt: encrypted.salt,
        })

      console.log('[handleAddSecret] Insert complete, error:', insertError)

      if (insertError) {
        setError(insertError.message)
      } else {
        // Refresh secrets
        const { data } = await supabase
          .from('secrets')
          .select('*')
          .eq('vault_id', selectedVault)
          .order('created_at', { ascending: false })

        setSecrets(data || [])
        setNewSecretName('')
        setNewSecretValue('')
        setMasterPassword('')
        setShowAddSecret(false)

        // Log the action
        await supabase.from('audit_logs').insert({
          user_id: user?.id,
          action: 'SECRET_CREATE',
          target: newSecretName.toUpperCase().replace(/\s+/g, '_'),
        })
      }
    } catch (err) {
      console.error('Secret creation error:', err)
      setError(err instanceof Error ? err.message : 'Failed to encrypt secret')
    } finally {
      setSaving(false)
    }
  }

  // Create new vault
  const handleCreateVault = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setCreatingVault(true)

    try {
      const response = await fetch('/api/vaults', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newVaultName,
          description: newVaultDescription || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.code === 'LIMIT_REACHED') {
          setError(data.error)
        } else {
          setError(data.error || 'Failed to create vault')
        }
      } else {
        // Add to vaults list and select it
        setVaults([...vaults, data.vault])
        setSelectedVault(data.vault.id)
        setNewVaultName('')
        setNewVaultDescription('')
        setShowAddVault(false)
      }
    } catch {
      setError('Failed to create vault')
    }

    setCreatingVault(false)
  }

  // Delete vault
  const handleDeleteVault = async (vaultId: string, vaultName: string) => {
    if (!confirm(`Delete vault "${vaultName}"? All secrets in this vault will be deleted. This cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/vaults/${vaultId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Failed to delete vault')
      } else {
        const newVaults = vaults.filter((v) => v.id !== vaultId)
        setVaults(newVaults)
        if (selectedVault === vaultId) {
          setSelectedVault(newVaults[0]?.id || null)
        }
        setSecrets([])
      }
    } catch {
      setError('Failed to delete vault')
    }
  }

  // Delete secret
  const handleDeleteSecret = async (secretId: string, secretName: string) => {
    if (!confirm(`Delete secret "${secretName}"? This cannot be undone.`)) return

    const supabase = getSupabase()
    if (!supabase) {
      setError('Database connection failed')
      return
    }

    const { error: deleteError } = await supabase
      .from('secrets')
      .delete()
      .eq('id', secretId)

    if (deleteError) {
      setError(deleteError.message)
    } else {
      setSecrets(secrets.filter((s) => s.id !== secretId))

      // Log the action
      await supabase.from('audit_logs').insert({
        user_id: user?.id,
        action: 'SECRET_DELETE',
        target: secretName,
      })
    }
  }

  const selectedVaultData = vaults.find((v) => v.id === selectedVault)

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-xs" style={{ color: '#5f5d64' }}>
          [~] Loading vault...
        </p>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-lg sm:text-xl mb-2" style={{ color: '#a8d8b9' }}>
            [/] Your Vault
          </h1>
          <p className="text-xs" style={{ color: '#5f5d64' }}>
            {`// encrypted secrets, zero-knowledge storage`}
          </p>
        </div>

        {/* Vault Selector and Create */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
          {vaults.length > 0 && (
            <select
              value={selectedVault || ''}
              onChange={(e) => setSelectedVault(e.target.value)}
              className="px-3 py-2 text-xs w-full sm:w-auto"
              style={{
                backgroundColor: '#1a211d',
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
          )}
          <button
            onClick={() => setShowAddVault(!showAddVault)}
            className="text-xs px-3 py-2 whitespace-nowrap"
            style={{
              border: '1px solid #a8d8b9',
              color: '#a8d8b9',
              backgroundColor: 'transparent',
            }}
          >
            {showAddVault ? '[x] CANCEL' : '[+] NEW VAULT'}
          </button>
        </div>
      </div>

      {error && (
        <div
          className="p-3 mb-6 text-xs flex justify-between items-center"
          style={{
            backgroundColor: '#1e1517',
            border: '1px solid #eb6f92',
            color: '#eb6f92',
          }}
        >
          <span>[!] {error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-4 hover:opacity-70"
            style={{ color: '#eb6f92' }}
          >
            [x]
          </button>
        </div>
      )}

      {/* Create Vault Form */}
      {showAddVault && (
        <div
          className="mb-6 p-4"
          style={{ border: '1px solid #5f5d64', backgroundColor: '#1e1e2e' }}
        >
          <h2 className="text-sm mb-4" style={{ color: '#a8d8b9' }}>
            Create New Vault
          </h2>
          <form onSubmit={handleCreateVault}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs mb-2" style={{ color: '#5f5d64' }}>
                  VAULT NAME
                </label>
                <input
                  type="text"
                  value={newVaultName}
                  onChange={(e) => setNewVaultName(e.target.value)}
                  placeholder="production"
                  required
                  className="w-full px-3 py-2 text-xs"
                  style={{
                    backgroundColor: '#1a211d',
                    border: '1px solid #5f5d64',
                    color: '#e8e3e3',
                  }}
                />
              </div>
              <div>
                <label className="block text-xs mb-2" style={{ color: '#5f5d64' }}>
                  DESCRIPTION (OPTIONAL)
                </label>
                <input
                  type="text"
                  value={newVaultDescription}
                  onChange={(e) => setNewVaultDescription(e.target.value)}
                  placeholder="Production API keys"
                  className="w-full px-3 py-2 text-xs"
                  style={{
                    backgroundColor: '#1a211d',
                    border: '1px solid #5f5d64',
                    color: '#e8e3e3',
                  }}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={creatingVault}
                className="px-4 py-2 text-xs disabled:opacity-50"
                style={{
                  backgroundColor: '#a8d8b9',
                  color: '#141a17',
                }}
              >
                {creatingVault ? '[~] CREATING...' : '[>] CREATE VAULT'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* No Vaults Message */}
      {vaults.length === 0 && !showAddVault && (
        <div
          className="p-8 text-center mb-6"
          style={{ border: '1px solid #5f5d64' }}
        >
          <p className="text-sm mb-4" style={{ color: '#a8d8b9' }}>
            [/] No vaults yet
          </p>
          <p className="text-xs mb-6" style={{ color: '#5f5d64' }}>
            Create your first vault to start storing encrypted secrets.
          </p>
          <button
            onClick={() => setShowAddVault(true)}
            className="px-4 py-2 text-xs"
            style={{
              backgroundColor: '#a8d8b9',
              color: '#141a17',
            }}
          >
            [+] CREATE YOUR FIRST VAULT
          </button>
        </div>
      )}

      {/* Secrets List - only show when vaults exist */}
      {vaults.length > 0 && (
      <div
        className="mb-6"
        style={{ border: '1px solid #5f5d64' }}
      >
        <div
          className="px-4 py-3 flex justify-between items-center"
          style={{
            backgroundColor: '#1a211d',
            borderBottom: '1px solid #5f5d64',
          }}
        >
          <span className="text-xs" style={{ color: '#a8d8b9' }}>
            SECRETS IN {selectedVaultData?.name?.toUpperCase() || 'VAULT'}
          </span>
          <button
            onClick={() => setShowAddSecret(!showAddSecret)}
            className="text-xs px-3 py-1"
            style={{
              border: '1px solid #a8d8b9',
              color: '#a8d8b9',
              backgroundColor: 'transparent',
            }}
          >
            {showAddSecret ? '[x] CANCEL' : '[+] ADD'}
          </button>
        </div>

        {/* Add Secret Form */}
        {showAddSecret && (
          <form
            onSubmit={handleAddSecret}
            className="p-4 border-b"
            style={{ borderColor: '#5f5d64', backgroundColor: '#1e1e2e' }}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-xs mb-2" style={{ color: '#5f5d64' }}>
                  SECRET NAME
                </label>
                <input
                  type="text"
                  value={newSecretName}
                  onChange={(e) => setNewSecretName(e.target.value)}
                  placeholder="OPENAI_API_KEY"
                  required
                  className="w-full px-3 py-2 text-xs"
                  style={{
                    backgroundColor: '#1a211d',
                    border: '1px solid #5f5d64',
                    color: '#e8e3e3',
                  }}
                />
              </div>
              <div>
                <label className="block text-xs mb-2" style={{ color: '#5f5d64' }}>
                  SECRET VALUE
                </label>
                <input
                  type="password"
                  value={newSecretValue}
                  onChange={(e) => setNewSecretValue(e.target.value)}
                  placeholder="sk-xxxxxxxxxxxxxxxx"
                  required
                  className="w-full px-3 py-2 text-xs"
                  style={{
                    backgroundColor: '#1a211d',
                    border: '1px solid #5f5d64',
                    color: '#e8e3e3',
                  }}
                />
              </div>
              <div>
                <label className="block text-xs mb-2" style={{ color: '#5f5d64' }}>
                  MASTER PASSWORD
                </label>
                <input
                  type="password"
                  value={masterPassword}
                  onChange={(e) => setMasterPassword(e.target.value)}
                  placeholder="Your encryption password"
                  required
                  className="w-full px-3 py-2 text-xs"
                  style={{
                    backgroundColor: '#1a211d',
                    border: '1px solid #5f5d64',
                    color: '#e8e3e3',
                  }}
                />
              </div>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-xs" style={{ color: '#5f5d64' }}>
                {`// encrypted client-side before upload`}
              </p>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-xs disabled:opacity-50"
                style={{
                  backgroundColor: '#a8d8b9',
                  color: '#141a17',
                }}
              >
                {saving ? '[~] ENCRYPTING...' : '[>] STORE SECRET'}
              </button>
            </div>
          </form>
        )}

        {/* Secrets Table */}
        {secrets.length === 0 ? (
          <div className="p-6 sm:p-8 text-center">
            <p className="text-xs" style={{ color: '#5f5d64' }}>
              No secrets yet. Click [+] ADD to store your first secret.
            </p>
          </div>
        ) : (
          <div>
            {secrets.map((secret, i) => (
              <div
                key={secret.id}
                className="px-3 sm:px-4 py-3"
                style={{
                  borderBottom: i < secrets.length - 1 ? '1px solid #2a2a3e' : 'none',
                }}
              >
                {/* Mobile: Stack layout */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                  <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                    <span style={{ color: '#a8d8b9' }}>[/]</span>
                    <span className="truncate" style={{ color: '#e8e3e3' }}>{secret.name}</span>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6 pl-6 sm:pl-0">
                    <div className="flex items-center gap-3 sm:gap-6 text-xs" style={{ color: '#5f5d64' }}>
                      <span className="hidden sm:inline">
                        {maskSecret(secret.encrypted_value.substring(0, 20))}
                      </span>
                      <span>
                        {secret.last_accessed_at
                          ? new Date(secret.last_accessed_at).toLocaleDateString()
                          : 'never'}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteSecret(secret.id, secret.name)}
                      className="text-xs px-2 py-1 flex-shrink-0"
                      style={{ color: '#eb6f92' }}
                    >
                      [x]
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      )}

      {/* Info Box */}
      <div
        className="p-4 text-xs"
        style={{
          backgroundColor: '#1a211d',
          border: '1px solid #5f5d64',
        }}
      >
        <p style={{ color: '#a8d8b9', marginBottom: '8px' }}>[i] Zero-Knowledge Encryption</p>
        <p style={{ color: '#5f5d64', lineHeight: '1.5' }}>
          Your secrets are encrypted with your master password before they leave your browser.
          We store only encrypted blobs that we cannot decrypt. Keep your master password safe -
          if you lose it, we cannot recover your secrets.
        </p>
      </div>
    </div>
  )
}
