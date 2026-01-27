'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

// ═══════════════════════════════════════════════════════════════
//  VAULTAGENT - ACCOUNT PAGE
//  Manage account settings and subscription
// ═══════════════════════════════════════════════════════════════

const TIER_INFO: Record<
  string,
  {
    name: string
    color: string
    features: string[]
    price: string
  }
> = {
  free: {
    name: 'Free',
    color: '#6e6a86',
    features: ['1 vault', '10 secrets', '50 sessions/day', '7-day audit retention'],
    price: '$0/month',
  },
  pro: {
    name: 'Pro',
    color: '#a8d8b9',
    features: ['5 vaults', '100 secrets', 'Unlimited sessions', '30-day audit retention', 'Audit export'],
    price: '$9/month',
  },
  team: {
    name: 'Team',
    color: '#c4a7e7',
    features: [
      '20 vaults',
      '500 secrets',
      'Unlimited sessions',
      '90-day audit retention',
      'Audit export',
      'Team members',
    ],
    price: '$29/month',
  },
  enterprise: {
    name: 'Enterprise',
    color: '#7eb8da',
    features: [
      'Unlimited vaults',
      'Unlimited secrets',
      'Unlimited sessions',
      'Unlimited audit retention',
      'Audit export',
      'SSO/SAML',
      'Priority support',
    ],
    price: '$99/month',
  },
}

export default function AccountPage() {
  const { user, profile, updatePassword } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Password change
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  const tierInfo = TIER_INFO[profile?.tier || 'free']

  // Handle upgrade
  const handleUpgrade = async (plan: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          billing: 'monthly',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to start checkout')
      } else if (data.url) {
        window.location.href = data.url
      }
    } catch {
      setError('Failed to start checkout')
    }

    setLoading(false)
  }

  // Handle manage subscription
  const handleManageSubscription = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to open portal')
      } else if (data.url) {
        window.location.href = data.url
      }
    } catch {
      setError('Failed to open portal')
    }

    setLoading(false)
  }

  // Handle password change
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setChangingPassword(true)

    try {
      await updatePassword(newPassword)
      setSuccess('Password updated successfully')
      setShowPasswordForm(false)
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password')
    }

    setChangingPassword(false)
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl mb-2" style={{ color: '#a8d8b9' }}>
          [@] Account Settings
        </h1>
        <p className="text-xs" style={{ color: '#6e6a86' }}>
          {`// manage your account and subscription`}
        </p>
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

      {/* Profile Section */}
      <div
        className="mb-6 p-4"
        style={{ border: '1px solid #6e6a86' }}
      >
        <h2
          className="text-sm mb-4 pb-3"
          style={{ color: '#a8d8b9', borderBottom: '1px solid #6e6a86' }}
        >
          Profile
        </h2>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs" style={{ color: '#6e6a86' }}>
              EMAIL
            </span>
            <span className="text-xs" style={{ color: '#e8e3e3' }}>
              {user?.email}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs" style={{ color: '#6e6a86' }}>
              USER ID
            </span>
            <span className="text-xs font-mono" style={{ color: '#6e6a86' }}>
              {user?.id?.substring(0, 8)}...
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs" style={{ color: '#6e6a86' }}>
              MEMBER SINCE
            </span>
            <span className="text-xs" style={{ color: '#e8e3e3' }}>
              {profile?.created_at
                ? new Date(profile.created_at).toLocaleDateString()
                : '-'}
            </span>
          </div>
        </div>
      </div>

      {/* Security Section */}
      <div
        className="mb-6 p-4"
        style={{ border: '1px solid #6e6a86' }}
      >
        <h2
          className="text-sm mb-4 pb-3"
          style={{ color: '#a8d8b9', borderBottom: '1px solid #6e6a86' }}
        >
          Security
        </h2>

        {!showPasswordForm ? (
          <button
            onClick={() => setShowPasswordForm(true)}
            className="text-xs px-4 py-2"
            style={{
              border: '1px solid #6e6a86',
              color: '#a8b2c3',
              backgroundColor: 'transparent',
            }}
          >
            [~] CHANGE PASSWORD
          </button>
        ) : (
          <form onSubmit={handlePasswordChange}>
            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-xs mb-2" style={{ color: '#6e6a86' }}>
                  NEW PASSWORD
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full max-w-xs px-3 py-2 text-xs"
                  style={{
                    backgroundColor: '#252542',
                    border: '1px solid #6e6a86',
                    color: '#e8e3e3',
                  }}
                />
              </div>
              <div>
                <label className="block text-xs mb-2" style={{ color: '#6e6a86' }}>
                  CONFIRM PASSWORD
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full max-w-xs px-3 py-2 text-xs"
                  style={{
                    backgroundColor: '#252542',
                    border: '1px solid #6e6a86',
                    color: '#e8e3e3',
                  }}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={changingPassword}
                className="text-xs px-4 py-2 disabled:opacity-50"
                style={{
                  backgroundColor: '#a8d8b9',
                  color: '#1a1a2e',
                }}
              >
                {changingPassword ? '[~] UPDATING...' : '[>] UPDATE PASSWORD'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPasswordForm(false)
                  setNewPassword('')
                  setConfirmPassword('')
                }}
                className="text-xs px-4 py-2"
                style={{
                  border: '1px solid #6e6a86',
                  color: '#6e6a86',
                  backgroundColor: 'transparent',
                }}
              >
                [x] CANCEL
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Subscription Section */}
      <div
        className="mb-6 p-4"
        style={{ border: '1px solid #6e6a86' }}
      >
        <h2
          className="text-sm mb-4 pb-3"
          style={{ color: '#a8d8b9', borderBottom: '1px solid #6e6a86' }}
        >
          Subscription
        </h2>

        {/* Current Plan */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <span
              className="text-lg font-bold"
              style={{ color: tierInfo.color }}
            >
              {tierInfo.name}
            </span>
            <span
              className="text-xs px-2 py-1"
              style={{
                border: `1px solid ${tierInfo.color}`,
                color: tierInfo.color,
              }}
            >
              {tierInfo.price}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {tierInfo.features.map((feature) => (
              <span
                key={feature}
                className="text-xs px-2 py-1"
                style={{
                  backgroundColor: '#252542',
                  color: '#a8b2c3',
                }}
              >
                {feature}
              </span>
            ))}
          </div>
        </div>

        {/* Upgrade Options or Manage */}
        {profile?.tier === 'free' ? (
          <div className="space-y-3">
            <p className="text-xs mb-4" style={{ color: '#6e6a86' }}>
              Upgrade for more vaults, secrets, and longer audit retention:
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleUpgrade('pro')}
                disabled={loading}
                className="text-xs px-4 py-2 disabled:opacity-50"
                style={{
                  border: '1px solid #a8d8b9',
                  color: '#a8d8b9',
                  backgroundColor: 'transparent',
                }}
              >
                {`[>] UPGRADE TO PRO - $9/mo`}
              </button>
              <button
                onClick={() => handleUpgrade('team')}
                disabled={loading}
                className="text-xs px-4 py-2 disabled:opacity-50"
                style={{
                  border: '1px solid #c4a7e7',
                  color: '#c4a7e7',
                  backgroundColor: 'transparent',
                }}
              >
                {`[>] UPGRADE TO TEAM - $29/mo`}
              </button>
              <button
                onClick={() => handleUpgrade('enterprise')}
                disabled={loading}
                className="text-xs px-4 py-2 disabled:opacity-50"
                style={{
                  border: '1px solid #7eb8da',
                  color: '#7eb8da',
                  backgroundColor: 'transparent',
                }}
              >
                {`[>] UPGRADE TO ENTERPRISE - $99/mo`}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={handleManageSubscription}
            disabled={loading}
            className="text-xs px-4 py-2 disabled:opacity-50"
            style={{
              border: '1px solid #6e6a86',
              color: '#a8b2c3',
              backgroundColor: 'transparent',
            }}
          >
            {loading ? '[~] LOADING...' : '[>] MANAGE SUBSCRIPTION'}
          </button>
        )}
      </div>

      {/* Usage Section */}
      <div
        className="mb-6 p-4"
        style={{ border: '1px solid #6e6a86' }}
      >
        <h2
          className="text-sm mb-4 pb-3"
          style={{ color: '#a8d8b9', borderBottom: '1px solid #6e6a86' }}
        >
          Current Usage
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-xs mb-1" style={{ color: '#6e6a86' }}>
              VAULTS
            </div>
            <div className="text-lg" style={{ color: '#e8e3e3' }}>
              0 / {profile?.vault_limit === -1 ? '∞' : profile?.vault_limit}
            </div>
          </div>
          <div>
            <div className="text-xs mb-1" style={{ color: '#6e6a86' }}>
              SECRETS
            </div>
            <div className="text-lg" style={{ color: '#e8e3e3' }}>
              0 / {profile?.secret_limit === -1 ? '∞' : profile?.secret_limit}
            </div>
          </div>
          <div>
            <div className="text-xs mb-1" style={{ color: '#6e6a86' }}>
              SESSIONS TODAY
            </div>
            <div className="text-lg" style={{ color: '#e8e3e3' }}>
              0 / {profile?.session_limit === -1 ? '∞' : profile?.session_limit}
            </div>
          </div>
          <div>
            <div className="text-xs mb-1" style={{ color: '#6e6a86' }}>
              AUDIT RETENTION
            </div>
            <div className="text-lg" style={{ color: '#e8e3e3' }}>
              {TIER_INFO[profile?.tier || 'free'].features.find((f) =>
                f.includes('audit')
              ) || '7 days'}
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div
        className="p-4"
        style={{ border: '1px solid #eb6f92' }}
      >
        <h2
          className="text-sm mb-4 pb-3"
          style={{ color: '#eb6f92', borderBottom: '1px solid #eb6f92' }}
        >
          Danger Zone
        </h2>
        <p className="text-xs mb-4" style={{ color: '#6e6a86' }}>
          Delete your account and all associated data. This action cannot be undone.
        </p>
        <button
          onClick={() => {
            if (
              confirm(
                'Are you sure you want to delete your account? All your vaults, secrets, and data will be permanently deleted.'
              )
            ) {
              alert('Account deletion coming soon. Contact support@vaultagent.dev')
            }
          }}
          className="text-xs px-4 py-2"
          style={{
            border: '1px solid #eb6f92',
            color: '#eb6f92',
            backgroundColor: 'transparent',
          }}
        >
          [!] DELETE ACCOUNT
        </button>
      </div>
    </div>
  )
}
