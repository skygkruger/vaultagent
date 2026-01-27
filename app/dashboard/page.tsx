'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase'
import { encryptSecret, maskSecret } from '@/lib/encryption'

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
  const { user, profile } = useAuth()
  const [vaults, setVaults] = useState<Vault[]>([])
  const [secrets, setSecrets] = useState<Secret[]>([])
  const [selectedVault, setSelectedVault] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  const supabase = createClient()

  // Fetch vaults
  useEffect(() => {
    const fetchVaults = async () => {
      if (!user) return

      const { data, error } = await supabase
        .from('vaults')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) {
        setError(error.message)
      } else {
        setVaults(data || [])
        if (data && data.length > 0 && !selectedVault) {
          setSelectedVault(data[0].id)
        }
      }
      setLoading(false)
    }

    fetchVaults()
  }, [user])

  // Fetch secrets when vault changes
  useEffect(() => {
    const fetchSecrets = async () => {
      if (!selectedVault) return

      const { data, error } = await supabase
        .from('secrets')
        .select('*')
        .eq('vault_id', selectedVault)
        .order('created_at', { ascending: false })

      if (error) {
        setError(error.message)
      } else {
        setSecrets(data || [])
      }
    }

    fetchSecrets()
  }, [selectedVault])

  // Add new secret
  const handleAddSecret = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedVault || !masterPassword) return

    setError(null)
    setSaving(true)

    try {
      // Check secret limit
      const currentSecretCount = secrets.length
      const limit = profile?.secret_limit || 10
      if (limit !== -1 && currentSecretCount >= limit) {
        setError(`You've reached your secret limit (${limit}). Upgrade to add more.`)
        setSaving(false)
        return
      }

      // Encrypt the secret client-side
      const encrypted = await encryptSecret(newSecretValue, masterPassword)

      // Save to database
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
      setError('Failed to encrypt secret')
    }

    setSaving(false)
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
        <p className="text-xs" style={{ color: '#6e6a86' }}>
          [~] Loading vault...
        </p>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-xl mb-2" style={{ color: '#a8d8b9' }}>
            [/] Your Vault
          </h1>
          <p className="text-xs" style={{ color: '#6e6a86' }}>
            {`// encrypted secrets, zero-knowledge storage`}
          </p>
        </div>

        {/* Vault Selector and Create */}
        <div className="flex items-center gap-4">
          {vaults.length > 0 && (
            <select
              value={selectedVault || ''}
              onChange={(e) => setSelectedVault(e.target.value)}
              className="px-3 py-2 text-xs"
              style={{
                backgroundColor: '#252542',
                border: '1px solid #6e6a86',
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
            className="text-xs px-3 py-2"
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

      {/* Create Vault Form */}
      {showAddVault && (
        <div
          className="mb-6 p-4"
          style={{ border: '1px solid #6e6a86', backgroundColor: '#1e1e2e' }}
        >
          <h2 className="text-sm mb-4" style={{ color: '#a8d8b9' }}>
            Create New Vault
          </h2>
          <form onSubmit={handleCreateVault}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs mb-2" style={{ color: '#6e6a86' }}>
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
                    backgroundColor: '#252542',
                    border: '1px solid #6e6a86',
                    color: '#e8e3e3',
                  }}
                />
              </div>
              <div>
                <label className="block text-xs mb-2" style={{ color: '#6e6a86' }}>
                  DESCRIPTION (OPTIONAL)
                </label>
                <input
                  type="text"
                  value={newVaultDescription}
                  onChange={(e) => setNewVaultDescription(e.target.value)}
                  placeholder="Production API keys"
                  className="w-full px-3 py-2 text-xs"
                  style={{
                    backgroundColor: '#252542',
                    border: '1px solid #6e6a86',
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
                  color: '#1a1a2e',
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
          style={{ border: '1px solid #6e6a86' }}
        >
          <p className="text-sm mb-4" style={{ color: '#a8d8b9' }}>
            [/] No vaults yet
          </p>
          <p className="text-xs mb-6" style={{ color: '#6e6a86' }}>
            Create your first vault to start storing encrypted secrets.
          </p>
          <button
            onClick={() => setShowAddVault(true)}
            className="px-4 py-2 text-xs"
            style={{
              backgroundColor: '#a8d8b9',
              color: '#1a1a2e',
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
        style={{ border: '1px solid #6e6a86' }}
      >
        <div
          className="px-4 py-3 flex justify-between items-center"
          style={{
            backgroundColor: '#252542',
            borderBottom: '1px solid #6e6a86',
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
            style={{ borderColor: '#6e6a86', backgroundColor: '#1e1e2e' }}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-xs mb-2" style={{ color: '#6e6a86' }}>
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
                    backgroundColor: '#252542',
                    border: '1px solid #6e6a86',
                    color: '#e8e3e3',
                  }}
                />
              </div>
              <div>
                <label className="block text-xs mb-2" style={{ color: '#6e6a86' }}>
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
                    backgroundColor: '#252542',
                    border: '1px solid #6e6a86',
                    color: '#e8e3e3',
                  }}
                />
              </div>
              <div>
                <label className="block text-xs mb-2" style={{ color: '#6e6a86' }}>
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
                    backgroundColor: '#252542',
                    border: '1px solid #6e6a86',
                    color: '#e8e3e3',
                  }}
                />
              </div>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-xs" style={{ color: '#6e6a86' }}>
                {`// encrypted client-side before upload`}
              </p>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-xs disabled:opacity-50"
                style={{
                  backgroundColor: '#a8d8b9',
                  color: '#1a1a2e',
                }}
              >
                {saving ? '[~] ENCRYPTING...' : '[>] STORE SECRET'}
              </button>
            </div>
          </form>
        )}

        {/* Secrets Table */}
        {secrets.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-xs" style={{ color: '#6e6a86' }}>
              No secrets yet. Click [+] ADD to store your first secret.
            </p>
          </div>
        ) : (
          <div>
            {secrets.map((secret, i) => (
              <div
                key={secret.id}
                className="px-4 py-3 flex items-center justify-between"
                style={{
                  borderBottom: i < secrets.length - 1 ? '1px solid #2a2a3e' : 'none',
                }}
              >
                <div className="flex items-center gap-4">
                  <span style={{ color: '#a8d8b9' }}>[/]</span>
                  <span style={{ color: '#e8e3e3' }}>{secret.name}</span>
                </div>
                <div className="flex items-center gap-6">
                  <span className="text-xs" style={{ color: '#6e6a86' }}>
                    {maskSecret(secret.encrypted_value.substring(0, 20))}
                  </span>
                  <span className="text-xs" style={{ color: '#6e6a86' }}>
                    {secret.last_accessed_at
                      ? new Date(secret.last_accessed_at).toLocaleDateString()
                      : 'never accessed'}
                  </span>
                  <button
                    onClick={() => handleDeleteSecret(secret.id, secret.name)}
                    className="text-xs px-2 py-1"
                    style={{ color: '#eb6f92' }}
                  >
                    [x]
                  </button>
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
          backgroundColor: '#252542',
          border: '1px solid #6e6a86',
        }}
      >
        <p style={{ color: '#a8d8b9', marginBottom: '8px' }}>[i] Zero-Knowledge Encryption</p>
        <p style={{ color: '#6e6a86', lineHeight: '1.5' }}>
          Your secrets are encrypted with your master password before they leave your browser.
          We store only encrypted blobs that we cannot decrypt. Keep your master password safe -
          if you lose it, we cannot recover your secrets.
        </p>
      </div>
    </div>
  )
}
